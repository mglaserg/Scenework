import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  encryptedKey: text("encrypted_key"),
  keySalt: text("key_salt"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ── Focus items (SHARED — userId nullable, null = global) ─────────────────────
export const focusItems = pgTable("focus_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),   // null = shared; set = private (reserved for future)
  title: text("title").notNull(),
  category: text("category").notNull().default("general"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertFocusItemSchema = createInsertSchema(focusItems).omit({ id: true, createdAt: true, userId: true });
export type InsertFocusItem = z.infer<typeof insertFocusItemSchema>;
export type FocusItem = typeof focusItems.$inferSelect;

// ── Practice sessions (USER-SCOPED) ──────────────────────────────────────────
export const practiceSessions = pgTable("practice_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  focusItemIds: text("focus_item_ids").notNull(),
  notes: text("notes"),
  sessionDate: timestamp("session_date").defaultNow(),
});
export const insertPracticeSessionSchema = createInsertSchema(practiceSessions).omit({ id: true, sessionDate: true, userId: true });
export type InsertPracticeSession = z.infer<typeof insertPracticeSessionSchema>;
export type PracticeSession = typeof practiceSessions.$inferSelect;

// ── Dialog prompts (SHARED — userId nullable) ─────────────────────────────────
export const dialogPrompts = pgTable("dialog_prompts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),   // null = shared
  line: text("line").notNull(),
  context: text("context"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertDialogPromptSchema = createInsertSchema(dialogPrompts).omit({ id: true, createdAt: true, userId: true });
export type InsertDialogPrompt = z.infer<typeof insertDialogPromptSchema>;
export type DialogPrompt = typeof dialogPrompts.$inferSelect;

// ── Journal entries (USER-SCOPED) ─────────────────────────────────────────────
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sessionType: text("session_type").notNull().default("practice"),
  whatWorked: text("what_worked"),
  whatToImprove: text("what_to_improve"),
  breakthroughMoment: text("breakthrough_moment"),
  freeWrite: text("free_write"),
  mood: text("mood").notNull().default("neutral"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true, userId: true });
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// ── Yes-And responses (USER-SCOPED) ───────────────────────────────────────────
export const yesAndResponses = pgTable("yes_and_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertYesAndResponseSchema = createInsertSchema(yesAndResponses).omit({ id: true, createdAt: true, userId: true });
export type InsertYesAndResponse = z.infer<typeof insertYesAndResponseSchema>;
export type YesAndResponse = typeof yesAndResponses.$inferSelect;

// ── Warmup exercises (SHARED — userId nullable) ───────────────────────────────
export const warmupExercises = pgTable("warmup_exercises", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),   // null = shared
  name: text("name").notNull(),
  duration: text("duration").notNull().default("3 min"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertWarmupExerciseSchema = createInsertSchema(warmupExercises).omit({ id: true, createdAt: true, userId: true });
export type InsertWarmupExercise = z.infer<typeof insertWarmupExerciseSchema>;
export type WarmupExercise = typeof warmupExercises.$inferSelect;

// ── Scene premises (USER-SCOPED) ──────────────────────────────────────────────
export const scenePremises = pgTable("scene_premises", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  characterA: text("character_a").notNull(),
  characterAWant: text("character_a_want").notNull(),
  characterB: text("character_b").notNull(),
  characterBWant: text("character_b_want").notNull(),
  location: text("location").notNull(),
  opening: text("opening").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertScenePremiseSchema = createInsertSchema(scenePremises).omit({ id: true, createdAt: true, userId: true });
export type InsertScenePremise = z.infer<typeof insertScenePremiseSchema>;
export type ScenePremise = typeof scenePremises.$inferSelect;

// ── Saved characters (USER-SCOPED) ────────────────────────────────────────────
export const savedCharacters = pgTable("saved_characters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  occupation: text("occupation").notNull(),
  quirk: text("quirk").notNull(),
  want: text("want").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertSavedCharacterSchema = createInsertSchema(savedCharacters).omit({ id: true, createdAt: true, userId: true });
export type InsertSavedCharacter = z.infer<typeof insertSavedCharacterSchema>;
export type SavedCharacter = typeof savedCharacters.$inferSelect;
