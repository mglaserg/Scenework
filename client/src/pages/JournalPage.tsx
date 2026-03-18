import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { encryptFields, decryptArray } from "@/lib/crypto";
import { Plus, Trash2, ChevronDown, ChevronRight, X, Check, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { JournalEntry } from "@shared/schema";

const SESSION_TYPES = ["practice", "show", "workshop", "class"];
const MOODS = ["energized", "neutral", "frustrated", "connected", "scattered", "present"];

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "Practice",
  show: "Show",
  workshop: "Workshop",
  class: "Class",
};

const MOOD_EMOJI: Record<string, string> = {
  energized: "⚡",
  neutral: "○",
  frustrated: "⟳",
  connected: "◎",
  scattered: "∿",
  present: "●",
};

type FormState = {
  title: string;
  sessionType: string;
  whatWorked: string;
  whatToImprove: string;
  breakthroughMoment: string;
  freeWrite: string;
  mood: string;
};

const BLANK: FormState = {
  title: "",
  sessionType: "practice",
  whatWorked: "",
  whatToImprove: "",
  breakthroughMoment: "",
  freeWrite: "",
  mood: "neutral",
};

function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = entry.whatWorked || entry.whatToImprove || entry.breakthroughMoment || entry.freeWrite;

  return (
    <div
      data-testid={`journal-entry-${entry.id}`}
      style={{
        background: "hsl(30 8% 10%)",
        border: "1px solid hsl(30 8% 18%)",
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 200ms",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px",
          cursor: hasContent ? "pointer" : "default",
        }}
        onClick={() => hasContent && setExpanded(v => !v)}
      >
        {hasContent && (
          <span style={{ color: "hsl(38 8% 45%)", flexShrink: 0 }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Zodiak', serif", fontWeight: 600, fontSize: "0.95rem", color: "hsl(38 20% 86%)" }}>
              {entry.title}
            </span>
            <span style={{
              fontSize: "0.7rem", padding: "1px 8px", borderRadius: 9999,
              background: "hsl(30 8% 16%)", color: "hsl(38 8% 55%)",
              textTransform: "capitalize",
            }}>
              {SESSION_TYPE_LABELS[entry.sessionType] ?? entry.sessionType}
            </span>
            <span
              className={`mood-${entry.mood}`}
              style={{ fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 3 }}
              title={entry.mood}
            >
              <span>{MOOD_EMOJI[entry.mood] ?? "○"}</span>
              <span style={{ textTransform: "capitalize" }}>{entry.mood}</span>
            </span>
          </div>
          <p style={{ fontSize: "0.7rem", color: "hsl(38 5% 38%)", marginTop: 3 }}>
            {new Date(entry.createdAt!).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            data-testid={`edit-entry-${entry.id}`}
            onClick={e => { e.stopPropagation(); onEdit(entry); }}
            style={{ padding: "4px 5px", color: "hsl(38 8% 42%)", cursor: "pointer", borderRadius: 4 }}
          >
            <Edit2 size={13} />
          </button>
          <button
            data-testid={`delete-entry-${entry.id}`}
            onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
            style={{ padding: "4px 5px", color: "hsl(38 8% 42%)", cursor: "pointer", borderRadius: 4 }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && hasContent && (
        <div
          className="animate-fade-in"
          style={{
            borderTop: "1px solid hsl(30 8% 15%)",
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {entry.whatWorked && (
            <Section label="What worked" value={entry.whatWorked} color="hsl(155 55% 55%)" />
          )}
          {entry.whatToImprove && (
            <Section label="Work on" value={entry.whatToImprove} color="hsl(38 85% 55%)" />
          )}
          {entry.breakthroughMoment && (
            <Section label="Breakthrough" value={entry.breakthroughMoment} color="hsl(260 60% 70%)" />
          )}
          {entry.freeWrite && (
            <Section label="Notes" value={entry.freeWrite} color="hsl(38 8% 55%)" />
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: "0.84rem", color: "hsl(38 12% 72%)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{value}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JOURNAL_ENCRYPTED_FIELDS: any[] = ["title", "whatWorked", "whatToImprove", "breakthroughMoment", "freeWrite"];

export default function JournalPage() {
  const { toast } = useToast();
  const { dataKey } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [filterType, setFilterType] = useState("all");

  const { data: rawEntries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal-entries"],
  });
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  useEffect(() => {
    if (!rawEntries.length) { setEntries([]); return; }
    if (!dataKey) { setEntries(rawEntries); return; }
    decryptArray(rawEntries, JOURNAL_ENCRYPTED_FIELDS, dataKey).then(setEntries);
  }, [rawEntries, dataKey]);

  const createMutation = useMutation({
    mutationFn: async (data: FormState) => {
      if (!dataKey) throw new Error("No encryption key");
      const encrypted = await encryptFields(data, JOURNAL_ENCRYPTED_FIELDS, dataKey);
      return apiRequest("POST", "/api/journal-entries", encrypted);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] }); setShowForm(false); setForm(BLANK); toast({ title: "Entry saved" }); },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormState> }) => {
      if (!dataKey) throw new Error("No encryption key");
      const encrypted = await encryptFields(data, JOURNAL_ENCRYPTED_FIELDS, dataKey);
      return apiRequest("PATCH", `/api/journal-entries/${id}`, encrypted);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] }); setEditingEntry(null); setShowForm(false); setForm(BLANK); toast({ title: "Entry updated" }); },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/journal-entries/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] }),
  });

  function startEdit(entry: JournalEntry) {
    setEditingEntry(entry);
    setForm({
      title: entry.title,
      sessionType: entry.sessionType,
      whatWorked: entry.whatWorked ?? "",
      whatToImprove: entry.whatToImprove ?? "",
      breakthroughMoment: entry.breakthroughMoment ?? "",
      freeWrite: entry.freeWrite ?? "",
      mood: entry.mood,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitForm() {
    if (!form.title.trim()) return;
    if (editingEntry) updateMutation.mutate({ id: editingEntry.id, data: form });
    else createMutation.mutate(form);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingEntry(null);
    setForm(BLANK);
  }

  const filtered = filterType === "all" ? entries : entries.filter(e => e.sessionType === filterType);

  return (
    <div style={{ padding: "32px 32px 48px", maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Zodiak', serif", fontSize: "clamp(1.5rem, 2vw + 1rem, 2rem)", fontWeight: 700, color: "hsl(38 20% 88%)", marginBottom: 6 }}>
            Practice Journal
          </h1>
          <p style={{ color: "hsl(38 8% 50%)", fontSize: "0.875rem" }}>
            Reflect on every session. Patterns emerge when you write things down.
          </p>
        </div>
        <Button
          data-testid="new-entry-button"
          onClick={() => { setEditingEntry(null); setForm(BLANK); setShowForm(true); }}
          style={{ background: "hsl(38 85% 52%)", color: "hsl(30 8% 7%)", fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}
        >
          <Plus size={15} />
          New Entry
        </Button>
      </div>

      {/* Journal form */}
      {showForm && (
        <div
          data-testid="journal-form"
          className="animate-fade-in"
          style={{
            background: "hsl(30 8% 10%)",
            border: "1px solid hsl(38 85% 52% / 0.2)",
            borderRadius: 12,
            padding: "24px",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontFamily: "'Zodiak', serif", fontWeight: 600, fontSize: "1.05rem" }}>
              {editingEntry ? "Edit Entry" : "New Journal Entry"}
            </h2>
            <button onClick={cancelForm} style={{ color: "hsl(38 8% 50%)", cursor: "pointer" }}><X size={16} /></button>
          </div>

          {/* Title + type + mood */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", gap: 10, marginBottom: 14 }}>
            <Input
              data-testid="journal-title-input"
              placeholder="Session title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={{ background: "hsl(30 8% 14%)", border: "1px solid hsl(30 8% 22%)" }}
            />
            <Select value={form.sessionType} onValueChange={v => setForm(f => ({ ...f, sessionType: v }))}>
              <SelectTrigger data-testid="session-type-select" style={{ background: "hsl(30 8% 14%)", border: "1px solid hsl(30 8% 22%)" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map(t => <SelectItem key={t} value={t}>{SESSION_TYPE_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.mood} onValueChange={v => setForm(f => ({ ...f, mood: v }))}>
              <SelectTrigger data-testid="mood-select" style={{ background: "hsl(30 8% 14%)", border: "1px solid hsl(30 8% 22%)" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOODS.map(m => (
                  <SelectItem key={m} value={m}>
                    {MOOD_EMOJI[m]} {m.charAt(0).toUpperCase() + m.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <TemplateField
              label="What worked?"
              placeholder="Name specific moments, choices, discoveries..."
              value={form.whatWorked}
              onChange={v => setForm(f => ({ ...f, whatWorked: v }))}
              accent="hsl(155 55% 50%)"
              testId="journal-what-worked"
            />
            <TemplateField
              label="What to work on?"
              placeholder="One or two honest targets for next time..."
              value={form.whatToImprove}
              onChange={v => setForm(f => ({ ...f, whatToImprove: v }))}
              accent="hsl(38 85% 52%)"
              testId="journal-what-to-improve"
            />
            <TemplateField
              label="Breakthrough moment"
              placeholder="A scene that cracked open, a discovery, an instinct that landed..."
              value={form.breakthroughMoment}
              onChange={v => setForm(f => ({ ...f, breakthroughMoment: v }))}
              accent="hsl(260 60% 70%)"
              testId="journal-breakthrough"
            />
            <TemplateField
              label="Free write"
              placeholder="Anything else — fears, questions, quotes, observations..."
              value={form.freeWrite}
              onChange={v => setForm(f => ({ ...f, freeWrite: v }))}
              accent="hsl(38 8% 50%)"
              testId="journal-free-write"
              rows={4}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <Button
              data-testid="submit-journal-form"
              onClick={submitForm}
              disabled={!form.title.trim()}
              style={{ background: "hsl(38 85% 52%)", color: "hsl(30 8% 7%)", fontWeight: 600, display: "flex", gap: 5 }}
            >
              <Check size={15} />
              {editingEntry ? "Save Changes" : "Save Entry"}
            </Button>
            <Button onClick={cancelForm} variant="ghost" style={{ color: "hsl(38 8% 50%)" }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Filter row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", ...SESSION_TYPES].map(t => (
          <button
            key={t}
            data-testid={`filter-type-${t}`}
            onClick={() => setFilterType(t)}
            style={{
              padding: "4px 12px",
              borderRadius: 9999,
              border: "1px solid",
              fontSize: "0.77rem",
              fontWeight: 500,
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all 150ms",
              background: filterType === t ? "hsl(38 85% 52%)" : "transparent",
              color: filterType === t ? "hsl(30 8% 7%)" : "hsl(38 8% 55%)",
              borderColor: filterType === t ? "hsl(38 85% 52%)" : "hsl(30 8% 22%)",
            }}
          >
            {t === "all" ? "All" : SESSION_TYPE_LABELS[t]}
          </button>
        ))}
        {entries.length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "hsl(38 5% 38%)", alignSelf: "center" }}>
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        )}
      </div>

      {/* Entry list */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", color: "hsl(38 8% 40%)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 10, opacity: 0.25 }}>⌒</div>
          <p style={{ marginBottom: 4 }}>No entries yet.</p>
          <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>The stage is yours — write something down.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={startEdit}
              onDelete={id => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateField({
  label, placeholder, value, onChange, accent, testId, rows = 2,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  accent: string;
  testId: string;
  rows?: number;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: accent, marginBottom: 5 }}>
        {label}
      </label>
      <Textarea
        data-testid={testId}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        style={{
          background: "hsl(30 8% 13%)",
          border: "1px solid hsl(30 8% 22%)",
          resize: "vertical",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          borderLeft: `2px solid ${accent}`,
          borderRadius: "0 6px 6px 0",
        }}
      />
    </div>
  );
}
