import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { encryptFields, decryptArray, decryptFields } from "@/lib/crypto";
import { Plus, Edit2, Trash2, Shuffle, BookOpen, X, Check, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FocusItem, PracticeSession } from "@shared/schema";

const CATEGORIES = ["technique", "listening", "physicality", "character", "general"];

const CATEGORY_LABELS: Record<string, string> = {
  technique: "Technique",
  listening: "Listening",
  physicality: "Physicality",
  character: "Character",
  general: "General",
};

function CategoryBadge({ cat }: { cat: string }) {
  return (
    <span className={`category-badge category-${cat}`}>
      {CATEGORY_LABELS[cat] ?? cat}
    </span>
  );
}

function FocusCard({
  item,
  onEdit,
  onDelete,
  highlighted,
  selectable,
  selected,
  onToggleSelect,
}: {
  item: FocusItem;
  onEdit: (item: FocusItem) => void;
  onDelete: (id: number) => void;
  highlighted?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (item: FocusItem) => void;
}) {
  const isActive = highlighted || selected;
  return (
    <div
      data-testid={`focus-card-${item.id}`}
      onClick={selectable ? () => onToggleSelect?.(item) : undefined}
      style={{
        background: selected ? "hsl(38 85% 52% / 0.12)" : highlighted ? "hsl(38 85% 52% / 0.08)" : "hsl(30 8% 10%)",
        border: selected ? "1px solid hsl(38 85% 52% / 0.7)" : highlighted ? "1px solid hsl(38 85% 52% / 0.4)" : "1px solid hsl(30 8% 18%)",
        borderRadius: 10,
        padding: "16px 18px",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: selected ? "0 0 20px hsl(38 85% 52% / 0.18)" : highlighted ? "0 0 16px hsl(38 85% 52% / 0.12)" : "none",
        cursor: selectable ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {selectable && (
          <div style={{
            width: 18, height: 18, borderRadius: 5, border: selected ? "2px solid hsl(38 85% 52%)" : "2px solid hsl(30 8% 30%)",
            background: selected ? "hsl(38 85% 52%)" : "transparent",
            flexShrink: 0, marginTop: 2,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 150ms",
          }}>
            {selected && <Check size={11} style={{ color: "hsl(30 8% 7%)" }} />}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontFamily: "'Zodiak', serif",
                fontWeight: 600,
                fontSize: "0.95rem",
                color: isActive ? "hsl(38 85% 65%)" : "hsl(38 20% 88%)",
              }}
            >
              {item.title}
            </span>
            <CategoryBadge cat={item.category} />
          </div>
          {item.description && (
            <p style={{ fontSize: "0.82rem", color: "hsl(38 8% 55%)", lineHeight: 1.5 }}>
              {item.description}
            </p>
          )}
        </div>
        {!selectable && (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button
              data-testid={`edit-focus-${item.id}`}
              onClick={e => { e.stopPropagation(); onEdit(item); }}
              style={{ padding: "5px 6px", borderRadius: 6, color: "hsl(38 8% 50%)", background: "transparent", border: "none", cursor: "pointer", transition: "color 150ms, background 150ms" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "hsl(38 20% 80%)"; (e.currentTarget as HTMLElement).style.background = "hsl(30 8% 16%)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "hsl(38 8% 50%)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Edit2 size={14} />
            </button>
            <button
              data-testid={`delete-focus-${item.id}`}
              onClick={e => { e.stopPropagation(); onDelete(item.id); }}
              style={{ padding: "5px 6px", borderRadius: 6, color: "hsl(38 8% 50%)", background: "transparent", border: "none", cursor: "pointer", transition: "color 150ms, background 150ms" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "hsl(0 60% 55%)"; (e.currentTarget as HTMLElement).style.background = "hsl(0 40% 15%)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "hsl(38 8% 50%)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type FormState = { title: string; category: string; description: string };
const BLANK: FormState = { title: "", category: "technique", description: "" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FOCUS_ENCRYPTED_FIELDS: any[] = ["title", "description"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SESSION_ENCRYPTED_FIELDS: any[] = ["notes"];

export default function FocusPage() {
  const { toast } = useToast();
  const { dataKey } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FocusItem | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [drawnItems, setDrawnItems] = useState<FocusItem[]>([]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [drawMode, setDrawMode] = useState<"random" | "pick">("random");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: items = [], isLoading } = useQuery<FocusItem[], Error, FocusItem[]>({
    queryKey: ["/api/focus-items"],
    select: ((raw: FocusItem[]) => dataKey ? decryptArray(raw, FOCUS_ENCRYPTED_FIELDS, dataKey) : raw) as (raw: FocusItem[]) => FocusItem[],
  });
  const { data: sessions = [] } = useQuery<PracticeSession[], Error, PracticeSession[]>({
    queryKey: ["/api/practice-sessions"],
    select: ((raw: PracticeSession[]) => dataKey ? decryptArray(raw, SESSION_ENCRYPTED_FIELDS, dataKey) : raw) as (raw: PracticeSession[]) => PracticeSession[],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormState) => {
      if (!dataKey) throw new Error("No encryption key");
      const encrypted = await encryptFields(data, FOCUS_ENCRYPTED_FIELDS, dataKey);
      return apiRequest("POST", "/api/focus-items", encrypted);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/focus-items"] }); setShowForm(false); setForm(BLANK); toast({ title: "Focus item added" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormState> }) => {
      if (!dataKey) throw new Error("No encryption key");
      const encrypted = await encryptFields(data, FOCUS_ENCRYPTED_FIELDS, dataKey);
      return apiRequest("PATCH", `/api/focus-items/${id}`, encrypted);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/focus-items"] }); setEditingItem(null); setForm(BLANK); toast({ title: "Updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/focus-items/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/focus-items"] }); toast({ title: "Removed" }); },
  });

  const sessionMutation = useMutation({
    mutationFn: async (data: { focusItemIds: string; notes?: string }) => {
      if (!dataKey) throw new Error("No encryption key");
      const encrypted = await encryptFields(data, SESSION_ENCRYPTED_FIELDS, dataKey);
      return apiRequest("POST", "/api/practice-sessions", encrypted);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/practice-sessions"] }); setSessionNotes(""); toast({ title: "Session logged ✓" }); },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/practice-sessions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/practice-sessions"] }),
  });

  function draw() {
    const pool = [...items];
    pool.sort(() => Math.random() - 0.5);
    setDrawnItems(pool.slice(0, Math.min(3, pool.length)));
  }

  function toggleSelect(item: FocusItem) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }

  function confirmPick() {
    const picked = items.filter(i => selectedIds.has(i.id));
    setDrawnItems(picked);
    setDrawMode("random");
    setSelectedIds(new Set());
  }

  function logSession() {
    if (drawnItems.length === 0) return;
    sessionMutation.mutate({
      focusItemIds: JSON.stringify(drawnItems.map(i => i.id)),
      notes: sessionNotes || undefined,
    });
  }

  function startEdit(item: FocusItem) {
    setEditingItem(item);
    setForm({ title: item.title, category: item.category, description: item.description ?? "" });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingItem(null);
    setForm(BLANK);
  }

  function submitForm() {
    if (!form.title.trim()) return;
    if (editingItem) updateMutation.mutate({ id: editingItem.id, data: form });
    else createMutation.mutate(form);
  }

  const filtered = filterCat === "all" ? items : items.filter(i => i.category === filterCat);
  const drawnIds = new Set(drawnItems.map(i => i.id));

  // Resolve focus item names for session log
  const itemMap = Object.fromEntries(items.map(i => [i.id, i]));

  return (
    <div style={{ padding: "32px 32px 48px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Zodiak', serif", fontSize: "clamp(1.5rem, 2vw + 1rem, 2rem)", fontWeight: 700, color: "hsl(38 20% 88%)", marginBottom: 6 }}>
          Focus Library
        </h1>
        <p style={{ color: "hsl(38 8% 50%)", fontSize: "0.875rem" }}>
          Build your catalog of skills and draw 3 to focus on in each session.
        </p>
      </div>

      {/* Draw section */}
      <div
        style={{
          background: "hsl(30 8% 10%)",
          border: "1px solid hsl(38 85% 52% / 0.2)",
          borderRadius: 12,
          padding: "24px",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: drawnItems.length || drawMode === "pick" ? 18 : 0, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ fontFamily: "'Zodiak', serif", fontWeight: 600, fontSize: "1.05rem", color: "hsl(38 85% 60%)", marginBottom: 2 }}>
              Tonight's Focus
            </h2>
            <p style={{ fontSize: "0.78rem", color: "hsl(38 8% 50%)" }}>Choose randomly or pick your own</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {/* Mode toggle */}
            <div style={{ display: "flex", background: "hsl(30 8% 14%)", border: "1px solid hsl(30 8% 22%)", borderRadius: 8, padding: 3, gap: 2 }}>
              <button
                data-testid="mode-random"
                onClick={() => { setDrawMode("random"); setSelectedIds(new Set()); }}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600,
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  background: drawMode === "random" ? "hsl(38 85% 52%)" : "transparent",
                  color: drawMode === "random" ? "hsl(30 8% 7%)" : "hsl(38 8% 55%)",
                  transition: "all 150ms",
                }}
              >
                <Shuffle size={12} /> Random
              </button>
              <button
                data-testid="mode-pick"
                onClick={() => { setDrawMode("pick"); setDrawnItems([]); }}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600,
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  background: drawMode === "pick" ? "hsl(38 85% 52%)" : "transparent",
                  color: drawMode === "pick" ? "hsl(30 8% 7%)" : "hsl(38 8% 55%)",
                  transition: "all 150ms",
                }}
              >
                <MousePointerClick size={12} /> Pick Own
              </button>
            </div>

            {drawMode === "random" && (
              <Button
                data-testid="draw-button"
                onClick={draw}
                disabled={items.length === 0}
                size="sm"
                style={{ background: "hsl(38 85% 52%)", color: "hsl(30 8% 7%)", fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}
              >
                <Shuffle size={14} />
                {drawnItems.length ? "Redraw" : "Draw 3"}
              </Button>
            )}

            {drawMode === "pick" && selectedIds.size > 0 && (
              <Button
                data-testid="confirm-pick-button"
                onClick={confirmPick}
                size="sm"
                style={{ background: "hsl(38 85% 52%)", color: "hsl(30 8% 7%)", fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}
              >
                <Check size={14} />
                Set Focus ({selectedIds.size})
              </Button>
            )}

            {drawnItems.length > 0 && (
              <Button
                data-testid="log-session-button"
                onClick={logSession}
                size="sm"
                variant="outline"
                style={{ display: "flex", gap: 6, alignItems: "center", borderColor: "hsl(38 8% 28%)", color: "hsl(38 10% 65%)" }}
              >
                <BookOpen size={14} />
                Log Session
              </Button>
            )}
          </div>
        </div>

        {/* Pick mode instruction */}
        {drawMode === "pick" && drawnItems.length === 0 && selectedIds.size === 0 && (
          <div style={{ fontSize: "0.8rem", color: "hsl(38 8% 45%)", marginBottom: 8, fontStyle: "italic" }}>
            Click any items in your library below to select them as tonight's focus.
          </div>
        )}

        {drawnItems.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: sessionNotes !== undefined ? 14 : 0 }}>
            {drawnItems.map((item, i) => (
              <div
                key={item.id}
                data-testid={`drawn-item-${i}`}
                className="animate-spotlight"
                style={{
                  background: "hsl(38 85% 52% / 0.08)",
                  border: "1px solid hsl(38 85% 52% / 0.3)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: "hsl(38 85% 52%)", color: "hsl(30 8% 7%)", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "hsl(38 85% 70%)" }}>{item.title}</span>
                </div>
                <CategoryBadge cat={item.category} />
                {item.description && (
                  <p style={{ fontSize: "0.75rem", color: "hsl(38 8% 55%)", marginTop: 6, lineHeight: 1.45 }}>{item.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {drawnItems.length > 0 && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <Textarea
                data-testid="session-notes-input"
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                placeholder="Add session notes (optional)..."
                rows={2}
                style={{ fontSize: "0.82rem", background: "hsl(30 8% 13%)", border: "1px solid hsl(30 8% 22%)", resize: "none" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", ...CATEGORIES].map(cat => (
            <button
              key={cat}
              data-testid={`filter-${cat}`}
              onClick={() => setFilterCat(cat)}
              style={{
                padding: "4px 12px",
                borderRadius: 9999,
                border: "1px solid",
                fontSize: "0.77rem",
                fontWeight: 500,
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 150ms",
                background: filterCat === cat ? "hsl(38 85% 52%)" : "transparent",
                color: filterCat === cat ? "hsl(30 8% 7%)" : "hsl(38 8% 55%)",
                borderColor: filterCat === cat ? "hsl(38 85% 52%)" : "hsl(30 8% 22%)",
              }}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <Button
          data-testid="add-focus-button"
          onClick={() => { setEditingItem(null); setForm(BLANK); setShowForm(true); }}
          size="sm"
          style={{ display: "flex", gap: 6, alignItems: "center", background: "hsl(30 8% 16%)", color: "hsl(38 10% 70%)", border: "1px solid hsl(30 8% 24%)" }}
        >
          <Plus size={14} />
          Add Focus Item
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div
          data-testid="focus-form"
          className="animate-fade-in"
          style={{
            background: "hsl(30 8% 11%)",
            border: "1px solid hsl(38 85% 52% / 0.25)",
            borderRadius: 10,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontFamily: "'Zodiak', serif", fontWeight: 600, fontSize: "0.95rem" }}>
              {editingItem ? "Edit Item" : "New Focus Item"}
            </h3>
            <button onClick={cancelForm} style={{ color: "hsl(38 8% 50%)", cursor: "pointer" }}><X size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 10, marginBottom: 10 }}>
            <Input
              data-testid="focus-title-input"
              placeholder="Title (e.g. Active Listening)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={{ background: "hsl(30 8% 14%)", border: "1px solid hsl(30 8% 24%)" }}
            />
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger data-testid="focus-category-select" style={{ background: "hsl(30 8% 14%)", border: "1px solid hsl(30 8% 24%)" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            data-testid="focus-description-input"
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            style={{ background: "hsl(30 8% 14%)", border: "1px solid hsl(30 8% 24%)", resize: "none", marginBottom: 12, fontSize: "0.875rem" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              data-testid="submit-focus-form"
              onClick={submitForm}
              disabled={!form.title.trim()}
              size="sm"
              style={{ background: "hsl(38 85% 52%)", color: "hsl(30 8% 7%)", fontWeight: 600, display: "flex", gap: 5 }}
            >
              <Check size={14} />
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
            <Button onClick={cancelForm} size="sm" variant="ghost" style={{ color: "hsl(38 8% 50%)" }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Item list */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "hsl(38 8% 45%)" }}>
          <div style={{ fontSize: "2rem", marginBottom: 8, opacity: 0.4 }}>○</div>
          <p>No items yet. Add a focus skill to get started.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {filtered.map(item => (
            <FocusCard
              key={item.id}
              item={item}
              onEdit={startEdit}
              onDelete={id => deleteMutation.mutate(id)}
              highlighted={drawMode === "random" && drawnIds.has(item.id)}
              selectable={drawMode === "pick"}
              selected={selectedIds.has(item.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Session log */}
      {sessions.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontFamily: "'Zodiak', serif", fontWeight: 600, fontSize: "1rem", marginBottom: 14, color: "hsl(38 20% 80%)" }}>
            Session Log
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.slice(0, 10).map(session => {
              const ids: number[] = JSON.parse(session.focusItemIds);
              return (
                <div
                  key={session.id}
                  data-testid={`session-log-${session.id}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "12px 16px",
                    background: "hsl(30 8% 10%)",
                    border: "1px solid hsl(30 8% 17%)",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                      {ids.map(id => itemMap[id] ? (
                        <span key={id} style={{ fontSize: "0.78rem", background: "hsl(30 8% 16%)", border: "1px solid hsl(30 8% 22%)", padding: "2px 8px", borderRadius: 4, color: "hsl(38 10% 65%)" }}>
                          {itemMap[id].title}
                        </span>
                      ) : null)}
                    </div>
                    {session.notes && <p style={{ fontSize: "0.78rem", color: "hsl(38 8% 50%)", marginTop: 2 }}>{session.notes}</p>}
                    <p style={{ fontSize: "0.7rem", color: "hsl(38 5% 38%)", marginTop: 4 }}>
                      {new Date(session.sessionDate!).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button
                    data-testid={`delete-session-${session.id}`}
                    onClick={() => deleteSessionMutation.mutate(session.id)}
                    style={{ color: "hsl(38 5% 35%)", cursor: "pointer", padding: 4, flexShrink: 0 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
