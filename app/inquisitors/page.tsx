"use client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useEffect, useState, useCallback } from "react";
import { MinimalBwBackground } from "@/components/ui/minimal-bw-background";
import Link from "next/link";

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  @keyframes slideInR { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:none} }

  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(220,38,38,0.25); border-radius: 2px; }

  .inq-card { transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1); }
  .inq-card:hover { transform: translateY(-3px); border-color: rgba(220,38,38,0.4) !important; box-shadow: 0 0 24px -6px rgba(220,38,38,0.25) !important; }

  .nav-link-iq:hover { color: #f8fafc !important; }
  .action-btn-iq:hover { border-color: rgba(220,38,38,0.5) !important; color: #f8fafc !important; }
`;

// ── Types ─────────────────────────────────────────────────────────────────────
type InquisitorStatus = "DEPLOYED" | "STANDBY" | "SPECIAL ASSIGNMENT";

interface Inquisitor {
  id: string;
  name: string;
  title: string;
  status: InquisitorStatus;
  kills: number;
  assignedSector: string;
  weapon: string;
  combatRating: number; // 0 - 100
  forceRating: number; // 0 - 100
  stealthRating: number; // 0 - 100
  biography: string;
  activeTarget?: string;
}

const INQUISITORS: Inquisitor[] = [
  {
    id: "INQ-01",
    name: "The Grand Inquisitor",
    title: "Leader of the Inquisitorious",
    status: "DEPLOYED",
    kills: 14,
    assignedSector: "DAGOBAH · OUTER RIM",
    weapon: "Ringed Double-Bladed Spinning Lightsaber",
    combatRating: 95,
    forceRating: 92,
    stealthRating: 88,
    biography: "Former Jedi Temple Guard on Coruscant who turned to the dark side after falling disillusioned with the Order. Master of lightsaber combat forms and psychological warfare.",
    activeTarget: "SHADOW-PRIME (Yoda)",
  },
  {
    id: "INQ-02",
    name: "Second Sister",
    title: "Trilla Suduri",
    status: "DEPLOYED",
    kills: 9,
    assignedSector: "TATOOINE · OUTER RIM",
    weapon: "Ringed Double-Bladed Spinning Lightsaber",
    combatRating: 90,
    forceRating: 86,
    stealthRating: 92,
    biography: "Former Padawan of Cere Junda. Captured and tortured by the Empire until she embraced the dark side. Relentless tracker with acute analytical instincts.",
    activeTarget: "KENOBI-ECHO (Obi-Wan Kenobi)",
  },
  {
    id: "INQ-05",
    name: "Fifth Brother",
    title: "Inquisitor Operative",
    status: "DEPLOYED",
    kills: 7,
    assignedSector: "LOTHAL · MID RIM",
    weapon: "Ringed Double-Bladed Spinning Lightsaber",
    combatRating: 88,
    forceRating: 78,
    stealthRating: 70,
    biography: "Heavy brute specialist known for overwhelming physical force and aggressive lightsaber assaults. Uses brute strength to break opponent defenses.",
    activeTarget: "SURVIVOR-7 (Kanan Jarrus)",
  },
  {
    id: "INQ-07",
    name: "Seventh Sister",
    title: "Inquisitor Operative",
    status: "SPECIAL ASSIGNMENT",
    kills: 8,
    assignedSector: "RAADA · MID RIM",
    weapon: "Ringed Double-Bladed Spinning Lightsaber + ID9 Seekers",
    combatRating: 85,
    forceRating: 84,
    stealthRating: 95,
    biography: "Cunning strategist utilizing specialized ID9 seeker droids to track fleeing targets and gather field telemetry.",
    activeTarget: "FULCRUM-ALPHA (Ahsoka Tano)",
  },
  {
    id: "INQ-09",
    name: "Ninth Sister",
    title: "Dowutin Inquisitor",
    status: "STANDBY",
    kills: 5,
    assignedSector: "CORUSCANT CITADEL",
    weapon: "Heavy Ringed Double-Bladed Lightsaber",
    combatRating: 92,
    forceRating: 75,
    stealthRating: 60,
    biography: "Massive Dowutin warrior possessing extraordinary physical resistance and empathetic force reading capabilities to sense target fear.",
    activeTarget: "GHOST-SIGNAL (Caleb Dume)",
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
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 10, color: "#dc2626", letterSpacing: "0.12em", fontWeight: 600 }}>INQUISITOR COMMAND</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {[
          { label: "CONSOLE", href: "/console" },
          { label: "DOSSIERS", href: "/dossiers" },
          { label: "MISSIONS", href: "/missions" },
          { label: "INTERCEPTS", href: "/intercepts" },
          { label: "INQUISITORS", href: "/inquisitors" },
        ].map((n) => (
          <Link key={n.href} href={n.href} className="nav-link-iq" style={{
            fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.14em",
            color: n.href === "/inquisitors" ? "#f8fafc" : "#475569",
            textDecoration: "none", transition: "color 150ms",
          }}>{n.label}</Link>
        ))}
      </div>
      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#dc2626", letterSpacing: "0.1em" }}>{time} GST</div>
    </nav>
  );
}

// ── Inquisitor Drawer ─────────────────────────────────────────────────────────
function InquisitorDrawer({ inq, onClose }: { inq: Inquisitor; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <aside
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 51,
          width: "min(460px, 90vw)", background: "#000", borderLeft: "1px solid rgba(255,255,255,0.08)",
          padding: 28, display: "flex", flexDirection: "column", gap: 24, overflowY: "auto",
          animation: "slideInR 240ms cubic-bezier(0.22,1,0.36,1) forwards",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.18em", marginBottom: 4 }}>
              {inq.id} · PURGE CADRE DOSSIER
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, color: "#f8fafc", fontWeight: 700 }}>
              {inq.name}
            </div>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#dc2626", marginTop: 2 }}>
              {inq.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b", padding: "4px 8px", cursor: "pointer", borderRadius: 2, fontSize: 12 }}
          >&#10005;</button>
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em", marginBottom: 6 }}>CONFIRMED JEDI PACIFICATIONS</div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 24, color: "#dc2626", fontWeight: 700 }}>
            {inq.kills} <span style={{ fontSize: 12, color: "#64748b" }}>CONFIRMED KILLS</span>
          </div>
        </div>

        {/* Ratings bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "14px 0" }}>
          {[
            { label: "LIGHTSABER COMBAT", val: inq.combatRating, col: "#dc2626" },
            { label: "FORCE ABILITY", val: inq.forceRating, col: "#a855f7" },
            { label: "STEALTH & TRACKING", val: inq.stealthRating, col: "#3b82f6" },
          ].map((r) => (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", marginBottom: 4 }}>
                <span>{r.label}</span>
                <span style={{ color: r.col }}>{r.val}/100</span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 1.5, overflow: "hidden" }}>
                <div style={{ width: `${r.val}%`, height: "100%", background: r.col }} />
              </div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em", marginBottom: 6 }}>ASSIGNED WEAPONRY</div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#cbd5e1" }}>{inq.weapon}</div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em", marginBottom: 6 }}>CURRENT ASSIGNED SECTOR</div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#f59e0b" }}>{inq.assignedSector}</div>
        </div>

        {inq.activeTarget && (
          <div>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em", marginBottom: 6 }}>PRIMARY TARGET</div>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: "#dc2626", fontWeight: 700 }}>{inq.activeTarget}</div>
          </div>
        )}

        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em", marginBottom: 6 }}>CADRE BIOGRAPHY</div>
          <p style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#64748b", lineHeight: 1.7, margin: 0 }}>
            {inq.biography}
          </p>
        </div>
      </aside>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InquisitorsPage() {
  const [selectedInq, setSelectedInq] = useState<Inquisitor | null>(null);

  const statusColor: Record<InquisitorStatus, string> = {
    DEPLOYED: "#dc2626",
    STANDBY: "#22c55e",
    "SPECIAL ASSIGNMENT": "#f59e0b",
  };

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
              IMPERIAL SECURITY BUREAU · PURGE CADRE COMMAND
            </div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(26px,4vw,40px)", color: "#f8fafc", fontWeight: 700, margin: "0 0 8px" }}>
              Inquisitor <span style={{ color: "#dc2626" }}>Command</span>
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#374151", margin: 0 }}>
              Tactical roster and status registry of dark side force operatives dispatched to eliminate surviving Jedi.
            </p>
          </div>

          {/* Top Summary Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 2, marginBottom: 36 }}>
            <div style={{ padding: "14px 18px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 20, color: "#dc2626", fontWeight: 700 }}>
                {INQUISITORS.length} OPERATIVES
              </div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>ACTIVE HUNTER CADRE</div>
            </div>
            <div style={{ padding: "14px 18px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 20, color: "#dc2626" }}>
                {INQUISITORS.reduce((acc, i) => acc + i.kills, 0)} PACIFICATIONS
              </div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>CONFIRMED JEDI KILLS</div>
            </div>
            <div style={{ padding: "14px 18px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 20, color: "#22c55e" }}>
                {INQUISITORS.filter((i) => i.status === "DEPLOYED").length} FIELD DEPLOYED
              </div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>CURRENT OPERATIONAL STATUS</div>
            </div>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 20, color: "#a855f7" }}>94.6%</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>COMBAT EFFECTIVENESS</div>
            </div>
          </div>

          {/* Inquisitor Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {INQUISITORS.map((inq) => {
              const sCol = statusColor[inq.status];
              return (
                <div
                  key={inq.id}
                  className="inq-card"
                  onClick={() => setSelectedInq(inq)}
                  style={{
                    padding: "20px 22px",
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderLeft: `2px solid ${sCol}`,
                    borderRadius: 2,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em", marginBottom: 3 }}>
                        {inq.id}
                      </div>
                      <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "#f8fafc", fontWeight: 700 }}>
                        {inq.name}
                      </div>
                      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#64748b", marginTop: 2 }}>
                        {inq.title}
                      </div>
                    </div>
                    <Tag color={sCol}>{inq.status}</Tag>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 2 }}>CONFIRMED KILLS</div>
                      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 14, color: "#dc2626", fontWeight: 700 }}>{inq.kills}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 2 }}>ASSIGNED SECTOR</div>
                      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inq.assignedSector.split(" · ")[0]}</div>
                    </div>
                  </div>

                  {inq.activeTarget && (
                    <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#64748b" }}>
                      HUNTING: <span style={{ color: "#dc2626", fontWeight: 600 }}>{inq.activeTarget}</span>
                    </div>
                  )}

                  <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#1f2937", letterSpacing: "0.12em" }}>
                    VIEW FULL DOSSIER &#8594;
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {selectedInq && (
          <InquisitorDrawer inq={selectedInq} onClose={() => setSelectedInq(null)} />
        )}
      </div>
    </>
  );
}
