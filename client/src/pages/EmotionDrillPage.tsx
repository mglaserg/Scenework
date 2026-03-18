import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { encryptFields, decryptArray, decryptFields } from "@/lib/crypto";
import { RefreshCw, Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DialogPrompt } from "@shared/schema";

const EMOTIONS = [
  "Joy", "Grief", "Rage", "Fear", "Disgust", "Shame",
  "Longing", "Envy", "Wonder", "Tenderness", "Humiliation",
  "Relief", "Dread", "Ecstasy", "Bitterness", "Gratitude",
  "Desperation", "Contentment", "Betrayal", "Hope",
];

const EMOTION_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  Joy:          { bg: "hsl(50 85% 52% / 0.12)", text: "hsl(50 85% 65%)", glow: "hsl(50 85% 52% / 0.2)" },
  Grief:        { bg: "hsl(220 30% 25% / 0.4)", text: "hsl(220 40% 70%)", glow: "hsl(220 30% 40% / 0.2)" },
  Rage:         { bg: "hsl(0 60% 25% / 0.4)", text: "hsl(0 70% 65%)", glow: "hsl(0 60% 45% / 0.25)" },
  Fear:         { bg: "hsl(280 40% 20% / 0.4)", text: "hsl(280 60% 72%)", glow: "hsl(280 40% 45% / 0.2)" },
  Disgust:      { bg: "hsl(100 35% 18% / 0.4)", text: "hsl(100 50% 58%)", glow: "hsl(100 40% 40% / 0.2)" },
  Shame:        { bg: "hsl(340 35% 22% / 0.4)", text: "hsl(340 50% 65%)", glow: "hsl(340 40% 45% / 0.2)" },
  Longing:      { bg: "hsl(195 50% 18% / 0.4)", text: "hsl(195 65% 65%)", glow: "hsl(195 55% 45% / 0.2)" },
  Envy:         { bg: "hsl(130 40% 16% / 0.4)", text: "hsl(130 55% 60%)", glow: "hsl(130 45% 38% / 0.2)" },
  Wonder:       { bg: "hsl(260 55% 20% / 0.4)", text: "hsl(260 65% 78%)", glow: "hsl(260 55% 50% / 0.2)" },
  Tenderness:   { bg: "hsl(345 50% 20% / 0.4)", text: "hsl(345 60% 72%)", glow: "hsl(345 50% 50% / 0.2)" },
  Humiliation:  { bg: "hsl(20 55% 18% / 0.4)", text: "hsl(20 65% 62%)", glow: "hsl(20 55% 40% / 0.2)" },
  Relief:       { bg: "hsl(155 45% 15% / 0.4)", text: "hsl(155 60% 60%)", glow: "hsl(155 50% 40% / 0.2)" },
  Dread:        { bg: "hsl(245 30% 18% / 0.4)", text: "hsl(245 45% 68%)", glow: "hsl(245 35% 42% / 0.2)" },
  Ecstasy:      { bg: "hsl(38 85% 22% / 0.4)", text: "hsl(38 85% 65%)", glow: "hsl(38 85% 52% / 0.25)" },
  Bitterness:   { bg: "hsl(30 35% 16% / 0.4)", text: "hsl(30 50% 58%)", glow: "hsl(30 40% 38% / 0.2)" },
  Gratitude:    { bg: "hsl(80 50% 15% / 0.4)", text: "hsl(80 65% 62%)", glow: "hsl(80 55% 40% / 0.2)" },
  Desperation:  { bg: "hsl(15 55% 18% / 0.4)", text: "hsl(15 70% 62%)", glow: "hsl(15 55% 42% / 0.2)" },
  Contentment:  { bg: "hsl(185 45% 16% / 0.4)", text: "hsl(185 60% 62%)", glow: "hsl(185 50% 40% / 0.2)" },
  Betrayal:     { bg: "hsl(310 35% 18% / 0.4)", text: "hsl(310 55% 65%)", glow: "hsl(310 40% 42% / 0.2)" },
  Hope:         { bg: "hsl(200 60% 18% / 0.4)", text: "hsl(200 70% 68%)", glow: "hsl(200 60% 45% / 0.2)" },
};

type DrillResult = { prompt: { id: number; line: string; context: string | null }; emotion: string };

type FormState = { line: string; context: string };
const BLANK: FormState = { line: "", context: "" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DIALOG_ENCRYPTED_FIELDS: any[] = ["line", "context"];

export default function EmotionDrillPage() {
  const { toast } = useToast();
  const { dataKey } = useAuth();
  const [drill, setDrill] = useState<DrillResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<DialogPrompt | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  const { data: rawPrompts = [] } = useQuery<DialogPrompt[]>({
    queryKey: ["/api/dialog-prompts"],
  });
  const [prompts, setPrompts] = useState<DialogPrompt[]>([]);
  useEffect(() => {
    if (!rawPrompts.length) { setPrompts([]); return; }
    if (!dataKey) { setPrompts(rawPrompts); return; }
    decryptArray(rawPrompts, DIALOG_ENCRYPTED_FIELDS, dataKey).then(setPrompts);
  }, [rawPrompts, dataKey]);

  const createMutation = useMutation({
    mutationFn: async (data: FormState) => {
      if (!dataKey) throw new Error("No encryption key");
      const encrypted = await encryptFields(data, DIALOG_ENCRYPTED_FIELDS, dataKey);
      return apiRequest("POST", "/api/dialog-prompts", encrypted);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/dialog-prompts"] }); setShowForm(false); setForm(BLANK); toast({ title: "Line added" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormState> }) => {
      if (!dataKey) throw new Error("No encryption key");
      const encrypted = await encryptFields(data, DIALOG_ENCRYPTED_FIELDS, dataKey);
      return apiRequest("PATCH", `/api/dialog-prompts/${id}`, encrypted);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/dialog-prompts"] }); setEditingPrompt(null); setForm(BLANK); setShowForm(false); toast({ title: "Updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/dialog-prompts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/dialog-prompts"] }),
  });

  async function rollDrill() {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/emotion-drill/random");
      const data = await res.json();
      if (dataKey) {
        data.prompt = await decryptFields(data.prompt, DIALOG_ENCRYPTED_FIELDS, dataKey);
      }
      setDrill(data);
    } catch {
      toast({ title: "Error", description: "Could not fetch a prompt." });
    } finally {
      setLoading(false);
    }
  }

  function startEdit(p: DialogPrompt) {
    setEditingPrompt(p);
    setForm({ line: p.line, context: p.context ?? "" });
    setShowForm(true);
  }

  function submitForm() {
    if (!form.line.trim()) return;
    if (editingPrompt) updateMutation.mutate({ id: editingPrompt.id, data: form });
    else createMutation.mutate(form);
  }

  const emotionStyle = drill ? (EMOTION_COLORS[drill.emotion] ?? { bg: "hsl(38 85% 52% / 0.1)", text: "hsl(38 85% 60%)", glow: "hsl(38 85% 52% / 0.15)" }) : null;

  return (
    <div style={{ padding: "32px 32px 48px", maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Zodiak', serif", fontSize: "clamp(1.5rem, 2vw + 1rem, 2rem)", fontWeight: 700, color: "hsl(38 20% 88%)", marginBottom: 6 }}>
          Emotion Drill
        </h1>
        <p style={{ color: "hsl(38 8% 50%)", fontSize: "0.875rem" }}>
          A line and an emotion. Deliver the line from that place — fully, specifically, without commenting on it.
        </p>
      </div>

      {/* Main drill card */}
      <div
        style={{
          background: "hsl(30 8% 10%)",
          border: "1px solid hsl(30 8% 20%)",
          borderRadius: 14,
          padding: "36px 32px",
          marginBottom: 20,
          textAlign: "center",
          minHeight: 280,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {!drill && !loading && (
          <div style={{ color: "hsl(38 8% 40%)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12, opacity: 0.3 }}>◎</div>
            <p style={{ fontSize: "0.9rem" }}>Hit the button to receive your prompt.</p>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "hsl(38 8% 45%)" }}>
            <div className="skeleton" style={{ width: 320, height: 28 }} />
            <div className="skeleton" style={{ width: 200, height: 20 }} />
            <div className="skeleton" style={{ width: 120, height: 40, borderRadius: 8 }} />
          </div>
        )}

        {drill && !loading && emotionStyle && (
          <div className="animate-spotlight" style={{ width: "100%" }}>
            {/* Emotion badge */}
            <div
              data-testid="emotion-badge"
              style={{
                display: "inline-block",
                padding: "8px 24px",
                borderRadius: 9999,
                background: emotionStyle.bg,
                color: emotionStyle.text,
                fontWeight: 700,
                fontSize: "clamp(1rem, 3vw, 1.4rem)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 20,
                boxShadow: `0 0 24px ${emotionStyle.glow}`,
                fontFamily: "'General Sans', sans-serif",
              }}
            >
              {drill.emotion}
            </div>

            {/* The line */}
            <blockquote
              data-testid="dialog-line"
              style={{
                fontFamily: "'Zodiak', serif",
                fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
                fontWeight: 500,
                color: "hsl(38 20% 90%)",
                lineHeight: 1.5,
                fontStyle: "italic",
                margin: "0 0 14px",
                padding: "0 8px",
              }}
            >
              "{drill.prompt.line}"
            </blockquote>

            {/* Context */}
            {drill.prompt.context && (
              <p
                data-testid="dialog-context"
                style={{ fontSize: "0.82rem", color: "hsl(38 8% 48%)", fontStyle: "italic" }}
              >
                Context: {drill.prompt.context}
              </p>
            )}

            {/* Instruction */}
            <p style={{ fontSize: "0.78rem", color: "hsl(38 5% 38%)", marginTop: 16, maxWidth: 420 }}>
              Say the line. Then say it again. Let the emotion arrive — don't push it.
            </p>
          </div>
        )}
      </div>

      {/* Roll button */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 32 }}>
        <Button
          data-testid="roll-drill-button"
          onClick={rollDrill}
          disabled={loading || prompts.length === 0}
          style={{
            background: "hsl(38 85% 52%)",
            color: "hsl(30 8% 7%)",
            fontWeight: 700,
            fontSize: "0.95rem",
            padding: "10px 28px",
            display: "flex",
            gap: 8,
            alignItems: "center",
            borderRadius: 8,
          }}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {drill ? "New Prompt" : "Get Prompt"}
        </Button>
        <Button
          data-testid="toggle-prompt-manager"
          onClick={() => setShowManager(!showManager)}
          size="sm"
          variant="outline"
          style={{ borderColor: "hsl(30 8% 22%)", color: "hsl(38 8% 55%)" }}
        >
          Manage Lines
        </Button>
      </div>

      {/* Emotion palette reference */}
      <div style={{ background: "hsl(30 8% 10%)", border: "1px solid hsl(30 8% 17%)", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
        <p style={{ fontSize: "0.75rem", color: "hsl(38 8% 42%)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>All Emotions in the Deck</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {EMOTIONS.map(e => {
            const s = EMOTION_COLORS[e];
            const active = drill?.emotion === e;
            return (
              <span
                key={e}
                style={{
                  padding: "3px 10px",
                  borderRadius: 9999,
                  fontSize: "0.75rem",
                  fontWeight: active ? 600 : 400,
                  background: active ? s.bg : "hsl(30 8% 14%)",
                  color: active ? s.text : "hsl(38 8% 48%)",
                  border: "1px solid",
                  borderColor: active ? s.text.replace(")", " / 0.3)") : "transparent",
                  transition: "all 200ms",
                }}
              >
                {e}
              </span>
            );
          })}
        </div>
      </div>

      {/* Prompt manager */}
      {showManager && (
        <div
          className="animate-fade-in"
          style={{ background: "hsl(30 8% 10%)", border: "1px solid hsl(30 8% 18%)", borderRadius: 12, padding: 20 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "'Zodiak', serif", fontWeight: 600, fontSize: "1rem" }}>Dialog Line Library</h2>
            <Button
              data-testid="add-prompt-button"
              onClick={() => { setEditingPrompt(null); setForm(BLANK); setShowForm(true); }}
              size="sm"
              style={{ background: "hsl(30 8% 18%)", color: "hsl(38 10% 65%)", border: "1px solid hsl(30 8% 24%)", display: "flex", gap: 5 }}
            >
              <Plus size={13} /> Add Line
            </Button>
          </div>

          {showForm && (
            <div
              data-testid="prompt-form"
              className="animate-fade-in"
              style={{ background: "hsl(30 8% 13%)", border: "1px solid hsl(38 85% 52% / 0.2)", borderRadius: 8, padding: 14, marginBottom: 14 }}
            >
              <Textarea
                data-testid="prompt-line-input"
                placeholder="The dialog line (e.g. 'I've been meaning to tell you something.')"
                value={form.line}
                onChange={e => setForm(f => ({ ...f, line: e.target.value }))}
                rows={2}
                style={{ background: "hsl(30 8% 16%)", border: "1px solid hsl(30 8% 24%)", resize: "none", marginBottom: 8, fontSize: "0.875rem" }}
              />
              <Input
                data-testid="prompt-context-input"
                placeholder="Context (optional)"
                value={form.context}
                onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
                style={{ background: "hsl(30 8% 16%)", border: "1px solid hsl(30 8% 24%)", marginBottom: 10, fontSize: "0.875rem" }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <Button onClick={submitForm} disabled={!form.line.trim()} size="sm" style={{ background: "hsl(38 85% 52%)", color: "hsl(30 8% 7%)", fontWeight: 600, display: "flex", gap: 5 }}>
                  <Check size={13} /> {editingPrompt ? "Save" : "Add"}
                </Button>
                <Button onClick={() => { setShowForm(false); setEditingPrompt(null); setForm(BLANK); }} size="sm" variant="ghost" style={{ color: "hsl(38 8% 50%)" }}>Cancel</Button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
            {prompts.map(p => (
              <div
                key={p.id}
                data-testid={`prompt-row-${p.id}`}
                style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "hsl(30 8% 13%)", borderRadius: 7, border: "1px solid hsl(30 8% 18%)" }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.82rem", fontStyle: "italic", color: "hsl(38 15% 78%)", marginBottom: 2 }}>"{p.line}"</p>
                  {p.context && <p style={{ fontSize: "0.72rem", color: "hsl(38 8% 48%)" }}>{p.context}</p>}
                </div>
                <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                  <button onClick={() => startEdit(p)} style={{ padding: "4px 5px", color: "hsl(38 8% 45%)", cursor: "pointer", borderRadius: 4 }}>
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(p.id)} style={{ padding: "4px 5px", color: "hsl(38 8% 45%)", cursor: "pointer", borderRadius: 4 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
