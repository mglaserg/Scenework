/**
 * Storage layer — uses PostgreSQL if DATABASE_URL is set, otherwise in-memory.
 * All methods are scoped to userId for multi-user isolation.
 */
import {
  type FocusItem, type InsertFocusItem,
  type PracticeSession, type InsertPracticeSession,
  type DialogPrompt, type InsertDialogPrompt,
  type JournalEntry, type InsertJournalEntry,
  type YesAndResponse, type InsertYesAndResponse,
  type WarmupExercise, type InsertWarmupExercise,
  type ScenePremise, type InsertScenePremise,
  type SavedCharacter, type InsertSavedCharacter,
} from "@shared/schema";

export interface IStorage {
  getFocusItems(userId: number): Promise<FocusItem[]>;
  getFocusItem(userId: number, id: number): Promise<FocusItem | undefined>;
  createFocusItem(userId: number, item: InsertFocusItem): Promise<FocusItem>;
  updateFocusItem(userId: number, id: number, item: Partial<InsertFocusItem>): Promise<FocusItem | undefined>;
  deleteFocusItem(userId: number, id: number): Promise<boolean>;

  getPracticeSessions(userId: number): Promise<PracticeSession[]>;
  createPracticeSession(userId: number, session: InsertPracticeSession): Promise<PracticeSession>;
  deletePracticeSession(userId: number, id: number): Promise<boolean>;

  getDialogPrompts(userId: number): Promise<DialogPrompt[]>;
  createDialogPrompt(userId: number, prompt: InsertDialogPrompt): Promise<DialogPrompt>;
  updateDialogPrompt(userId: number, id: number, prompt: Partial<InsertDialogPrompt>): Promise<DialogPrompt | undefined>;
  deleteDialogPrompt(userId: number, id: number): Promise<boolean>;

  getJournalEntries(userId: number): Promise<JournalEntry[]>;
  getJournalEntry(userId: number, id: number): Promise<JournalEntry | undefined>;
  createJournalEntry(userId: number, entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(userId: number, id: number, entry: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(userId: number, id: number): Promise<boolean>;

  getYesAndResponses(userId: number): Promise<YesAndResponse[]>;
  createYesAndResponse(userId: number, r: InsertYesAndResponse): Promise<YesAndResponse>;
  deleteYesAndResponse(userId: number, id: number): Promise<boolean>;

  getWarmupExercises(userId: number): Promise<WarmupExercise[]>;
  createWarmupExercise(userId: number, e: InsertWarmupExercise): Promise<WarmupExercise>;
  updateWarmupExercise(userId: number, id: number, e: Partial<InsertWarmupExercise>): Promise<WarmupExercise | undefined>;
  deleteWarmupExercise(userId: number, id: number): Promise<boolean>;

  getScenePremises(userId: number): Promise<ScenePremise[]>;
  createScenePremise(userId: number, s: InsertScenePremise): Promise<ScenePremise>;
  updateScenePremise(userId: number, id: number, s: Partial<InsertScenePremise>): Promise<ScenePremise | undefined>;
  deleteScenePremise(userId: number, id: number): Promise<boolean>;

  getSavedCharacters(userId: number): Promise<SavedCharacter[]>;
  createSavedCharacter(userId: number, c: InsertSavedCharacter): Promise<SavedCharacter>;
  updateSavedCharacter(userId: number, id: number, c: Partial<InsertSavedCharacter>): Promise<SavedCharacter | undefined>;
  deleteSavedCharacter(userId: number, id: number): Promise<boolean>;
}

// ── In-Memory Storage (dev fallback) ─────────────────────────────────────────
class MemStorage implements IStorage {
  private focusItemsMap: Map<number, FocusItem> = new Map();
  private practiceSessionsMap: Map<number, PracticeSession> = new Map();
  private dialogPromptsMap: Map<number, DialogPrompt> = new Map();
  private journalEntriesMap: Map<number, JournalEntry> = new Map();
  private yesAndResponsesMap: Map<number, YesAndResponse> = new Map();
  private warmupExercisesMap: Map<number, WarmupExercise> = new Map();
  private scenePremisesMap: Map<number, ScenePremise> = new Map();
  private savedCharactersMap: Map<number, SavedCharacter> = new Map();
  private nextId = { focus: 1, session: 1, dialog: 1, journal: 1, yesand: 1, warmup: 1, scene: 1, char: 1 };

  private byUser<T extends { userId: number }>(map: Map<number, T>, userId: number) {
    return Array.from(map.values()).filter(v => v.userId === userId);
  }
  private ownedItem<T extends { userId: number }>(map: Map<number, T>, userId: number, id: number) {
    const item = map.get(id);
    return item?.userId === userId ? item : undefined;
  }

  async getFocusItems(uid: number) { return this.byUser(this.focusItemsMap, uid).sort((a, b) => a.id - b.id); }
  async getFocusItem(uid: number, id: number) { return this.ownedItem(this.focusItemsMap, uid, id); }
  async createFocusItem(uid: number, item: InsertFocusItem): Promise<FocusItem> {
    const id = this.nextId.focus++;
    const n: FocusItem = { ...item, id, userId: uid, createdAt: new Date() };
    this.focusItemsMap.set(id, n); return n;
  }
  async updateFocusItem(uid: number, id: number, item: Partial<InsertFocusItem>) {
    const e = this.ownedItem(this.focusItemsMap, uid, id); if (!e) return undefined;
    const u = { ...e, ...item }; this.focusItemsMap.set(id, u); return u;
  }
  async deleteFocusItem(uid: number, id: number) {
    return this.ownedItem(this.focusItemsMap, uid, id) ? this.focusItemsMap.delete(id) : false;
  }

  async getPracticeSessions(uid: number) { return this.byUser(this.practiceSessionsMap, uid).sort((a, b) => b.id - a.id); }
  async createPracticeSession(uid: number, session: InsertPracticeSession): Promise<PracticeSession> {
    const id = this.nextId.session++;
    const n: PracticeSession = { ...session, id, userId: uid, sessionDate: new Date() };
    this.practiceSessionsMap.set(id, n); return n;
  }
  async deletePracticeSession(uid: number, id: number) {
    return this.ownedItem(this.practiceSessionsMap, uid, id) ? this.practiceSessionsMap.delete(id) : false;
  }

  async getDialogPrompts(uid: number) { return this.byUser(this.dialogPromptsMap, uid).sort((a, b) => a.id - b.id); }
  async createDialogPrompt(uid: number, prompt: InsertDialogPrompt): Promise<DialogPrompt> {
    const id = this.nextId.dialog++;
    const n: DialogPrompt = { ...prompt, id, userId: uid, createdAt: new Date() };
    this.dialogPromptsMap.set(id, n); return n;
  }
  async updateDialogPrompt(uid: number, id: number, prompt: Partial<InsertDialogPrompt>) {
    const e = this.ownedItem(this.dialogPromptsMap, uid, id); if (!e) return undefined;
    const u = { ...e, ...prompt }; this.dialogPromptsMap.set(id, u); return u;
  }
  async deleteDialogPrompt(uid: number, id: number) {
    return this.ownedItem(this.dialogPromptsMap, uid, id) ? this.dialogPromptsMap.delete(id) : false;
  }

  async getJournalEntries(uid: number) { return this.byUser(this.journalEntriesMap, uid).sort((a, b) => b.id - a.id); }
  async getJournalEntry(uid: number, id: number) { return this.ownedItem(this.journalEntriesMap, uid, id); }
  async createJournalEntry(uid: number, entry: InsertJournalEntry): Promise<JournalEntry> {
    const id = this.nextId.journal++;
    const n: JournalEntry = { ...entry, id, userId: uid, createdAt: new Date() };
    this.journalEntriesMap.set(id, n); return n;
  }
  async updateJournalEntry(uid: number, id: number, entry: Partial<InsertJournalEntry>) {
    const e = this.ownedItem(this.journalEntriesMap, uid, id); if (!e) return undefined;
    const u = { ...e, ...entry }; this.journalEntriesMap.set(id, u); return u;
  }
  async deleteJournalEntry(uid: number, id: number) {
    return this.ownedItem(this.journalEntriesMap, uid, id) ? this.journalEntriesMap.delete(id) : false;
  }

  async getYesAndResponses(uid: number) { return this.byUser(this.yesAndResponsesMap, uid).sort((a, b) => b.id - a.id); }
  async createYesAndResponse(uid: number, r: InsertYesAndResponse): Promise<YesAndResponse> {
    const id = this.nextId.yesand++;
    const n: YesAndResponse = { ...r, id, userId: uid, createdAt: new Date() };
    this.yesAndResponsesMap.set(id, n); return n;
  }
  async deleteYesAndResponse(uid: number, id: number) {
    return this.ownedItem(this.yesAndResponsesMap, uid, id) ? this.yesAndResponsesMap.delete(id) : false;
  }

  async getWarmupExercises(uid: number) { return this.byUser(this.warmupExercisesMap, uid).sort((a, b) => a.id - b.id); }
  async createWarmupExercise(uid: number, e: InsertWarmupExercise): Promise<WarmupExercise> {
    const id = this.nextId.warmup++;
    const n: WarmupExercise = { ...e, id, userId: uid, createdAt: new Date() };
    this.warmupExercisesMap.set(id, n); return n;
  }
  async updateWarmupExercise(uid: number, id: number, e: Partial<InsertWarmupExercise>) {
    const ex = this.ownedItem(this.warmupExercisesMap, uid, id); if (!ex) return undefined;
    const u = { ...ex, ...e }; this.warmupExercisesMap.set(id, u); return u;
  }
  async deleteWarmupExercise(uid: number, id: number) {
    return this.ownedItem(this.warmupExercisesMap, uid, id) ? this.warmupExercisesMap.delete(id) : false;
  }

  async getScenePremises(uid: number) { return this.byUser(this.scenePremisesMap, uid).sort((a, b) => b.id - a.id); }
  async createScenePremise(uid: number, s: InsertScenePremise): Promise<ScenePremise> {
    const id = this.nextId.scene++;
    const n: ScenePremise = { ...s, id, userId: uid, createdAt: new Date() };
    this.scenePremisesMap.set(id, n); return n;
  }
  async updateScenePremise(uid: number, id: number, s: Partial<InsertScenePremise>) {
    const ex = this.ownedItem(this.scenePremisesMap, uid, id); if (!ex) return undefined;
    const u = { ...ex, ...s }; this.scenePremisesMap.set(id, u); return u;
  }
  async deleteScenePremise(uid: number, id: number) {
    return this.ownedItem(this.scenePremisesMap, uid, id) ? this.scenePremisesMap.delete(id) : false;
  }

  async getSavedCharacters(uid: number) { return this.byUser(this.savedCharactersMap, uid).sort((a, b) => b.id - a.id); }
  async createSavedCharacter(uid: number, c: InsertSavedCharacter): Promise<SavedCharacter> {
    const id = this.nextId.char++;
    const n: SavedCharacter = { ...c, id, userId: uid, createdAt: new Date() };
    this.savedCharactersMap.set(id, n); return n;
  }
  async updateSavedCharacter(uid: number, id: number, c: Partial<InsertSavedCharacter>) {
    const ex = this.ownedItem(this.savedCharactersMap, uid, id); if (!ex) return undefined;
    const u = { ...ex, ...c }; this.savedCharactersMap.set(id, u); return u;
  }
  async deleteSavedCharacter(uid: number, id: number) {
    return this.ownedItem(this.savedCharactersMap, uid, id) ? this.savedCharactersMap.delete(id) : false;
  }
}

// ── PostgreSQL Storage ────────────────────────────────────────────────────────
async function createDatabaseStorage(): Promise<IStorage> {
  const { eq, desc, asc, and } = await import("drizzle-orm");
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const schema = await import("@shared/schema");
  const { readFileSync } = await import("fs");
  const { resolve } = await import("path");

  let sslConfig: any = { rejectUnauthorized: false, require: true };
  try {
    const ca = readFileSync(resolve(process.cwd(), "ca-certificate.crt")).toString();
    sslConfig = { rejectUnauthorized: true, ca };
  } catch { /* no cert file — use rejectUnauthorized:false */ }

  const connStr = process.env.DATABASE_URL!.replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]$/, '').replace(/\?$/, '');
  const pool = new Pool({ connectionString: connStr, ssl: sslConfig });
  const db = drizzle(pool, { schema });

  const own = (table: any, uid: number) => eq(table.userId, uid);
  const ownAndId = (table: any, uid: number, id: number) => and(eq(table.userId, uid), eq(table.id, id));

  return {
    async getFocusItems(uid) { return db.select().from(schema.focusItems).where(own(schema.focusItems, uid)).orderBy(asc(schema.focusItems.id)); },
    async getFocusItem(uid, id) { const [r] = await db.select().from(schema.focusItems).where(ownAndId(schema.focusItems, uid, id)); return r; },
    async createFocusItem(uid, item) { const [r] = await db.insert(schema.focusItems).values({ ...item, userId: uid }).returning(); return r; },
    async updateFocusItem(uid, id, item) { const [r] = await db.update(schema.focusItems).set(item).where(ownAndId(schema.focusItems, uid, id)).returning(); return r; },
    async deleteFocusItem(uid, id) { const r = await db.delete(schema.focusItems).where(ownAndId(schema.focusItems, uid, id)).returning(); return r.length > 0; },

    async getPracticeSessions(uid) { return db.select().from(schema.practiceSessions).where(own(schema.practiceSessions, uid)).orderBy(desc(schema.practiceSessions.id)); },
    async createPracticeSession(uid, s) { const [r] = await db.insert(schema.practiceSessions).values({ ...s, userId: uid }).returning(); return r; },
    async deletePracticeSession(uid, id) { const r = await db.delete(schema.practiceSessions).where(ownAndId(schema.practiceSessions, uid, id)).returning(); return r.length > 0; },

    async getDialogPrompts(uid) { return db.select().from(schema.dialogPrompts).where(own(schema.dialogPrompts, uid)).orderBy(asc(schema.dialogPrompts.id)); },
    async createDialogPrompt(uid, p) { const [r] = await db.insert(schema.dialogPrompts).values({ ...p, userId: uid }).returning(); return r; },
    async updateDialogPrompt(uid, id, p) { const [r] = await db.update(schema.dialogPrompts).set(p).where(ownAndId(schema.dialogPrompts, uid, id)).returning(); return r; },
    async deleteDialogPrompt(uid, id) { const r = await db.delete(schema.dialogPrompts).where(ownAndId(schema.dialogPrompts, uid, id)).returning(); return r.length > 0; },

    async getJournalEntries(uid) { return db.select().from(schema.journalEntries).where(own(schema.journalEntries, uid)).orderBy(desc(schema.journalEntries.id)); },
    async getJournalEntry(uid, id) { const [r] = await db.select().from(schema.journalEntries).where(ownAndId(schema.journalEntries, uid, id)); return r; },
    async createJournalEntry(uid, e) { const [r] = await db.insert(schema.journalEntries).values({ ...e, userId: uid }).returning(); return r; },
    async updateJournalEntry(uid, id, e) { const [r] = await db.update(schema.journalEntries).set(e).where(ownAndId(schema.journalEntries, uid, id)).returning(); return r; },
    async deleteJournalEntry(uid, id) { const r = await db.delete(schema.journalEntries).where(ownAndId(schema.journalEntries, uid, id)).returning(); return r.length > 0; },

    async getYesAndResponses(uid) { return db.select().from(schema.yesAndResponses).where(own(schema.yesAndResponses, uid)).orderBy(desc(schema.yesAndResponses.id)); },
    async createYesAndResponse(uid, r) { const [row] = await db.insert(schema.yesAndResponses).values({ ...r, userId: uid }).returning(); return row; },
    async deleteYesAndResponse(uid, id) { const r = await db.delete(schema.yesAndResponses).where(ownAndId(schema.yesAndResponses, uid, id)).returning(); return r.length > 0; },

    async getWarmupExercises(uid) { return db.select().from(schema.warmupExercises).where(own(schema.warmupExercises, uid)).orderBy(asc(schema.warmupExercises.id)); },
    async createWarmupExercise(uid, e) { const [r] = await db.insert(schema.warmupExercises).values({ ...e, userId: uid }).returning(); return r; },
    async updateWarmupExercise(uid, id, e) { const [r] = await db.update(schema.warmupExercises).set(e).where(ownAndId(schema.warmupExercises, uid, id)).returning(); return r; },
    async deleteWarmupExercise(uid, id) { const r = await db.delete(schema.warmupExercises).where(ownAndId(schema.warmupExercises, uid, id)).returning(); return r.length > 0; },

    async getScenePremises(uid) { return db.select().from(schema.scenePremises).where(own(schema.scenePremises, uid)).orderBy(desc(schema.scenePremises.id)); },
    async createScenePremise(uid, s) { const [r] = await db.insert(schema.scenePremises).values({ ...s, userId: uid }).returning(); return r; },
    async updateScenePremise(uid, id, s) { const [r] = await db.update(schema.scenePremises).set(s).where(ownAndId(schema.scenePremises, uid, id)).returning(); return r; },
    async deleteScenePremise(uid, id) { const r = await db.delete(schema.scenePremises).where(ownAndId(schema.scenePremises, uid, id)).returning(); return r.length > 0; },

    async getSavedCharacters(uid) { return db.select().from(schema.savedCharacters).where(own(schema.savedCharacters, uid)).orderBy(desc(schema.savedCharacters.id)); },
    async createSavedCharacter(uid, c) { const [r] = await db.insert(schema.savedCharacters).values({ ...c, userId: uid }).returning(); return r; },
    async updateSavedCharacter(uid, id, c) { const [r] = await db.update(schema.savedCharacters).set(c).where(ownAndId(schema.savedCharacters, uid, id)).returning(); return r; },
    async deleteSavedCharacter(uid, id) { const r = await db.delete(schema.savedCharacters).where(ownAndId(schema.savedCharacters, uid, id)).returning(); return r.length > 0; },
  };
}

// ── Export ────────────────────────────────────────────────────────────────────
let _storage: IStorage | null = null;

export async function getStorage(): Promise<IStorage> {
  if (_storage) return _storage;
  if (process.env.DATABASE_URL) {
    console.log("[storage] Using PostgreSQL");
    _storage = await createDatabaseStorage();
  } else {
    console.log("[storage] Using in-memory storage (set DATABASE_URL to enable Postgres)");
    _storage = new MemStorage();
  }
  return _storage;
}

export let storage: IStorage = new MemStorage();

export async function initStorage() {
  storage = await getStorage();
}
