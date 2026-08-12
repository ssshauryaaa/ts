"use client";
import { useEffect, useState, useCallback } from "react";
import { MinimalBwBackground } from "@/components/ui/minimal-bw-background";
import Link from "next/link";

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  @keyframes slideInR { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:none} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(220,38,38,0.25); border-radius: 2px; }

  .mission-card { transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1); }
  .mission-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.03) !important; border-color: rgba(220,38,38,0.3) !important; }

  .col-container { background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05); }

  .nav-link-m:hover { color: #f8fafc !important; }
  .action-btn:hover { border-color: rgba(220,38,38,0.5) !important; color: #f8fafc !important; }
`;

// ── Types ─────────────────────────────────────────────────────────────────────
type OperationStatus = "PLANNED" | "ACTIVE" | "CONCLUDED";
type ThreatLevel = "critical" | "high" | "moderate" | "low";

interface Operation {
  id: string;
  codeName: string;
  targetCodename: string;
  sector: string;
  threat: ThreatLevel;
  status: OperationStatus;
  assignedInquisitor: string;
  unitsDeployed: string;
  progressPct: number;
  objective: string;
  lastIntelUpdate: string;
  outcome?: string;
}

const THREAT_COLOR: Record<ThreatLevel, string> = {
  critical: "#dc2626",
  high: "#f59e0b",
  moderate: "#3b82f6",
  low: "#22c55e",
};

const INITIAL_OPERATIONS: Operation[] = [
  {
    id: "OP-901",
    codeName: "OP: NIGHTFALL ECHO",
    targetCodename: "KENOBI-ECHO",
    sector: "TATOOINE · OUTER RIM",
    threat: "critical",
    status: "ACTIVE",
    assignedInquisitor: "Second Sister",
    unitsDeployed: "501st Vanguard Detachment + Probe Droids",
    progressPct: 65,
    objective: "Establish orbital blockade around Tatooine. Intercept encrypted HoloNet transmissions and trace signal origin to moisture farm sectors.",
    lastIntelUpdate: "14 mins ago · Probe droid 4-B destroyed near Dune Sea. High Force interference reported.",
  },
  {
    id: "OP-902",
    codeName: "OP: SILENT VANGUARD",
    targetCodename: "SURVIVOR-7",
    sector: "LOTHAL · MID RIM",
    threat: "high",
    status: "ACTIVE",
    assignedInquisitor: "Fifth Brother",
    unitsDeployed: "Imperial Star Destroyer Relentless + Local Garrison",
    progressPct: 40,
    objective: "Track Ghost-class freighter vessel across Lothal sector. Prevent merger with local HCET Syndicate cell.",
    lastIntelUpdate: "1 hour ago · Skirmish at Sector 4 mining facility. Target escaped into hyperspace.",
  },
  {
    id: "OP-903",
    codeName: "OP: SHADOW HARVEST",
    targetCodename: "FULCRUM-ALPHA",
    sector: "RAADA · MID RIM",
    threat: "high",
    status: "PLANNED",
    assignedInquisitor: "Seventh Sister",
    unitsDeployed: "ISB Intelligence Unit 9 + Death Trooper Cadre",
    progressPct: 15,
    objective: "Infiltrate suspected rebel communication hub on Raada. Capture target alive for intelligence extraction regarding HCET leadership.",
    lastIntelUpdate: "3 hours ago · Cipher logs decrypted. Target rendezvous projected at 0400 GST.",
  },
  {
    id: "OP-904",
    codeName: "OP: DARK BANYAN",
    targetCodename: "SHADOW-PRIME",
    sector: "DAGOBAH · OUTER RIM",
    threat: "critical",
    status: "PLANNED",
    assignedInquisitor: "Grand Inquisitor",
    unitsDeployed: "ISB Reconnaissance Fleet Alpha",
    progressPct: 10,
    objective: "Deploy heavy bio-scanners to swamp world Dagobah following deep-space Force wave anomaly.",
    lastIntelUpdate: "Yesterday · Sensor buoy array online. Atmospheric scanning in progress.",
  },
  {
    id: "OP-890",
    codeName: "OP: STYGEON SNARE",
    targetCodename: "CRIMSON-VEIL",
    sector: "STYGEON PRIME · INNER RIM",
    threat: "low",
    status: "CONCLUDED",
    assignedInquisitor: "Grand Inquisitor",
    unitsDeployed: "Spire Citadel Garrison",
    progressPct: 100,
    objective: "Broadcast falsified life support telemetry for Master Luminara Unduli to bait surviving Jedi cells into rescue attempt.",
    lastIntelUpdate: "Concluded · Target confirmed eliminated. 3 rebel infiltrators neutralized.",
    outcome: "SUCCESSFUL PACIFICATION",
  },
  {
    id: "OP-888",
    codeName: "OP: PHANTOM PURGE",
    targetCodename: "EXILE-EMBER",
    sector: "NAR SHADDAA · OUTER RIM",
    threat: "moderate",
    status: "CONCLUDED",
    assignedInquisitor: "Ninth Sister",
    unitsDeployed: "Bounty Hunter Guild Liaison",
    progressPct: 100,
    objective: "Purge Syndicate safehouse network in Nar Shaddaa lower levels.",
    lastIntelUpdate: "Concluded · Safehouse destroyed. Target escaped before perimeter collapse.",
    outcome: "TARGET EVADED · CELL DESTROYED",
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
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 10, color: "#dc2626", letterSpacing: "0.12em", fontWeight: 600 }}>OPERATIONS BOARD</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {[{ label: "CONSOLE", href: "/console" }, { label: "DOSSIERS", href: "/dossiers" }, { label: "MISSIONS", href: "/missions" }].map((n) => (
          <Link key={n.href} href={n.href} className="nav-link-m" style={{
            fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.14em",
            color: n.href === "/missions" ? "#f8fafc" : "#475569",
            textDecoration: "none", transition: "color 150ms",
          }}>{n.label}</Link>
        ))}
      </div>
      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#dc2626", letterSpacing: "0.1em" }}>{time} GST</div>
    </nav>
  );
}

// ── Operation Card ────────────────────────────────────────────────────────────
function OperationCard({
  op,
  onClick,
  onMoveStatus,
}: {
  op: Operation;
  onClick: () => void;
  onMoveStatus: (newStatus: OperationStatus) => void;
}) {
  const tColor = THREAT_COLOR[op.threat];

  return (
    <div
      className="mission-card"
      onClick={onClick}
      style={{
        padding: "16px 18px",
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderLeft: `2px solid ${tColor}`,
        borderRadius: 2,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em", marginBottom: 3 }}>
            {op.id}
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 14, color: "#f8fafc", fontWeight: 700 }}>
            {op.codeName}
          </div>
        </div>
        <Tag color={tColor}>{op.threat.toUpperCase()}</Tag>
      </div>

      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#94a3b8" }}>
        TARGET: <span style={{ color: "#f8fafc", fontWeight: 600 }}>{op.targetCodename}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 9, fontFamily: "var(--font-terminal)", color: "#64748b" }}>
        <span>{op.sector.split(" · ")[0]}</span>
        <span style={{ color: "#475569" }}>{op.assignedInquisitor}</span>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, fontFamily: "var(--font-nav)", color: "#374151", marginBottom: 4 }}>
          <span>PROGRESS</span>
          <span>{op.progressPct}%</span>
        </div>
        <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ width: `${op.progressPct}%`, height: "100%", background: tColor }} />
        </div>
      </div>

      {/* Actions to shift status */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", gap: 6, marginTop: 4, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.03)" }}
      >
        {op.status !== "PLANNED" && (
          <button
            onClick={() => onMoveStatus(op.status === "ACTIVE" ? "PLANNED" : "ACTIVE")}
            className="action-btn"
            style={{
              fontFamily: "var(--font-nav)", fontSize: 7, letterSpacing: "0.1em",
              color: "#475569", background: "none", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 2, padding: "2px 6px", cursor: "pointer", transition: "all 150ms",
            }}
          >
            &#8592; {op.status === "ACTIVE" ? "PLAN" : "ACTIVE"}
          </button>
        )}
        {op.status !== "CONCLUDED" && (
          <button
            onClick={() => onMoveStatus(op.status === "PLANNED" ? "ACTIVE" : "CONCLUDED")}
            className="action-btn"
            style={{
              fontFamily: "var(--font-nav)", fontSize: 7, letterSpacing: "0.1em",
              color: "#475569", background: "none", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 2, padding: "2px 6px", cursor: "pointer", transition: "all 150ms", marginLeft: "auto",
            }}
          >
            {op.status === "PLANNED" ? "ACTIVATE" : "CONCLUDE"} &#8594;
          </button>
        )}
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function OperationDetailModal({ op, onClose }: { op: Operation; onClose: () => void }) {
  const tColor = THREAT_COLOR[op.threat];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560, background: "#000",
          border: "1px solid rgba(255,255,255,0.08)", borderTop: `2px solid ${tColor}`,
          padding: 28, borderRadius: 3, display: "flex", flexDirection: "column", gap: 20,
          boxShadow: `0 0 30px -10px ${tColor}`, animation: "fadeUp 200ms ease forwards",
          margin: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.18em", marginBottom: 4 }}>
              {op.id} · CLASSIFIED MISSION BRIEF
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: "#f8fafc", fontWeight: 700 }}>
              {op.codeName}
            </div>
          </div>
          <button
            onClick={onClose}
            className="action-btn"
            style={{
              background: "none", border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748b", padding: "4px 8px", cursor: "pointer", borderRadius: 2, fontSize: 12,
            }}
          >&#10005;</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "12px 0" }}>
          <div>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 3 }}>TARGET</div>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: tColor, fontWeight: 700 }}>{op.targetCodename}</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 3 }}>SECTOR</div>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#94a3b8" }}>{op.sector}</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 3 }}>COMMANDER</div>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#94a3b8" }}>{op.assignedInquisitor}</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 3 }}>UNITS DEPLOYED</div>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#64748b" }}>{op.unitsDeployed}</div>
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em", marginBottom: 6 }}>PRIMARY OBJECTIVE</div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#cbd5e1", lineHeight: 1.7, background: "rgba(255,255,255,0.02)", padding: 12, borderLeft: `2px solid ${tColor}` }}>
            {op.objective}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em", marginBottom: 6 }}>LATEST FIELD INTEL</div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#94a3b8" }}>{op.lastIntelUpdate}</div>
        </div>

        {op.outcome && (
          <div>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em", marginBottom: 4 }}>OPERATION OUTCOME</div>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: "#22c55e", fontWeight: 700 }}>{op.outcome}</div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            onClick={onClose}
            className="action-btn"
            style={{
              fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.14em",
              padding: "6px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#f8fafc", cursor: "pointer", borderRadius: 2,
            }}
          >CLOSE BRIEFING</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MissionsPage() {
  const [ops, setOps] = useState<Operation[]>(INITIAL_OPERATIONS);
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);

  const moveStatus = useCallback((id: string, newStatus: OperationStatus) => {
    setOps((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus, progressPct: newStatus === "CONCLUDED" ? 100 : o.progressPct } : o))
    );
  }, []);

  const cols: { status: OperationStatus; title: string; subtitle: string; color: string }[] = [
    { status: "PLANNED", title: "PLANNED OPERATIONS", subtitle: "Intel gathering & staging phase", color: "#f59e0b" },
    { status: "ACTIVE", title: "ACTIVE OPERATIONS", subtitle: "Inquisitor strike execution", color: "#dc2626" },
    { status: "CONCLUDED", title: "CONCLUDED OPERATIONS", subtitle: "Pacified & archived records", color: "#22c55e" },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: "100dvh", background: "#000", position: "relative" }}>
        <MinimalBwBackground />
        <NavBar />

        <main style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 80px" }}>
          {/* Header */}
          <div style={{ padding: "40px 0 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 32 }}>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 9, color: "#374151", letterSpacing: "0.28em", marginBottom: 10 }}>
              IMPERIAL SECURITY BUREAU · STRATEGIC COMMAND
            </div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(26px,4vw,40px)", color: "#f8fafc", fontWeight: 700, margin: "0 0 8px" }}>
              Active Operations <span style={{ color: "#dc2626" }}>Board</span>
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#374151", margin: 0 }}>
              Real-time tactical deployment matrix tracking Inquisitor purge operations across all galactic sectors.
            </p>
          </div>

          {/* Top Summary Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 2, marginBottom: 36 }}>
            <div style={{ padding: "14px 18px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 20, color: "#dc2626", fontWeight: 700 }}>
                {ops.filter((o) => o.status === "ACTIVE").length} ACTIVE
              </div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>PURGE OPERATIONS</div>
            </div>
            <div style={{ padding: "14px 18px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 20, color: "#22c55e" }}>84.2%</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>TACTICAL SUCCESS RATE</div>
            </div>
            <div style={{ padding: "14px 18px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 20, color: "#f59e0b" }}>5 DEPLOYED</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>INQUISITOR CADRE</div>
            </div>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 20, color: "#64748b" }}>{ops.length} TOTAL</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>TRACKED MISSIONS</div>
            </div>
          </div>

          {/* Kanban Columns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {cols.map((col) => {
              const colOps = ops.filter((o) => o.status === col.status);
              return (
                <div key={col.status} className="col-container" style={{ padding: 20, borderRadius: 2, display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Column Header */}
                  <div style={{ borderBottom: `1px solid ${col.color}`, paddingBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--font-nav)", fontSize: 10, color: col.color, fontWeight: 700, letterSpacing: "0.14em" }}>
                        {col.title}
                      </span>
                      <span style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#64748b" }}>
                        {colOps.length}
                      </span>
                    </div>
                    <div style={{ fontFamily: "var(--font-terminal)", fontSize: 8, color: "#374151", marginTop: 2 }}>
                      {col.subtitle}
                    </div>
                  </div>

                  {/* Cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 280 }}>
                    {colOps.length === 0 ? (
                      <div style={{ padding: "40px 0", textAlign: "center", fontFamily: "var(--font-nav)", fontSize: 8, color: "#1f2937", letterSpacing: "0.14em" }}>
                        NO OPERATIONS IN THIS STAGE
                      </div>
                    ) : (
                      colOps.map((op) => (
                        <OperationCard
                          key={op.id}
                          op={op}
                          onClick={() => setSelectedOp(op)}
                          onMoveStatus={(newStat) => moveStatus(op.id, newStat)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {selectedOp && (
          <OperationDetailModal op={selectedOp} onClose={() => setSelectedOp(null)} />
        )}
      </div>
    </>
  );
}
