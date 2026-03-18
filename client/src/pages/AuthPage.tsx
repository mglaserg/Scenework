import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";

type Mode = "login" | "signup";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (mode === "signup") {
      if (password.length < 8) {
        toast({ title: "Password too short", description: "Must be at least 8 characters.", variant: "destructive" });
        return;
      }
      if (password !== confirm) {
        toast({ title: "Passwords don't match", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password);
        toast({ title: "Account created", description: "Welcome to Stagework." });
      }
    } catch (err: any) {
      toast({ title: mode === "login" ? "Login failed" : "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "hsl(30 8% 7%)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "hsl(30 8% 10%)",
          border: "1px solid hsl(30 8% 18%)",
          borderRadius: 16,
          padding: "40px 36px",
          boxShadow: "0 8px 40px hsl(0 0% 0% / 0.4)",
        }}
      >
        {/* Logo / title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "hsl(38 85% 52% / 0.15)",
              marginBottom: 16,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="Stagework">
              <circle cx="12" cy="12" r="9" stroke="hsl(38 85% 55%)" strokeWidth="1.5" />
              <path d="M8 12 L12 8 L16 12 L12 16 Z" fill="hsl(38 85% 55%)" opacity="0.8" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "'Zodiak', serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "hsl(38 20% 88%)",
              marginBottom: 6,
            }}
          >
            Stagework
          </h1>
          <p style={{ fontSize: "0.82rem", color: "hsl(38 8% 48%)" }}>
            {mode === "login" ? "Sign in to continue practicing." : "Create your private practice space."}
          </p>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            background: "hsl(30 8% 8%)",
            borderRadius: 8,
            padding: 3,
            marginBottom: 24,
          }}
        >
          {(["login", "signup"] as Mode[]).map(m => (
            <button
              key={m}
              data-testid={`auth-mode-${m}`}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 6,
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms",
                background: mode === m ? "hsl(38 85% 52%)" : "transparent",
                color: mode === m ? "hsl(30 8% 7%)" : "hsl(38 8% 50%)",
                border: "none",
              }}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Email */}
          <div style={{ position: "relative" }}>
            <Mail
              size={14}
              style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", color: "hsl(38 8% 42%)", pointerEvents: "none",
              }}
            />
            <Input
              data-testid="auth-email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
              style={{
                paddingLeft: 34,
                background: "hsl(30 8% 13%)",
                border: "1px solid hsl(30 8% 22%)",
                color: "hsl(38 20% 86%)",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ position: "relative" }}>
            <Lock
              size={14}
              style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", color: "hsl(38 8% 42%)", pointerEvents: "none",
              }}
            />
            <Input
              data-testid="auth-password"
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              style={{
                paddingLeft: 34,
                paddingRight: 36,
                background: "hsl(30 8% 13%)",
                border: "1px solid hsl(30 8% 22%)",
                color: "hsl(38 20% 86%)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{
                position: "absolute", right: 10, top: "50%",
                transform: "translateY(-50%)", color: "hsl(38 8% 42%)", cursor: "pointer",
                background: "none", border: "none", padding: 2,
              }}
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Confirm password (signup only) */}
          {mode === "signup" && (
            <div style={{ position: "relative" }}>
              <Lock
                size={14}
                style={{
                  position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)", color: "hsl(38 8% 42%)", pointerEvents: "none",
                }}
              />
              <Input
                data-testid="auth-confirm"
                type={showPw ? "text" : "password"}
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                style={{
                  paddingLeft: 34,
                  background: "hsl(30 8% 13%)",
                  border: "1px solid hsl(30 8% 22%)",
                  color: "hsl(38 20% 86%)",
                }}
              />
            </div>
          )}

          <Button
            data-testid="auth-submit"
            type="submit"
            disabled={loading}
            style={{
              background: "hsl(38 85% 52%)",
              color: "hsl(30 8% 7%)",
              fontWeight: 700,
              fontSize: "0.9rem",
              marginTop: 4,
            }}
          >
            {loading
              ? mode === "login" ? "Signing in…" : "Creating account…"
              : mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Encryption note */}
        <div
          style={{
            marginTop: 24,
            padding: "12px 14px",
            background: "hsl(30 8% 8%)",
            borderRadius: 8,
            border: "1px solid hsl(30 8% 16%)",
          }}
        >
          <p style={{ fontSize: "0.72rem", color: "hsl(38 8% 44%)", lineHeight: 1.6, textAlign: "center" }}>
            🔒 Your journal and focus data are encrypted in your browser before being stored.
            Only you can read them.
          </p>
        </div>
      </div>
    </div>
  );
}
