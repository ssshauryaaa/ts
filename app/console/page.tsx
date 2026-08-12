"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MinimalBwBackground } from "@/components/ui/minimal-bw-background";
import { GalaxyMap3D } from "@/components/ui/galaxy-map-3d";
import { analyzeTransmission, getAnalysisHistory, type AnalysisResult as AnalysisResultType } from "@/lib/api";

// ── Keyframe styles (injected once) ──────────────────────────────────────────
const GLOBAL_STYLES = `
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes spin   { to { transform: rotate(360deg) } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } }
  @keyframes bootFadeIn { from { opacity:0; transform:translateX(-6px); } to { opacity:1; transform:none; } }
  @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
  @keyframes flagPulse { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.5)} }
  @keyframes flicker { 0%,100%{opacity:1}92%{opacity:1}93%{opacity:.4}94%{opacity:1}96%{opacity:.6}97%{opacity:1} }

  * { box-sizing: border-box; }

  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

  .console-section {
    opacity: 0;
    animation: fadeUp 600ms var(--ease-terminal, cubic-bezier(0.4,0,0.2,1)) forwards;
  }
  .console-section:nth-child(1) { animation-delay: 0ms; }
  .console-section:nth-child(2) { animation-delay: 80ms; }
  .console-section:nth-child(3) { animation-delay: 160ms; }
  .console-section:nth-child(4) { animation-delay: 240ms; }
  .console-section:nth-child(5) { animation-delay: 320ms; }
  .console-section:nth-child(6) { animation-delay: 400ms; }

  .stat-row:hover { background: rgba(255,255,255,0.03); }
  .feed-item:hover { background: rgba(255,255,255,0.03); }
  .analyze-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 0 28px -2px #dc2626 !important; }
  .analyze-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .sector-dot:hover { transform: translate(-50%,-50%) scale(1.4); }
  .nav-link:hover { color: #f8fafc !important; }
  .new-tx-btn:hover { color: #f8fafc !important; }
  .history-row:hover { background: rgba(255,255,255,0.03) !important; }
  .map-expand-btn:hover { color: #f8fafc !important; border-color: rgba(220,38,38,0.5) !important; }
  .map-close-btn:hover { color: #f8fafc !important; border-color: rgba(220,38,38,0.5) !important; }
`;

// ── Boot Screen ───────────────────────────────────────────────────────────────
const BOOT_LINES = [
  "GALACTIC EMPIRE -- ISB SECURE TERMINAL v7.4.1",
  "COPYRIGHT IMPERIAL SECURITY BUREAU, CORUSCANT",
  "----------------------------------------------",
  "[ OK ] Initialising cryptographic subsystems...",
  "[ OK ] Loading threat classification matrices...",
  "[ OK ] Establishing HoloNet uplink... [ENCRYPTED]",
  "[ OK ] Mounting Jedi-detection kernel module...",
  "[ OK ] Syncing sector compliance indices...",
  "[ OK ] Authenticating ISB agent credentials...",
  "----------------------------------------------",
  "ALL SYSTEMS NOMINAL. ORDER 66 ENFORCEMENT ACTIVE.",
  "WELCOME, AGENT. THE EMPIRE IS WATCHING.",
];

function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [cursor, setCursor] = useState(true);
  const [done, setDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let idx = 0;
    let cancelled = false;
    const add = () => {
      if (cancelled) return;
      if (idx >= BOOT_LINES.length) { setTimeout(() => { if (!cancelled) setDone(true); }, 600); return; }
      const line = BOOT_LINES[idx];
      if (line !== undefined) setLines((p) => [...p, line]);
      idx++;
      setTimeout(add, Math.random() * 80 + 55);
    };
    const t = setTimeout(add, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setCursor((c) => !c), 500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => { setFadeOut(true); setTimeout(onComplete, 700); }, 800);
    return () => clearTimeout(t);
  }, [done, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      style={{ opacity: fadeOut ? 0 : 1, transition: "opacity 700ms ease" }}>
      <MinimalBwBackground />
      <div className="w-full max-w-xl px-8 py-6" style={{ fontFamily: "var(--font-terminal)", fontSize: 13, lineHeight: 2 }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            opacity: 0, animation: "bootFadeIn 220ms ease forwards",
            color: l.startsWith("[ OK ]") ? "#22c55e" : l.startsWith("---")
              ? "#1a1f28" : l.startsWith("WELCOME") || l.startsWith("ALL") ? "#dc2626" : "#64748b",
          }}>{l}</div>
        ))}
        {!done && <span style={{ display: "inline-block", width: 8, height: 14, background: "#dc2626", opacity: cursor ? 1 : 0, transition: "opacity 100ms", verticalAlign: "middle" }} />}
        {done && <div style={{ color: "#dc2626", marginTop: 8 }}>&#9658; LAUNCHING ISB ANALYSIS CONSOLE...</div>}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.2em",
      color: "#374151", textTransform: "uppercase", marginBottom: 20,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ width: 18, height: 1, background: "rgba(220,38,38,0.4)", display: "inline-block" }} />
      {children}
      <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)", display: "inline-block" }} />
    </div>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "var(--font-nav)", fontSize: 7, letterSpacing: "0.12em",
      color, border: `1px solid ${color}`, borderRadius: 999, padding: "2px 8px",
      background: `color-mix(in srgb, ${color} 10%, transparent)`,
    }}>{children}</span>
  );
}

function ImperialCrest({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" stroke="#dc2626" strokeWidth="3" fill="none" opacity="0.9" />
      <circle cx="50" cy="50" r="34" stroke="#dc2626" strokeWidth="1.5" fill="none" opacity="0.5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x1 = Math.round((50 + 34 * Math.cos(a)) * 1000) / 1000;
        const y1 = Math.round((50 + 34 * Math.sin(a)) * 1000) / 1000;
        const x2 = Math.round((50 + 46 * Math.cos(a)) * 1000) / 1000;
        const y2 = Math.round((50 + 46 * Math.sin(a)) * 1000) / 1000;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#dc2626" strokeWidth="2" opacity="0.6" />;
      })}
      <circle cx="50" cy="50" r="8" fill="#dc2626" opacity="0.9" />
      <circle cx="50" cy="50" r="4" fill="#000" />
    </svg>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function NavBar({ agentId }: { agentId: string | null }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")}`);
    };
    update(); const iv = setInterval(update, 1000); return () => clearInterval(iv);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
      background: "rgba(0,0,0,0.88)", backdropFilter: "blur(24px)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 32px", height: 52,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ImperialCrest size={20} />
        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.18em" }}>GALACTIC EMPIRE · ISB</div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 10, color: "#dc2626", letterSpacing: "0.12em", fontWeight: 600 }}>THREAT ANALYSIS CONSOLE</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {[
          { label: "STATUS", id: "section-status" },
          { label: "INTERCEPTS", id: "section-feed" },
          { label: "MAP", id: "section-map" },
          { label: "ANALYZE", id: "section-analyze" },
          { label: "HISTORY", id: "section-history" },
        ].map((n) => (
          <button key={n.id} className="nav-link" onClick={() => scrollTo(n.id)}
            style={{
              fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.14em",
              color: "#475569", background: "none", border: "none", cursor: "pointer",
              padding: "4px 0", transition: "color 150ms",
            }}>{n.label}</button>
        ))}
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "#374151", letterSpacing: "0.1em" }}>
          {agentId ? agentId.slice(0, 12).toUpperCase() : "UNIDENTIFIED"}
        </div>
        <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#dc2626", letterSpacing: "0.1em" }}>{time} GST</div>
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ padding: "120px 0 80px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <ImperialCrest size={64} />
      </div>
      <div style={{ fontFamily: "var(--font-nav)", fontSize: 10, color: "#374151", letterSpacing: "0.3em", marginBottom: 14 }}>
        IMPERIAL SECURITY BUREAU
      </div>
      <h1 style={{
        fontFamily: "var(--font-heading)", fontSize: "clamp(32px, 5vw, 56px)",
        color: "#f8fafc", fontWeight: 700, letterSpacing: "-0.01em",
        lineHeight: 1.1, margin: "0 0 16px",
      }}>
        Threat Analysis<br />
        <span style={{ color: "#dc2626" }}>Console</span>
      </h1>
      <p style={{
        fontFamily: "var(--font-body)", fontSize: 14, color: "#475569",
        maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.7,
      }}>
        Intercept. Decode. Classify. Real-time ISB intelligence processing powered by the HoloNet uplink.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        {[
          { label: "UPLINK STABLE", color: "#22c55e" },
          { label: "ORDER 66 ACTIVE", color: "#dc2626" },
          { label: "FORCE SCAN ON", color: "#a855f7" },
        ].map((s) => <Tag key={s.label} color={s.color}>{s.label}</Tag>)}
      </div>
    </section>
  );
}

// ── Status ────────────────────────────────────────────────────────────────────
const SYSTEM_STATS = [
  { label: "HOLONET UPLINK", value: "ENCRYPTED", sub: "AES-512 · CORUSCANT RELAY", color: "#22c55e" },
  { label: "JEDI DETECTION MODULE", value: "ACTIVE", sub: "Force-sensitivity threshold: 42 midi-chlorians", color: "#a855f7" },
  { label: "ORDER 66 ENFORCEMENT", value: "ENFORCED", sub: "All Imperial forces notified", color: "#dc2626" },
  { label: "THREAT MATRIX VERSION", value: "v7.4.1-α", sub: "Last sync: 0300 GST", color: "#64748b" },
  { label: "SECTOR COMPLIANCE", value: "73%", sub: "Inner Rim: 100% · Outer Rim: 31%", color: "#f59e0b" },
  { label: "NEURAL PROCESSOR", value: "ONLINE", sub: "ISB Deep Analysis Engine · 97% capacity", color: "#22c55e" },
];

function StatusSection() {
  return (
    <section id="section-status" className="console-section" style={{ marginBottom: 72 }}>
      <SectionLabel>System Status</SectionLabel>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2,
      }}>
        {SYSTEM_STATS.map((s, i) => (
          <div key={i} className="stat-row" style={{
            padding: "18px 22px",
            borderRight: "1px solid rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            transition: "background 150ms",
          }}>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 16, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "#1f2937" }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Intercepts ────────────────────────────────────────────────────────────────
const COMMS = [
  { from: "REBEL-ALPHA", sector: "OUTER RIM", content: "We move at 0300. Tell the others.", threat: "high" },
  { from: "KENOBI-ECHO", sector: "TATOOINE", content: "The Force will guide us.", threat: "critical" },
  { from: "SYNDICATE-7", sector: "KASHYYYK", content: "Supply drop confirmed. Use channel 9.", threat: "moderate" },
  { from: "UNKNOWN", sector: "WILD SPACE", content: "...static... rendezvous point delta.", threat: "low" },
  { from: "HCET-PRIME", sector: "DANTOOINE", content: "New recruits secured. Awaiting extraction.", threat: "critical" },
  { from: "AGENT-ZERO", sector: "CORUSCANT", content: "Uplink stable. Standing by for orders.", threat: "low" },
];
const TC: Record<string, string> = { critical: "#dc2626", high: "#f59e0b", moderate: "#3b82f6", low: "#22c55e" };

function InterceptsSection() {
  const [comms, setComms] = useState<typeof COMMS>([]);
  useEffect(() => {
    let i = 0;
    const add = () => { setComms((p) => [COMMS[i % COMMS.length], ...p].slice(0, 8)); i++; };
    add(); const iv = setInterval(add, 3500); return () => clearInterval(iv);
  }, []);

  return (
    <section id="section-feed" className="console-section" style={{ marginBottom: 72 }}>
      <SectionLabel>Live HoloNet Intercepts</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {comms.map((c, i) => (
          <div key={i} className="feed-item" style={{
            display: "flex", alignItems: "flex-start", gap: 20, padding: "14px 20px",
            borderLeft: `2px solid ${TC[c.threat]}`,
            background: i === 0 ? `color-mix(in srgb, ${TC[c.threat]} 5%, transparent)` : "transparent",
            animation: i === 0 ? "slideIn 300ms ease" : "none",
            opacity: Math.max(0.2, 1 - i * 0.1),
            transition: "background 150ms",
          }}>
            <div style={{ flexShrink: 0, width: 140 }}>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 9, color: TC[c.threat], letterSpacing: "0.12em", marginBottom: 3 }}>{c.from}</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.1em" }}>{c.sector}</div>
            </div>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: "#94a3b8", lineHeight: 1.6, flex: 1 }}>{c.content}</div>
            <Tag color={TC[c.threat]}>{c.threat.toUpperCase()}</Tag>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Map ───────────────────────────────────────────────────────────────────────
function ExpandIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

const MAP_LEGEND = [
  { k: "pacified", v: "#22c55e" },
  { k: "contested", v: "#f59e0b" },
  { k: "lost", v: "#dc2626" },
] as const;

function MapLegend({ dot = 5, fontSize = 7, gap = 14 }: { dot?: number; fontSize?: number; gap?: number }) {
  return (
    <div style={{ display: "flex", gap }}>
      {MAP_LEGEND.map(({ k, v }) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: dot, height: dot, borderRadius: "50%", background: v }} />
          <span style={{ fontFamily: "var(--font-nav)", fontSize, color: "#374151", letterSpacing: "0.1em", textTransform: "uppercase" }}>{k}</span>
        </div>
      ))}
    </div>
  );
}

function MapSection({ onExpand }: { onExpand: () => void }) {
  return (
    <section id="section-map" className="console-section" style={{ marginBottom: 72 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ width: 18, height: 1, background: "rgba(220,38,38,0.4)", display: "inline-block" }} />
        <span style={{ fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.2em", color: "#374151", textTransform: "uppercase" }}>
          Sector Tactical Map
        </span>
        <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)", display: "inline-block" }} />
        <button
          onClick={onExpand}
          className="map-expand-btn"
          aria-label="Expand tactical map to fullscreen"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.12em",
            color: "#475569", background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 3, padding: "5px 10px", cursor: "pointer", transition: "all 150ms ease",
          }}
        >
          <ExpandIcon /> FULLSCREEN
        </button>
      </div>

      <div style={{ position: "relative", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: 340, width: "100%" }}>
          <GalaxyMap3D autoRotate interactive={false} cameraDistance={8.5} />
        </div>
        <div style={{ position: "absolute", bottom: 12, right: 16, pointerEvents: "none" }}>
          <MapLegend />
        </div>
      </div>
    </section>
  );
}

function MapFullscreenModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen sector tactical map"
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.97)",
        backdropFilter: "blur(8px)", display: "flex", flexDirection: "column",
        animation: "fadeUp 240ms ease forwards",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ImperialCrest size={18} />
          <span style={{ fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.2em", color: "#94a3b8", textTransform: "uppercase" }}>
            Sector Tactical Map — Full Holo-Projection
          </span>
        </div>
        <button
          onClick={onClose}
          className="map-close-btn"
          aria-label="Close fullscreen map"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 30, height: 30, borderRadius: 3, background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          <CloseIcon />
        </button>
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <GalaxyMap3D interactive autoRotate cameraDistance={10} />
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 24,
        padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
      }}>
        <MapLegend dot={6} fontSize={8} gap={20} />
        <span style={{ fontFamily: "var(--font-terminal)", fontSize: 8, color: "#1f2937", letterSpacing: "0.05em" }}>
          DRAG TO ROTATE · SCROLL TO ZOOM · ESC TO CLOSE
        </span>
      </div>
    </div>
  );
}

// ── Analyzer ──────────────────────────────────────────────────────────────────
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_/|#$%&*+=";
const rg = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

function splitWithFlags(text: string, flagged: Array<{ phrase: string; type: string; label: string }>) {
  if (flagged.length === 0) return [{ text, flag: null as null | typeof flagged[0] }];
  const segs: { text: string; flag: typeof flagged[0] | null }[] = []; let cur = 0;
  const matches = flagged.map((f) => ({ f, idx: text.indexOf(f.phrase) })).filter((m) => m.idx !== -1).sort((a, b) => a.idx - b.idx);
  for (const { f, idx } of matches) { if (idx < cur) continue; if (idx > cur) segs.push({ text: text.slice(cur, idx), flag: null }); segs.push({ text: f.phrase, flag: f }); cur = idx + f.phrase.length; }
  if (cur < text.length) segs.push({ text: text.slice(cur), flag: null });
  return segs;
}

function AnalyzeSection({
  inputText, setInputText, analyzing, result, onSubmit
}: {
  inputText: string;
  setInputText: (v: string) => void;
  analyzing: boolean;
  result: AnalysisResultType | null;
  onSubmit: () => void;
}) {
  const [scr, setScr] = useState(inputText);
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [score, setScore] = useState(0);
  const [summary, setSummary] = useState("");

  const resolved = !!result && !analyzing;
  const flagged = result?.flagged ?? [];

  useEffect(() => {
    if (!analyzing) { if (ivRef.current) clearInterval(ivRef.current); return; }
    ivRef.current = setInterval(() => setScr(inputText.split("").map((c) => c === "\n" || c === " " ? c : Math.random() < 0.35 ? rg() : c).join("")), 45);
    return () => { if (ivRef.current) clearInterval(ivRef.current); };
  }, [analyzing, inputText]);

  useEffect(() => {
    if (!result) { setScore(0); setSummary(""); return; }
    let i = 0; const id = setInterval(() => { i++; setSummary(result.summary.slice(0, i)); if (i >= result.summary.length) clearInterval(id); }, 16);
    return () => clearInterval(id);
  }, [result]);

  useEffect(() => {
    if (!result) { setScore(0); return; }
    const target = result.threatScore; let cur = 0;
    const id = setInterval(() => { cur = Math.min(cur + target / 60, target); setScore(Math.round(cur)); if (cur >= target) clearInterval(id); }, 16);
    return () => clearInterval(id);
  }, [result]);

  const sc = score > 70 ? "#dc2626" : score > 40 ? "#f59e0b" : "#22c55e";
  const fc: Record<string, string> = { critical: "#dc2626", warning: "#f59e0b", info: "#3b82f6" };
  const cl: Record<string, string> = { critical: "FORCE-SENSITIVE", warning: "SYNDICATE TERMS", info: "UNCLEAR" };
  const ok = inputText.trim().length > 0 && !analyzing;

  return (
    <section id="section-analyze" className="console-section" style={{ marginBottom: 72 }}>
      <SectionLabel>Transmission Analyzer</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 0 }}>
        {/* Input / Output */}
        <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px 0 0 2px", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, padding: "20px 24px", minHeight: 200 }}>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em", marginBottom: 12 }}>
              {analyzing ? "DECRYPTING…" : resolved ? "CLASSIFIED TRANSMISSION" : "INPUT"}
            </div>
            {analyzing ? (
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 13, color: "#94a3b8", whiteSpace: "pre-wrap", lineHeight: 1.7, animation: "flicker 2s infinite" }} aria-live="polite">{scr}</div>
            ) : resolved && result ? (
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 13, color: "#f8fafc", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                {splitWithFlags(inputText, flagged).map((seg, i) =>
                  seg.flag
                    ? <span key={i} style={{ color: fc[seg.flag.type], textDecoration: "underline", textDecorationThickness: "2px", textUnderlineOffset: "2px", animation: "flagPulse 1.6s ease-in-out infinite" }} title={seg.flag.label}>{seg.text}</span>
                    : <span key={i}>{seg.text}</span>
                )}
              </div>
            ) : (
              <textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
                placeholder="PASTE INTERCEPTED TRANSMISSION HERE..."
                style={{
                  width: "100%", minHeight: 180, resize: "none", background: "transparent",
                  border: "none", outline: "none", fontFamily: "var(--font-terminal)",
                  fontSize: 13, color: "#f8fafc", lineHeight: 1.7, caretColor: "#dc2626",
                } as React.CSSProperties}
              />
            )}
          </div>
          <Divider />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px" }}>
            {resolved && !analyzing
              ? <button className="new-tx-btn" onClick={() => setInputText("")}
                style={{ fontFamily: "var(--font-nav)", fontSize: 9, color: "#374151", letterSpacing: "0.12em", background: "none", border: "none", cursor: "pointer", transition: "color 150ms" }}>
                &#8592; NEW TRANSMISSION</button>
              : <span style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "#1f2937" }}>{inputText.length} CHARS</span>}
            <button onClick={onSubmit} disabled={!ok} className="analyze-btn"
              style={{
                fontFamily: "var(--font-nav)", fontSize: 9, fontWeight: 700, letterSpacing: "0.16em",
                padding: "8px 20px", borderRadius: 3,
                background: ok ? "linear-gradient(135deg, #dc2626, #7f1d1d)" : "transparent",
                color: ok ? "#fff" : "#1f2937",
                border: `1px solid ${ok ? "#dc2626" : "#1f2937"}`,
                boxShadow: ok ? "0 0 16px -2px #dc2626" : "none",
                transition: "all 150ms ease",
              }}>ANALYZE</button>
          </div>
        </div>

        {/* Threat side panel */}
        <div style={{
          border: "1px solid rgba(255,255,255,0.06)", borderLeft: "none",
          borderRadius: "0 2px 2px 0", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "28px 20px", gap: 16,
        }}>
          {!result && !analyzing && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: 0.25 }}>
              <ImperialCrest size={36} />
              <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.15em", textAlign: "center" }}>AWAITING TRANSMISSION</span>
            </div>
          )}
          {analyzing && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#f59e0b", borderRightColor: "rgba(245,158,11,0.2)", animation: "spin 700ms linear infinite", filter: "drop-shadow(0 0 8px #f59e0b)" }} />
              <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#f59e0b", letterSpacing: "0.15em", animation: "pulse 1.2s ease-in-out infinite" }}>ANALYZING…</span>
            </div>
          )}
          {result && (
            <>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={50} cy={50} r={42} fill="none" stroke="#0f141a" strokeWidth={6} />
                  <circle cx={50} cy={50} r={42} fill="none" stroke={sc} strokeWidth={6} strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - score / 100)}
                    style={{ transition: "stroke 300ms", filter: `drop-shadow(0 0 5px ${sc})` }} />
                </svg>
                <div style={{ position: "absolute", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-terminal)", fontSize: 24, color: sc, lineHeight: 1 }}>{score}</div>
                  <div style={{ fontFamily: "var(--font-nav)", fontSize: 6, color: "#374151", letterSpacing: "0.14em" }}>THREAT</div>
                </div>
              </div>
              {result.flagged.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
                  {["critical", "warning", "info"].filter((t) => result.flagged.some((f) => f.type === t)).map((t) => (
                    <Tag key={t} color={fc[t]}>{cl[t]}</Tag>
                  ))}
                </div>
              )}
              <p style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "#64748b", textAlign: "center", lineHeight: 1.7, margin: 0 }}>
                {summary}<span style={{ animation: "pulse 0.9s ease-in-out infinite" }}>_</span>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ── History ───────────────────────────────────────────────────────────────────
function HistorySection({
  history, selectedId, onSelect
}: {
  history: AnalysisResultType[];
  selectedId: string | null;
  onSelect: (item: AnalysisResultType) => void;
}) {
  if (history.length === 0) return null;

  return (
    <section id="section-history" className="console-section" style={{ marginBottom: 72 }}>
      <SectionLabel>Case File Log — {history.length} {history.length === 1 ? "Entry" : "Entries"}</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {history.map((item) => {
          const col = item.threatScore > 70 ? "#dc2626" : item.threatScore > 40 ? "#f59e0b" : "#22c55e";
          const active = item.id === selectedId;
          return (
            <button key={item.id} onClick={() => onSelect(item)} className="history-row"
              style={{
                display: "flex", alignItems: "center", gap: 20, padding: "14px 20px",
                background: active ? `color-mix(in srgb, ${col} 8%, transparent)` : "transparent",
                border: "none", borderLeft: `2px solid ${active ? col : "rgba(255,255,255,0.04)"}`,
                cursor: "pointer", textAlign: "left", transition: "all 150ms ease", width: "100%",
              }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 22, color: col, fontWeight: 700, width: 48, flexShrink: 0, lineHeight: 1 }}>{item.threatScore}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
                  {item.inputText.slice(0, 80)}{item.inputText.length > 80 ? "…" : ""}
                </div>
                <div style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "#374151" }}>
                  {item.summary.slice(0, 100)}{item.summary.length > 100 ? "…" : ""}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.1em", flexShrink: 0 }}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.05)", padding: "28px 0 56px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ImperialCrest size={16} />
        <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#1f2937", letterSpacing: "0.16em" }}>IMPERIAL SECURITY BUREAU · CLASSIFIED</span>
      </div>
      <span style={{ fontFamily: "var(--font-terminal)", fontSize: 8, color: "#1f2937" }}>BUILD 7.4.1-α · THE EMPIRE IS WATCHING</span>
    </footer>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ConsolePage() {
  const [booted, setBooted] = useState(false);
  const [inputText, setInputText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResultType | null>(null);
  const [history, setHistory] = useState<AnalysisResultType[]>([]);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/agents/me").then((r) => (r.ok ? r.json() : null));
        if (!me?.id) return;
        setAgentId(me.id);
        setHistory(await getAnalysisHistory(me.id));
      } catch { }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!inputText.trim() || analyzing) return;
    setAnalyzing(true); setResult(null);
    try {
      const res = await analyzeTransmission(inputText);
      setResult(res); setSelectedId(res.id);
      setHistory((prev) => [res, ...prev]);
    } catch {
      const err: AnalysisResultType = {
        id: "error", inputText, threatScore: 0,
        summary: "TRANSMISSION CORRUPTED — uplink failed, resubmit when ready.",
        flagged: [], createdAt: new Date().toISOString(),
      };
      setResult(err);
    } finally { setAnalyzing(false); }
  };

  const handleSelectHistory = useCallback((item: AnalysisResultType) => {
    setInputText(item.inputText); setResult(item); setSelectedId(item.id); setAnalyzing(false);
    document.getElementById("section-analyze")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSetInput = useCallback((v: string) => {
    setInputText(v); if (v === "") { setResult(null); setSelectedId(null); }
  }, []);

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      {!booted && <BootScreen onComplete={() => setBooted(true)} />}

      <div style={{ minHeight: "100dvh", background: "#000", position: "relative", opacity: booted ? 1 : 0, transition: "opacity 500ms ease" }}>
        <MinimalBwBackground />
        <NavBar agentId={agentId} />

        <main style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "0 32px" }}>
          <Hero />
          <StatusSection />
          <InterceptsSection />
          <MapSection onExpand={() => setMapExpanded(true)} />
          <AnalyzeSection
            inputText={inputText} setInputText={handleSetInput}
            analyzing={analyzing} result={result} onSubmit={handleSubmit}
          />
          <HistorySection history={history} selectedId={selectedId} onSelect={handleSelectHistory} />
          <Footer />
        </main>

        {mapExpanded && <MapFullscreenModal onClose={() => setMapExpanded(false)} />}
      </div>
    </>
  );
}