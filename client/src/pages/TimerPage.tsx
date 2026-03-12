import { useState, useEffect, useRef, useCallback } from "react";

type Mode = "stopwatch" | "countdown";

const PRESETS = [
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
];

function fmt(s: number) {
  const abs = Math.abs(s);
  const m = Math.floor(abs / 60).toString().padStart(2, "0");
  const sec = (abs % 60).toString().padStart(2, "0");
  return `${s < 0 ? "-" : ""}${m}:${sec}`;
}

export default function TimerPage() {
  const [mode, setMode] = useState<Mode>("countdown");
  const [preset, setPreset] = useState(PRESETS[1]); // 5 min default
  const [customInput, setCustomInput] = useState("");
  const [customSeconds, setCustomSeconds] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(PRESETS[1].seconds);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = mode === "countdown" ? (customSeconds ?? preset.seconds) : 0;

  const reset = useCallback(() => {
    setRunning(false);
    setFinished(false);
    setElapsed(0);
    setRemaining(customSeconds ?? preset.seconds);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [preset, customSeconds]);

  useEffect(() => { reset(); }, [preset, customSeconds]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      if (mode === "countdown") {
        setRemaining(prev => {
          if (prev <= 1) {
            setRunning(false);
            setFinished(true);
            clearInterval(intervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setElapsed(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running, mode]);

  const display = mode === "countdown" ? remaining : elapsed;
  const progress = mode === "countdown" && totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;

  const handleCustom = () => {
    const [mStr, sStr] = customInput.split(":");
    const m = parseInt(mStr || "0");
    const s = parseInt(sStr || "0");
    if (!isNaN(m) && !isNaN(s) && (m > 0 || s > 0)) {
      const total = m * 60 + s;
      setCustomSeconds(total);
      setCustomInput("");
    }
  };

  const circumference = 2 * Math.PI * 110;

  return (
    <div style={{ padding: "32px 24px", maxWidth: 520, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Zodiak', serif", fontSize: "1.5rem", fontWeight: 700, color: "hsl(38 20% 88%)", marginBottom: 4 }}>
          Session Timer
        </h1>
        <p style={{ fontSize: "0.8rem", color: "hsl(38 8% 55%)" }}>
          Time your drills, scenes, and exercises.
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["countdown", "stopwatch"] as Mode[]).map(m => (
          <button
            key={m}
            data-testid={`mode-${m}`}
            onClick={() => { setMode(m); setRunning(false); setElapsed(0); setFinished(false); setRemaining(customSeconds ?? preset.seconds); }}
            style={{
              padding: "7px 18px", borderRadius: 6, fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", border: "1px solid",
              background: mode === m ? "hsl(38 85% 52% / 0.15)" : "hsl(30 8% 14%)",
              color: mode === m ? "hsl(38 85% 60%)" : "hsl(38 8% 55%)",
              borderColor: mode === m ? "hsl(38 85% 52% / 0.35)" : "hsl(30 8% 22%)",
              transition: "all 150ms",
            }}
          >
            {m === "countdown" ? "Countdown" : "Stopwatch"}
          </button>
        ))}
      </div>

      {/* Presets (countdown only) */}
      {mode === "countdown" && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                data-testid={`preset-${p.label.replace(" ", "")}`}
                onClick={() => { setPreset(p); setCustomSeconds(null); }}
                style={{
                  padding: "6px 14px", borderRadius: 6, fontSize: "0.8rem", cursor: "pointer", border: "1px solid",
                  background: (!customSeconds && preset.seconds === p.seconds) ? "hsl(38 85% 52% / 0.15)" : "hsl(30 8% 14%)",
                  color: (!customSeconds && preset.seconds === p.seconds) ? "hsl(38 85% 60%)" : "hsl(38 8% 55%)",
                  borderColor: (!customSeconds && preset.seconds === p.seconds) ? "hsl(38 85% 52% / 0.35)" : "hsl(30 8% 22%)",
                  transition: "all 150ms",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Custom time input */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              data-testid="input-custom-time"
              type="text"
              placeholder="mm:ss"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCustom()}
              style={{
                width: 72, padding: "6px 10px", borderRadius: 6, fontSize: "0.82rem",
                background: "hsl(30 8% 14%)", border: "1px solid hsl(30 8% 22%)",
                color: "hsl(38 20% 88%)", outline: "none",
              }}
            />
            <button
              data-testid="button-set-custom"
              onClick={handleCustom}
              style={{
                padding: "6px 12px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer",
                background: "hsl(30 8% 18%)", border: "1px solid hsl(30 8% 26%)",
                color: "hsl(38 10% 65%)",
              }}
            >
              Set
            </button>
            {customSeconds && (
              <span style={{ fontSize: "0.75rem", color: "hsl(38 85% 55%)" }}>
                Custom: {fmt(customSeconds)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Clock face */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <div style={{ position: "relative", width: 240, height: 240 }}>
          <svg width="240" height="240" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="120" cy="120" r="110" fill="none" stroke="hsl(30 8% 16%)" strokeWidth="8" />
            {mode === "countdown" && (
              <circle
                cx="120" cy="120" r="110"
                fill="none"
                stroke={finished ? "hsl(0 62% 45%)" : "hsl(38 85% 52%)"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * progress}
                style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
              />
            )}
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: finished ? "2.4rem" : "3rem",
              fontWeight: 700,
              color: finished ? "hsl(0 62% 55%)" : "hsl(38 20% 88%)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}>
              {finished ? "Done" : fmt(display)}
            </span>
            {mode === "countdown" && !finished && (
              <span style={{ fontSize: "0.7rem", color: "hsl(38 8% 45%)", marginTop: 6 }}>
                {fmt(totalSeconds - remaining)} elapsed
              </span>
            )}
            {mode === "stopwatch" && elapsed > 0 && (
              <span style={{ fontSize: "0.7rem", color: "hsl(38 8% 45%)", marginTop: 6 }}>running</span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <button
          data-testid="button-start-stop"
          onClick={() => { setFinished(false); setRunning(r => !r); }}
          style={{
            padding: "12px 32px", borderRadius: 8, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
            background: running ? "hsl(38 85% 52% / 0.2)" : "hsl(38 85% 52%)",
            color: running ? "hsl(38 85% 65%)" : "hsl(30 8% 7%)",
            border: running ? "1px solid hsl(38 85% 52% / 0.4)" : "1px solid transparent",
            transition: "all 150ms",
          }}
        >
          {running ? "Pause" : finished ? "Restart" : "Start"}
        </button>
        <button
          data-testid="button-reset"
          onClick={reset}
          style={{
            padding: "12px 20px", borderRadius: 8, fontSize: "0.9rem", cursor: "pointer",
            background: "hsl(30 8% 14%)", border: "1px solid hsl(30 8% 22%)",
            color: "hsl(38 8% 55%)", transition: "all 150ms",
          }}
        >
          Reset
        </button>
      </div>

      {/* Laps (stopwatch) */}
      {mode === "stopwatch" && elapsed > 0 && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", color: "hsl(38 5% 40%)" }}>
            Running for {fmt(elapsed)}
          </p>
        </div>
      )}
    </div>
  );
}
