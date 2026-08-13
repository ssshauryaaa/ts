"use client";
import { useEffect, useState } from "react";
import { MinimalBwBackground } from "@/components/ui/minimal-bw-background";
import Link from "next/link";

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(220,38,38,0.25); border-radius: 2px; }

  .nav-link-a:hover { color: #f8fafc !important; }
  .action-btn-a:hover { border-color: rgba(220,38,38,0.5) !important; color: #f8fafc !important; }
`;

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
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 10, color: "#dc2626", letterSpacing: "0.12em", fontWeight: 600 }}>AGENT PROFILE</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {[
          { label: "CONSOLE", href: "/console" },
          { label: "DOSSIERS", href: "/dossiers" },
          { label: "MISSIONS", href: "/missions" },
          { label: "INTERCEPTS", href: "/intercepts" },
          { label: "INQUISITORS", href: "/inquisitors" },
          { label: "AGENT", href: "/agent" },
        ].map((n) => (
          <Link key={n.href} href={n.href} className="nav-link-a" style={{
            fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.14em",
            color: n.href === "/agent" ? "#f8fafc" : "#475569",
            textDecoration: "none", transition: "color 150ms",
          }}>{n.label}</Link>
        ))}
      </div>
      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#dc2626", letterSpacing: "0.1em" }}>{time} GST</div>
    </nav>
  );
}

export default function AgentPage() {
  const [agentId, setAgentId] = useState<string>("ISB-7741-ALPHA");

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/agents/me").then((r) => (r.ok ? r.json() : null));
        if (me?.id) setAgentId(me.id);
      } catch {}
    })();
  }, []);

  const logs = [
    { time: "10 mins ago", action: "Analyzed transmission TX-9041 (KENOBI-ECHO)", threat: "CRITICAL" },
    { time: "42 mins ago", action: "Dispatched Inquisitor Strike to Outer Rim Sector 7", threat: "HIGH" },
    { time: "2 hours ago", action: "Accessed Classified Target File: YODA (SHADOW-PRIME)", threat: "CRITICAL" },
    { time: "5 hours ago", action: "Synced HoloNet encryption keys with Coruscant Central", threat: "INFO" },
    { time: "Yesterday", action: "Authenticated session credentials on ISB Terminal v7.4.1", threat: "INFO" },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: "100dvh", background: "#000", position: "relative" }}>
        <MinimalBwBackground />
        <NavBar />

        <main style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto", padding: "80px 32px 80px" }}>
          {/* Header */}
          <div style={{ padding: "40px 0 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 36, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <ImperialCrest size={54} />
            </div>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 9, color: "#374151", letterSpacing: "0.28em", marginBottom: 8 }}>
              IMPERIAL SECURITY BUREAU · PERSONNEL DOSSIER
            </div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(24px,4vw,36px)", color: "#f8fafc", fontWeight: 700, margin: "0 0 6px" }}>
              AGENT {agentId.toUpperCase()}
            </h1>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#dc2626", letterSpacing: "0.12em" }}>
              CLEARANCE: ISB LEVEL 7 · CORUSCANT DIVISION
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 2, marginBottom: 40 }}>
            <div style={{ padding: "18px 20px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 22, color: "#22c55e", fontWeight: 700 }}>47</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginTop: 4 }}>TRANSMISSIONS ANALYZED</div>
            </div>
            <div style={{ padding: "18px 20px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 22, color: "#dc2626", fontWeight: 700 }}>12</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginTop: 4 }}>THREATS FLAGGED</div>
            </div>
            <div style={{ padding: "18px 20px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 22, color: "#f59e0b", fontWeight: 700 }}>6</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginTop: 4 }}>CASES OPENED</div>
            </div>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 22, color: "#3b82f6", fontWeight: 700 }}>98.4%</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginTop: 4 }}>SECURITY COMPLIANCE</div>
            </div>
          </div>

          {/* Activity Log */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.2em", color: "#374151", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 18, height: 1, background: "rgba(220,38,38,0.4)", display: "inline-block" }} />
              Agent Audit Log
              <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)", display: "inline-block" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 2 }}>
              {logs.map((log, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.03)", background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#475569", width: 90 }}>{log.time}</span>
                    <span style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#cbd5e1" }}>{log.action}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: log.threat === "CRITICAL" ? "#dc2626" : log.threat === "HIGH" ? "#f59e0b" : "#475569", letterSpacing: "0.1em" }}>
                    {log.threat}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Purge Session */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <button
              className="action-btn-a"
              onClick={() => {
                if (confirm("Purge active session data and log out?")) {
                  window.localStorage.removeItem("umbra.boot.seen");
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  window.location.href = "/";
                }
              }}
              style={{
                fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.16em",
                padding: "8px 20px", background: "none", border: "1px solid rgba(220,38,38,0.3)",
                color: "#dc2626", borderRadius: 2, cursor: "pointer", transition: "all 150ms",
              }}
            >
              PURGE ACTIVE SESSION & LOG OUT
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
