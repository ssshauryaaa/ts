"use client";
import { useEffect, useState } from "react";
import { MinimalBwBackground } from "@/components/ui/minimal-bw-background";
import Link from "next/link";

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }

  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(220,38,38,0.25); border-radius: 2px; }

  .portal-card {
    transition: all 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .portal-card:hover {
    transform: translateY(-4px);
    background: rgba(255,255,255,0.025) !important;
    border-color: rgba(220,38,38,0.4) !important;
    box-shadow: 0 12px 30px -10px rgba(220,38,38,0.25) !important;
  }

  .nav-link-db:hover { color: #f8fafc !important; }
`;

// ── Data ──────────────────────────────────────────────────────────────────────
interface PortalModule {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  badge: string;
  badgeColor: string;
  stats: string;
}

const MODULES: PortalModule[] = [
  {
    id: "MOD-01",
    title: "Threat Analysis Console",
    subtitle: "REAL-TIME INTELLIGENCE & 3D MAP",
    description: "Intercept transmissions, evaluate Force threat scores, and view the interactive 3D sector tactical map.",
    href: "/console",
    badge: "LIVE UPLINK",
    badgeColor: "#dc2626",
    stats: "3D Holo-Map · Threat Scrambler",
  },
  {
    id: "MOD-02",
    title: "Jedi Target Registry",
    subtitle: "CLASSIFIED FUGITIVE DOSSIERS",
    description: "Searchable kill-list of surviving Jedi targets with midi-chlorian counts, sightings, and profiles.",
    href: "/dossiers",
    badge: "8 TARGETS LOGGED",
    badgeColor: "#f59e0b",
    stats: "M-Count Meter · Side Drawer",
  },
  {
    id: "MOD-03",
    title: "Active Operations Board",
    subtitle: "INQUISITOR WAR ROOM",
    description: "Kanban board tracking planned, active, and concluded strike operations across all sectors.",
    href: "/missions",
    badge: "4 ACTIVE OPS",
    badgeColor: "#dc2626",
    stats: "Kanban Grid · Briefing Modals",
  },
  {
    id: "MOD-04",
    title: "HoloNet Transmissions",
    subtitle: "DECRYPTED REBEL COMM ARCHIVE",
    description: "Live intercept stream decoding rebel signals, highlighting Force keywords, and triggering strikes.",
    href: "/intercepts",
    badge: "LIVE FEED",
    badgeColor: "#22c55e",
    stats: "Cipher Decoder · Threat Flags",
  },
  {
    id: "MOD-05",
    title: "Inquisitor Command",
    subtitle: "PURGE CADRE ROSTER",
    description: "Status registry of dark side Force operatives, lightsaber ratings, assigned sectors, and confirmed kills.",
    href: "/inquisitors",
    badge: "5 OPERATIVES",
    badgeColor: "#a855f7",
    stats: "Combat Ratings · Target Tracing",
  },
  {
    id: "MOD-06",
    title: "Agent Profile & Audit",
    subtitle: "CLEARANCE & ACTION TIMELINE",
    description: "Personal ISB agent dossier, security compliance index, operational history, and session management.",
    href: "/agent",
    badge: "CLEARANCE L7",
    badgeColor: "#3b82f6",
    stats: "Audit Timeline · Session Control",
  },
];

// ── Components ────────────────────────────────────────────────────────────────
function ImperialCrest({ size = 24 }: { size?: number }) {
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
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 10, color: "#dc2626", letterSpacing: "0.12em", fontWeight: 600 }}>COMMAND DASHBOARD</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {[
          { label: "DASHBOARD", href: "/dashboard" },
          { label: "CONSOLE", href: "/console" },
          { label: "DOSSIERS", href: "/dossiers" },
          { label: "MISSIONS", href: "/missions" },
          { label: "INTERCEPTS", href: "/intercepts" },
          { label: "INQUISITORS", href: "/inquisitors" },
          { label: "AGENT", href: "/agent" },
        ].map((n) => (
          <Link key={n.href} href={n.href} className="nav-link-db" style={{
            fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.14em",
            color: n.href === "/dashboard" ? "#f8fafc" : "#475569",
            textDecoration: "none", transition: "color 150ms",
          }}>{n.label}</Link>
        ))}
      </div>
      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#dc2626", letterSpacing: "0.1em" }}>{time} GST</div>
    </nav>
  );
}

// ── Main Dashboard Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: "100dvh", background: "#000", position: "relative" }}>
        <MinimalBwBackground />
        <NavBar />

        <main style={{ position: "relative", zIndex: 1, maxWidth: 1140, margin: "0 auto", padding: "90px 32px 80px" }}>
          {/* Hero Banner */}
          <div style={{ padding: "48px 0 40px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 40, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <ImperialCrest size={64} />
            </div>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 9, color: "#374151", letterSpacing: "0.3em", marginBottom: 12 }}>
              IMPERIAL SECURITY BUREAU · CENTRAL COMMAND
            </div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(30px,4.5vw,52px)", color: "#f8fafc", fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.01em" }}>
              Strategic Command <span style={{ color: "#dc2626" }}>Nexus</span>
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#475569", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.7 }}>
              Unified operational portal for Jedi fugitive tracking, HoloNet signal interception, and Inquisitor strike coordination.
            </p>

            {/* Quick status pills */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
              <Tag color="#dc2626">ORDER 66 ACTIVE</Tag>
              <Tag color="#22c55e">HOLO-UPLINK ONLINE</Tag>
              <Tag color="#a855f7">FORCE RADAR ACTIVE</Tag>
              <Tag color="#f59e0b">HCET SYNDICATE FLAGGED</Tag>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 2, marginBottom: 44 }}>
            <div style={{ padding: "16px 20px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 22, color: "#dc2626", fontWeight: 700 }}>6 MODULES</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginTop: 2 }}>COMMAND PLATFORM</div>
            </div>
            <div style={{ padding: "16px 20px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 22, color: "#f59e0b" }}>8 TARGETS</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginTop: 2 }}>JEDI FUGITIVES LOGGED</div>
            </div>
            <div style={{ padding: "16px 20px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 22, color: "#22c55e" }}>4 ACTIVE</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginTop: 2 }}>PURGE OPERATIONS</div>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 22, color: "#3b82f6" }}>5 HUNTERS</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginTop: 2 }}>INQUISITOR CADRE</div>
            </div>
          </div>

          {/* Module Navigation Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20, marginBottom: 48 }}>
            {MODULES.map((mod, i) => (
              <Link
                key={mod.id}
                href={mod.href}
                className="portal-card"
                style={{
                  display: "flex", flexDirection: "column", gap: 14, padding: "24px",
                  background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
                  borderLeft: `2px solid ${mod.badgeColor}`, borderRadius: 2,
                  textDecoration: "none", opacity: 0, animation: `fadeUp 400ms ease forwards`,
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.18em", marginBottom: 4 }}>
                      {mod.id} · {mod.subtitle}
                    </div>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "#f8fafc", fontWeight: 700 }}>
                      {mod.title}
                    </div>
                  </div>
                  <Tag color={mod.badgeColor}>{mod.badge}</Tag>
                </div>

                <p style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#64748b", lineHeight: 1.7, margin: 0, flex: 1 }}>
                  {mod.description}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "#374151" }}>
                    {mod.stats}
                  </span>
                  <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: mod.badgeColor, letterSpacing: "0.14em", fontWeight: 700 }}>
                    OPEN PORTAL &#8594;
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ImperialCrest size={16} />
              <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#1f2937", letterSpacing: "0.16em" }}>
                GALACTIC EMPIRE · IMPERIAL SECURITY BUREAU
              </span>
            </div>
            <span style={{ fontFamily: "var(--font-terminal)", fontSize: 8, color: "#1f2937" }}>
              COMMAND NEXUS v7.4.1 · CLASSIFIED LEVEL 7
            </span>
          </footer>
        </main>
      </div>
    </>
  );
}
