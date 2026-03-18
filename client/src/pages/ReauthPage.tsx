/**
 * ReauthPage — shown when the session cookie is still valid but the
 * in-memory CryptoKey was lost on page refresh.
 * The user just needs to re-enter their password to restore the key.
 */
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function ReauthPage() {
  const { user, login, logout } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || !user) return;
    setLoading(true);
    try {
      await login(user.email, password);
    } catch (err: any) {
      toast({ title: "Incorrect password", description: err.message, variant: "destructive" });
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
          maxWidth: 380,
          background: "hsl(30 8% 10%)",
          border: "1px solid hsl(30 8% 18%)",
          borderRadius: 16,
          padding: "36px 32px",
          boxShadow: "0 8px 40px hsl(0 0% 0% / 0.4)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "hsl(38 85% 52% / 0.12)",
              marginBottom: 14,
            }}
          >
            <Lock size={20} color="hsl(38 85% 55%)" />
          </div>
          <h2
            style={{
              fontFamily: "'Zodiak', serif",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "hsl(38 20% 88%)",
              marginBottom: 6,
            }}
          >
            Unlock your data
          </h2>
          <p style={{ fontSize: "0.8rem", color: "hsl(38 8% 48%)", lineHeight: 1.5 }}>
            Re-enter your password to decrypt your content.
          </p>
          {user && (
            <p style={{ fontSize: "0.75rem", color: "hsl(38 8% 36%)", marginTop: 4 }}>
              {user.email}
            </p>
          )}
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Lock
              size={14}
              style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", color: "hsl(38 8% 42%)", pointerEvents: "none",
              }}
            />
            <Input
              data-testid="reauth-password"
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
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

          <Button
            data-testid="reauth-submit"
            type="submit"
            disabled={loading}
            style={{
              background: "hsl(38 85% 52%)",
              color: "hsl(30 8% 7%)",
              fontWeight: 700,
            }}
          >
            {loading ? "Unlocking…" : "Unlock"}
          </Button>
        </form>

        <button
          onClick={logout}
          style={{
            display: "block",
            width: "100%",
            marginTop: 16,
            fontSize: "0.78rem",
            color: "hsl(38 8% 40%)",
            cursor: "pointer",
            background: "none",
            border: "none",
            textAlign: "center",
          }}
        >
          Sign in as a different user
        </button>
      </div>
    </div>
  );
}
