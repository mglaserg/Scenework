import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SavedCharacter } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface RandomChar { name: string; occupation: string; quirk: string; want: string; }

type Tab = "generate" | "library";

const FIELD_COLORS = { occupation: "hsl(200 70% 55%)", quirk: "hsl(38 85% 52%)", want: "hsl(280 60% 65%)" };
const FIELD_LABELS = { occupation: "Occupation", quirk: "Defining Quirk", want: "Secret Want" };
const FIELD_ICONS: Record<string, JSX.Element> = {
  occupation: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  quirk: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  want: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>,
};

const S = {
  label: { fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: "hsl(38 5% 40%)" },
  input: { width: "100%", boxSizing: "border-box" as const, padding: "8px 12px", borderRadius: 6, fontSize: "0.85rem", background: "hsl(30 8% 13%)", border: "1px solid hsl(30 8% 22%)", color: "hsl(38 20% 88%)", outline: "none", fontFamily: "inherit" },
  btn: (primary: boolean) => ({ padding: "8px 18px", borderRadius: 7, fontSize: "0.83rem", fontWeight: 600, cursor: "pointer" as const, border: "1px solid", background: primary ? "hsl(38 85% 52%)" : "hsl(30 8% 16%)", color: primary ? "hsl(30 8% 7%)" : "hsl(38 10% 65%)", borderColor: primary ? "transparent" : "hsl(30 8% 24%)" }),
};

type FormState = { name: string; occupation: string; quirk: string; want: string; notes: string };
const EMPTY_FORM: FormState = { name: "", occupation: "", quirk: "", want: "", notes: "" };

export default function CharacterPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("generate");
  const [character, setCharacter] = useState<RandomChar | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: library = [], isLoading: libLoading } = useQuery<SavedCharacter[]>({
    queryKey: ["/api/saved-characters"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormState) => { await apiRequest("POST", "/api/saved-characters", data); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/saved-characters"] }); setShowAddForm(false); setForm(EMPTY_FORM); toast({ title: "Character saved" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormState> }) => { await apiRequest("PATCH", `/api/saved-characters/${id}`, data); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/saved-characters"] }); setEditId(null); toast({ title: "Character updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/saved-characters/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/saved-characters"] }),
  });

  const fetchCharacter = async () => {
    setLoading(true);
    try { const res = await apiRequest("GET", "/api/character/random"); setCharacter(await res.json()); }
    finally { setLoading(false); }
  };

  const saveCurrent = () => {
    if (!character) return;
    createMutation.mutate({ ...character, notes: "" });
  };

  const startEdit = (c: SavedCharacter) => {
    setForm({ name: c.name, occupation: c.occupation, quirk: c.quirk, want: c.want, notes: c.notes ?? "" });
    setEditId(c.id);
    setShowAddForm(false);
  };

  const CharForm = ({ isEdit, id }: { isEdit?: boolean; id?: number }) => (
    <div style={{ background: "hsl(30 8% 12%)", border: "1px solid hsl(38 85% 52% / 0.25)", borderRadius: 10, padding: "18px 20px", marginBottom: 14 }}>
      <p style={{ ...S.label, marginBottom: 14 }}>{isEdit ? "Edit Character" : "Add Character"}</p>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
        {(["name", "occupation", "quirk", "want", "notes"] as const).map(field => (
          <div key={field}>
            <p style={{ ...S.label, marginBottom: 4 }}>{field === "notes" ? "Notes (optional)" : field === "want" ? "Secret Want" : field.charAt(0).toUpperCase() + field.slice(1)}</p>
            <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={field === "name" ? "e.g. Marlowe Crane" : field === "occupation" ? "e.g. Forensic accountant" : field === "quirk" ? "e.g. Hums when they lie" : field === "want" ? "e.g. To be taken seriously just once" : "Any context or notes…"} style={S.input} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={() => { if (isEdit && id) updateMutation.mutate({ id, data: form }); else { if (!form.name.trim()) return; createMutation.mutate(form); } }} style={S.btn(true)} disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? "Saving…" : "Save Character"}
          </button>
          <button onClick={() => { setShowAddForm(false); setEditId(null); }} style={S.btn(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "32px 24px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Zodiak', serif", fontSize: "1.5rem", fontWeight: 700, color: "hsl(38 20% 88%)", marginBottom: 4 }}>Character Generator</h1>
        <p style={{ fontSize: "0.8rem", color: "hsl(38 8% 55%)" }}>Generate random characters or build your own library to pull from.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "hsl(30 8% 12%)", padding: 3, borderRadius: 8, width: "fit-content" }}>
        {(["generate", "library"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 18px", borderRadius: 6, fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", border: "none", background: tab === t ? "hsl(30 8% 22%)" : "transparent", color: tab === t ? "hsl(38 20% 88%)" : "hsl(38 8% 50%)", transition: "all 150ms" }}>
            {t === "generate" ? "Generate" : `Library (${library.length})`}
          </button>
        ))}
      </div>

      {/* ── GENERATE TAB ── */}
      {tab === "generate" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "center" }}>
            <button data-testid="button-generate-character" onClick={fetchCharacter} disabled={loading} style={{ ...S.btn(true), padding: "11px 28px" }}>
              {loading ? "Casting…" : character ? "New Character" : "Generate Character"}
            </button>
            {character && !loading && (
              <button onClick={saveCurrent} disabled={createMutation.isPending} style={S.btn(false)}>
                {createMutation.isPending ? "Saving…" : "Save to Library"}
              </button>
            )}
          </div>

          {loading && (
            <div style={{ background: "hsl(30 8% 11%)", border: "1px solid hsl(30 8% 20%)", borderRadius: 12, padding: "22px" }}>
              <Skeleton className="h-8 w-1/2 rounded mb-4" />
              {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg mb-2" />)}
            </div>
          )}

          {!loading && character && (
            <div style={{ background: "hsl(30 8% 11%)", border: "1px solid hsl(30 8% 20%)", borderRadius: 12, padding: "22px 24px" }}>
              <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid hsl(30 8% 18%)" }}>
                <p style={{ ...S.label, marginBottom: 6 }}>Name</p>
                <h2 style={{ fontFamily: "'Zodiak', serif", fontSize: "1.4rem", fontWeight: 700, color: "hsl(38 20% 90%)" }}>{character.name}</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {(["occupation", "quirk", "want"] as const).map(field => (
                  <div key={field} style={{ background: "hsl(30 8% 9%)", borderRadius: 8, border: `1px solid ${FIELD_COLORS[field]}22`, padding: "11px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ color: FIELD_COLORS[field], marginTop: 2, flexShrink: 0 }}>{FIELD_ICONS[field]}</span>
                    <div>
                      <p style={{ ...S.label, marginBottom: 3 }}>{FIELD_LABELS[field]}</p>
                      <p style={{ fontSize: "0.87rem", color: "hsl(38 15% 78%)", lineHeight: 1.5 }}>{character[field]}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "0.7rem", color: "hsl(38 5% 35%)", marginTop: 14, textAlign: "center", fontStyle: "italic" }}>Find the physicality first. How do they hold their body?</p>
            </div>
          )}

          {!loading && !character && (
            <div style={{ border: "1px dashed hsl(30 8% 22%)", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="hsl(38 8% 35%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px" }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <p style={{ color: "hsl(38 8% 45%)", fontSize: "0.85rem" }}>Generate a character to begin</p>
            </div>
          )}
        </>
      )}

      {/* ── LIBRARY TAB ── */}
      {tab === "library" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: "0.78rem", color: "hsl(38 8% 45%)" }}>{library.length} character{library.length !== 1 ? "s" : ""} saved</span>
            <button data-testid="button-add-character" onClick={() => { setShowAddForm(true); setEditId(null); setForm(EMPTY_FORM); }} style={S.btn(true)}>+ Add Character</button>
          </div>

          {showAddForm && <CharForm />}

          {libLoading && <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>}

          {!libLoading && library.length === 0 && !showAddForm && (
            <div style={{ border: "1px dashed hsl(30 8% 22%)", borderRadius: 10, padding: "32px 24px", textAlign: "center" }}>
              <p style={{ color: "hsl(38 8% 45%)", fontSize: "0.85rem" }}>No characters yet. Generate one and save it, or add manually.</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {library.map(c => (
              <div key={c.id} data-testid={`character-row-${c.id}`}>
                {editId === c.id
                  ? <CharForm isEdit id={c.id} />
                  : (
                    <div style={{ background: "hsl(30 8% 11%)", border: "1px solid hsl(30 8% 19%)", borderRadius: 9, padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: "'Zodiak', serif", fontWeight: 700, fontSize: "1rem", color: "hsl(38 18% 86%)", marginBottom: 6 }}>{c.name}</p>
                          <p style={{ fontSize: "0.75rem", marginBottom: 3 }}><span style={{ color: FIELD_COLORS.occupation }}>●</span> <span style={{ color: "hsl(38 5% 42%)" }}>Occupation:</span> <span style={{ color: "hsl(38 12% 68%)" }}>{c.occupation}</span></p>
                          <p style={{ fontSize: "0.75rem", marginBottom: 3 }}><span style={{ color: FIELD_COLORS.quirk }}>●</span> <span style={{ color: "hsl(38 5% 42%)" }}>Quirk:</span> <span style={{ color: "hsl(38 12% 68%)" }}>{c.quirk}</span></p>
                          <p style={{ fontSize: "0.75rem", marginBottom: c.notes ? 6 : 0 }}><span style={{ color: FIELD_COLORS.want }}>●</span> <span style={{ color: "hsl(38 5% 42%)" }}>Wants:</span> <span style={{ color: "hsl(38 12% 68%)" }}>{c.want}</span></p>
                          {c.notes && <p style={{ fontSize: "0.72rem", color: "hsl(38 5% 38%)", marginTop: 4, fontStyle: "italic" }}>{c.notes}</p>}
                          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                            <button data-testid={`button-edit-character-${c.id}`} onClick={() => startEdit(c)} style={{ ...S.btn(false), padding: "4px 12px", fontSize: "0.75rem" }}>Edit</button>
                            <button data-testid={`button-delete-character-${c.id}`} onClick={() => deleteMutation.mutate(c.id)} style={{ padding: "4px 10px", borderRadius: 6, background: "none", border: "1px solid hsl(0 50% 35% / 0.4)", color: "hsl(0 60% 55%)", cursor: "pointer", fontSize: "0.75rem" }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
