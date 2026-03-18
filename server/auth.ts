import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ── Session store ─────────────────────────────────────────────────────────────
export function setupAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "stagework-dev-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // ── Passport local strategy ──────────────────────────────────────────────
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
        if (!user) return done(null, false, { message: "Invalid email or password" });
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return done(null, false, { message: "Invalid email or password" });
        return done(null, user);
      } catch (e) {
        return done(e);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      done(null, user || false);
    } catch (e) {
      done(e);
    }
  });

  // ── Auth routes ──────────────────────────────────────────────────────────
  const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    encryptedKey: z.string().optional(),
    keySalt: z.string().optional(),
  });

  // POST /api/auth/signup
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }
    const { email, password, encryptedKey, keySalt } = result.data;
    try {
      const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
      if (existing) return res.status(409).json({ error: "An account with this email already exists" });

      const passwordHash = await bcrypt.hash(password, 12);
      const [user] = await db.insert(users).values({
        email: email.toLowerCase().trim(),
        passwordHash,
        encryptedKey: encryptedKey || null,
        keySalt: keySalt || null,
      }).returning();

      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login failed after signup" });
        return res.status(201).json({
          id: user.id,
          email: user.email,
          encryptedKey: user.encryptedKey,
          keySalt: user.keySalt,
        });
      });
    } catch (e: any) {
      console.error("Signup error:", e);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return res.status(500).json({ error: "Login failed" });
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
      req.login(user, (loginErr) => {
        if (loginErr) return res.status(500).json({ error: "Session error" });
        return res.json({
          id: user.id,
          email: user.email,
          encryptedKey: user.encryptedKey,
          keySalt: user.keySalt,
        });
      });
    })(req, res, next);
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout(() => res.json({ ok: true }));
  });

  // GET /api/auth/me
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const user = req.user as any;
    return res.json({
      id: user.id,
      email: user.email,
      encryptedKey: user.encryptedKey,
      keySalt: user.keySalt,
    });
  });
}

// ── Auth middleware ───────────────────────────────────────────────────────────
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  next();
}

export function getUserId(req: Request): number {
  return (req.user as any).id;
}
