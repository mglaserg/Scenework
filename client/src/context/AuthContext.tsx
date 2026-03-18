/**
 * AuthContext — stores the authenticated user and their in-memory CryptoKey.
 *
 * The CryptoKey is NEVER written to localStorage/sessionStorage/cookies.
 * It lives only in React state and is lost on page refresh (which forces a
 * re-login — an intentional security property of the encrypted-at-rest model).
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { generateAndWrapKey, unwrapKey } from "@/lib/crypto";
import { queryClient } from "@/lib/queryClient";

// ─── types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  email: string;
  encryptedKey: string | null;
  keySalt: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  dataKey: CryptoKey | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ─── provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dataKey, setDataKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if the session is still alive (server-side session cookie).
  // If so we ask the user to re-enter their password to restore the CryptoKey
  // (this is handled by the auth-gating in App.tsx — if user is set but
  // dataKey is null, the app shows a "re-enter password" prompt).
  useEffect(() => {
    apiRequest("GET", "/api/auth/me")
      .then(async (res: Response) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      })
      .catch(() => {
        // not logged in — ignore
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Login failed");
    }
    const data: AuthUser = await res.json();
    setUser(data);

    // Unwrap the data key from the password
    if (data.encryptedKey && data.keySalt) {
      const key = await unwrapKey(password, data.encryptedKey, data.keySalt);
      setDataKey(key);
    }

    // Clear all cached query data so pages re-fetch as the new user
    queryClient.clear();
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    // Generate + wrap data key before hitting the server
    const { encryptedKey, keySalt, dataKey: newKey } = await generateAndWrapKey(password);

    const res = await apiRequest("POST", "/api/auth/signup", {
      email,
      password,
      encryptedKey,
      keySalt,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Signup failed");
    }
    const data: AuthUser = await res.json();
    setUser(data);
    setDataKey(newKey);
    queryClient.clear();
  }, []);

  const logout = useCallback(async () => {
    await apiRequest("POST", "/api/auth/logout").catch(() => {});
    setUser(null);
    setDataKey(null);
    queryClient.clear();
  }, []);

  return (
    <AuthContext.Provider value={{ user, dataKey, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
