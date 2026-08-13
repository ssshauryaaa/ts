"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";

/* ────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS
   Imperial data-slate, pass 3: darker void, richer glow language.
   Surfaces pulled down a notch so the red/amber/green accents read hotter
   against them; progress bars and active states now carry real bloom.
   ──────────────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700&family=Saira+Semi+Condensed:wght@600;700&family=Orbitron:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @font-face {
    font-family: 'StarJedi';
    src: url('/fonts/Starjedi.ttf') format('truetype');
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root{
    --void: #010102;
    --surface: #050506;
    --surface-2: #09090b;
    --surface-3: #0f0f12;
    --line: rgba(255,255,255,0.05);
    --line-strong: rgba(255,255,255,0.12);
    --ink: #f3f3f5;
    --ink-dim: #8a8a93;
    --ink-faint: #47474e;
    --red: #ff3b48;
    --red-dim: #7a1a1e;
    --red-soft: rgba(255,59,72,0.1);
    --red-glow: rgba(255,59,72,0.65);
    --amber: #e3ac57;
    --amber-glow: rgba(227,172,87,0.6);
    --slate: #7a7f8a;
    --green: #57b58c;
    --green-glow: rgba(87,181,140,0.6);
    --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 20px;
    --sp-6: 24px; --sp-7: 32px; --sp-8: 40px; --sp-9: 48px; --sp-10: 64px;

    --font-heading: 'Saira Semi Condensed', 'Saira Condensed', 'Oswald', sans-serif;
    --font-nav: 'Saira Condensed', 'Oswald', sans-serif;
    --font-terminal: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
    --font-code: 'Orbitron', 'Saira Semi Condensed', sans-serif;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,59,72,0.3); border-radius: 3px; }

  @keyframes fadeUp     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes rowIn      { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  @keyframes softPulse  { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes caretBlink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes backdropIn { from{opacity:0} to{opacity:1} }
  @keyframes drawerIn   { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:none} }
  @keyframes modalIn    { from{opacity:0;transform:translateY(10px) scale(0.98)} to{opacity:1;transform:none} }
  @keyframes popIn      { from{opacity:0;transform:translateY(-4px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes toastIn    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes toastOut   { from{opacity:1;transform:none} to{opacity:0;transform:translateY(6px)} }
  @keyframes glowPulse  { 0%,100%{ filter:brightness(1) } 50%{ filter:brightness(1.4) } }
  @keyframes scanSweep  { 0%{ transform:translateX(-120%) } 100%{ transform:translateX(320%) } }
  @keyframes dotPulse   { 0%{ box-shadow:0 0 0 0 var(--pulse-color,rgba(255,59,72,0.6)) } 100%{ box-shadow:0 0 0 10px rgba(255,59,72,0) } }
  @keyframes ringExpand { 0%{ transform:scale(0.6); opacity:0.9 } 100%{ transform:scale(2.4); opacity:0 } }

  .rail-btn{ transition: all 150ms ease; cursor:pointer; }
  .rail-btn:hover{ background: var(--surface-3) !important; border-color: var(--red) !important; box-shadow: 0 0 18px rgba(255,59,72,0.18); }
  .rail-btn:hover .rail-label{ opacity: 1 !important; transform: translateX(-4px) !important; }

  .row{ transition: background 150ms ease, border-color 150ms ease, box-shadow 150ms ease; cursor:pointer; }
  .row:hover{ background: var(--surface-2) !important; }
  .row.sel{ background: var(--red-soft) !important; box-shadow: inset 0 0 24px rgba(255,59,72,0.08); }
  .row:hover .threat-dot{ animation: dotPulse 1.1s ease-out infinite; }

  .lnk{ transition: color 150ms ease; position:relative; }
  .lnk:hover{ color: var(--ink) !important; }
  .lnk.on::after{ content:''; position:absolute; left:0; right:0; bottom:-21px; height:2px; background:var(--red); box-shadow: 0 0 8px var(--red-glow); }

  .btn{ transition: all 150ms ease; cursor:pointer; }
  .btn:hover{ filter: brightness(1.3); }
  .btn:active{ transform: scale(0.98); }
  .btn-icon{ transition: all 150ms ease; cursor:pointer; }
  .btn-icon:hover{ background: var(--surface-3) !important; border-color: var(--line-strong) !important; }

  .seg{
    transition: all 150ms ease; cursor:pointer; user-select:none;
    appearance:none; -webkit-appearance:none; outline:none; font-family:inherit;
    background: var(--surface-2); border: 1px solid var(--line-strong); color: var(--ink-faint);
  }
  .seg:hover{ color: var(--ink-dim); background: var(--surface-3); border-color: var(--line-strong); }
  .seg.on{
    color: var(--ink) !important; background: var(--surface-3) !important;
    border-color: var(--red) !important;
    box-shadow: 0 0 12px rgba(255,59,72,0.18), inset 0 0 0 1px rgba(255,59,72,0.25);
  }
  .seg:active{ transform: scale(0.97); }

  .pin{ cursor:pointer; }
  .pin:hover .pin-dot{ r: 4.5; filter: brightness(1.5); }
  .pin:hover .pin-label{ opacity: 1 !important; }

  .search:focus{ outline:none; border-color: var(--red) !important; box-shadow: 0 0 0 1px var(--red), 0 0 16px rgba(255,59,72,0.15) !important; }
  .search::placeholder{ color: var(--ink-faint); }

  .tile{ transition: all 200ms ease; cursor:default; }
  .tile:hover{ border-color: var(--line-strong) !important; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.5); }
  .caret::after{ content:'_'; animation: caretBlink 1.1s step-end infinite; color: var(--red); }

  .pname{ cursor:pointer; border-bottom: 1px dashed var(--line-strong); transition: color 150ms ease, border-color 150ms ease; }
  .pname:hover{ color: var(--ink) !important; border-color: var(--red) !important; }

  .kbd{ font-family: var(--font-terminal); font-size: 9.5px; color: var(--ink-faint); border: 1px solid var(--line-strong); border-bottom-width:2px; padding: 2px 6px; border-radius: 4px; background: var(--surface-2); }

  .palette-item:hover, .palette-item.active{ background: var(--surface-3) !important; }

  .cmd-item{ transition: background 120ms ease; }

  .bar-wrap{ position:relative; cursor: pointer; }
  .bar-tip{ position:absolute; bottom: calc(100% + 8px); left: var(--tip-left, 50%); transform: translateX(-50%); background: var(--surface-3); border: 1px solid var(--line-strong); padding: 4px 8px; font-family: var(--font-terminal); font-size: 10px; color: var(--ink); white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 150ms ease; box-shadow: 0 8px 20px rgba(0,0,0,0.5); z-index: 5; }
  .bar-wrap:hover .bar-tip{ opacity: 1; }
`;

/* ── Types ────────────────────────────────────────────────────────────── */
type OpStatus = "PLANNED" | "ACTIVE" | "CONCLUDED";
type ThreatLevel = "critical" | "high" | "moderate" | "low";
type SortKey = "recent" | "threat" | "progress";

interface Operation {
  id: string; codeName: string; targetCodename: string;
  sector: string; threat: ThreatLevel; status: OpStatus;
  assignedInquisitor: string; unitsDeployed: string;
  progressPct: number; objective: string; lastIntelUpdate: string;
  outcome?: string;
  mapX: number; mapY: number;
}

interface IntelEntry {
  id: number; opId: string; time: string;
  severity: "URGENT" | "ROUTINE" | "CLASSIFIED"; text: string;
}

interface Toast { id: number; text: string; tone: "default" | "success" | "warn" }

const THREAT_COLOR: Record<ThreatLevel, string> = { critical: "var(--red)", high: "var(--amber)", moderate: "var(--slate)", low: "#4a4a55" };
const THREAT_GLOW: Record<ThreatLevel, string> = { critical: "var(--red-glow)", high: "var(--amber-glow)", moderate: "rgba(122,127,138,0.45)", low: "rgba(74,74,85,0.4)" };
const THREAT_RANK: Record<ThreatLevel, number> = { critical: 3, high: 2, moderate: 1, low: 0 };
const STATUS_COLOR: Record<OpStatus, string> = { PLANNED: "var(--amber)", ACTIVE: "var(--red)", CONCLUDED: "var(--green)" };
const STATUS_GLOW: Record<OpStatus, string> = { PLANNED: "var(--amber-glow)", ACTIVE: "var(--red-glow)", CONCLUDED: "var(--green-glow)" };
const SEV_COLOR = { URGENT: "var(--red)", ROUTINE: "var(--ink-dim)", CLASSIFIED: "var(--amber)" };

const INQUISITOR_INFO: Record<string, { title: string; rank: string; blurb: string }> = {
  "Second Sister": { title: "Trilla Suduri", rank: "Inquisitorius · Rank II", blurb: "Former Jedi youngling. Aggressive field tactics, high capture rate on Force-sensitive targets." },
  "Fifth Brother": { title: "Unidentified", rank: "Inquisitorius · Rank IV", blurb: "Brute-force specialist. Prefers direct confrontation over surveillance." },
  "Seventh Sister": { title: "Shin Hati (cand.)", rank: "Inquisitorius · Rank IV", blurb: "Patient operator. Runs long infiltration plays before striking." },
  "Grand Inquisitor": { title: "Unidentified", rank: "Inquisitorius · Rank I", blurb: "Commands all Inquisitorius field assets. Reports directly to Lord Vader." },
  "Ninth Sister": { title: "Unidentified", rank: "Inquisitorius · Rank V", blurb: "Outer Rim specialist. Frequently liaises with bounty hunter guilds." },
};

/* ── Data (unchanged) ────────────────────────────────────────────────── */
const INIT_OPS: Operation[] = [
  { id: "OP-901", codeName: "NIGHTFALL ECHO", targetCodename: "KENOBI-ECHO", sector: "TATOOINE · OUTER RIM", threat: "critical", status: "ACTIVE", assignedInquisitor: "Second Sister", unitsDeployed: "501st Vanguard + Probe Droids", progressPct: 65, objective: "Establish orbital blockade around Tatooine. Intercept HoloNet transmissions and trace signal origin to moisture farm sectors. Neutralise on sight.", lastIntelUpdate: "14 mins ago · Probe droid 4-B destroyed near Dune Sea. High Force interference.", mapX: 18, mapY: 68 },
  { id: "OP-902", codeName: "SILENT VANGUARD", targetCodename: "SURVIVOR-7", sector: "LOTHAL · MID RIM", threat: "high", status: "ACTIVE", assignedInquisitor: "Fifth Brother", unitsDeployed: "ISD Relentless + Local Garrison", progressPct: 40, objective: "Track Ghost-class freighter across Lothal sector. Prevent merger with local HCET Syndicate cell. Intercept all crew members.", lastIntelUpdate: "1 hour ago · Skirmish at Sector 4 mining facility. Target escaped into hyperspace.", mapX: 49, mapY: 50 },
  { id: "OP-903", codeName: "SHADOW HARVEST", targetCodename: "FULCRUM-ALPHA", sector: "RAADA · MID RIM", threat: "high", status: "PLANNED", assignedInquisitor: "Seventh Sister", unitsDeployed: "ISB Unit 9 + Death Trooper Cadre", progressPct: 15, objective: "Infiltrate suspected rebel comm hub on Raada. Capture target alive for HCET leadership intelligence extraction.", lastIntelUpdate: "3 hours ago · Cipher logs decrypted. Rendezvous projected at 0400 GST.", mapX: 56, mapY: 37 },
  { id: "OP-904", codeName: "DARK BANYAN", targetCodename: "SHADOW-PRIME", sector: "DAGOBAH · OUTER RIM", threat: "critical", status: "PLANNED", assignedInquisitor: "Grand Inquisitor", unitsDeployed: "ISB Recon Fleet Alpha", progressPct: 10, objective: "Deploy heavy bio-scanners to Dagobah following deep-space Force wave anomaly. Search and destroy all life signatures.", lastIntelUpdate: "Yesterday · Sensor buoy array online. Atmospheric scanning in progress.", mapX: 28, mapY: 78 },
  { id: "OP-890", codeName: "STYGEON SNARE", targetCodename: "CRIMSON-VEIL", sector: "STYGEON PRIME · INNER RIM", threat: "low", status: "CONCLUDED", assignedInquisitor: "Grand Inquisitor", unitsDeployed: "Spire Citadel Garrison", progressPct: 100, objective: "Broadcast falsified life support telemetry for Master Luminara Unduli to bait rebel cells into rescue attempt.", lastIntelUpdate: "Concluded · Target confirmed eliminated. 3 rebel infiltrators neutralized.", outcome: "SUCCESSFUL PACIFICATION", mapX: 62, mapY: 43 },
  { id: "OP-888", codeName: "PHANTOM PURGE", targetCodename: "EXILE-EMBER", sector: "NAR SHADDAA · OUTER RIM", threat: "moderate", status: "CONCLUDED", assignedInquisitor: "Ninth Sister", unitsDeployed: "Bounty Hunter Guild Liaison", progressPct: 100, objective: "Purge Syndicate safehouse network in Nar Shaddaa lower levels. No survivors.", lastIntelUpdate: "Concluded · Safehouse destroyed. Target escaped before perimeter collapse.", outcome: "TARGET EVADED · CELL DESTROYED", mapX: 38, mapY: 62 },
];

const INIT_INTEL: IntelEntry[] = [
  { id: 1, opId: "OP-901", time: "14m", severity: "URGENT", text: "Probe droid 4-B signal lost in Jundland Wastes. High Force-field saturation. Recommend Inquisitor personal deployment." },
  { id: 2, opId: "OP-902", time: "1h", severity: "ROUTINE", text: "Ghost-class freighter last tracked at 14°N grid sector Lothal. Hyperspace vector computed — heading Outer Rim." },
  { id: 3, opId: "OP-903", time: "3h", severity: "CLASSIFIED", text: "FULCRUM-ALPHA cipher intercepted. Rendezvous with unknown contact at 0400 GST. Identity unconfirmed." },
  { id: 4, opId: "OP-904", time: "6h", severity: "URGENT", text: "Force anomaly spike detected Dagobah grid DG-7. Bio-scanner array activated. Awaiting atmospheric clearance." },
  { id: 5, opId: "OP-901", time: "8h", severity: "ROUTINE", text: "Orbital blockade at 87% saturation. All civilian transports held pending manifest review." },
  { id: 6, opId: "OP-902", time: "12h", severity: "CLASSIFIED", text: "Intelligence suggests SURVIVOR-7 is receiving Force coaching. Connection to Syndicate council suspected." },
  { id: 7, opId: "OP-890", time: "2d", severity: "ROUTINE", text: "OPERATION CONCLUDED. Luminara bait operation successful. 3 rebel agents neutralized at Stygeon Spire." },
  { id: 8, opId: "OP-903", time: "18h", severity: "URGENT", text: "ISB Unit 9 now in position. Death troopers briefed. Infiltration window: 0345–0415 GST confirmed." },
];

/* ── Glowing / interactive progress bar ───────────────────────────────
   Two glow layers (a wide soft bleed + a tight hot edge), a slow scanning
   highlight travelling across the fill, and a hover tooltip with the
   exact percentage. tipLeft lets the tooltip re-center on narrow fills.
   ──────────────────────────────────────────────────────────────────── */
function GlowBar({ pct, color, glow, height = 4, interactive = true }: { pct: number; color: string; glow: string; height?: number; interactive?: boolean }) {
  const tipLeft = pct < 12 ? "0%" : pct > 88 ? "100%" : "50%";
  const bar = (
    <div style={{ height, background: "var(--surface-3)", borderRadius: 2, overflow: "hidden", position: "relative", boxShadow: "inset 0 0 4px rgba(0,0,0,0.6)" }}>
      <div style={{
        width: `${pct}%`, height: "100%", borderRadius: 2, position: "relative", overflow: "hidden",
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        boxShadow: `0 0 14px ${glow}, 0 0 4px ${glow}, inset 0 0 6px rgba(255,255,255,0.15)`,
        animation: "glowPulse 2.6s ease-in-out infinite",
        transition: "width 500ms cubic-bezier(0.22,1,0.36,1)",
      }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, width: "40%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)", animation: "scanSweep 2.8s linear infinite" }} />
      </div>
    </div>
  );
  if (!interactive) return bar;
  return (
    <div className="bar-wrap" style={{ ["--tip-left" as any]: tipLeft }}>
      {bar}
      <span className="bar-tip">{pct}% COMPLETE</span>
    </div>
  );
}

/* ── Insignia mark ────────────────────────────────────────────────────── */
function Seal({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" stroke="var(--red)" strokeWidth="3" opacity="0.85" />
      <polygon points="50,22 78,37 78,63 50,78 22,63 22,37" stroke="var(--ink-dim)" strokeWidth="1" opacity="0.4" />
      <circle cx="50" cy="50" r="7" fill="var(--red)" />
    </svg>
  );
}

/* ── Generic overlay primitives ───────────────────────────────────────── */
function Backdrop({ onClick, z = 90 }: { onClick: () => void; z?: number }) {
  return <div onClick={onClick} style={{ position: "fixed", inset: 0, zIndex: z, background: "rgba(1,1,2,0.78)", backdropFilter: "blur(3px)", animation: "backdropIn 180ms ease both" }} />;
}

function Drawer({ open, onClose, width = 460, title, eyebrow, children }: { open: boolean; onClose: () => void; width?: number; title: string; eyebrow?: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <Backdrop onClick={onClose} z={90} />
      <div role="dialog" aria-modal="true" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: `min(${width}px, 100vw)`, background: "var(--surface)", borderLeft: "1px solid var(--line-strong)", zIndex: 91, display: "flex", flexDirection: "column", animation: "drawerIn 220ms cubic-bezier(0.22,1,0.36,1) both", boxShadow: "-24px 0 70px rgba(0,0,0,0.65)" }}>
        <div style={{ padding: "var(--sp-6) var(--sp-6) var(--sp-5)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            {eyebrow && <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "var(--ink-faint)", letterSpacing: "0.16em", marginBottom: 6 }}>{eyebrow}</div>}
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 19, color: "var(--ink)", fontWeight: 700 }}>{title}</div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close" style={{ width: 30, height: 30, flexShrink: 0, background: "none", border: "1px solid var(--line-strong)", color: "var(--ink-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      </div>
    </>
  );
}

function Modal({ open, onClose, children, width = 420 }: { open: boolean; onClose: () => void; children: React.ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <Backdrop onClick={onClose} z={120} />
      <div style={{ position: "fixed", inset: 0, zIndex: 121, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--sp-5)", pointerEvents: "none" }}>
        <div role="dialog" aria-modal="true" style={{ width: `min(${width}px, 100%)`, pointerEvents: "auto", background: "var(--surface-2)", border: "1px solid var(--line-strong)", animation: "modalIn 200ms cubic-bezier(0.22,1,0.36,1) both", boxShadow: "0 30px 90px rgba(0,0,0,0.7)" }}>
          {children}
        </div>
      </div>
    </>
  );
}

function Popover({ anchor, onClose, children }: { anchor: { x: number; y: number }; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); window.removeEventListener("keydown", onKey); };
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: "fixed", left: Math.min(anchor.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 300), top: anchor.y + 10, zIndex: 130, width: 280, background: "var(--surface-3)", border: "1px solid var(--line-strong)", padding: "var(--sp-4)", animation: "popIn 150ms ease both", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
      {children}
    </div>
  );
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  const toneColor = { default: "var(--ink-dim)", success: "var(--green)", warn: "var(--amber)" } as const;
  const toneGlow = { default: "rgba(138,138,147,0.25)", success: "var(--green-glow)", warn: "var(--amber-glow)" } as const;
  return (
    <div style={{ position: "fixed", bottom: "var(--sp-6)", right: "var(--sp-6)", zIndex: 150, display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
      {toasts.map(t => (
        <div key={t.id} style={{ animation: "toastIn 200ms ease both", background: "var(--surface-3)", border: `1px solid var(--line-strong)`, borderLeft: `3px solid ${toneColor[t.tone]}`, padding: "10px 16px", minWidth: 240, boxShadow: `0 12px 34px rgba(0,0,0,0.55), 0 0 20px ${toneGlow[t.tone]}` }}>
          <span style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "var(--ink)" }}>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Command Palette (⌘K) ────────────────────────────────────────────── */
function CommandPalette({ open, onClose, ops, onSelect }: { open: boolean; onClose: () => void; ops: Operation[]; onSelect: (op: Operation) => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const query = q.toLowerCase();
    if (!query) return ops;
    return ops.filter(o => [o.codeName, o.targetCodename, o.id, o.sector, o.assignedInquisitor].some(x => x.toLowerCase().includes(query)));
  }, [q, ops]);

  useEffect(() => { if (open) { setQ(""); setIdx(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && results[idx]) { onSelect(results[idx]); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, idx, onSelect, onClose]);

  if (!open) return null;
  return (
    <>
      <Backdrop onClick={onClose} z={140} />
      <div style={{ position: "fixed", top: "16vh", left: "50%", transform: "translateX(-50%)", zIndex: 141, width: "min(560px, 92vw)", background: "var(--surface-2)", border: "1px solid var(--line-strong)", boxShadow: "0 40px 110px rgba(0,0,0,0.75)", animation: "modalIn 180ms cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "var(--sp-4) var(--sp-5)", borderBottom: "1px solid var(--line)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setIdx(0); }} placeholder="Jump to an operation, target or sector…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: "var(--font-terminal)", fontSize: 13, color: "var(--ink)" }} />
          <span className="kbd">ESC</span>
        </div>
        <div style={{ maxHeight: "50vh", overflowY: "auto", padding: "var(--sp-2)" }}>
          {results.length === 0 && <div style={{ padding: "var(--sp-5)", textAlign: "center", fontFamily: "var(--font-nav)", fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.1em" }}>NO MATCHES</div>}
          {results.map((op, i) => (
            <div key={op.id} className={`cmd-item palette-item${i === idx ? " active" : ""}`} onClick={() => { onSelect(op); onClose(); }} onMouseEnter={() => setIdx(i)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", cursor: "pointer" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: THREAT_COLOR[op.threat], flexShrink: 0, boxShadow: `0 0 6px ${THREAT_GLOW[op.threat]}` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 12.5, color: "var(--ink)", fontWeight: 600 }}>{op.codeName}</div>
                <div style={{ fontFamily: "var(--font-terminal)", fontSize: 9.5, color: "var(--ink-faint)" }}>{op.id} · {op.targetCodename}</div>
              </div>
              <span style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: STATUS_COLOR[op.status], border: `1px solid ${STATUS_COLOR[op.status]}`, padding: "2px 6px", letterSpacing: "0.06em" }}>{op.status}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "var(--sp-3) var(--sp-5)", borderTop: "1px solid var(--line)", display: "flex", gap: 16 }}>
          <span style={{ fontFamily: "var(--font-nav)", fontSize: 7.5, color: "var(--ink-faint)", display: "flex", gap: 6, alignItems: "center" }}><span className="kbd">↑↓</span> NAVIGATE</span>
          <span style={{ fontFamily: "var(--font-nav)", fontSize: 7.5, color: "var(--ink-faint)", display: "flex", gap: 6, alignItems: "center" }}><span className="kbd">↵</span> OPEN</span>
        </div>
      </div>
    </>
  );
}

/* ── Edge Rail ────────────────────────────────────────────────────────── */
function EdgeRail({ onSearch, onIntel, intelCount }: { onSearch: () => void; onIntel: () => void; intelCount: number }) {
  const items = [
    { key: "search", label: "SEARCH", hint: "⌘K", onClick: onSearch, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg> },
    { key: "intel", label: "INTEL FEED", hint: intelCount ? String(intelCount) : undefined, onClick: onIntel, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg> },
  ];
  return (
    <div style={{ position: "fixed", top: "50%", right: 0, transform: "translateY(-50%)", zIndex: 40, display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map(it => (
        <button key={it.key} className="rail-btn" onClick={it.onClick} aria-label={it.label}
          style={{ position: "relative", width: 46, height: 58, background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRight: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--ink-dim)", cursor: "pointer" }}>
          {it.icon}
          {it.hint && (
            <span style={{ fontFamily: "var(--font-terminal)", fontSize: 8, color: "var(--ink-faint)" }}>{it.hint}</span>
          )}
          <span className="rail-label" style={{ position: "absolute", right: "100%", top: "50%", transform: "translate(0,-50%)", marginRight: 8, opacity: 0, transition: "all 150ms ease", background: "var(--surface-3)", border: "1px solid var(--line-strong)", padding: "6px 10px", whiteSpace: "nowrap", fontFamily: "var(--font-nav)", fontSize: 8.5, letterSpacing: "0.1em", color: "var(--ink)", pointerEvents: "none" }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Dotted World Map (Imperial cartography) ─────────────────────────────
   Stylised dotted-earth silhouette (continents as dot fields) with a
   handful of random glowing supply-route arcs drawn across it. Same
   prop interface as the previous GalaxyMap, so operation pins, threat
   rings and status colors all keep working unchanged.
   ──────────────────────────────────────────────────────────────────── */
const CONTINENT_PATHS = [
  "M60,50 C40,60 30,90 45,120 C55,140 90,150 120,160 C160,168 200,150 220,120 C235,95 225,65 195,48 C160,30 100,32 60,50 Z", // N. America
  "M225,180 C215,200 210,230 220,265 C228,290 245,310 260,300 C275,290 280,250 275,215 C270,190 245,170 225,180 Z", // S. America
  "M385,55 C375,70 378,90 395,100 C415,112 445,108 460,90 C470,75 460,55 440,48 C420,42 395,44 385,55 Z", // Europe
  "M370,125 C358,150 355,190 365,225 C375,255 400,280 425,270 C445,262 455,225 450,190 C445,155 425,120 400,115 C388,113 376,116 370,125 Z", // Africa
  "M470,45 C450,60 445,90 460,115 C480,145 530,150 580,140 C630,130 660,100 645,70 C630,42 560,25 500,32 C488,34 480,38 470,45 Z", // Asia
  "M665,235 C655,250 658,270 675,280 C695,290 725,285 735,268 C742,252 728,238 705,232 C690,228 673,228 665,235 Z", // Australia
];

function WorldDotMap({ ops, sel, onPin }: { ops: Operation[]; sel: Operation | null; onPin: (op: Operation) => void }) {
  const arcs = useMemo(() => {
    const pts = [{ x: 90, y: 90 }, { x: 250, y: 240 }, { x: 420, y: 70 }, { x: 400, y: 190 }, { x: 560, y: 90 }, { x: 700, y: 255 }, { x: 130, y: 130 }];
    return Array.from({ length: 5 }, (_, i) => {
      const a = pts[i % pts.length], b = pts[(i + 3) % pts.length];
      const midX = (a.x + b.x) / 2, midY = Math.min(a.y, b.y) - 40;
      return { d: `M${a.x},${a.y} Q${midX},${midY} ${b.x},${b.y}`, delay: i * 0.9, dur: 3.4 + (i % 3) * 0.6 };
    });
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "var(--surface)" }}>
      <svg viewBox="0 0 800 400" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="landDots" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.1" cy="1.1" r="1.1" fill="var(--ink-faint)" />
          </pattern>
          <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
          </pattern>
          <filter id="pinGlow2" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="800" height="400" fill="url(#grid2)" />
        {CONTINENT_PATHS.map((d, i) => <path key={i} d={d} fill="url(#landDots)" opacity="0.9" />)}

        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill="none" stroke="var(--red)" strokeWidth="0.6" opacity="0.35" strokeDasharray="4 3">
            <animate attributeName="stroke-dashoffset" from="0" to="-140" dur={`${arc.dur}s`} begin={`${arc.delay}s`} repeatCount="indefinite" />
          </path>
        ))}

        <text x="400" y="20" fill="rgba(255,255,255,0.08)" fontSize="5" fontFamily="monospace" textAnchor="middle" letterSpacing="4">GALACTIC CARTOGRAPHY · IMPERIAL SURVEY</text>

        {ops.map(op => {
          const px = (op.mapX / 100) * 800, py = (op.mapY / 100) * 400;
          const sc = STATUS_COLOR[op.status];
          const isSel = sel?.id === op.id;
          const isActive = op.status === "ACTIVE";
          return (
            <g key={op.id} className="pin" onClick={() => onPin(op)}>
              {isActive && (
                <>
                  <circle cx={px} cy={py} r="7" fill="none" stroke={sc} strokeWidth="0.7">
                    <animate attributeName="r" values="5;16" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={px} cy={py} r="7" fill="none" stroke={sc} strokeWidth="0.5">
                    <animate attributeName="r" values="5;16" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.45;0" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
              {isSel && <circle cx={px} cy={py} r="9" fill="none" stroke="var(--ink)" strokeWidth="0.8" opacity="0.7" />}
              <circle className="pin-dot" cx={px} cy={py} r="3" fill={sc} filter="url(#pinGlow2)" />
              <circle cx={px} cy={py} r="1.2" fill="var(--void)" />
              <text className="pin-label" x={px + 7} y={py - 5} fill="var(--ink-dim)" fontSize="4.2" fontFamily="monospace" opacity={isSel ? 1 : 0.55}>{op.id}</text>
              <text x={px + 7} y={py + 1} fill="var(--ink-faint)" fontSize="3.8" fontFamily="monospace">{op.codeName}</text>
            </g>
          );
        })}

        <path d="M0,14 L0,0 L14,0" stroke="var(--red)" strokeWidth="1.4" fill="none" opacity="0.7" />
        <path d="M786,0 L800,0 L800,14" stroke="var(--red)" strokeWidth="1.4" fill="none" opacity="0.7" />
        <path d="M0,386 L0,400 L14,400" stroke="var(--red)" strokeWidth="1.4" fill="none" opacity="0.7" />
        <path d="M786,400 L800,400 L800,386" stroke="var(--red)" strokeWidth="1.4" fill="none" opacity="0.7" />
      </svg>
    </div>
  );
}

/* ── Intel Feed (drawer content) ─────────────────────────────────────── */
function IntelFeed({ entries }: { entries: IntelEntry[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {entries.map((e, i) => (
        <div key={e.id} style={{ padding: "var(--sp-5) var(--sp-6)", borderBottom: "1px solid var(--line)", animation: `rowIn 300ms ${i * 35}ms ease both` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: SEV_COLOR[e.severity], flexShrink: 0, boxShadow: `0 0 6px ${SEV_COLOR[e.severity]}` }} />
            <span style={{ fontFamily: "var(--font-nav)", fontSize: 7.5, color: SEV_COLOR[e.severity], letterSpacing: "0.1em" }}>{e.severity}</span>
            <span style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "var(--ink-faint)" }}>{e.opId}</span>
            <span style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "var(--ink-faint)", marginLeft: "auto" }}>{e.time} ago</span>
          </div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "var(--ink-dim)", lineHeight: 1.7 }}>{e.text}</div>
        </div>
      ))}
      <div style={{ padding: "var(--sp-5) var(--sp-6)", fontFamily: "var(--font-terminal)", fontSize: 10, color: "var(--ink-faint)" }}>
        <span className="caret">AWAITING NEXT DISPATCH</span>
      </div>
    </div>
  );
}

/* ── Op Row ───────────────────────────────────────────────────────────── */
function OpRow({ op, sel, onClick, onCommander }: { op: Operation; sel: boolean; onClick: () => void; onCommander: (e: React.MouseEvent, name: string) => void }) {
  const tc = THREAT_COLOR[op.threat], sc = STATUS_COLOR[op.status];
  return (
    <div className={`row${sel ? " sel" : ""}`} onClick={onClick} style={{ padding: "var(--sp-5) var(--sp-6)", borderLeft: `3px solid ${sel ? "var(--red)" : "transparent"}`, borderBottom: "1px solid var(--line)", display: "grid", gridTemplateColumns: "auto 1.6fr 1fr 120px 100px", alignItems: "center", gap: 20 }}>
      <div className="threat-dot" style={{ ["--pulse-color" as any]: THREAT_GLOW[op.threat], width: 7, height: 7, borderRadius: "50%", background: tc, boxShadow: `0 0 6px ${THREAT_GLOW[op.threat]}` }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 5 }}>
          <span style={{ fontFamily: "var(--font-code)", fontSize: 13.5, color: "var(--ink)", fontWeight: 700, letterSpacing: "0.03em" }}>{op.codeName}</span>
          <span style={{ fontFamily: "var(--font-nav)", fontSize: 7.5, color: "var(--ink-faint)", letterSpacing: "0.1em" }}>{op.id}</span>
        </div>
        <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.02em" }}>TARGET <span style={{ color: "var(--ink-dim)", fontWeight: 500 }}>{op.targetCodename}</span></div>
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-nav)", fontSize: 11, color: "var(--ink-dim)", letterSpacing: "0.05em", fontWeight: 600 }}>{op.sector.split(" · ")[0]}</div>
        <div className="pname" onClick={(e) => { e.stopPropagation(); onCommander(e, op.assignedInquisitor); }} style={{ display: "inline-block", marginTop: 4, fontFamily: "var(--font-heading)", color: "var(--ink-faint)", fontSize: 10.5, fontWeight: 600 }}>{op.assignedInquisitor}</div>
      </div>
      <div>
        <GlowBar pct={op.progressPct} color={sc} glow={STATUS_GLOW[op.status]} height={4} />
      </div>
      <span style={{ fontFamily: "var(--font-nav)", fontSize: 7.5, color: sc, border: `1px solid ${sc}`, padding: "4px 8px", letterSpacing: "0.06em", textAlign: "center", justifySelf: "start" }}>{op.status}</span>
    </div>
  );
}

/* ── Detail Drawer content ────────────────────────────────────────────── */
function DetailContent({ op, onMove, onCommander }: { op: Operation; onMove: (id: string, s: OpStatus) => void; onCommander: (e: React.MouseEvent, name: string) => void }) {
  const tc = THREAT_COLOR[op.threat];
  const steps = ["AUTHORIZED", "STAGED", "ACTIVE", "CONCLUDED"];
  const curIdx = op.status === "PLANNED" ? 1 : op.status === "ACTIVE" ? 2 : 3;

  return (
    <div style={{ padding: "var(--sp-6)", display: "flex", flexDirection: "column", gap: "var(--sp-7)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "var(--ink-dim)" }}>TARGET: <span style={{ color: "var(--ink)" }}>{op.targetCodename}</span></div>
        <span style={{ fontFamily: "var(--font-nav)", fontSize: 7.5, color: tc, border: `1px solid ${tc}`, padding: "4px 8px", letterSpacing: "0.06em", flexShrink: 0, boxShadow: `0 0 10px ${THREAT_GLOW[op.threat]}` }}>{op.threat.toUpperCase()}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
        {[{ l: "STATUS", v: op.status, c: STATUS_COLOR[op.status] }, { l: "SECTOR", v: op.sector.split(" · ")[0], c: "var(--ink)" }, { l: "COMMANDER", v: op.assignedInquisitor, c: "var(--ink)", click: true }, { l: "PROGRESS", v: `${op.progressPct}%`, c: "var(--ink)", bar: true }].map(s => (
          <div key={s.l} style={{ padding: "var(--sp-4)", background: "var(--surface)" }}>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 6.5, color: "var(--ink-faint)", letterSpacing: "0.12em", marginBottom: 6 }}>{s.l}</div>
            {s.click ? (
              <div className="pname" onClick={(e) => onCommander(e, s.v)} style={{ display: "inline-block", fontFamily: "var(--font-terminal)", fontSize: 11, color: s.c, fontWeight: 600 }}>{s.v}</div>
            ) : (
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: s.c, fontWeight: 600, marginBottom: s.bar ? 7 : 0 }}>{s.v}</div>
            )}
            {s.bar && <GlowBar pct={op.progressPct} color={STATUS_COLOR[op.status]} glow={STATUS_GLOW[op.status]} height={4} interactive={false} />}
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontFamily: "var(--font-nav)", fontSize: 7.5, color: "var(--ink-faint)", letterSpacing: "0.16em", marginBottom: "var(--sp-4)" }}>MISSION TIMELINE</div>
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{ width: i === curIdx ? 9 : 7, height: i === curIdx ? 9 : 7, borderRadius: "50%", background: i <= curIdx ? "var(--red)" : "var(--surface-3)", border: `1px solid ${i <= curIdx ? "var(--red)" : "var(--line-strong)"}`, boxShadow: i === curIdx ? "0 0 10px var(--red-glow)" : "none" }} />
                <span style={{ fontFamily: "var(--font-nav)", fontSize: 6, color: i <= curIdx ? "var(--ink-dim)" : "var(--ink-faint)", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: i < curIdx ? "var(--red-dim)" : "var(--line)", margin: "0 6px", marginBottom: 17 }} />}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: "var(--font-nav)", fontSize: 7.5, color: "var(--ink-faint)", letterSpacing: "0.16em", marginBottom: "var(--sp-3)" }}>PRIMARY OBJECTIVE</div>
        <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11.5, color: "var(--ink-dim)", lineHeight: 1.8, paddingLeft: 14, borderLeft: "2px solid var(--line-strong)" }}>{op.objective}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 7.5, color: "var(--ink-faint)", letterSpacing: "0.16em", marginBottom: "var(--sp-2)" }}>UNITS DEPLOYED</div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "var(--ink-dim)" }}>{op.unitsDeployed}</div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 7.5, color: "var(--ink-faint)", letterSpacing: "0.16em", marginBottom: "var(--sp-2)" }}>LATEST FIELD INTEL</div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.6 }}>{op.lastIntelUpdate}</div>
        </div>
      </div>

      {op.outcome && (
        <div style={{ padding: "var(--sp-4)", border: "1px solid var(--line-strong)", background: "var(--surface-2)" }}>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "var(--ink-faint)", letterSpacing: "0.12em", marginBottom: 5 }}>OPERATION OUTCOME</div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: "var(--green)", fontWeight: 700, textShadow: "0 0 12px var(--green-glow)" }}>{op.outcome}</div>
        </div>
      )}

      {op.status !== "CONCLUDED" && (
        <div style={{ display: "flex", gap: "var(--sp-3)" }}>
          {op.status === "ACTIVE" && (
            <button className="btn" onClick={() => onMove(op.id, "PLANNED")} style={{ flex: 1, fontFamily: "var(--font-nav)", fontSize: 8.5, letterSpacing: "0.1em", color: "var(--ink-dim)", background: "none", border: "1px solid var(--line-strong)", padding: "11px 0", cursor: "pointer" }}>← REVERT TO STAGED</button>
          )}
          {op.status === "PLANNED" && (
            <button className="btn" onClick={() => onMove(op.id, "ACTIVE")} style={{ flex: 1, fontFamily: "var(--font-nav)", fontSize: 8.5, letterSpacing: "0.1em", color: "var(--amber)", background: "rgba(227,172,87,0.08)", border: "1px solid rgba(227,172,87,0.32)", padding: "11px 0", cursor: "pointer", boxShadow: "0 0 0 rgba(0,0,0,0)" }}>ACTIVATE OPERATION →</button>
          )}
          {op.status === "ACTIVE" && (
            <button className="btn" onClick={() => onMove(op.id, "CONCLUDED")} style={{ flex: 1, fontFamily: "var(--font-nav)", fontSize: 8.5, letterSpacing: "0.1em", color: "var(--green)", background: "rgba(87,181,140,0.08)", border: "1px solid rgba(87,181,140,0.32)", padding: "11px 0", cursor: "pointer" }}>MARK CONCLUDED ✓</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Stats Bar — numbers count up on mount, tiles lift + glow on hover ─── */
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function StatTile({ label, value, suffix, color }: { label: string; value: number; suffix?: string; color: string }) {
  const n = useCountUp(value);
  return (
    <div className="tile" style={{ padding: "var(--sp-6)", background: "var(--surface)", border: "1px solid var(--line)", borderTop: `2px solid ${color}` }}>
      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 28, color, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums", textShadow: `0 0 16px ${color}55` }}>{n}{suffix}</div>
      <div style={{ fontFamily: "var(--font-nav)", fontSize: 7.5, color: "var(--ink-faint)", letterSpacing: "0.12em", marginTop: 10 }}>{label}</div>
    </div>
  );
}

function StatsBar({ ops }: { ops: Operation[] }) {
  const active = ops.filter(o => o.status === "ACTIVE").length;
  const concluded = ops.filter(o => o.status === "CONCLUDED").length;
  const successful = ops.filter(o => o.outcome?.includes("SUCCESSFUL")).length;
  const rate = concluded > 0 ? Math.round((successful / concluded) * 100) : 0;
  const sectors = new Set(ops.map(o => o.sector.split(" · ")[0])).size;
  const inqs = new Set(ops.map(o => o.assignedInquisitor)).size;
  const tiles = [
    { l: "ACTIVE OPERATIONS", v: active, s: "", c: "var(--red)" },
    { l: "TACTICAL SUCCESS", v: rate, s: "%", c: "var(--green)" },
    { l: "SECTORS MONITORED", v: sectors, s: "", c: "var(--ink)" },
    { l: "INQUISITORS ACTIVE", v: inqs, s: "", c: "var(--amber)" },
    { l: "TOTAL OPERATIONS", v: ops.length, s: "", c: "var(--ink-dim)" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "var(--sp-4)" }}>
      {tiles.map(t => <StatTile key={t.l} label={t.l} value={t.v} suffix={t.s} color={t.c} />)}
    </div>
  );
}

/* ── Filter / Sort Bar ────────────────────────────────────────────────── */
function FilterBar({ filter, setFilter, search, setSearch, sort, setSort }: { filter: OpStatus | "ALL"; setFilter: (f: OpStatus | "ALL") => void; search: string; setSearch: (s: string) => void; sort: SortKey; setSort: (s: SortKey) => void }) {
  const chips: (OpStatus | "ALL")[] = ["ALL", "PLANNED", "ACTIVE", "CONCLUDED"];
  const sorts: { k: SortKey; l: string }[] = [{ k: "recent", l: "RECENT" }, { k: "threat", l: "THREAT" }, { k: "progress", l: "PROGRESS" }];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-6)", flexWrap: "wrap" }}>
      <div style={{ position: "relative" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH OPERATIONS" className="search"
          style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "var(--ink)", background: "var(--surface-2)", border: "1px solid var(--line-strong)", padding: "10px 14px 10px 32px", outline: "none", minWidth: 230, letterSpacing: "0.03em" }} />
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {chips.map(c => (
          <button key={c} className={`seg${filter === c ? " on" : ""}`} onClick={() => setFilter(c)}
            style={{ fontFamily: "var(--font-nav)", fontSize: 8.5, letterSpacing: "0.1em", padding: "10px 16px", minWidth: 74, textAlign: "center" }}>{c}</button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
        <span style={{ fontFamily: "var(--font-nav)", fontSize: 7.5, color: "var(--ink-faint)", letterSpacing: "0.1em" }}>SORT</span>
        <div style={{ display: "flex", gap: 6 }}>
          {sorts.map(s => (
            <button key={s.k} className={`seg${sort === s.k ? " on" : ""}`} onClick={() => setSort(s.k)}
              style={{ fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.08em", padding: "8px 13px" }}>{s.l}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────── */
export default function MissionsPage() {
  const [ops, setOps] = useState<Operation[]>(INIT_OPS);
  const [sel, setSel] = useState<Operation | null>(null);
  const [filter, setFilter] = useState<OpStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [mapView, setMapView] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const [commander, setCommander] = useState<{ name: string; x: number; y: number } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Operation | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((text: string, tone: Toast["tone"] = "default") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, text, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const applyMove = useCallback((id: string, ns: OpStatus) => {
    setOps(prev => prev.map(o => o.id === id ? { ...o, status: ns, progressPct: ns === "CONCLUDED" ? 100 : o.progressPct } : o));
    setSel(prev => prev && prev.id === id ? { ...prev, status: ns, progressPct: ns === "CONCLUDED" ? 100 : prev.progressPct } : prev);
  }, []);

  const onMove = useCallback((id: string, ns: OpStatus) => {
    if (ns === "CONCLUDED") {
      const target = ops.find(o => o.id === id) || null;
      setConfirmTarget(target);
      return;
    }
    applyMove(id, ns);
    pushToast(ns === "ACTIVE" ? `${id} activated — units moving to sector` : `${id} reverted to staged`, ns === "ACTIVE" ? "warn" : "default");
  }, [ops, applyMove, pushToast]);

  const confirmConclude = useCallback(() => {
    if (!confirmTarget) return;
    applyMove(confirmTarget.id, "CONCLUDED");
    pushToast(`${confirmTarget.id} marked concluded`, "success");
    setConfirmTarget(null);
  }, [confirmTarget, applyMove, pushToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(true); }
      if (e.key === "Escape" && !paletteOpen && !confirmTarget && !intelOpen) setSel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, confirmTarget, intelOpen]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = ops.filter(o => {
      const mf = filter === "ALL" || o.status === filter;
      const ms = !q || [o.codeName, o.targetCodename, o.sector, o.id].some(x => x.toLowerCase().includes(q));
      return mf && ms;
    });
    if (sort === "threat") list = [...list].sort((a, b) => THREAT_RANK[b.threat] - THREAT_RANK[a.threat]);
    if (sort === "progress") list = [...list].sort((a, b) => b.progressPct - a.progressPct);
    return list;
  }, [ops, filter, search, sort]);

  const openCommander = (e: React.MouseEvent, name: string) => setCommander({ name, x: e.clientX, y: e.clientY });

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ position: "fixed", inset: 0, background: "var(--void)", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 900px 500px at 20% 0%, rgba(255,59,72,0.06), transparent 60%)" }} />

      <EdgeRail onSearch={() => setPaletteOpen(true)} onIntel={() => setIntelOpen(true)} intelCount={INIT_INTEL.length} />

      <main style={{ position: "relative", zIndex: 1, minHeight: "100dvh", padding: "var(--sp-9) calc(var(--sp-9) + 46px) var(--sp-9) var(--sp-9)", display: "flex", flexDirection: "column", gap: "var(--sp-8)", maxWidth: 1520, margin: "0 auto" }}>

        <div style={{ paddingBottom: "var(--sp-6)", borderBottom: "1px solid var(--line)", animation: "fadeUp 400ms ease both" }}>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 8.5, color: "var(--ink-faint)", letterSpacing: "0.24em", marginBottom: 10 }}>IMPERIAL SECURITY BUREAU · CLASSIFIED LEVEL 5 ACCESS</div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "'StarJedi', var(--font-heading)", fontSize: "clamp(32px,4vw,48px)", color: "var(--ink)", fontWeight: "normal", margin: 0, letterSpacing: "0.05em" }}>
              missions
            </h1>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.06em", paddingBottom: 4 }}>GALACTIC RIM THEATER · JEDI PURGE OPS</div>
          </div>
        </div>

        <div style={{ animation: "fadeUp 400ms 60ms ease both" }}><StatsBar ops={ops} /></div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)", animation: "fadeUp 400ms 100ms ease both" }}>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)", justifyContent: "space-between", flexWrap: "wrap" }}>
            <FilterBar filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} sort={sort} setSort={setSort} />
            <div style={{ display: "flex", gap: 6 }}>
              {([
                { l: "MAP", v: true, icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg> },
                { l: "LIST", v: false, icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg> },
              ]).map(b => (
                <button key={String(b.v)} className={`seg${mapView === b.v ? " on" : ""}`} onClick={() => setMapView(b.v)}
                  style={{ fontFamily: "var(--font-nav)", fontSize: 8.5, letterSpacing: "0.1em", padding: "9px 16px", display: "flex", alignItems: "center", gap: 7, minWidth: 74, justifyContent: "center" }}>
                  {b.icon}{b.l}
                </button>
              ))}
            </div>
          </div>

          {mapView && (
            <div style={{ border: "1px solid var(--line)", position: "relative", height: "clamp(240px,26vw,340px)" }}>
              <WorldDotMap ops={filtered} sel={sel} onPin={op => setSel(sel?.id === op.id ? null : op)} />
              <div style={{ position: "absolute", bottom: "var(--sp-4)", left: "var(--sp-4)", display: "flex", gap: 16, padding: "8px 14px", background: "rgba(5,5,6,0.88)", border: "1px solid var(--line)" }}>
                {(["PLANNED", "ACTIVE", "CONCLUDED"] as OpStatus[]).map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLOR[s], boxShadow: `0 0 5px ${STATUS_COLOR[s]}` }} />
                    <span style={{ fontFamily: "var(--font-nav)", fontSize: 6.5, color: "var(--ink-faint)", letterSpacing: "0.08em" }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ border: "1px solid var(--line)", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
            <div style={{ padding: "var(--sp-4) var(--sp-6)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-code)", fontSize: 11, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.14em" }}>TRACKED OPERATIONS</span>
              <span style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "var(--ink-faint)" }}>{filtered.length} / {ops.length}</span>
            </div>
            {filtered.length === 0
              ? <div style={{ textAlign: "center", padding: "var(--sp-9) 0", fontFamily: "var(--font-nav)", fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.14em" }}>NO OPERATIONS MATCH CURRENT FILTER</div>
              : filtered.map(op => <OpRow key={op.id} op={op} sel={sel?.id === op.id} onClick={() => setSel(sel?.id === op.id ? null : op)} onCommander={openCommander} />)
            }
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "var(--sp-5)", display: "flex", justifyContent: "space-between", fontFamily: "var(--font-nav)", fontSize: 7.5, color: "var(--ink-faint)", letterSpacing: "0.14em" }}>
          <span>IMPERIAL SECURITY BUREAU · OPERATIONS COMMAND · CLASSIFIED LEVEL 5</span>
          <span>ALL DATA ENCRYPTED · SECURE ISB CHANNEL</span>
        </div>
      </main>

      {/* Operation detail — drawer */}
      <Drawer open={!!sel} onClose={() => setSel(null)} width={500} eyebrow={sel ? `${sel.id} · CLASSIFIED BRIEF` : ""} title={sel ? sel.codeName : ""}>
        {sel && <DetailContent op={sel} onMove={onMove} onCommander={openCommander} />}
      </Drawer>

      {/* Intel feed — drawer */}
      <Drawer open={intelOpen} onClose={() => setIntelOpen(false)} width={440} eyebrow="ISB SECURE CHANNEL" title="Live Intel Dispatch">
        <IntelFeed entries={INIT_INTEL} />
      </Drawer>

      {/* Command palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} ops={ops} onSelect={(op) => setSel(op)} />

      {/* Commander popover */}
      {commander && (
        <Popover anchor={commander} onClose={() => setCommander(null)}>
          {(() => {
            const info = INQUISITOR_INFO[commander.name];
            return (
              <>
                <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "var(--ink-faint)", letterSpacing: "0.12em", marginBottom: 6 }}>ASSIGNED COMMANDER</div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 14, color: "var(--ink)", fontWeight: 700, marginBottom: 3 }}>{commander.name}</div>
                {info && <>
                  <div style={{ fontFamily: "var(--font-terminal)", fontSize: 9.5, color: "var(--red)", marginBottom: 10 }}>{info.rank}</div>
                  <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10.5, color: "var(--ink-dim)", lineHeight: 1.7 }}>{info.blurb}</div>
                </>}
              </>
            );
          })()}
        </Popover>
      )}

      {/* Confirm conclude — modal */}
      <Modal open={!!confirmTarget} onClose={() => setConfirmTarget(null)} width={420}>
        {confirmTarget && (
          <div style={{ padding: "var(--sp-6)" }}>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "var(--ink-faint)", letterSpacing: "0.14em", marginBottom: 8 }}>CONFIRM ACTION</div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "var(--ink)", fontWeight: 700, marginBottom: 12 }}>Mark {confirmTarget.codeName} as concluded?</div>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "var(--ink-dim)", lineHeight: 1.7, marginBottom: 24 }}>
              This closes {confirmTarget.id} and sets progress to 100%. Units currently deployed will be recalled from {confirmTarget.sector.split(" · ")[0]}. This cannot be undone from this console.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={() => setConfirmTarget(null)} style={{ flex: 1, fontFamily: "var(--font-nav)", fontSize: 8.5, letterSpacing: "0.1em", color: "var(--ink-dim)", background: "none", border: "1px solid var(--line-strong)", padding: "11px 0", cursor: "pointer" }}>CANCEL</button>
              <button className="btn" onClick={confirmConclude} style={{ flex: 1, fontFamily: "var(--font-nav)", fontSize: 8.5, letterSpacing: "0.1em", color: "var(--green)", background: "rgba(87,181,140,0.1)", border: "1px solid rgba(87,181,140,0.35)", padding: "11px 0", cursor: "pointer" }}>CONFIRM ✓</button>
            </div>
          </div>
        )}
      </Modal>

      <ToastStack toasts={toasts} />
    </>
  );
}