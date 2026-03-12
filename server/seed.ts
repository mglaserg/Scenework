/**
 * Seed script — run once to populate focus items and dialog prompts.
 * Safe to run multiple times (checks if data already exists).
 */
import { db } from "./db";
import { focusItems, dialogPrompts } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // --- Focus Items ---
  const existingFocus = await db.execute(sql`SELECT COUNT(*) as count FROM focus_items`);
  const focusCount = Number((existingFocus.rows[0] as any).count);

  if (focusCount === 0) {
    await db.insert(focusItems).values([
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
    ]);
    console.log("✓ Seeded focus items");
  } else {
    console.log(`  Focus items already seeded (${focusCount} rows)`);
  }

  // --- Dialog Prompts ---
  const existingPrompts = await db.execute(sql`SELECT COUNT(*) as count FROM dialog_prompts`);
  const promptCount = Number((existingPrompts.rows[0] as any).count);

  if (promptCount === 0) {
    await db.insert(dialogPrompts).values([
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
    ]);
    console.log("✓ Seeded dialog prompts");
  } else {
    console.log(`  Dialog prompts already seeded (${promptCount} rows)`);
  }

  console.log("Seed complete.");
}

seed().catch(console.error);
