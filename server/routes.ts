import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { requireAuth, getUserId } from "./auth";
import {
  insertFocusItemSchema, insertPracticeSessionSchema, insertDialogPromptSchema,
  insertJournalEntrySchema, insertYesAndResponseSchema, insertWarmupExerciseSchema,
  insertScenePremiseSchema, insertSavedCharacterSchema,
} from "@shared/schema";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED ROUTES — no auth required, anyone can read/write
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Focus Items (shared library) ──────────────────────────────────────────
  app.get("/api/focus-items/random", async (_req, res) => {
    const items = await storage.getFocusItems();
    if (items.length < 3) return res.json(items);
    res.json([...items].sort(() => Math.random() - 0.5).slice(0, 3));
  });

  app.get("/api/focus-items", async (_req, res) => {
    res.json(await storage.getFocusItems());
  });

  app.post("/api/focus-items", async (req, res) => {
    const result = insertFocusItemSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    res.status(201).json(await storage.createFocusItem(result.data));
  });

  app.patch("/api/focus-items/:id", async (req, res) => {
    const result = insertFocusItemSchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    const updated = await storage.updateFocusItem(parseInt(req.params.id), result.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/focus-items/:id", async (req, res) => {
    const deleted = await storage.deleteFocusItem(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  });

  // ── Dialog Prompts (shared — used by Emotion Drill) ───────────────────────
  app.get("/api/dialog-prompts", async (_req, res) => {
    res.json(await storage.getDialogPrompts());
  });

  app.post("/api/dialog-prompts", async (req, res) => {
    const result = insertDialogPromptSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    res.status(201).json(await storage.createDialogPrompt(result.data));
  });

  app.patch("/api/dialog-prompts/:id", async (req, res) => {
    const result = insertDialogPromptSchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    const updated = await storage.updateDialogPrompt(parseInt(req.params.id), result.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/dialog-prompts/:id", async (req, res) => {
    const deleted = await storage.deleteDialogPrompt(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  });

  // ── Emotion Drill (shared prompts) ────────────────────────────────────────
  app.get("/api/emotion-drill/random", async (_req, res) => {
    const prompts = await storage.getDialogPrompts();
    const emotions = [
      "Joy", "Grief", "Rage", "Fear", "Disgust", "Shame",
      "Longing", "Envy", "Wonder", "Tenderness", "Humiliation",
      "Relief", "Dread", "Ecstasy", "Bitterness", "Gratitude",
      "Desperation", "Contentment", "Betrayal", "Hope",
    ];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    if (prompts.length === 0) return res.json({ prompt: null, emotion });
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    res.json({ prompt, emotion });
  });

  // ── Warmup Exercises (shared library) ────────────────────────────────────
  app.get("/api/warmup-exercises", async (_req, res) => {
    res.json(await storage.getWarmupExercises());
  });

  app.get("/api/warmup-exercises/random", async (_req, res) => {
    const all = await storage.getWarmupExercises();
    if (all.length === 0) return res.json({ exercises: [] });
    const count = Math.min(all.length, 3 + Math.floor(Math.random() * 3));
    res.json({ exercises: [...all].sort(() => Math.random() - 0.5).slice(0, count) });
  });

  app.post("/api/warmup-exercises", async (req, res) => {
    const result = insertWarmupExerciseSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    res.status(201).json(await storage.createWarmupExercise(result.data));
  });

  app.patch("/api/warmup-exercises/:id", async (req, res) => {
    const result = insertWarmupExerciseSchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    const updated = await storage.updateWarmupExercise(parseInt(req.params.id), result.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/warmup-exercises/:id", async (req, res) => {
    const deleted = await storage.deleteWarmupExercise(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  });

  // ── Static random generators (always shared, no DB) ──────────────────────
  app.get("/api/scene-partner/random", (_req, res) => {
    const characters = [
      { name: "A disgraced surgeon", want: "to redeem themselves" },
      { name: "An overconfident amateur magician", want: "to be taken seriously" },
      { name: "A retired spy", want: "one last adventure" },
      { name: "A wedding planner who hates romance", want: "to get through the day" },
      { name: "A competitive amateur chef", want: "to prove their mother wrong" },
      { name: "A conspiracy theorist barista", want: "someone to believe them" },
      { name: "An extremely literal genie", want: "to finally grant a wish correctly" },
      { name: "A ghost who doesn't know they're dead", want: "to finish unfinished business" },
      { name: "A time traveler from the 1970s", want: "to understand modern phones" },
      { name: "A motivational speaker with crippling self-doubt", want: "to believe their own advice" },
      { name: "A librarian who moonlights as a bouncer", want: "quiet" },
      { name: "A professional rival from childhood", want: "to finally win" },
      { name: "A scientist who accidentally shrunk themselves", want: "to get back to normal" },
      { name: "A medieval knight transported to now", want: "to find a quest worthy of them" },
      { name: "A failed actor who became a driving instructor", want: "to feel the spotlight again" },
    ];
    const locations = [
      "an IKEA at closing time", "the rooftop of a hospital",
      "a submarine running low on oxygen", "a silent retreat that just broke its own rules",
      "a 24-hour laundromat during a blackout", "the last open diner in a town during a blizzard",
      "a waiting room with no clear exit", "the greenroom before the biggest show of their lives",
      "a hot air balloon drifting off course", "an elevator stuck between floors",
      "a lighthouse during a storm", "a pawn shop with one item left",
      "the world's smallest airport", "a botanical garden after hours",
      "the back of a moving truck full of furniture",
    ];
    const openings = [
      "One of them just arrived with something they shouldn't have.",
      "They both need the same thing, but only one can have it.",
      "One of them knows a secret about the other.",
      "They haven't seen each other in exactly ten years.",
      "One of them is about to leave forever.",
      "Something just broke, and it can't be fixed.",
      "They've been waiting here for hours and don't know why.",
      "One of them is pretending to be someone they're not.",
      "They both thought they were alone.",
      "One of them just received devastating news.",
    ];
    const r = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    res.json({ characterA: r(characters), characterB: r(characters), location: r(locations), opening: r(openings) });
  });

  app.get("/api/warmup/random", (_req, res) => {
    const allExercises = [
      { name: "Zip Zap Zop", duration: "3 min", description: "Send energy around the circle using 'Zip', 'Zap', 'Zop' in sequence. Eye contact is everything." },
      { name: "Word Association", duration: "2 min", description: "Say the first word that comes to mind from the previous word. No thinking — just react." },
      { name: "Walk and Stop", duration: "3 min", description: "Fill the space evenly. When you stop, notice the space around you. Respond to the group, not yourself." },
      { name: "Sound Ball", duration: "3 min", description: "Throw an invisible ball with a sound. The receiver mirrors the sound and energy before throwing on." },
      { name: "Counting to 20", duration: "5 min", description: "Group counts from 1 to 20 — one number per person, no order, no simultaneous talking. Start over if two people speak at once." },
      { name: "Status Walk", duration: "3 min", description: "Walk the room at your current status (1–10). Adjust as directed. Notice how posture, gaze, and pace shift." },
      { name: "Gibberish Exchange", duration: "3 min", description: "Have a full emotional conversation using only gibberish. Meaning lives in the body, not the words." },
      { name: "Emotional Mirroring", duration: "3 min", description: "Mirror your partner's emotion without commentary. Follow the feeling, not the logic." },
      { name: "Last Letter", duration: "3 min", description: "The first word of each sentence must start with the last letter of the previous sentence's last word." },
      { name: "Object Transformation", duration: "4 min", description: "Pass an object around the circle. Each person uses it as something new, fully committing to the physicality." },
      { name: "Space Jump", duration: "5 min", description: "One person starts a scene. Someone calls 'Space Jump' — everyone freezes and a new scene is layered on top." },
      { name: "Shared Breath", duration: "2 min", description: "Stand in a circle and breathe together. Inhale for 4 counts, hold 4, exhale 4. Tune in to the group." },
      { name: "Blind Offers", duration: "3 min", description: "Make a physical offer (move, gesture, position). Your partner justifies what it means and responds." },
      { name: "Conducted Story", duration: "4 min", description: "One conductor points to players who tell a single story, picking up mid-sentence when pointed at." },
      { name: "Emotional Slides", duration: "3 min", description: "Walk the room. A caller shouts an emotion — you shift immediately. No announcement, just the feeling." },
    ];
    const count = 3 + Math.floor(Math.random() * 3);
    res.json({ exercises: [...allExercises].sort(() => Math.random() - 0.5).slice(0, count) });
  });

  app.get("/api/character/random", (_req, res) => {
    const firstNames = ["Marlowe","Delia","Crispin","Bette","Alonzo","Vera","Idris","Constance","Phineas","Lupe","Soren","Marigold","Dashiell","Oona","Thaddeus","Birdie","Cosmo","Neva","Fletcher","Ingrid"];
    const lastNames = ["Crane","Vasiliev","Okonkwo","Marchetti","Thorne","Nakamura","Delacroix","Osei","Whitmore","Patel","Fuentes","Adler","Mbeki","Hartley","Kovač","Bergström","Yuen","Rosario","O'Brien","Dubois"];
    const occupations = ["Taxidermist","Underground pastry chef","Forensic accountant","Retired rodeo clown","Municipal noise inspector","Professional mourner","Competitive memory athlete","Beekeeper","Handwriting analyst","Decommissioned astronaut","Town crier","Freelance exorcist","Toll booth philosopher","Yacht restorer","Amateur cryptographer","Unlicensed chiropractor","Oral historian","Museum nightguard","Escape room designer","Competitive dog groomer"];
    const quirks = ["Can't stop naming inanimate objects","Speaks in aphorisms they just made up","Treats every interaction like a business negotiation","Apologizes after every sentence","Always has one glove on","Hums when they lie","Believes they are the most interesting person in any room","Refers to themselves in the third person when nervous","Can't resist correcting people's grammar","Leaves voicemails to no one","Takes everything literally","Narrates their own actions under their breath","Never makes direct eye contact — always looks slightly to the left","Randomly quotes maritime law","Convinced the conversation is being secretly recorded"];
    const wants = ["To be forgiven for something they haven't admitted yet","To find the one person who understands them","To finish what they started twenty years ago","To be taken seriously just once","To leave before anyone notices they were there","To prove a childhood bully wrong","To finally say the thing they've been holding back","To become someone unrecognizable from who they were","To matter to a stranger","To get home before dark","To stop pretending everything is fine","To be the last one standing","To feel something real","To never have to explain themselves again","To find out if the story they tell about themselves is true"];
    const r = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    res.json({ name: `${r(firstNames)} ${r(lastNames)}`, occupation: r(occupations), quirk: r(quirks), want: r(wants) });
  });

  app.get("/api/yes-and/prompts/random", (_req, res) => {
    const prompts = [
      "I just found out I can talk to animals.",
      "We're going to be late for the most important meeting of our lives.",
      "This isn't the house I grew up in.",
      "I've decided to quit my job and sail around the world.",
      "Someone just left a baby on our doorstep.",
      "I think the coffee shop is haunted.",
      "I bought us matching tattoos.",
      "We won the lottery but lost the ticket.",
      "My long-lost twin just showed up at the door.",
      "The museum called — apparently we stole something last night.",
      "I enrolled us in a competitive pie-eating contest.",
      "Our landlord is actually a wizard.",
      "I've been practicing ventriloquism in secret for six months.",
      "The neighbor's dog can apparently predict the future.",
      "I accidentally adopted a whole family of raccoons.",
      "I signed us up to be on a reality TV show.",
      "The doctor said I can only speak in questions for the next week.",
      "I found a treasure map in the attic.",
      "Our vacation rental is a decommissioned submarine.",
      "I've been secretly training for the Olympics.",
      "Someone's been living in our walls for three years.",
      "I just agreed to house-sit a jaguar.",
      "The mayor wants us to run the city for a day.",
      "I may have accidentally started a cult.",
      "I traded our car for a horse.",
    ];
    res.json({ prompt: prompts[Math.floor(Math.random() * prompts.length)] });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USER-SCOPED ROUTES — requireAuth on all of these
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Practice Sessions (Focus DB log) ─────────────────────────────────────
  app.get("/api/practice-sessions", requireAuth, async (req, res) => {
    res.json(await storage.getPracticeSessions(getUserId(req)));
  });

  app.post("/api/practice-sessions", requireAuth, async (req, res) => {
    const result = insertPracticeSessionSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    res.status(201).json(await storage.createPracticeSession(getUserId(req), result.data));
  });

  app.delete("/api/practice-sessions/:id", requireAuth, async (req, res) => {
    const deleted = await storage.deletePracticeSession(getUserId(req), parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  });

  // ── Journal Entries ───────────────────────────────────────────────────────
  app.get("/api/journal-entries", requireAuth, async (req, res) => {
    res.json(await storage.getJournalEntries(getUserId(req)));
  });

  app.get("/api/journal-entries/:id", requireAuth, async (req, res) => {
    const entry = await storage.getJournalEntry(getUserId(req), parseInt(req.params.id));
    if (!entry) return res.status(404).json({ error: "Not found" });
    res.json(entry);
  });

  app.post("/api/journal-entries", requireAuth, async (req, res) => {
    const result = insertJournalEntrySchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    res.status(201).json(await storage.createJournalEntry(getUserId(req), result.data));
  });

  app.patch("/api/journal-entries/:id", requireAuth, async (req, res) => {
    const result = insertJournalEntrySchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    const updated = await storage.updateJournalEntry(getUserId(req), parseInt(req.params.id), result.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/journal-entries/:id", requireAuth, async (req, res) => {
    const deleted = await storage.deleteJournalEntry(getUserId(req), parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  });

  // ── Yes-And Responses ─────────────────────────────────────────────────────
  app.get("/api/yes-and/responses", requireAuth, async (req, res) => {
    res.json(await storage.getYesAndResponses(getUserId(req)));
  });

  app.post("/api/yes-and/responses", requireAuth, async (req, res) => {
    const result = insertYesAndResponseSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    res.status(201).json(await storage.createYesAndResponse(getUserId(req), result.data));
  });

  app.delete("/api/yes-and/responses/:id", requireAuth, async (req, res) => {
    const deleted = await storage.deleteYesAndResponse(getUserId(req), parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  });

  // ── Scene Premises ────────────────────────────────────────────────────────
  app.get("/api/scene-premises", requireAuth, async (req, res) => {
    res.json(await storage.getScenePremises(getUserId(req)));
  });

  app.post("/api/scene-premises", requireAuth, async (req, res) => {
    const result = insertScenePremiseSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    res.status(201).json(await storage.createScenePremise(getUserId(req), result.data));
  });

  app.patch("/api/scene-premises/:id", requireAuth, async (req, res) => {
    const result = insertScenePremiseSchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    const updated = await storage.updateScenePremise(getUserId(req), parseInt(req.params.id), result.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/scene-premises/:id", requireAuth, async (req, res) => {
    const deleted = await storage.deleteScenePremise(getUserId(req), parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  });

  // ── Saved Characters ──────────────────────────────────────────────────────
  app.get("/api/saved-characters", requireAuth, async (req, res) => {
    res.json(await storage.getSavedCharacters(getUserId(req)));
  });

  app.post("/api/saved-characters", requireAuth, async (req, res) => {
    const result = insertSavedCharacterSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    res.status(201).json(await storage.createSavedCharacter(getUserId(req), result.data));
  });

  app.patch("/api/saved-characters/:id", requireAuth, async (req, res) => {
    const result = insertSavedCharacterSchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues });
    const updated = await storage.updateSavedCharacter(getUserId(req), parseInt(req.params.id), result.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/saved-characters/:id", requireAuth, async (req, res) => {
    const deleted = await storage.deleteSavedCharacter(getUserId(req), parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  });

  return httpServer;
}
