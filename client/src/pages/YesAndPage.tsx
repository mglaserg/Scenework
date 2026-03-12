import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { YesAndResponse } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function YesAndPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: history = [], isLoading: historyLoading } = useQuery<YesAndResponse[]>({
    queryKey: ["/api/yes-and/responses"],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!prompt || !response.trim()) return;
      await apiRequest("POST", "/api/yes-and/responses", { prompt, response: response.trim() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/yes-and/responses"] });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
      setResponse("");
      fetchPrompt();
    },
    onError: () => toast({ title: "Couldn't save response", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/yes-and/responses/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/yes-and/responses"] }),
  });

  const fetchPrompt = async () => {
    setLoadingPrompt(true);
    setResponse("");
    setJustSaved(false);
    try {
      const res = await apiRequest("GET", "/api/yes-and/prompts/random");
      const json = await res.json();
      setPrompt(json.prompt);
    } finally {
      setLoadingPrompt(false);
    }
  };

  useEffect(() => {
    if (prompt && textareaRef.current) textareaRef.current.focus();
  }, [prompt]);

  return (
    <div style={{ padding: "32px 24px", maxWidth: 600, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Zodiak', serif", fontSize: "1.5rem", fontWeight: 700, color: "hsl(38 20% 88%)", marginBottom: 4 }}>
          Yes-And Trainer
        </h1>
        <p style={{ fontSize: "0.8rem", color: "hsl(38 8% 55%)" }}>
          Read the offer. Accept it, build on it. Start your response with "Yes, and…"
        </p>
      </div>

      {/* Prompt card */}
      <div style={{
        background: "hsl(30 8% 11%)", border: "1px solid hsl(30 8% 20%)",
        borderRadius: 12, padding: "20px 22px", marginBottom: 16, minHeight: 80,
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(38 8% 45%)", marginBottom: 8 }}>
              The Offer
            </p>
            {loadingPrompt ? (
              <Skeleton className="h-6 w-3/4 rounded" />
            ) : prompt ? (
              <p style={{ fontSize: "1.05rem", color: "hsl(38 20% 88%)", fontWeight: 500, lineHeight: 1.5 }}>
                "{prompt}"
              </p>
            ) : (
              <p style={{ fontSize: "0.88rem", color: "hsl(38 8% 45%)", fontStyle: "italic" }}>
                Hit "New Prompt" to begin
              </p>
            )}
          </div>
          <button
            data-testid="button-new-prompt"
            onClick={fetchPrompt}
            disabled={loadingPrompt}
            style={{
              flexShrink: 0, padding: "7px 14px", borderRadius: 6, fontSize: "0.78rem", fontWeight: 500, cursor: "pointer",
              background: "hsl(30 8% 17%)", border: "1px solid hsl(30 8% 26%)",
              color: "hsl(38 10% 65%)", transition: "all 150ms",
            }}
          >
            {loadingPrompt ? "…" : prompt ? "Skip" : "New Prompt"}
          </button>
        </div>
      </div>

      {/* Response input */}
      {prompt && !loadingPrompt && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: 14,
              fontSize: "0.85rem", color: "hsl(38 85% 55%)", fontWeight: 600, pointerEvents: "none",
            }}>
              Yes, and…
            </span>
            <textarea
              ref={textareaRef}
              data-testid="input-yes-and-response"
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="continue the offer…"
              rows={3}
              style={{
                width: "100%", boxSizing: "border-box",
                paddingTop: 14, paddingBottom: 12, paddingLeft: 90, paddingRight: 14,
                background: "hsl(30 8% 12%)", border: "1px solid hsl(30 8% 22%)",
                borderRadius: 8, color: "hsl(38 20% 88%)", fontSize: "0.9rem",
                lineHeight: 1.6, resize: "vertical", outline: "none",
                fontFamily: "inherit",
              }}
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  if (response.trim()) saveMutation.mutate();
                }
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <span style={{ fontSize: "0.7rem", color: "hsl(38 5% 38%)" }}>⌘↵ to save and continue</span>
            <button
              data-testid="button-save-response"
              onClick={() => saveMutation.mutate()}
              disabled={!response.trim() || saveMutation.isPending}
              style={{
                padding: "8px 20px", borderRadius: 7, fontSize: "0.83rem", fontWeight: 600, cursor: response.trim() ? "pointer" : "default",
                background: justSaved ? "hsl(150 60% 40% / 0.2)" : response.trim() ? "hsl(38 85% 52%)" : "hsl(30 8% 16%)",
                color: justSaved ? "hsl(150 60% 55%)" : response.trim() ? "hsl(30 8% 7%)" : "hsl(38 5% 38%)",
                border: justSaved ? "1px solid hsl(150 60% 40% / 0.4)" : "1px solid transparent",
                transition: "all 150ms",
              }}
            >
              {justSaved ? "Saved ✓" : saveMutation.isPending ? "Saving…" : "Save & Next"}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "hsl(38 8% 45%)" }}>
            Response Log
          </h2>
          {history.length > 0 && (
            <span style={{ fontSize: "0.7rem", color: "hsl(38 5% 38%)" }}>{history.length} saved</span>
          )}
        </div>

        {historyLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        )}

        {!historyLoading && history.length === 0 && (
          <p style={{ fontSize: "0.82rem", color: "hsl(38 5% 38%)", fontStyle: "italic" }}>
            Your saved responses will appear here.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((r) => (
            <div
              key={r.id}
              data-testid={`response-item-${r.id}`}
              style={{
                background: "hsl(30 8% 10%)", border: "1px solid hsl(30 8% 18%)",
                borderRadius: 8, padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.72rem", color: "hsl(38 5% 40%)", fontStyle: "italic", marginBottom: 4, lineHeight: 1.4 }}>
                    "{r.prompt}"
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "hsl(38 15% 75%)", lineHeight: 1.5 }}>
                    <span style={{ color: "hsl(38 85% 55%)", fontWeight: 600 }}>Yes, and</span> {r.response}
                  </p>
                </div>
                <button
                  data-testid={`button-delete-response-${r.id}`}
                  onClick={() => deleteMutation.mutate(r.id)}
                  style={{ flexShrink: 0, padding: 4, background: "none", border: "none", cursor: "pointer", color: "hsl(38 5% 35%)", opacity: 0.7 }}
                  title="Delete"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
