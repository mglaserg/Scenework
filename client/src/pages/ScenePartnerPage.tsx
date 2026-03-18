import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ScenePremise } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { encryptFields, decryptArray } from "@/lib/crypto";

interface RandomPremise {
  characterA: { name: string; want: string };
  characterB: { name: string; want: string };
  location: string;
  opening: string;
}

type Tab = "generate" | "saved";
type EditId = number | null;

const S = {
  label: { fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: "hsl(38 5% 40%)" },
  input: { width: "100%", boxSizing: "border-box" as const, padding: "8px 12px", borderRadius: 6, fontSize: "0.85rem", background: "hsl(30 8% 13%)", border: "1px solid hsl(30 8% 22%)", color: "hsl(38 20% 88%)", outline: "none", fontFamily: "inherit" },
  btn: (primary: boolean) => ({ padding: "8px 18px", borderRadius: 7, fontSize: "0.83rem", fontWeight: 600, cursor: "pointer" as const, border: "1px solid", background: primary ? "hsl(38 85% 52%)" : "hsl(30 8% 16%)", color: primary ? "hsl(30 8% 7%)" : "hsl(38 10% 65%)", borderColor: primary ? "transparent" : "hsl(30 8% 24%)" }),
};

function CharCard({ label, name, want }: { label: string; name: string; want: string }) {
  return (
    <div style={{ background: "hsl(30 8% 12%)", border: "1px solid hsl(30 8% 20%)", borderRadius: 10, padding: "14px 16px", flex: 1, minWidth: 0 }}>
      <div style={{ ...S.label, marginBottom: 8 }}>{label}</div>
      <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "hsl(38 20% 88%)", lineHeight: 1.4, marginBottom: 8 }}>{name}</p>
      <p style={{ fontSize: "0.78rem", color: "hsl(38 12% 62%)", fontStyle: "italic" }}>wants {want}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCENE_ENCRYPTED_FIELDS: any[] = ["characterA", "characterAWant", "characterB", "characterBWant", "location", "opening", "notes"];

export default function ScenePartnerPage() {
  const { toast } = useToast();
  const { dataKey } = useAuth();
  const [tab, setTab] = useState<Tab>("generate");
  const [premise, setPremise] = useState<RandomPremise | null>(null);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<EditId>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ characterA: "", characterAWant: "", characterB: "", characterBWant: "", location: "", opening: "", notes: "" });

  const { data: saved = [], isLoading: savedLoading } = useQuery<ScenePremise[], Error, ScenePremise[]>({
    queryKey: ["/api/scene-premises"],
    select: ((raw: ScenePremise[]) => dataKey ? decryptArray(raw, SCENE_ENCRYPTED_FIELDS, dataKey) : raw) as (raw: ScenePremise[]) => ScenePremise[],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (!dataKey) throw new Error("No encryption key");
      const encrypted = await encryptFields(data, SCENE_ENCRYPTED_FIELDS, dataKey);
      await apiRequest("POST", "/api/scene-premises", encrypted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scene-premises"] });
      toast({ title: "Scene saved" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof form> }) => {
      if (!dataKey) throw new Error("No encryption key");
      const encrypted = await encryptFields(data, SCENE_ENCRYPTED_FIELDS, dataKey);
      await apiRequest("PATCH", `/api/scene-premises/${id}`, encrypted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scene-premises"] });
      setEditId(null);
      toast({ title: "Scene updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/scene-premises/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/scene-premises"] }),
  });

  const fetchPremise = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/scene-partner/random");
      const json = await res.json();
      setPremise(json);
    } finally { setLoading(false); }
  };

  const saveCurrentPremise = () => {
    if (!premise) return;
    saveMutation.mutate({
      characterA: premise.characterA.name, characterAWant: premise.characterA.want,
      characterB: premise.characterB.name, characterBWant: premise.characterB.want,
      location: premise.location, opening: premise.opening, notes: "",
    });
  };

  const startEdit = (sp: ScenePremise) => {
    setForm({ characterA: sp.characterA, characterAWant: sp.characterAWant, characterB: sp.characterB, characterBWant: sp.characterBWant, location: sp.location, opening: sp.opening, notes: sp.notes ?? "" });
    setEditId(sp.id);
    setShowAddForm(false);
  };

  const startAdd = () => {
    setForm({ characterA: "", characterAWant: "", characterB: "", characterBWant: "", location: "", opening: "", notes: "" });
    setShowAddForm(true);
    setEditId(null);
  };

  const Field = ({ label, field, placeholder, area }: { label: string; field: keyof typeof form; placeholder?: string; area?: boolean }) => (
    <div>
      <p style={{ ...S.label, marginBottom: 4 }}>{label}</p>
      {area
        ? <textarea value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} rows={2} style={{ ...S.input, resize: "vertical" as const }} />
        : <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} style={S.input} />
      }
    </div>
  );

  const SceneForm = ({ isEdit, id }: { isEdit: boolean; id?: number }) => (
    <div style={{ background: "hsl(30 8% 12%)", border: "1px solid hsl(38 85% 52% / 0.25)", borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
      <p style={{ ...S.label, marginBottom: 14 }}>{isEdit ? "Edit Scene" : "Add Scene"}</p>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}><Field label="Character A" field="characterA" placeholder="e.g. A retired spy" /></div>
        <div style={{ flex: 1 }}><Field label="A wants" field="characterAWant" placeholder="e.g. one last adventure" /></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}><Field label="Character B" field="characterB" placeholder="e.g. An overconfident magician" /></div>
        <div style={{ flex: 1 }}><Field label="B wants" field="characterBWant" placeholder="e.g. to be taken seriously" /></div>
      </div>
      <div style={{ marginBottom: 10 }}><Field label="Location" field="location" placeholder="e.g. an elevator stuck between floors" /></div>
      <div style={{ marginBottom: 10 }}><Field label="Opening Situation" field="opening" placeholder="e.g. One of them knows a secret about the other." area /></div>
      <div style={{ marginBottom: 14 }}><Field label="Notes (optional)" field="notes" placeholder="Context, casting ideas…" area /></div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { if (isEdit && id) updateMutation.mutate({ id, data: form }); else saveMutation.mutate(form); }} style={S.btn(true)} disabled={saveMutation.isPending || updateMutation.isPending}>
          {saveMutation.isPending || updateMutation.isPending ? "Saving…" : "Save Scene"}
        </button>
        <button onClick={() => { setShowAddForm(false); setEditId(null); }} style={S.btn(false)}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "32px 24px", maxWidth: 660, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Zodiak', serif", fontSize: "1.5rem", fontWeight: 700, color: "hsl(38 20% 88%)", marginBottom: 4 }}>Scene Partner</h1>
        <p style={{ fontSize: "0.8rem", color: "hsl(38 8% 55%)" }}>Generate random scene premises or build and manage your own library.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "hsl(30 8% 12%)", padding: 3, borderRadius: 8, width: "fit-content" }}>
        {(["generate", "saved"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 18px", borderRadius: 6, fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", border: "none", background: tab === t ? "hsl(30 8% 22%)" : "transparent", color: tab === t ? "hsl(38 20% 88%)" : "hsl(38 8% 50%)", transition: "all 150ms" }}>
            {t === "generate" ? "Generate" : `Saved (${saved.length})`}
          </button>
        ))}
      </div>

      {/* ── GENERATE TAB ── */}
      {tab === "generate" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "center" }}>
            <button data-testid="button-generate-scene" onClick={fetchPremise} disabled={loading} style={{ ...S.btn(true), padding: "11px 28px" }}>
              {loading ? "Generating…" : premise ? "New Scene" : "Generate Scene"}
            </button>
            {premise && !loading && (
              <button onClick={saveCurrentPremise} disabled={saveMutation.isPending} style={S.btn(false)}>
                {saveMutation.isPending ? "Saving…" : "Save to Library"}
              </button>
            )}
          </div>

          {loading && <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>}

          {!loading && premise && (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
                <CharCard label="Character A" name={premise.characterA.name} want={premise.characterA.want} />
                <CharCard label="Character B" name={premise.characterB.name} want={premise.characterB.want} />
              </div>
              <div style={{ background: "hsl(30 8% 12%)", border: "1px solid hsl(30 8% 20%)", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ ...S.label, marginBottom: 6 }}>Location</div>
                <p style={{ fontSize: "0.95rem", color: "hsl(38 20% 88%)", fontWeight: 500 }}>Set in <span style={{ color: "hsl(38 85% 60%)" }}>{premise.location}</span></p>
              </div>
              <div style={{ background: "hsl(38 85% 52% / 0.07)", border: "1px solid hsl(38 85% 52% / 0.2)", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ ...S.label, marginBottom: 6 }}>Opening Situation</div>
                <p style={{ fontSize: "0.93rem", color: "hsl(38 20% 85%)", lineHeight: 1.6, fontStyle: "italic" }}>"{premise.opening}"</p>
              </div>
              <p style={{ fontSize: "0.72rem", color: "hsl(38 5% 38%)", textAlign: "center" }}>Start the scene mid-moment. Don't set up — just begin.</p>
            </div>
          )}

          {!loading && !premise && (
            <div style={{ border: "1px dashed hsl(30 8% 22%)", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="hsl(38 8% 35%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <p style={{ color: "hsl(38 8% 45%)", fontSize: "0.85rem" }}>Hit Generate to get a scene premise</p>
            </div>
          )}
        </>
      )}

      {/* ── SAVED TAB ── */}
      {tab === "saved" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: "0.78rem", color: "hsl(38 8% 45%)" }}>{saved.length} scene{saved.length !== 1 ? "s" : ""} saved</span>
            <button data-testid="button-add-scene" onClick={startAdd} style={S.btn(true)}>+ Add Scene</button>
          </div>

          {showAddForm && <SceneForm isEdit={false} />}

          {savedLoading && <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>{[1,2].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}</div>}

          {!savedLoading && saved.length === 0 && !showAddForm && (
            <div style={{ border: "1px dashed hsl(30 8% 22%)", borderRadius: 10, padding: "32px 24px", textAlign: "center" }}>
              <p style={{ color: "hsl(38 8% 45%)", fontSize: "0.85rem" }}>No saved scenes yet. Generate one and save it, or add manually.</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {saved.map(sp => (
              <div key={sp.id} data-testid={`scene-row-${sp.id}`}>
                {editId === sp.id
                  ? <SceneForm isEdit id={sp.id} />
                  : (
                    <div style={{ background: "hsl(30 8% 11%)", border: "1px solid hsl(30 8% 19%)", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, marginBottom: 10 }}>
                        <CharCard label="A" name={sp.characterA} want={sp.characterAWant} />
                        <CharCard label="B" name={sp.characterB} want={sp.characterBWant} />
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "hsl(38 85% 55%)", marginBottom: 4 }}><span style={{ color: "hsl(38 5% 45%)" }}>Location:</span> {sp.location}</p>
                      <p style={{ fontSize: "0.8rem", color: "hsl(38 12% 65%)", fontStyle: "italic", marginBottom: sp.notes ? 6 : 0 }}>"{sp.opening}"</p>
                      {sp.notes && <p style={{ fontSize: "0.75rem", color: "hsl(38 5% 42%)", marginTop: 6 }}>{sp.notes}</p>}
                      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                        <button data-testid={`button-edit-scene-${sp.id}`} onClick={() => startEdit(sp)} style={{ ...S.btn(false), padding: "5px 12px", fontSize: "0.75rem" }}>Edit</button>
                        <button data-testid={`button-delete-scene-${sp.id}`} onClick={() => deleteMutation.mutate(sp.id)} style={{ padding: "5px 10px", borderRadius: 6, background: "none", border: "1px solid hsl(0 50% 35% / 0.4)", color: "hsl(0 60% 55%)", cursor: "pointer", fontSize: "0.75rem" }}>Delete</button>
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
