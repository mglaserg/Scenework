import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WarmupExercise } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { encryptFields, decryptArray } from "@/lib/crypto";

// ── Default seed exercises (seeded into DB on first generate if empty) ────────
const DEFAULT_EXERCISES = [
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

const NUM_COLORS = ["hsl(38 85% 52%)", "hsl(200 70% 55%)", "hsl(280 60% 60%)", "hsl(150 60% 45%)", "hsl(10 70% 55%)"];

type EditState = { id: number; name: string; duration: string; description: string } | null;
type FormState = { name: string; duration: string; description: string };

const EMPTY_FORM: FormState = { name: "", duration: "3 min", description: "" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WARMUP_ENCRYPTED_FIELDS: any[] = ["name", "description"];

export default function WarmUpPage() {
  const { toast } = useToast();
  const { dataKey } = useAuth();
  const [drawnSet, setDrawnSet] = useState<WarmupExercise[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editState, setEditState] = useState<EditState>(null);
  const [tab, setTab] = useState<"draw" | "library">("draw");

  const { data: rawExercises = [], isLoading } = useQuery<WarmupExercise[]>({
    queryKey: ["/api/warmup-exercises"],
  });
  const [exercises, setExercises] = useState<WarmupExercise[]>([]);
  useEffect(() => {
    if (!rawExercises.length) { setExercises([]); return; }
    if (!dataKey) { setExercises(rawExercises); return; }
    decryptArray(rawExercises, WARMUP_ENCRYPTED_FIELDS, dataKey).then(setExercises);
  }, [rawExercises, dataKey]);

  const createMutation = useMutation({
    mutationFn: async (data: FormState) => {
      if (!dataKey) throw new Error("No encryption key");
      const encrypted = await encryptFields(data, WARMUP_ENCRYPTED_FIELDS, dataKey);
      await apiRequest("POST", "/api/warmup-exercises", encrypted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warmup-exercises"] });
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast({ title: "Exercise added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormState> }) => {
      if (!dataKey) throw new Error("No encryption key");
      const encrypted = await encryptFields(data, WARMUP_ENCRYPTED_FIELDS, dataKey);
      await apiRequest("PATCH", `/api/warmup-exercises/${id}`, encrypted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warmup-exercises"] });
      setEditState(null);
      toast({ title: "Exercise updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/warmup-exercises/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/warmup-exercises"] }),
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const seedAndDraw = async () => {
    let pool = exercises;
    // Auto-seed defaults if library is empty
    if (pool.length === 0) {
      if (!dataKey) throw new Error("No encryption key");
      const created: WarmupExercise[] = [];
      for (const ex of DEFAULT_EXERCISES) {
        const encrypted = await encryptFields(ex, ["name", "description"], dataKey);
        const res = await apiRequest("POST", "/api/warmup-exercises", encrypted);
        created.push(await res.json());
      }
      queryClient.invalidateQueries({ queryKey: ["/api/warmup-exercises"] });
      pool = created;
    }
    const count = Math.min(pool.length, 3 + Math.floor(Math.random() * 3));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setDrawnSet(shuffled.slice(0, count));
    setExpanded(null);
    setTab("draw");
  };

  const totalMin = drawnSet.reduce((acc, e) => acc + parseInt(e.duration), 0);

  const S = {
    label: { fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: "hsl(38 5% 40%)" },
    input: { width: "100%", boxSizing: "border-box" as const, padding: "8px 12px", borderRadius: 6, fontSize: "0.85rem", background: "hsl(30 8% 13%)", border: "1px solid hsl(30 8% 22%)", color: "hsl(38 20% 88%)", outline: "none", fontFamily: "inherit" },
    btn: (primary: boolean) => ({ padding: "8px 18px", borderRadius: 7, fontSize: "0.83rem", fontWeight: 600, cursor: "pointer", border: "1px solid", background: primary ? "hsl(38 85% 52%)" : "hsl(30 8% 16%)", color: primary ? "hsl(30 8% 7%)" : "hsl(38 10% 65%)", borderColor: primary ? "transparent" : "hsl(30 8% 24%)" }),
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Zodiak', serif", fontSize: "1.5rem", fontWeight: 700, color: "hsl(38 20% 88%)", marginBottom: 4 }}>Warm-Up Generator</h1>
        <p style={{ fontSize: "0.8rem", color: "hsl(38 8% 55%)" }}>Build your exercise library, then draw a randomized sequence.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "hsl(30 8% 12%)", padding: 3, borderRadius: 8, width: "fit-content" }}>
        {(["draw", "library"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 18px", borderRadius: 6, fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", border: "none", background: tab === t ? "hsl(30 8% 22%)" : "transparent", color: tab === t ? "hsl(38 20% 88%)" : "hsl(38 8% 50%)", transition: "all 150ms" }}>
            {t === "draw" ? "Draw" : `Library (${exercises.length})`}
          </button>
        ))}
      </div>

      {/* ── DRAW TAB ── */}
      {tab === "draw" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button data-testid="button-generate-warmup" onClick={seedAndDraw} style={{ ...S.btn(true), padding: "11px 28px" }}>
              {drawnSet.length > 0 ? "New Draw" : "Draw Warm-Up"}
            </button>
            {drawnSet.length > 0 && <span style={{ fontSize: "0.78rem", color: "hsl(38 8% 45%)" }}>{drawnSet.length} exercises · ~{totalMin} min</span>}
          </div>

          {drawnSet.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {drawnSet.map((ex, i) => {
                const isOpen = expanded === i;
                const accent = NUM_COLORS[i % NUM_COLORS.length];
                return (
                  <div key={ex.id} style={{ background: "hsl(30 8% 11%)", border: `1px solid ${isOpen ? accent + "55" : "hsl(30 8% 20%)"}`, borderRadius: 10, overflow: "hidden", transition: "border-color 200ms" }}>
                    <button onClick={() => setExpanded(isOpen ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                      <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: accent + "22", color: accent, fontSize: "0.78rem", fontWeight: 700 }}>{i + 1}</span>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: "0.9rem", color: "hsl(38 20% 88%)" }}>{ex.name}</span>
                      <span style={{ flexShrink: 0, fontSize: "0.72rem", padding: "3px 8px", borderRadius: 20, background: "hsl(30 8% 18%)", color: "hsl(38 8% 55%)", border: "1px solid hsl(30 8% 25%)" }}>{ex.duration}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(38 8% 45%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }}><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    {isOpen && <div style={{ padding: "0 18px 16px 60px" }}><p style={{ fontSize: "0.84rem", color: "hsl(38 12% 65%)", lineHeight: 1.65 }}>{ex.description}</p></div>}
                  </div>
                );
              })}
              <div style={{ marginTop: 6, padding: "10px 16px", borderRadius: 8, background: "hsl(30 8% 9%)", border: "1px solid hsl(30 8% 16%)", display: "flex", flexWrap: "wrap" as const, gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", color: "hsl(38 5% 40%)", marginRight: 4 }}>Order:</span>
                {drawnSet.map((ex, i) => (
                  <span key={i} style={{ fontSize: "0.7rem", color: "hsl(38 10% 60%)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: NUM_COLORS[i % NUM_COLORS.length] }}>●</span> {ex.name}
                    {i < drawnSet.length - 1 && <span style={{ color: "hsl(38 5% 35%)", marginLeft: 2 }}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ border: "1px dashed hsl(30 8% 22%)", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="hsl(38 8% 35%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px" }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <p style={{ color: "hsl(38 8% 45%)", fontSize: "0.85rem" }}>Hit "Draw Warm-Up" to get a randomized sequence</p>
              <p style={{ color: "hsl(38 5% 35%)", fontSize: "0.75rem", marginTop: 4 }}>If your library is empty, 15 defaults will be seeded automatically.</p>
            </div>
          )}
        </>
      )}

      {/* ── LIBRARY TAB ── */}
      {tab === "library" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: "0.78rem", color: "hsl(38 8% 45%)" }}>{exercises.length} exercise{exercises.length !== 1 ? "s" : ""} in library</span>
            <button data-testid="button-add-exercise" onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setEditState(null); }} style={S.btn(true)}>+ Add Exercise</button>
          </div>

          {/* Add / Edit Form */}
          {(showForm || editState) && (
            <div style={{ background: "hsl(30 8% 12%)", border: "1px solid hsl(38 85% 52% / 0.25)", borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
              <p style={{ ...S.label, marginBottom: 14 }}>{editState ? "Edit Exercise" : "New Exercise"}</p>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                <div>
                  <p style={{ ...S.label, marginBottom: 4 }}>Name</p>
                  <input data-testid="input-exercise-name" value={editState ? editState.name : form.name} onChange={e => editState ? setEditState({ ...editState, name: e.target.value }) : setForm({ ...form, name: e.target.value })} placeholder="e.g. Zip Zap Zop" style={S.input} />
                </div>
                <div>
                  <p style={{ ...S.label, marginBottom: 4 }}>Duration</p>
                  <input data-testid="input-exercise-duration" value={editState ? editState.duration : form.duration} onChange={e => editState ? setEditState({ ...editState, duration: e.target.value }) : setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3 min" style={{ ...S.input, width: 120 }} />
                </div>
                <div>
                  <p style={{ ...S.label, marginBottom: 4 }}>Description</p>
                  <textarea data-testid="input-exercise-description" value={editState ? editState.description : form.description} onChange={e => editState ? setEditState({ ...editState, description: e.target.value }) : setForm({ ...form, description: e.target.value })} placeholder="How does this exercise work?" rows={3} style={{ ...S.input, resize: "vertical" as const }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button data-testid="button-save-exercise" onClick={() => {
                    if (editState) { updateMutation.mutate({ id: editState.id, data: { name: editState.name, duration: editState.duration, description: editState.description } }); }
                    else { if (!form.name.trim() || !form.description.trim()) return; createMutation.mutate(form); }
                  }} style={S.btn(true)} disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditState(null); }} style={S.btn(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {isLoading && <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>}

          {!isLoading && exercises.length === 0 && (
            <div style={{ border: "1px dashed hsl(30 8% 22%)", borderRadius: 10, padding: "32px 24px", textAlign: "center" }}>
              <p style={{ color: "hsl(38 8% 45%)", fontSize: "0.85rem" }}>No exercises yet. Add one above, or hit "Draw Warm-Up" to auto-seed 15 defaults.</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {exercises.map(ex => (
              <div key={ex.id} data-testid={`exercise-row-${ex.id}`} style={{ background: "hsl(30 8% 11%)", border: "1px solid hsl(30 8% 19%)", borderRadius: 9, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "hsl(38 18% 84%)" }}>{ex.name}</span>
                      <span style={{ fontSize: "0.7rem", padding: "2px 7px", borderRadius: 20, background: "hsl(30 8% 18%)", color: "hsl(38 8% 52%)", border: "1px solid hsl(30 8% 24%)", flexShrink: 0 }}>{ex.duration}</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "hsl(38 8% 52%)", lineHeight: 1.5 }}>{ex.description}</p>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button data-testid={`button-edit-exercise-${ex.id}`} onClick={() => { setEditState({ id: ex.id, name: ex.name, duration: ex.duration, description: ex.description }); setShowForm(false); }} style={{ padding: 5, background: "none", border: "none", cursor: "pointer", color: "hsl(38 8% 45%)" }} title="Edit">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button data-testid={`button-delete-exercise-${ex.id}`} onClick={() => deleteMutation.mutate(ex.id)} style={{ padding: 5, background: "none", border: "none", cursor: "pointer", color: "hsl(38 5% 38%)" }} title="Delete">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
