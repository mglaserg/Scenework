import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Focus items — things to work on in practice (e.g. "listening", "physicality", "yes-and")
export const focusItems = pgTable("focus_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("general"), // technique, character, listening, physicality, etc.
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFocusItemSchema = createInsertSchema(focusItems).omit({ id: true, createdAt: true });
export type InsertFocusItem = z.infer<typeof insertFocusItemSchema>;
export type FocusItem = typeof focusItems.$inferSelect;

// Practice sessions — log of 3 randomly selected focus items per session
export const practiceSessions = pgTable("practice_sessions", {
  id: serial("id").primaryKey(),
  focusItemIds: text("focus_item_ids").notNull(), // JSON array of 3 IDs
  notes: text("notes"),
  sessionDate: timestamp("session_date").defaultNow(),
});

export const insertPracticeSessionSchema = createInsertSchema(practiceSessions).omit({ id: true, sessionDate: true });
export type InsertPracticeSession = z.infer<typeof insertPracticeSessionSchema>;
export type PracticeSession = typeof practiceSessions.$inferSelect;

// Dialog prompts — lines + emotions for the emotion drill
export const dialogPrompts = pgTable("dialog_prompts", {
  id: serial("id").primaryKey(),
  line: text("line").notNull(),
  context: text("context"), // optional scene context
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDialogPromptSchema = createInsertSchema(dialogPrompts).omit({ id: true, createdAt: true });
export type InsertDialogPrompt = z.infer<typeof insertDialogPromptSchema>;
export type DialogPrompt = typeof dialogPrompts.$inferSelect;

// Journal entries — improv journal with templated fields
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  sessionType: text("session_type").notNull().default("practice"), // practice, show, workshop, class
  whatWorked: text("what_worked"),
  whatToImprove: text("what_to_improve"),
  breakthroughMoment: text("breakthrough_moment"),
  freeWrite: text("free_write"),
  mood: text("mood").notNull().default("neutral"), // energized, neutral, frustrated, connected, scattered, present
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true });
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// Yes-And Trainer responses — log of user responses to yes-and prompts
export const yesAndResponses = pgTable("yes_and_responses", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertYesAndResponseSchema = createInsertSchema(yesAndResponses).omit({ id: true, createdAt: true });
export type InsertYesAndResponse = z.infer<typeof insertYesAndResponseSchema>;
export type YesAndResponse = typeof yesAndResponses.$inferSelect;

// Warm-up exercises — user-managed library of exercises
export const warmupExercises = pgTable("warmup_exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  duration: text("duration").notNull().default("3 min"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWarmupExerciseSchema = createInsertSchema(warmupExercises).omit({ id: true, createdAt: true });
export type InsertWarmupExercise = z.infer<typeof insertWarmupExerciseSchema>;
export type WarmupExercise = typeof warmupExercises.$inferSelect;

// Scene premises — user-saved scene setups
export const scenePremises = pgTable("scene_premises", {
  id: serial("id").primaryKey(),
  characterA: text("character_a").notNull(),
  characterAWant: text("character_a_want").notNull(),
  characterB: text("character_b").notNull(),
  characterBWant: text("character_b_want").notNull(),
  location: text("location").notNull(),
  opening: text("opening").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScenePremiseSchema = createInsertSchema(scenePremises).omit({ id: true, createdAt: true });
export type InsertScenePremise = z.infer<typeof insertScenePremiseSchema>;
export type ScenePremise = typeof scenePremises.$inferSelect;

// Saved characters — user-managed character library
export const savedCharacters = pgTable("saved_characters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  occupation: text("occupation").notNull(),
  quirk: text("quirk").notNull(),
  want: text("want").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedCharacterSchema = createInsertSchema(savedCharacters).omit({ id: true, createdAt: true });
export type InsertSavedCharacter = z.infer<typeof insertSavedCharacterSchema>;
export type SavedCharacter = typeof savedCharacters.$inferSelect;
