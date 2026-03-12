/**
 * Storage layer — uses PostgreSQL if DATABASE_URL is set, otherwise in-memory.
 * Switch is automatic: just set DATABASE_URL env var to enable persistence.
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
  getFocusItems(): Promise<FocusItem[]>;
  getFocusItem(id: number): Promise<FocusItem | undefined>;
  createFocusItem(item: InsertFocusItem): Promise<FocusItem>;
  updateFocusItem(id: number, item: Partial<InsertFocusItem>): Promise<FocusItem | undefined>;
  deleteFocusItem(id: number): Promise<boolean>;

  getPracticeSessions(): Promise<PracticeSession[]>;
  createPracticeSession(session: InsertPracticeSession): Promise<PracticeSession>;
  deletePracticeSession(id: number): Promise<boolean>;

  getDialogPrompts(): Promise<DialogPrompt[]>;
  createDialogPrompt(prompt: InsertDialogPrompt): Promise<DialogPrompt>;
  updateDialogPrompt(id: number, prompt: Partial<InsertDialogPrompt>): Promise<DialogPrompt | undefined>;
  deleteDialogPrompt(id: number): Promise<boolean>;

  getJournalEntries(): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: number, entry: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: number): Promise<boolean>;

  getYesAndResponses(): Promise<YesAndResponse[]>;
  createYesAndResponse(r: InsertYesAndResponse): Promise<YesAndResponse>;
  deleteYesAndResponse(id: number): Promise<boolean>;

  // Warm-up exercises
  getWarmupExercises(): Promise<WarmupExercise[]>;
  getWarmupExercise(id: number): Promise<WarmupExercise | undefined>;
  createWarmupExercise(e: InsertWarmupExercise): Promise<WarmupExercise>;
  updateWarmupExercise(id: number, e: Partial<InsertWarmupExercise>): Promise<WarmupExercise | undefined>;
  deleteWarmupExercise(id: number): Promise<boolean>;

  // Scene premises
  getScenePremises(): Promise<ScenePremise[]>;
  getScenePremise(id: number): Promise<ScenePremise | undefined>;
  createScenePremise(s: InsertScenePremise): Promise<ScenePremise>;
  updateScenePremise(id: number, s: Partial<InsertScenePremise>): Promise<ScenePremise | undefined>;
  deleteScenePremise(id: number): Promise<boolean>;

  // Saved characters
  getSavedCharacters(): Promise<SavedCharacter[]>;
  getSavedCharacter(id: number): Promise<SavedCharacter | undefined>;
  createSavedCharacter(c: InsertSavedCharacter): Promise<SavedCharacter>;
  updateSavedCharacter(id: number, c: Partial<InsertSavedCharacter>): Promise<SavedCharacter | undefined>;
  deleteSavedCharacter(id: number): Promise<boolean>;
}

// ── In-Memory Storage (fallback) ──────────────────────────────────────────────
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

  constructor() { this.seedData(); }

  private seedData() {
    const defaultFocusItems: InsertFocusItem[] = [
      { title: "Active Listening", category: "listening", description: "Truly hear your scene partners — what they're saying AND not saying." },
      { title: "Yes, And…", category: "technique", description: "Accept everything offered and build on it without blocking or denying." },
      { title: "Object Work", category: "physicality", description: "Make imaginary objects real through consistent, committed physical handling." },
      { title: "Emotional Truth", category: "character", description: "Let real emotion drive the scene rather than performing a result." },
      { title: "Grounded Presence", category: "physicality", description: "Stay in your body, feet planted, breath steady — don't float away." },
      { title: "Follow the Follower", category: "listening", description: "Surrender to the group mind; let moves emerge from collective awareness." },
      { title: "Make Your Partner Look Good", category: "technique", description: "Support your partner's choices at all costs — their genius is your genius." },
      { title: "Slow Down", category: "technique", description: "Resist the urge to rush. Dwell in the moment longer than feels comfortable." },
      { title: "Status Play", category: "character", description: "Explore the power dynamics between characters. Raise and lower status deliberately." },
      { title: "Specificity", category: "character", description: "Replace generic with precise. Not 'a bar' — 'the sticky-floored dive on Colfax.'" },
      { title: "Space Work", category: "physicality", description: "Use the full stage. Let physical placement create relationships." },
      { title: "Initiation Boldness", category: "technique", description: "Start scenes with a strong, committed offer rather than a vague setup." },
    ];
    for (const item of defaultFocusItems) {
      const id = this.nextId.focus++;
      this.focusItemsMap.set(id, { ...item, id, createdAt: new Date() });
    }
    const defaultPrompts: InsertDialogPrompt[] = [
      { line: "I've been meaning to tell you something.", context: "Two people who haven't spoken in months" },
      { line: "That's not what I asked.", context: "A confrontation that's been building for years" },
      { line: "You always do this.", context: "Recurring argument between old friends" },
      { line: "I think I left the door unlocked.", context: "A couple returning from vacation" },
      { line: "It doesn't matter anymore.", context: "The end of something important" },
      { line: "Say that again. Slowly.", context: "Someone who can't believe what they just heard" },
      { line: "I found it.", context: "After a long search for something lost" },
      { line: "You were supposed to be there.", context: "A moment of abandonment" },
      { line: "Don't look at me like that.", context: "Someone caught in a lie" },
      { line: "I'm not angry. I'm disappointed.", context: "A parent or mentor figure" },
      { line: "This is the last time.", context: "A broken promise being repeated" },
      { line: "What were you thinking?", context: "Aftermath of a reckless decision" },
      { line: "I never wanted this.", context: "Someone confronting an unwanted responsibility" },
      { line: "You look different.", context: "A reunion after years apart" },
      { line: "Fine. Have it your way.", context: "Caving to someone after a fight" },
      { line: "I need a minute.", context: "Overwhelmed by an unexpected revelation" },
      { line: "We don't have to talk about it.", context: "After witnessing something difficult" },
      { line: "Pretend I didn't say that.", context: "Accidental confession" },
      { line: "It's complicated.", context: "Explaining a relationship to an outsider" },
      { line: "I thought I knew you.", context: "A betrayal, real or perceived" },
    ];
    for (const prompt of defaultPrompts) {
      const id = this.nextId.dialog++;
      this.dialogPromptsMap.set(id, { ...prompt, id, createdAt: new Date() });
    }
  }

  async getFocusItems() { return Array.from(this.focusItemsMap.values()).sort((a, b) => a.id - b.id); }
  async getFocusItem(id: number) { return this.focusItemsMap.get(id); }
  async createFocusItem(item: InsertFocusItem): Promise<FocusItem> {
    const id = this.nextId.focus++;
    const n: FocusItem = { ...item, id, createdAt: new Date() };
    this.focusItemsMap.set(id, n); return n;
  }
  async updateFocusItem(id: number, item: Partial<InsertFocusItem>) {
    const e = this.focusItemsMap.get(id); if (!e) return undefined;
    const u = { ...e, ...item }; this.focusItemsMap.set(id, u); return u;
  }
  async deleteFocusItem(id: number) { return this.focusItemsMap.delete(id); }

  async getPracticeSessions() { return Array.from(this.practiceSessionsMap.values()).sort((a, b) => b.id - a.id); }
  async createPracticeSession(session: InsertPracticeSession): Promise<PracticeSession> {
    const id = this.nextId.session++;
    const n: PracticeSession = { ...session, id, sessionDate: new Date() };
    this.practiceSessionsMap.set(id, n); return n;
  }
  async deletePracticeSession(id: number) { return this.practiceSessionsMap.delete(id); }

  async getDialogPrompts() { return Array.from(this.dialogPromptsMap.values()).sort((a, b) => a.id - b.id); }
  async createDialogPrompt(prompt: InsertDialogPrompt): Promise<DialogPrompt> {
    const id = this.nextId.dialog++;
    const n: DialogPrompt = { ...prompt, id, createdAt: new Date() };
    this.dialogPromptsMap.set(id, n); return n;
  }
  async updateDialogPrompt(id: number, prompt: Partial<InsertDialogPrompt>) {
    const e = this.dialogPromptsMap.get(id); if (!e) return undefined;
    const u = { ...e, ...prompt }; this.dialogPromptsMap.set(id, u); return u;
  }
  async deleteDialogPrompt(id: number) { return this.dialogPromptsMap.delete(id); }

  async getJournalEntries() { return Array.from(this.journalEntriesMap.values()).sort((a, b) => b.id - a.id); }
  async getJournalEntry(id: number) { return this.journalEntriesMap.get(id); }
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const id = this.nextId.journal++;
    const n: JournalEntry = { ...entry, id, createdAt: new Date() };
    this.journalEntriesMap.set(id, n); return n;
  }
  async updateJournalEntry(id: number, entry: Partial<InsertJournalEntry>) {
    const e = this.journalEntriesMap.get(id); if (!e) return undefined;
    const u = { ...e, ...entry }; this.journalEntriesMap.set(id, u); return u;
  }
  async deleteJournalEntry(id: number) { return this.journalEntriesMap.delete(id); }

  async getYesAndResponses() { return Array.from(this.yesAndResponsesMap.values()).sort((a, b) => b.id - a.id); }
  async createYesAndResponse(r: InsertYesAndResponse): Promise<YesAndResponse> {
    const id = this.nextId.yesand++;
    const n: YesAndResponse = { ...r, id, createdAt: new Date() };
    this.yesAndResponsesMap.set(id, n); return n;
  }
  async deleteYesAndResponse(id: number) { return this.yesAndResponsesMap.delete(id); }

  // Warm-up exercises
  async getWarmupExercises() { return Array.from(this.warmupExercisesMap.values()).sort((a, b) => a.id - b.id); }
  async getWarmupExercise(id: number) { return this.warmupExercisesMap.get(id); }
  async createWarmupExercise(e: InsertWarmupExercise): Promise<WarmupExercise> {
    const id = this.nextId.warmup++;
    const n: WarmupExercise = { ...e, id, createdAt: new Date() };
    this.warmupExercisesMap.set(id, n); return n;
  }
  async updateWarmupExercise(id: number, e: Partial<InsertWarmupExercise>) {
    const ex = this.warmupExercisesMap.get(id); if (!ex) return undefined;
    const u = { ...ex, ...e }; this.warmupExercisesMap.set(id, u); return u;
  }
  async deleteWarmupExercise(id: number) { return this.warmupExercisesMap.delete(id); }

  // Scene premises
  async getScenePremises() { return Array.from(this.scenePremisesMap.values()).sort((a, b) => b.id - a.id); }
  async getScenePremise(id: number) { return this.scenePremisesMap.get(id); }
  async createScenePremise(s: InsertScenePremise): Promise<ScenePremise> {
    const id = this.nextId.scene++;
    const n: ScenePremise = { ...s, id, createdAt: new Date() };
    this.scenePremisesMap.set(id, n); return n;
  }
  async updateScenePremise(id: number, s: Partial<InsertScenePremise>) {
    const ex = this.scenePremisesMap.get(id); if (!ex) return undefined;
    const u = { ...ex, ...s }; this.scenePremisesMap.set(id, u); return u;
  }
  async deleteScenePremise(id: number) { return this.scenePremisesMap.delete(id); }

  // Saved characters
  async getSavedCharacters() { return Array.from(this.savedCharactersMap.values()).sort((a, b) => b.id - a.id); }
  async getSavedCharacter(id: number) { return this.savedCharactersMap.get(id); }
  async createSavedCharacter(c: InsertSavedCharacter): Promise<SavedCharacter> {
    const id = this.nextId.char++;
    const n: SavedCharacter = { ...c, id, createdAt: new Date() };
    this.savedCharactersMap.set(id, n); return n;
  }
  async updateSavedCharacter(id: number, c: Partial<InsertSavedCharacter>) {
    const ex = this.savedCharactersMap.get(id); if (!ex) return undefined;
    const u = { ...ex, ...c }; this.savedCharactersMap.set(id, u); return u;
  }
  async deleteSavedCharacter(id: number) { return this.savedCharactersMap.delete(id); }
}

// ── PostgreSQL Storage ─────────────────────────────────────────────────────────
async function createDatabaseStorage(): Promise<IStorage> {
  const { eq, desc, asc } = await import("drizzle-orm");
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const schema = await import("@shared/schema");

  const { readFileSync } = await import("fs");
  const { resolve } = await import("path");
  const ca = readFileSync(resolve(process.cwd(), "ca-certificate.crt")).toString();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true, ca } });
  const db = drizzle(pool, { schema });

  return {
    async getFocusItems() { return db.select().from(schema.focusItems).orderBy(asc(schema.focusItems.id)); },
    async getFocusItem(id) { const [r] = await db.select().from(schema.focusItems).where(eq(schema.focusItems.id, id)); return r; },
    async createFocusItem(item) { const [r] = await db.insert(schema.focusItems).values(item).returning(); return r; },
    async updateFocusItem(id, item) { const [r] = await db.update(schema.focusItems).set(item).where(eq(schema.focusItems.id, id)).returning(); return r; },
    async deleteFocusItem(id) { const r = await db.delete(schema.focusItems).where(eq(schema.focusItems.id, id)).returning(); return r.length > 0; },

    async getPracticeSessions() { return db.select().from(schema.practiceSessions).orderBy(desc(schema.practiceSessions.id)); },
    async createPracticeSession(s) { const [r] = await db.insert(schema.practiceSessions).values(s).returning(); return r; },
    async deletePracticeSession(id) { const r = await db.delete(schema.practiceSessions).where(eq(schema.practiceSessions.id, id)).returning(); return r.length > 0; },

    async getDialogPrompts() { return db.select().from(schema.dialogPrompts).orderBy(asc(schema.dialogPrompts.id)); },
    async createDialogPrompt(p) { const [r] = await db.insert(schema.dialogPrompts).values(p).returning(); return r; },
    async updateDialogPrompt(id, p) { const [r] = await db.update(schema.dialogPrompts).set(p).where(eq(schema.dialogPrompts.id, id)).returning(); return r; },
    async deleteDialogPrompt(id) { const r = await db.delete(schema.dialogPrompts).where(eq(schema.dialogPrompts.id, id)).returning(); return r.length > 0; },

    async getJournalEntries() { return db.select().from(schema.journalEntries).orderBy(desc(schema.journalEntries.id)); },
    async getJournalEntry(id) { const [r] = await db.select().from(schema.journalEntries).where(eq(schema.journalEntries.id, id)); return r; },
    async createJournalEntry(e) { const [r] = await db.insert(schema.journalEntries).values(e).returning(); return r; },
    async updateJournalEntry(id, e) { const [r] = await db.update(schema.journalEntries).set(e).where(eq(schema.journalEntries.id, id)).returning(); return r; },
    async deleteJournalEntry(id) { const r = await db.delete(schema.journalEntries).where(eq(schema.journalEntries.id, id)).returning(); return r.length > 0; },

    async getYesAndResponses() { return db.select().from(schema.yesAndResponses).orderBy(desc(schema.yesAndResponses.id)); },
    async createYesAndResponse(r) { const [row] = await db.insert(schema.yesAndResponses).values(r).returning(); return row; },
    async deleteYesAndResponse(id) { const r = await db.delete(schema.yesAndResponses).where(eq(schema.yesAndResponses.id, id)).returning(); return r.length > 0; },

    async getWarmupExercises() { return db.select().from(schema.warmupExercises).orderBy(asc(schema.warmupExercises.id)); },
    async getWarmupExercise(id) { const [r] = await db.select().from(schema.warmupExercises).where(eq(schema.warmupExercises.id, id)); return r; },
    async createWarmupExercise(e) { const [r] = await db.insert(schema.warmupExercises).values(e).returning(); return r; },
    async updateWarmupExercise(id, e) { const [r] = await db.update(schema.warmupExercises).set(e).where(eq(schema.warmupExercises.id, id)).returning(); return r; },
    async deleteWarmupExercise(id) { const r = await db.delete(schema.warmupExercises).where(eq(schema.warmupExercises.id, id)).returning(); return r.length > 0; },

    async getScenePremises() { return db.select().from(schema.scenePremises).orderBy(desc(schema.scenePremises.id)); },
    async getScenePremise(id) { const [r] = await db.select().from(schema.scenePremises).where(eq(schema.scenePremises.id, id)); return r; },
    async createScenePremise(s) { const [r] = await db.insert(schema.scenePremises).values(s).returning(); return r; },
    async updateScenePremise(id, s) { const [r] = await db.update(schema.scenePremises).set(s).where(eq(schema.scenePremises.id, id)).returning(); return r; },
    async deleteScenePremise(id) { const r = await db.delete(schema.scenePremises).where(eq(schema.scenePremises.id, id)).returning(); return r.length > 0; },

    async getSavedCharacters() { return db.select().from(schema.savedCharacters).orderBy(desc(schema.savedCharacters.id)); },
    async getSavedCharacter(id) { const [r] = await db.select().from(schema.savedCharacters).where(eq(schema.savedCharacters.id, id)); return r; },
    async createSavedCharacter(c) { const [r] = await db.insert(schema.savedCharacters).values(c).returning(); return r; },
    async updateSavedCharacter(id, c) { const [r] = await db.update(schema.savedCharacters).set(c).where(eq(schema.savedCharacters.id, id)).returning(); return r; },
    async deleteSavedCharacter(id) { const r = await db.delete(schema.savedCharacters).where(eq(schema.savedCharacters.id, id)).returning(); return r.length > 0; },
  };
}

// Export: auto-select based on DATABASE_URL
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

// Synchronous export for routes that are already initialized
export let storage: IStorage = new MemStorage(); // replaced on server init

export async function initStorage() {
  storage = await getStorage();
}
