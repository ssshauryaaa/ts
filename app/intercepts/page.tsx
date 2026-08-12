"use client";
import { useEffect, useState, useCallback } from "react";
import { MinimalBwBackground } from "@/components/ui/minimal-bw-background";
import Link from "next/link";

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes flicker { 0%,100%{opacity:1}92%{opacity:1}93%{opacity:.4}94%{opacity:1}96%{opacity:.6}97%{opacity:1} }

  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(220,38,38,0.25); border-radius: 2px; }

  .intercept-row { transition: background 150ms ease; }
  .intercept-row:hover { background: rgba(255,255,255,0.025) !important; }

  .nav-link-i:hover { color: #f8fafc !important; }
  .filter-chip-i:hover { border-color: rgba(220,38,38,0.5) !important; color: #f8fafc !important; }
  .action-btn-i:hover { border-color: rgba(220,38,38,0.5) !important; color: #f8fafc !important; }
`;

// ── Types ─────────────────────────────────────────────────────────────────────
type ThreatLevel = "critical" | "high" | "moderate" | "low";

interface Intercept {
  id: string;
  timestamp: string;
  sender: string;
  sector: string;
  rawCipher: string;
  decryptedContent: string;
  threat: ThreatLevel;
  keywords: string[];
  actionTaken?: string;
}

const THREAT_COLOR: Record<ThreatLevel, string> = {
  critical: "#dc2626",
  high: "#f59e0b",
  moderate: "#3b82f6",
  low: "#22c55e",
};

const INITIAL_INTERCEPTS: Intercept[] = [
  {
    id: "TX-9041",
    timestamp: "03:42:19 GST",
    sender: "KENOBI-ECHO",
    sector: "TATOOINE · OUTER RIM",
    rawCipher: "7F 9A 41 B8 02 E1 5C 88 12 F0 3B 99 AD 01 4F",
    decryptedContent: "The Force will guide us through this shadow. Maintain contact on frequency 94.2. Do not gather in groups of more than three. Safehouse Delta remains compromised.",
    threat: "critical",
    keywords: ["Force", "Safehouse Delta", "frequency 94.2"],
  },
  {
    id: "TX-9040",
    timestamp: "03:39:02 GST",
    sender: "HCET-PRIME",
    sector: "DANTOOINE · OUTER RIM",
    rawCipher: "A1 B2 3C 4D 5E 6F 70 81 92 03 14 25 36 47 58",
    decryptedContent: "New recruits secured near old enclave ruins. Awaiting extraction shuttle. Requesting Imperial patrol timetable for outer sector grid 4.",
    threat: "critical",
    keywords: ["recruits", "enclave ruins", "extraction shuttle"],
  },
  {
    id: "TX-9039",
    timestamp: "03:21:45 GST",
    sender: "REBEL-ALPHA",
    sector: "OUTER RIM · SECTOR 7",
    rawCipher: "55 66 77 88 99 AA BB CC DD EE FF 00 11 22 33",
    decryptedContent: "We move at 0300. Tell the others to prime their hyperdrives. Convoy escort departs from coordinates 14-88.",
    threat: "high",
    keywords: ["0300", "hyperdrives", "coordinates 14-88"],
  },
  {
    id: "TX-9038",
    timestamp: "02:55:12 GST",
    sender: "SYNDICATE-7",
    sector: "KASHYYYK · MID RIM",
    rawCipher: "12 34 56 78 90 AB CD EF fe dc ba 09 87 65 43",
    decryptedContent: "Supply drop confirmed. Use sub-channel 9 for code clearance. Imperial scouts sighted near tree city canopy.",
    threat: "moderate",
    keywords: ["Supply drop", "sub-channel 9", "Imperial scouts"],
  },
  {
    id: "TX-9037",
    timestamp: "02:14:00 GST",
    sender: "AGENT-ZERO",
    sector: "CORUSCANT · INNER RIM",
    rawCipher: "00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E",
    decryptedContent: "Uplink stable. Standing by for ISB orders. Monitoring high-level HoloNet traffic from Senate district.",
    threat: "low",
    keywords: ["Uplink stable", "Senate district"],
  },
  {
    id: "TX-9036",
    timestamp: "01:48:30 GST",
    sender: "UNKNOWN-WILD",
    sector: "WILD SPACE",
    rawCipher: "88 77 66 55 44 33 22 11 00 FF EE DD CC BB AA",
    decryptedContent: "...static... rendezvous point delta confirmed ...static... awaiting confirmation from HCET coordinator.",
    threat: "low",
    keywords: ["rendezvous point delta", "HCET coordinator"],
  },
];

// ── Components ────────────────────────────────────────────────────────────────
function ImperialCrest({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" stroke="#dc2626" strokeWidth="3" fill="none" opacity="0.9" />
      <circle cx="50" cy="50" r="34" stroke="#dc2626" strokeWidth="1.5" fill="none" opacity="0.5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            key={i}
            x1={Math.round((50 + 34 * Math.cos(a)) * 100) / 100}
            y1={Math.round((50 + 34 * Math.sin(a)) * 100) / 100}
            x2={Math.round((50 + 46 * Math.cos(a)) * 100) / 100}
            y2={Math.round((50 + 46 * Math.sin(a)) * 100) / 100}
            stroke="#dc2626" strokeWidth="2" opacity="0.6"
          />
        );
      })}
      <circle cx="50" cy="50" r="8" fill="#dc2626" opacity="0.9" />
      <circle cx="50" cy="50" r="4" fill="#000" />
    </svg>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "var(--font-nav)", fontSize: 7, letterSpacing: "0.12em",
      color, border: `1px solid ${color}`, borderRadius: 999, padding: "2px 7px",
      background: `color-mix(in srgb, ${color} 10%, transparent)`, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function NavBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")}`);
    };
    update(); const iv = setInterval(update, 1000); return () => clearInterval(iv);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
      background: "rgba(0,0,0,0.90)", backdropFilter: "blur(24px)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 32px", height: 52,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ImperialCrest size={20} />
        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.18em" }}>GALACTIC EMPIRE · ISB</div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 10, color: "#dc2626", letterSpacing: "0.12em", fontWeight: 600 }}>HOLONET ARCHIVE</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {[
          { label: "CONSOLE", href: "/console" },
          { label: "DOSSIERS", href: "/dossiers" },
          { label: "MISSIONS", href: "/missions" },
          { label: "INTERCEPTS", href: "/intercepts" },
        ].map((n) => (
          <Link key={n.href} href={n.href} className="nav-link-i" style={{
            fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.14em",
            color: n.href === "/intercepts" ? "#f8fafc" : "#475569",
            textDecoration: "none", transition: "color 150ms",
          }}>{n.label}</Link>
        ))}
      </div>
      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#dc2626", letterSpacing: "0.1em" }}>{time} GST</div>
    </nav>
  );
}

// Highlight keywords inside text
function HighlightedText({ text, keywords, color }: { text: string; keywords: string[]; color: string }) {
  if (!keywords.length) return <>{text}</>;
  const pattern = new RegExp(`(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        keywords.some((k) => k.toLowerCase() === part.toLowerCase()) ? (
          <span
            key={i}
            style={{
              color,
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: "2px",
              background: `color-mix(in srgb, ${color} 15%, transparent)`,
              padding: "0 4px",
              borderRadius: 2,
            }}
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InterceptsPage() {
  const [intercepts, setIntercepts] = useState<Intercept[]>(INITIAL_INTERCEPTS);
  const [filterThreat, setFilterThreat] = useState<ThreatLevel | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>("TX-9041");

  // Simulated live incoming intercept generator
  useEffect(() => {
    const samples = [
      { sender: "REBEL-BETA", sector: "MID RIM", content: "Safehouse 4 grid verified. Requesting medical supplies.", threat: "moderate" as ThreatLevel, kw: ["Safehouse 4", "medical supplies"] },
      { sender: "KENOBI-ECHO", sector: "TATOOINE", content: "Inquisitor probe detected in sector 4. Shifting frequencies.", threat: "critical" as ThreatLevel, kw: ["Inquisitor probe", "frequencies"] },
      { sender: "HCET-SIGNAL", sector: "EXPANSION", content: "New recruit transport en route to rendezvous point beta.", threat: "high" as ThreatLevel, kw: ["recruit transport", "rendezvous point beta"] },
    ];

    let count = 9042;
    const interval = setInterval(() => {
      const sample = samples[Math.floor(Math.random() * samples.length)];
      const n = new Date();
      const timeStr = `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")} GST`;
      const newItem: Intercept = {
        id: `TX-${count++}`,
        timestamp: timeStr,
        sender: sample.sender,
        sector: sample.sector,
        rawCipher: Array.from({ length: 12 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()).join(" "),
        decryptedContent: sample.content,
        threat: sample.threat,
        keywords: sample.kw,
      };
      setIntercepts((prev) => [newItem, ...prev.slice(0, 15)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const filtered = intercepts.filter((item) => {
    const matchThreat = filterThreat === "ALL" || item.threat === filterThreat;
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      item.sender.toLowerCase().includes(q) ||
      item.sector.toLowerCase().includes(q) ||
      item.decryptedContent.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);
    return matchThreat && matchQuery;
  });

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: "100dvh", background: "#000", position: "relative" }}>
        <MinimalBwBackground />
        <NavBar />

        <main style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "80px 32px 80px" }}>
          {/* Header */}
          <div style={{ padding: "40px 0 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 32 }}>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 9, color: "#374151", letterSpacing: "0.28em", marginBottom: 10 }}>
              IMPERIAL SECURITY BUREAU · COMMUNICATIONS DECRYPTION DIVISION
            </div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(26px,4vw,40px)", color: "#f8fafc", fontWeight: 700, margin: "0 0 8px" }}>
              HoloNet Transmissions <span style={{ color: "#dc2626" }}>Archive</span>
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#374151", margin: 0 }}>
              Decoded long-range rebel transmissions intercepted across Imperial HoloNet relays. Automatically scanned for Force-sensitive activity.
            </p>
          </div>

          {/* Top Summary / Status Ticker */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 2, marginBottom: 36 }}>
            <div style={{ padding: "14px 18px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 20, color: "#22c55e" }}>99.98%</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>DECRYPTION UPLINK</div>
            </div>
            <div style={{ padding: "14px 18px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 20, color: "#dc2626", fontWeight: 700 }}>
                {intercepts.filter((i) => i.threat === "critical").length} CRITICAL
              </div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>FLAGGED THREATS</div>
            </div>
            <div style={{ padding: "14px 18px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 20, color: "#f59e0b" }}>LIVE</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>SIGNAL INTERCEPTOR</div>
            </div>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 20, color: "#64748b" }}>{intercepts.length} LOGGED</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>INTERCEPT ARCHIVES</div>
            </div>
          </div>

          {/* Search + Filter Bar */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
              <input
                type="text"
                placeholder="SEARCH TRANSMISSIONS BY SENDER, SECTOR, KEYWORD..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: "100%", padding: "10px 16px",
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 2, color: "#f8fafc", fontFamily: "var(--font-terminal)", fontSize: 11,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["ALL", "critical", "high", "moderate", "low"] as const).map((t) => {
                const active = filterThreat === t;
                const col = t === "ALL" ? "#64748b" : THREAT_COLOR[t];
                return (
                  <button
                    key={t}
                    onClick={() => setFilterThreat(t)}
                    className="filter-chip-i"
                    style={{
                      fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.12em",
                      color: active ? col : "#374151", border: `1px solid ${active ? col : "rgba(255,255,255,0.07)"}`,
                      background: active ? `color-mix(in srgb, ${col} 12%, transparent)` : "transparent",
                      borderRadius: 999, padding: "4px 10px", cursor: "pointer", transition: "all 150ms",
                    }}
                  >
                    {t.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intercepts List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 2 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", fontFamily: "var(--font-nav)", fontSize: 9, color: "#1f2937", letterSpacing: "0.18em" }}>
                NO INTERCEPTED TRANSMISSIONS MATCH QUERY
              </div>
            ) : (
              filtered.map((item, index) => {
                const tColor = THREAT_COLOR[item.threat];
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="intercept-row"
                    style={{
                      background: isExpanded ? `color-mix(in srgb, ${tColor} 5%, transparent)` : "transparent",
                      borderLeft: `2px solid ${tColor}`,
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      animation: index === 0 ? "slideIn 300ms ease" : "none",
                    }}
                  >
                    {/* Row Header */}
                    <div
                      onClick={() => toggleExpand(item.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 16, padding: "14px 20px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#475569", width: 70, flexShrink: 0 }}>
                        {item.id}
                      </div>
                      <div style={{ fontFamily: "var(--font-nav)", fontSize: 9, color: tColor, letterSpacing: "0.1em", width: 130, flexShrink: 0 }}>
                        {item.sender}
                      </div>
                      <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", width: 140, flexShrink: 0 }}>
                        {item.sector}
                      </div>
                      <div style={{ flex: 1, fontFamily: "var(--font-terminal)", fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.decryptedContent}
                      </div>
                      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "#475569", width: 90, textAlign: "right" }}>
                        {item.timestamp}
                      </div>
                      <Tag color={tColor}>{item.threat.toUpperCase()}</Tag>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: "16px 20px 20px 106px",
                          borderTop: "1px solid rgba(255,255,255,0.03)",
                          background: "rgba(0,0,0,0.4)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 4 }}>
                            RAW CIPHER STREAM
                          </div>
                          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#475569", letterSpacing: "0.08em" }}>
                            {item.rawCipher}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 4 }}>
                            DECRYPTED TRANSMISSION BODY
                          </div>
                          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: "#f8fafc", lineHeight: 1.7 }}>
                            <HighlightedText text={item.decryptedContent} keywords={item.keywords} color={tColor} />
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                          <button
                            className="action-btn-i"
                            onClick={() => alert(`Inquisitor team dispatched for ${item.sender} at ${item.sector}`)}
                            style={{
                              fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.12em",
                              padding: "4px 12px", background: `color-mix(in srgb, ${tColor} 15%, transparent)`,
                              border: `1px solid ${tColor}`, color: "#fff", cursor: "pointer", borderRadius: 2,
                            }}
                          >
                            DISPATCH INQUISITOR STRIKE
                          </button>
                          <button
                            className="action-btn-i"
                            onClick={() => alert(`Transmission ${item.id} logged for ISB monitoring.`)}
                            style={{
                              fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.12em",
                              padding: "4px 12px", background: "none",
                              border: "1px solid rgba(255,255,255,0.08)", color: "#64748b", cursor: "pointer", borderRadius: 2,
                            }}
                          >
                            FLAG FOR SURVEILLANCE
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </>
  );
}
