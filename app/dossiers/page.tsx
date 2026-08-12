"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { MinimalBwBackground } from "@/components/ui/minimal-bw-background";
import Link from "next/link";

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  @keyframes slideInR  { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:none} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes scanLine  { 0%{top:-10%} 100%{top:110%} }
  @keyframes glitch1   { 0%,100%{clip-path:inset(0 0 98% 0)} 20%{clip-path:inset(12% 0 68% 0)} 40%{clip-path:inset(43% 0 42% 0)} 60%{clip-path:inset(72% 0 14% 0)} 80%{clip-path:inset(87% 0 2% 0)} }
  @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes blink     { 0%,100%{opacity:1} 49%{opacity:1} 50%{opacity:0} 99%{opacity:0} }

  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(220,38,38,0.25); border-radius: 2px; }

  .dossier-card { transition: box-shadow 200ms ease, transform 200ms ease, border-color 200ms ease; }
  .dossier-card:hover { transform: translateY(-2px); }

  .filter-chip { transition: all 150ms ease; }
  .filter-chip:hover { border-color: rgba(220,38,38,0.5) !important; color: #f8fafc !important; }

  .drawer-overlay { animation: fadeUp 200ms ease forwards; }
  .drawer-panel   { animation: slideInR 240ms cubic-bezier(0.22,1,0.36,1) forwards; }

  .search-input::placeholder { color: #374151; }
  .search-input:focus { outline: none; border-color: rgba(220,38,38,0.4) !important; }

  .nav-link-d:hover { color: #f8fafc !important; }
  .close-btn:hover  { border-color: rgba(220,38,38,0.5) !important; color: #f8fafc !important; }
  .tag-btn:hover    { background: rgba(255,255,255,0.06) !important; }
`;

// ── Types ─────────────────────────────────────────────────────────────────────
type Status   = "ACTIVE" | "ELIMINATED" | "IN EXILE" | "UNKNOWN";
type Threat   = "critical" | "high" | "moderate" | "low";

interface Affiliation { name: string; role: string; }
interface Sighting    { date: string; sector: string; description: string; }

interface Dossier {
  id: string;
  codename: string;
  realName: string;
  species: string;
  sector: string;
  status: Status;
  threat: Threat;
  midiChlorians: number;
  inquisitorAssigned: string;
  affiliations: Affiliation[];
  lastSighting: Sighting;
  knownAbilities: string[];
  bounty: string;
  notes: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<Status, string> = {
  ACTIVE:     "#dc2626",
  ELIMINATED: "#22c55e",
  "IN EXILE": "#f59e0b",
  UNKNOWN:    "#64748b",
};
const THREAT_COLOR: Record<Threat, string> = {
  critical: "#dc2626",
  high:     "#f59e0b",
  moderate: "#3b82f6",
  low:      "#22c55e",
};
const THREAT_LABEL: Record<Threat, string> = {
  critical: "CRITICAL",
  high:     "HIGH",
  moderate: "MODERATE",
  low:      "LOW",
};

const DOSSIERS: Dossier[] = [
  {
    id: "KEN-001",
    codename: "KENOBI-ECHO",
    realName: "Obi-Wan Kenobi",
    species: "Human",
    sector: "TATOOINE · OUTER RIM",
    status: "IN EXILE",
    threat: "critical",
    midiChlorians: 13400,
    inquisitorAssigned: "Second Sister",
    affiliations: [
      { name: "Jedi High Council", role: "Master" },
      { name: "HCET Syndicate", role: "Senior Coordinator" },
    ],
    lastSighting: { date: "19 BBY · CYCLE 7", sector: "Polis Massa", description: "Intercepted encrypted HoloNet burst from desert coordinates. Likely sheltering near moisture farm settlements. Consider local informant network." },
    knownAbilities: ["Soresu (Form III)", "Mind Trick", "Force Leap", "Battle Meditation"],
    bounty: "50,000 IMPERIAL CREDITS",
    notes: "Extremely dangerous. Do not engage without Inquisitor escort. Former member of Jedi High Council. Trained Anakin Skywalker. Considered architect of HCET comm protocols.",
  },
  {
    id: "YOD-002",
    codename: "SHADOW-PRIME",
    realName: "Yoda",
    species: "Unknown",
    sector: "DAGOBAH · OUTER RIM",
    status: "IN EXILE",
    threat: "critical",
    midiChlorians: 17700,
    inquisitorAssigned: "Grand Inquisitor",
    affiliations: [
      { name: "Jedi High Council", role: "Grand Master" },
      { name: "HCET Syndicate", role: "Founder" },
    ],
    lastSighting: { date: "19 BBY · CYCLE 12", sector: "Dagobah System", description: "Faint Force signature detected in Dagobah swamp region. Dense atmospheric interference prevents orbital scans. Ground deployment required." },
    knownAbilities: ["Ataru (Form IV)", "Force Sense", "Telekinesis", "Force Barrier"],
    bounty: "CLASSIFIED — EMPEROR-LEVEL PRIORITY",
    notes: "Highest priority target. Approach only under direct Imperial authorization. Age and species may affect physical mobility but Force capability remains unmatched. HCET Syndicate spiritual leader.",
  },
  {
    id: "KAL-003",
    codename: "SURVIVOR-7",
    realName: "Kanan Jarrus",
    species: "Human",
    sector: "WILD SPACE",
    status: "ACTIVE",
    threat: "high",
    midiChlorians: 11200,
    inquisitorAssigned: "Fifth Brother",
    affiliations: [
      { name: "HCET Syndicate", role: "Field Operative" },
      { name: "Ghost Crew", role: "Leader" },
    ],
    lastSighting: { date: "19 BBY · CYCLE 22", sector: "Lothal Sector", description: "Confirmed sighting aboard Ghost-class freighter. Traveling with suspected Force-sensitive child. Mobile — no fixed base identified." },
    knownAbilities: ["Djem So (Form V)", "Force Push", "Blaster Deflection"],
    bounty: "12,000 IMPERIAL CREDITS",
    notes: "Survived Order 66 as a Padawan. Partially trained — gaps in technique may be exploitable. Primary concern is the Force-sensitive child accompanying him.",
  },
  {
    id: "AHK-004",
    codename: "FULCRUM-ALPHA",
    realName: "Ahsoka Tano",
    species: "Togruta",
    sector: "MID RIM",
    status: "ACTIVE",
    threat: "high",
    midiChlorians: 14200,
    inquisitorAssigned: "Seventh Sister",
    affiliations: [
      { name: "HCET Syndicate", role: "Intelligence Chief" },
      { name: "Rebel Network", role: "Handler" },
    ],
    lastSighting: { date: "19 BBY · CYCLE 19", sector: "Raada · Mid Rim", description: "Left Jedi Order prior to Order 66. Still maintains full Force capabilities. Uses alias FULCRUM for rebel communication network coordination." },
    knownAbilities: ["Djem So", "Jar'Kai (Dual Wield)", "Force Sight", "Precognition"],
    bounty: "15,000 IMPERIAL CREDITS",
    notes: "Dangerous intelligence asset for the HCET Syndicate. Responsible for recruiting multiple rebel cells. Dual white-bladed lightsabers noted. High-priority capture preferred over elimination for intelligence extraction.",
  },
  {
    id: "MKS-005",
    codename: "EXILE-EMBER",
    realName: "Quinlan Vos",
    species: "Kiffar",
    sector: "OUTER RIM",
    status: "UNKNOWN",
    threat: "moderate",
    midiChlorians: 12800,
    inquisitorAssigned: "Unassigned",
    affiliations: [
      { name: "Jedi Order", role: "Master — Espionage Division" },
    ],
    lastSighting: { date: "18 BBY · CYCLE 4", sector: "Unknown — last ping: Nar Shaddaa", description: "Signal lost after Nar Shaddaa underworld contact. Psychometric ability makes him exceptional at disappearing. May be operating undercover in criminal networks." },
    knownAbilities: ["Psychometry", "Niman (Form VI)", "Undercover Operations", "Force Camouflage"],
    bounty: "8,000 IMPERIAL CREDITS",
    notes: "Specialist in disappearing. Former undercover operative for the Jedi. His psychometric ability — reading Force impressions from objects — means secure facilities may be compromised if he enters them.",
  },
  {
    id: "CDR-006",
    codename: "GHOST-SIGNAL",
    realName: "Caleb Dume",
    species: "Human",
    sector: "LOTHAL · MID RIM",
    status: "ACTIVE",
    threat: "moderate",
    midiChlorians: 10600,
    inquisitorAssigned: "Ninth Sister",
    affiliations: [
      { name: "HCET Syndicate", role: "New Recruit Coordinator" },
    ],
    lastSighting: { date: "19 BBY · CYCLE 24", sector: "Lothal", description: "Young. Survived Order 66 by abandoning his identity. Now actively recruiting Force-sensitives for HCET Syndicate. Priority: disrupt recruitment pipeline." },
    knownAbilities: ["Shii-Cho (Form I)", "Force Jump", "Animal Bond"],
    bounty: "5,000 IMPERIAL CREDITS",
    notes: "Young target, relatively untrained. High value for disrupting HCET Syndicate recruitment operations. Consider alive capture for conversion program.",
  },
  {
    id: "SEN-007",
    codename: "CRIMSON-VEIL",
    realName: "Luminara Unduli",
    species: "Mirialan",
    sector: "STYGEON PRIME · INNER RIM",
    status: "ELIMINATED",
    threat: "low",
    midiChlorians: 10500,
    inquisitorAssigned: "Grand Inquisitor",
    affiliations: [
      { name: "Jedi High Council", role: "Master" },
    ],
    lastSighting: { date: "19 BBY · CYCLE 1", sector: "Stygeon Prime — Spire Prison", description: "Confirmed eliminated in Spire Prison. Inquisitor bait operation successful — multiple rebel contacts neutralized attempting rescue." },
    knownAbilities: ["Niman (Form VI)", "Force Healing", "Meditation Trance"],
    bounty: "CLOSED — ELIMINATED",
    notes: "Target eliminated. File maintained for rebel network mapping. Death used successfully as bait to identify rebel sympathizers. Operation: SUCCESS.",
  },
  {
    id: "ZEB-008",
    codename: "UNKNOWN-OMEGA",
    realName: "[REDACTED]",
    species: "Unknown — Force-sensitive",
    sector: "WILD SPACE",
    status: "UNKNOWN",
    threat: "low",
    midiChlorians: 9200,
    inquisitorAssigned: "Unassigned",
    affiliations: [],
    lastSighting: { date: "19 BBY · CYCLE 30", sector: "Wild Space — uncharted region", description: "Faint Force signature detected by long-range sensor array. No visual confirmation. Source may be untrained. Monitoring recommended." },
    knownAbilities: ["Unknown — untrained suspected"],
    bounty: "2,000 IMPERIAL CREDITS",
    notes: "Low priority. Likely untrained Force-sensitive. Risk: HCET Syndicate recruitment. Monitor and intercept if contact with known HCET operatives is detected.",
  },
];

const ALL_SECTORS  = ["ALL", "OUTER RIM", "MID RIM", "INNER RIM", "WILD SPACE", "TATOOINE", "DAGOBAH", "LOTHAL", "STYGEON PRIME"];
const ALL_STATUSES: Status[] = ["ACTIVE", "ELIMINATED", "IN EXILE", "UNKNOWN"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function ImperialCrest({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" stroke="#dc2626" strokeWidth="3" fill="none" opacity="0.9" />
      <circle cx="50" cy="50" r="34" stroke="#dc2626" strokeWidth="1.5" fill="none" opacity="0.5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return <line key={i}
          x1={Math.round((50 + 34 * Math.cos(a)) * 100) / 100}
          y1={Math.round((50 + 34 * Math.sin(a)) * 100) / 100}
          x2={Math.round((50 + 46 * Math.cos(a)) * 100) / 100}
          y2={Math.round((50 + 46 * Math.sin(a)) * 100) / 100}
          stroke="#dc2626" strokeWidth="2" opacity="0.6" />;
      })}
      <circle cx="50" cy="50" r="8" fill="#dc2626" opacity="0.9" />
      <circle cx="50" cy="50" r="4" fill="#000" />
    </svg>
  );
}

function Tag({ color, children, small }: { color: string; children: React.ReactNode; small?: boolean }) {
  return (
    <span style={{
      fontFamily: "var(--font-nav)", fontSize: small ? 7 : 8, letterSpacing: "0.12em",
      color, border: `1px solid ${color}`, borderRadius: 999, padding: small ? "1px 6px" : "2px 8px",
      background: `color-mix(in srgb, ${color} 10%, transparent)`, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
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
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 10, color: "#dc2626", letterSpacing: "0.12em", fontWeight: 600 }}>JEDI TARGET REGISTRY</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {[{ label: "CONSOLE", href: "/console" }, { label: "DOSSIERS", href: "/dossiers" }, { label: "MISSIONS", href: "/missions" }].map((n) => (
          <Link key={n.href} href={n.href} className="nav-link-d" style={{
            fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.14em",
            color: n.href === "/dossiers" ? "#f8fafc" : "#475569",
            textDecoration: "none", transition: "color 150ms",
          }}>{n.label}</Link>
        ))}
      </div>
      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#dc2626", letterSpacing: "0.1em" }}>{time} GST</div>
    </nav>
  );
}

// ── Dossier Card ──────────────────────────────────────────────────────────────
function DossierCard({ d, onClick, index }: { d: Dossier; onClick: () => void; index: number }) {
  const tColor = THREAT_COLOR[d.threat];
  const sColor = STATUS_COLOR[d.status];

  return (
    <button
      onClick={onClick}
      className="dossier-card"
      style={{
        display: "flex", flexDirection: "column", gap: 12, padding: "18px 20px 18px 22px",
        background: "rgba(255,255,255,0.015)",
        border: `1px solid rgba(255,255,255,0.04)`, borderLeft: `2px solid ${tColor}`,
        borderRadius: 2, cursor: "pointer", textAlign: "left", width: "100%",
        boxShadow: `0 0 20px -8px ${tColor}`,
        opacity: 0, animation: `fadeUp 400ms ease forwards`,
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.18em", marginBottom: 4 }}>
            {d.id}
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 15, color: "#f8fafc", fontWeight: 700, letterSpacing: "0.02em", marginBottom: 2 }}>
            {d.codename}
          </div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#64748b" }}>
            {d.realName === "[REDACTED]"
              ? <span style={{ color: "#dc2626", letterSpacing: "0.05em" }}>[REDACTED]</span>
              : d.realName}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
          <Tag color={sColor} small>{d.status}</Tag>
          <Tag color={tColor} small>{THREAT_LABEL[d.threat]}</Tag>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 3 }}>SECTOR</div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "#64748b" }}>{d.sector.split(" · ")[0]}</div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 3 }}>M-COUNT</div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: tColor }}>{d.midiChlorians.toLocaleString()}</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 3 }}>INQUISITOR</div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "#475569" }}>{d.inquisitorAssigned}</div>
        </div>
      </div>

      {/* Hover hint */}
      <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#1f2937", letterSpacing: "0.12em", marginTop: -4 }}>
        VIEW FULL DOSSIER &#8594;
      </div>
    </button>
  );
}

// ── Side Drawer ───────────────────────────────────────────────────────────────
function SideDrawer({ d, onClose }: { d: Dossier; onClose: () => void }) {
  const tColor = THREAT_COLOR[d.threat];
  const sColor = STATUS_COLOR[d.status];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const midiPct = Math.round((d.midiChlorians / 20000) * 100);

  return (
    <>
      {/* Backdrop */}
      <div
        className="drawer-overlay"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        }}
      />

      {/* Panel */}
      <aside
        className="drawer-panel"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 51,
          width: "min(480px, 92vw)",
          background: "#000", borderLeft: `1px solid rgba(255,255,255,0.07)`,
          display: "flex", flexDirection: "column", overflowY: "auto",
        }}
      >
        {/* Scanlines overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "repeating-linear-gradient(0deg,transparent 0px,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 4px)",
        }} />

        {/* Accent top bar */}
        <div style={{ height: 2, background: `linear-gradient(90deg, ${tColor}, transparent)`, flexShrink: 0, position: "relative", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{
            padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
          }}>
            <div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.2em", marginBottom: 6 }}>
                {d.id} · CLASSIFIED
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, color: "#f8fafc", fontWeight: 700, letterSpacing: "0.02em", marginBottom: 4 }}>
                {d.codename}
              </div>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: "#64748b" }}>
                {d.realName === "[REDACTED]"
                  ? <span style={{ color: "#dc2626" }}>[REDACTED]</span>
                  : d.realName}
                {" · "}{d.species}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <Tag color={sColor}>{d.status}</Tag>
                <Tag color={tColor}>{THREAT_LABEL[d.threat]} THREAT</Tag>
              </div>
            </div>
            <button
              onClick={onClose}
              className="close-btn"
              aria-label="Close dossier"
              style={{
                width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2, color: "#64748b", cursor: "pointer", flexShrink: 0, fontSize: 16,
                transition: "all 150ms",
              }}>&#10005;</button>
          </div>

          {/* Body */}
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 28, flex: 1 }}>

            {/* Midi-chlorian meter */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em" }}>MIDI-CHLORIAN COUNT</span>
                <span style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: tColor, fontWeight: 700 }}>
                  {d.midiChlorians.toLocaleString()}
                </span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  width: `${midiPct}%`, height: "100%",
                  background: `linear-gradient(90deg, ${tColor}, color-mix(in srgb, ${tColor} 60%, transparent))`,
                  boxShadow: `0 0 8px ${tColor}`,
                  transition: "width 800ms cubic-bezier(0.22,1,0.36,1)",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontFamily: "var(--font-terminal)", fontSize: 7, color: "#1f2937" }}>0</span>
                <span style={{ fontFamily: "var(--font-terminal)", fontSize: 7, color: "#1f2937" }}>EMPEROR LEVEL: 20,000</span>
              </div>
            </div>

            {/* Last sighting */}
            <div>
              <SectionHead>Last Known Sighting</SectionHead>
              <div style={{ padding: "14px 16px", borderLeft: `2px solid ${tColor}`, background: `color-mix(in srgb, ${tColor} 4%, transparent)` }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.12em" }}>{d.lastSighting.date}</span>
                  <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: tColor, letterSpacing: "0.1em" }}>{d.lastSighting.sector}</span>
                </div>
                <p style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#64748b", lineHeight: 1.7, margin: 0 }}>
                  {d.lastSighting.description}
                </p>
              </div>
            </div>

            {/* Known abilities */}
            <div>
              <SectionHead>Known Force Abilities</SectionHead>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {d.knownAbilities.map((a) => (
                  <span key={a} style={{
                    fontFamily: "var(--font-nav)", fontSize: 7, letterSpacing: "0.1em",
                    color: "#64748b", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2,
                    padding: "3px 8px", background: "rgba(255,255,255,0.02)",
                  }}>{a}</span>
                ))}
              </div>
            </div>

            {/* Affiliations */}
            {d.affiliations.length > 0 && (
              <div>
                <SectionHead>Known Affiliations</SectionHead>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {d.affiliations.map((af) => (
                    <div key={af.name} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      <span style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#94a3b8" }}>{af.name}</span>
                      <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.1em" }}>{af.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inquisitor assignment */}
            <div>
              <SectionHead>Inquisitor Assignment</SectionHead>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2 }}>
                <span style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: "#f8fafc" }}>{d.inquisitorAssigned}</span>
                <span style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: d.inquisitorAssigned === "Unassigned" ? "#374151" : "#22c55e", letterSpacing: "0.12em" }}>
                  {d.inquisitorAssigned === "Unassigned" ? "PENDING ASSIGNMENT" : "DEPLOYED"}
                </span>
              </div>
            </div>

            {/* Bounty */}
            <div>
              <SectionHead>Imperial Bounty</SectionHead>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 16, color: tColor, letterSpacing: "0.04em" }}>
                {d.bounty}
              </div>
            </div>

            {/* Intelligence notes */}
            <div>
              <SectionHead>Intelligence Notes</SectionHead>
              <p style={{
                fontFamily: "var(--font-terminal)", fontSize: 11, color: "#64748b", lineHeight: 1.8, margin: 0,
                borderLeft: "2px solid rgba(255,255,255,0.05)", paddingLeft: 14,
              }}>{d.notes}</p>
            </div>

          </div>

          {/* Footer */}
          <div style={{
            padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#1f2937", letterSpacing: "0.14em" }}>
              ISB CLASSIFICATION: IMPERIAL SECRET
            </span>
            <span style={{ fontFamily: "var(--font-terminal)", fontSize: 7, color: "#1f2937" }}>
              ESC TO CLOSE
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151",
      letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ width: 12, height: 1, background: "rgba(220,38,38,0.4)", display: "inline-block" }} />
      {children}
    </div>
  );
}

// ── Search + Filter bar ───────────────────────────────────────────────────────
function SearchBar({
  query, setQuery, statusFilter, setStatusFilter, sectorFilter, setSectorFilter,
}: {
  query: string; setQuery: (v: string) => void;
  statusFilter: Status | "ALL"; setStatusFilter: (v: Status | "ALL") => void;
  sectorFilter: string; setSectorFilter: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 32, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Search input */}
      <div style={{ position: "relative" }}>
        <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.3 }}
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className="search-input"
          type="text"
          placeholder="SEARCH CODENAME, REAL NAME, SECTOR..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%", padding: "11px 16px 11px 38px",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 2, color: "#f8fafc", fontFamily: "var(--font-terminal)", fontSize: 11,
            letterSpacing: "0.04em", transition: "border-color 150ms",
          }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 16, lineHeight: 1,
          }}>&#10005;</button>
        )}
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {/* Status */}
        <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.14em", alignSelf: "center", marginRight: 4 }}>STATUS:</span>
        {(["ALL", ...ALL_STATUSES] as const).map((s) => {
          const active = statusFilter === s;
          const col = s === "ALL" ? "#64748b" : STATUS_COLOR[s as Status];
          return (
            <button key={s} className="filter-chip" onClick={() => setStatusFilter(s as Status | "ALL")}
              style={{
                fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.12em",
                color: active ? col : "#374151", border: `1px solid ${active ? col : "rgba(255,255,255,0.07)"}`,
                background: active ? `color-mix(in srgb, ${col} 12%, transparent)` : "transparent",
                borderRadius: 999, padding: "3px 10px", cursor: "pointer", transition: "all 150ms",
              }}>{s}</button>
          );
        })}

        <span style={{ width: 1, background: "rgba(255,255,255,0.07)", alignSelf: "stretch", margin: "0 4px" }} />

        {/* Sector */}
        <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.14em", alignSelf: "center", marginRight: 4 }}>SECTOR:</span>
        {ALL_SECTORS.slice(0, 6).map((s) => {
          const active = sectorFilter === s;
          return (
            <button key={s} className="filter-chip" onClick={() => setSectorFilter(s)}
              style={{
                fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.12em",
                color: active ? "#f8fafc" : "#374151", border: `1px solid ${active ? "rgba(220,38,38,0.5)" : "rgba(255,255,255,0.07)"}`,
                background: active ? "rgba(220,38,38,0.1)" : "transparent",
                borderRadius: 999, padding: "3px 10px", cursor: "pointer", transition: "all 150ms",
              }}>{s}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Stats Row ─────────────────────────────────────────────────────────────────
function StatsRow({ dossiers }: { dossiers: Dossier[] }) {
  const counts = {
    ACTIVE:     dossiers.filter((d) => d.status === "ACTIVE").length,
    ELIMINATED: dossiers.filter((d) => d.status === "ELIMINATED").length,
    "IN EXILE": dossiers.filter((d) => d.status === "IN EXILE").length,
    UNKNOWN:    dossiers.filter((d) => d.status === "UNKNOWN").length,
  };
  return (
    <div style={{ display: "flex", gap: 1, marginBottom: 40, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 2 }}>
      {(Object.entries(counts) as [Status, number][]).map(([s, n]) => (
        <div key={s} style={{ flex: 1, padding: "14px 18px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 22, color: STATUS_COLOR[s], lineHeight: 1, marginBottom: 4 }}>{n}</div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.16em" }}>{s}</div>
        </div>
      ))}
      <div style={{ flex: 1, padding: "14px 18px" }}>
        <div style={{ fontFamily: "var(--font-terminal)", fontSize: 22, color: "#f8fafc", lineHeight: 1, marginBottom: 4 }}>{dossiers.length}</div>
        <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.16em" }}>TOTAL FILES</div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DossiersPage() {
  const [query,        setQuery]        = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [selected,     setSelected]     = useState<Dossier | null>(null);

  const filtered = DOSSIERS.filter((d) => {
    const q = query.toLowerCase();
    const matchQuery = !q
      || d.codename.toLowerCase().includes(q)
      || d.realName.toLowerCase().includes(q)
      || d.sector.toLowerCase().includes(q)
      || d.species.toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    const matchSector = sectorFilter === "ALL" || d.sector.toUpperCase().includes(sectorFilter);
    return matchQuery && matchStatus && matchSector;
  });

  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ minHeight: "100dvh", background: "#000", position: "relative" }}>
        <MinimalBwBackground />
        <NavBar />

        <main style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "80px 32px 80px" }}>

          {/* Page header */}
          <div style={{ padding: "48px 0 40px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 40 }}>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 9, color: "#374151", letterSpacing: "0.28em", marginBottom: 12 }}>
              IMPERIAL SECURITY BUREAU · CLASSIFIED
            </div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(28px,4vw,44px)", color: "#f8fafc", fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.01em" }}>
              Jedi Target <span style={{ color: "#dc2626" }}>Registry</span>
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>
              Active dossiers on known and suspected Jedi targets. All files classified under Imperial Secret protocol.
            </p>
          </div>

          {/* Stats */}
          <StatsRow dossiers={DOSSIERS} />

          {/* Search + filters */}
          <SearchBar
            query={query} setQuery={setQuery}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            sectorFilter={sectorFilter} setSectorFilter={setSectorFilter}
          />

          {/* Grid */}
          {filtered.length === 0 ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <ImperialCrest size={40} />
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 10, color: "#1f2937", letterSpacing: "0.24em", marginTop: 20 }}>
                NO TARGETS MATCH IMPERIAL CRITERIA
              </div>
              <button onClick={() => { setQuery(""); setStatusFilter("ALL"); setSectorFilter("ALL"); }}
                style={{
                  marginTop: 20, fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.14em",
                  color: "#374151", background: "none", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 2, padding: "8px 16px", cursor: "pointer", transition: "all 150ms",
                }}>CLEAR FILTERS</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {filtered.map((d, i) => (
                <DossierCard key={d.id} d={d} onClick={() => setSelected(d)} index={i} />
              ))}
            </div>
          )}
        </main>

        {/* Side drawer */}
        {selected && <SideDrawer d={selected} onClose={handleClose} />}
      </div>
    </>
  );
}
