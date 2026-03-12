import { Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useState } from "react";
import { Menu, X } from "lucide-react";
// PerplexityAttribution handled inline in footer

const NAV_GROUPS = [
  {
    label: "Practice",
    items: [
      {
        href: "/focus",
        label: "Focus DB",
        desc: "Draw 3 skills to work on",
        icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>),
      },
      {
        href: "/emotion-drill",
        label: "Emotion Drill",
        desc: "Random line + emotion",
        icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
      },
      {
        href: "/yes-and",
        label: "Yes-And Trainer",
        desc: "Accept offers & build",
        icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
      },
      {
        href: "/warmup",
        label: "Warm-Up",
        desc: "Randomized exercise sequence",
        icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>),
      },
      {
        href: "/timer",
        label: "Timer",
        desc: "Countdown & stopwatch",
        icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
      },
    ],
  },
  {
    label: "Create",
    items: [
      {
        href: "/scene-partner",
        label: "Scene Partner",
        desc: "Characters, location, opening",
        icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
      },
      {
        href: "/character",
        label: "Character",
        desc: "Name, job, quirk, want",
        icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
      },
      {
        href: "/journal",
        label: "Journal",
        desc: "Reflect & log your practice",
        icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>),
      },
    ],
  },
];
// Flat list for mobile
const NAV = NAV_GROUPS.flatMap(g => g.items);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/focus") return location === "/" || location === "/focus";
    return location.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        style={{ width: 240, minHeight: "100vh", background: "hsl(30 8% 9%)", borderRight: "1px solid hsl(30 8% 18%)" }}
        className="hidden md:flex flex-col flex-shrink-0"
      >
        {/* Logo */}
        <div style={{ padding: "28px 24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            {/* SVG logo: spotlight triangle */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="Stagework logo">
              <polygon points="14,3 26,24 2,24" stroke="hsl(38 85% 52%)" strokeWidth="2" fill="none" strokeLinejoin="round"/>
              <circle cx="14" cy="24" r="2" fill="hsl(38 85% 52%)"/>
            </svg>
            <span style={{ fontFamily: "'Zodiak', serif", fontSize: "1.1rem", fontWeight: 700, color: "hsl(38 20% 88%)", letterSpacing: "-0.01em" }}>
              Stagework
            </span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "hsl(38 8% 45%)", marginLeft: 38 }}>Improv Practice</p>
        </div>

        <div style={{ height: 1, background: "hsl(30 8% 18%)", margin: "0 16px 16px" }} />

        {/* Nav */}
        <nav style={{ padding: "0 8px", flex: 1, overflowY: "auto" }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: 6 }}>
              <div style={{ padding: "8px 14px 4px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(38 5% 35%)" }}>
                {group.label}
              </div>
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <a
                      data-testid={`nav-${item.href.replace("/", "")}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 12px", borderRadius: 7, marginBottom: 1,
                        textDecoration: "none", transition: "background 150ms, color 150ms",
                        background: active ? "hsl(38 85% 52% / 0.12)" : "transparent",
                        color: active ? "hsl(38 85% 60%)" : "hsl(38 10% 58%)",
                        border: active ? "1px solid hsl(38 85% 52% / 0.2)" : "1px solid transparent",
                      }}
                    >
                      <span style={{ flexShrink: 0, opacity: active ? 1 : 0.65 }}>{item.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: "0.82rem", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</div>
                        <div style={{ fontSize: "0.67rem", opacity: 0.6, lineHeight: 1.3, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.desc}</div>
                      </div>
                      {active && (
                        <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "hsl(38 85% 52%)", flexShrink: 0 }} />
                      )}
                    </a>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid hsl(30 8% 18%)" }}>
          <a
            href="https://www.perplexity.ai/computer"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.7rem", color: "hsl(38 5% 38%)", textDecoration: "none" }}
          >
            Created with Perplexity Computer
          </a>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
        style={{ padding: "12px 16px", background: "hsl(30 8% 9%)", borderBottom: "1px solid hsl(30 8% 18%)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <polygon points="14,3 26,24 2,24" stroke="hsl(38 85% 52%)" strokeWidth="2" fill="none" strokeLinejoin="round"/>
            <circle cx="14" cy="24" r="2" fill="hsl(38 85% 52%)"/>
          </svg>
          <span style={{ fontFamily: "'Zodiak', serif", fontWeight: 700, fontSize: "1rem", color: "hsl(38 20% 88%)" }}>Stagework</span>
        </div>
        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: "hsl(38 10% 60%)", padding: 4 }}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: "hsl(0 0% 0% / 0.7)" }}
          onClick={() => setMobileOpen(false)}
        >
          <nav
            style={{ width: 240, height: "100%", background: "hsl(30 8% 9%)", padding: "72px 8px 16px" }}
            onClick={e => e.stopPropagation()}
          >
            {NAV.map(item => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", borderRadius: 8, marginBottom: 2,
                      textDecoration: "none",
                      background: active ? "hsl(38 85% 52% / 0.12)" : "transparent",
                      color: active ? "hsl(38 85% 60%)" : "hsl(38 10% 60%)",
                      border: active ? "1px solid hsl(38 85% 52% / 0.2)" : "1px solid transparent",
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main
        className="flex-1 overflow-auto"
        style={{ paddingTop: 0 }}
      >
        <div className="md:hidden" style={{ height: 57 }} />
        {children}
      </main>
    </div>
  );
}
