/**
 * Client-side encryption utilities for Stagework.
 *
 * Model:
 *  – On signup the client generates a random 256-bit AES-GCM "data key".
 *  – The data key is wrapped (encrypted) with a PBKDF2-derived key from the
 *    user's password, producing `encryptedKey` (base64).
 *  – `keySalt` (hex) + `encryptedKey` are stored in the `users` row — the
 *    server never sees the raw data key or the password.
 *  – On login the server returns `encryptedKey` + `keySalt`; the client
 *    re-derives the wrap key from the password and unwraps the data key.
 *  – All sensitive text fields are encrypted with the data key (AES-GCM,
 *    random 96-bit IV prepended to ciphertext) before being sent to the API.
 *  – Decryption happens on read, so the server only ever stores ciphertext.
 */

// ─── helpers ────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// ─── PBKDF2 wrap-key derivation ──────────────────────────────────────────────

const PBKDF2_ITERS = 310_000;
const PBKDF2_HASH = "SHA-256";

async function deriveWrapKey(
  password: string,
  saltHex: string
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations: PBKDF2_ITERS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  );
}

// ─── Key generation & wrapping (signup) ─────────────────────────────────────

/**
 * Generate a new random AES-256-GCM data key and wrap it with PBKDF2(password).
 * Returns { encryptedKey (base64), keySalt (hex), dataKey (CryptoKey) }.
 */
export async function generateAndWrapKey(password: string): Promise<{
  encryptedKey: string;
  keySalt: string;
  dataKey: CryptoKey;
}> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(32));
  const keySalt = bytesToHex(saltBytes);

  const dataKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable so we can wrap it
    ["encrypt", "decrypt"]
  );

  const wrapKey = await deriveWrapKey(password, keySalt);

  const wrappedBuf = await crypto.subtle.wrapKey("raw", dataKey, wrapKey, {
    name: "AES-KW",
  });

  return {
    encryptedKey: bufToBase64(wrappedBuf),
    keySalt,
    dataKey,
  };
}

// ─── Key unwrapping (login) ──────────────────────────────────────────────────

/**
 * Unwrap the stored encrypted key using the user's password.
 * Returns the raw CryptoKey ready for encrypt/decrypt.
 */
export async function unwrapKey(
  password: string,
  encryptedKeyB64: string,
  keySaltHex: string
): Promise<CryptoKey> {
  const wrapKey = await deriveWrapKey(password, keySaltHex);
  const wrappedBuf = base64ToBuf(encryptedKeyB64);

  return crypto.subtle.unwrapKey(
    "raw",
    wrappedBuf,
    wrapKey,
    { name: "AES-KW" },
    { name: "AES-GCM", length: 256 },
    false, // not extractable after unwrap
    ["encrypt", "decrypt"]
  );
}

// ─── Field-level encrypt / decrypt ──────────────────────────────────────────

/**
 * Encrypt a plaintext string with the data key.
 * Output format: base64(iv[12 bytes] + ciphertext)
 */
export async function encryptField(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );
  // prepend IV to ciphertext
  const combined = new Uint8Array(iv.byteLength + cipherBuf.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuf), iv.byteLength);
  return bufToBase64(combined.buffer);
}

/**
 * Decrypt a field produced by encryptField.
 * Returns the original plaintext string.
 */
export async function decryptField(
  ciphertextB64: string,
  key: CryptoKey
): Promise<string> {
  const buf = new Uint8Array(base64ToBuf(ciphertextB64));
  const iv = buf.slice(0, 12);
  const ciphertext = buf.slice(12);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plainBuf);
}

// ─── Convenience helpers ─────────────────────────────────────────────────────

/**
 * Encrypt an object's string fields in-place (selected by keys list).
 * Skips empty / null / undefined values.
 */
export async function encryptFields<T extends Record<string, any>>(
  obj: T,
  keys: (keyof T)[],
  dataKey: CryptoKey
): Promise<T> {
  const result = { ...obj } as any;
  for (const k of keys) {
    if (result[k] && typeof result[k] === "string" && result[k].length > 0) {
      result[k] = await encryptField(result[k] as string, dataKey);
    }
  }
  return result as T;
}

/**
 * Decrypt an object's string fields in-place (selected by keys list).
 * Skips empty / null / undefined values; on decryption failure returns
 * the raw ciphertext so UI degrades gracefully.
 */
export async function decryptFields<T extends Record<string, any>>(
  obj: T,
  keys: (keyof T)[],
  dataKey: CryptoKey
): Promise<T> {
  const result = { ...obj } as any;
  for (const k of keys) {
    if (result[k] && typeof result[k] === "string" && result[k].length > 0) {
      try {
        result[k] = await decryptField(result[k] as string, dataKey);
      } catch {
        // ciphertext unreadable — leave as-is (shows garbled text rather than crashing)
      }
    }
  }
  return result as T;
}

/**
 * Decrypt an array of objects in parallel.
 */
export async function decryptArray<T extends Record<string, any>>(
  arr: T[],
  keys: (keyof T)[],
  dataKey: CryptoKey
): Promise<T[]> {
  return Promise.all(arr.map(item => decryptFields(item, keys, dataKey)));
}
