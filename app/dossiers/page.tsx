"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MinimalBwBackground } from "@/components/ui/minimal-bw-background";
import Link from "next/link";
import {
  DOSSIERS,
  ALL_STATUSES,
  STATUS_COLOR,
  THREAT_COLOR,
  THREAT_LABEL,
  CAPTURE_COLOR,
  type Dossier,
  type Status,
} from "@/lib/dossiers-data";

// ── Global Styles ─────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes slideInR { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:none} }
  @keyframes meterFill{ from{width:0%} to{width:var(--w)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.25} }
  @keyframes scanLine { 0%{top:-10%} 100%{top:110%} }

  * { box-sizing:border-box; }

  ::-webkit-scrollbar        { width:3px; }
  ::-webkit-scrollbar-track  { background:transparent; }
  ::-webkit-scrollbar-thumb  { background:rgba(220,38,38,0.2); border-radius:2px; }

  .list-item            { transition:background 150ms,border-color 150ms; }
  .list-item:hover      { background:rgba(255,255,255,0.03) !important; }
  .list-item.active     { background:rgba(220,38,38,0.06) !important; }

  .nav-link:hover       { color:#f8fafc !important; }
  .chip:hover           { border-color:rgba(220,38,38,0.4) !important; color:#94a3b8 !important; }
  .chip.active          { color:var(--chip-col) !important; border-color:var(--chip-col) !important; background:color-mix(in srgb,var(--chip-col) 10%,transparent) !important; }

  .open-btn:hover       { background:rgba(220,38,38,0.1) !important; border-color:rgba(220,38,38,0.5) !important; color:#f8fafc !important; }
  .search-inp           { transition:border-color 150ms; }
  .search-inp::placeholder{ color:#1f2937; }
  .search-inp:focus     { outline:none; border-color:rgba(220,38,38,0.35) !important; }

  .detail-scroll        { scrollbar-width:thin; }
  .pulse-dot            { animation:pulse 2s ease infinite; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function ImperialCrest({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" stroke="#dc2626" strokeWidth="3" fill="none" opacity="0.9" />
      <circle cx="50" cy="50" r="34" stroke="#dc2626" strokeWidth="1.5" fill="none" opacity="0.5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <line key={i}
            x1={+(50 + 34 * Math.cos(a)).toFixed(2)} y1={+(50 + 34 * Math.sin(a)).toFixed(2)}
            x2={+(50 + 46 * Math.cos(a)).toFixed(2)} y2={+(50 + 46 * Math.sin(a)).toFixed(2)}
            stroke="#dc2626" strokeWidth="2" opacity="0.6" />
        );
      })}
      <circle cx="50" cy="50" r="8" fill="#dc2626" opacity="0.9" />
      <circle cx="50" cy="50" r="4" fill="#000" />
    </svg>
  );
}

function Tag({ color, children, small }: { color: string; children: React.ReactNode; small?: boolean }) {
  return (
    <span style={{
      fontFamily: "var(--font-nav)", fontSize: small ? 7 : 8, letterSpacing: "0.1em",
      color, border: `1px solid ${color}`, borderRadius: 999,
      padding: small ? "1px 6px" : "2px 9px",
      background: `color-mix(in srgb,${color} 10%,transparent)`,
      whiteSpace: "nowrap", lineHeight: 1.4,
    }}>{children}</span>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151",
      letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ width: 12, height: 1, background: "rgba(220,38,38,0.35)", display: "inline-block" }} />
      {children}
    </div>
  );
}

// ── Nav Bar ───────────────────────────────────────────────────────────────────
function NavBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <nav style={{
      flexShrink: 0, height: 52, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 28px",
      background: "rgba(0,0,0,0.95)", backdropFilter: "blur(24px)",
      borderBottom: "1px solid rgba(255,255,255,0.05)", zIndex: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ImperialCrest size={18} />
        <div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.2em" }}>
            GALACTIC EMPIRE · ISB
          </div>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 9, color: "#dc2626", letterSpacing: "0.12em", fontWeight: 600 }}>
            JEDI TARGET REGISTRY
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {[
          { label: "CONSOLE", href: "/console" },
          { label: "DOSSIERS", href: "/dossiers" },
          { label: "MISSIONS", href: "/missions" },
          { label: "INTERCEPTS", href: "/intercepts" },
          { label: "INQUISITORS", href: "/inquisitors" },
        ].map((n) => (
          <Link key={n.href} href={n.href} className="nav-link" style={{
            fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.14em",
            color: n.href === "/dossiers" ? "#f8fafc" : "#374151",
            textDecoration: "none", transition: "color 150ms",
          }}>{n.label}</Link>
        ))}
      </div>

      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#374151", letterSpacing: "0.08em" }}>
        {time} <span style={{ color: "#1f2937" }}>GST</span>
      </div>
    </nav>
  );
}

// ── Left Panel — List Item ────────────────────────────────────────────────────
function ListItem({
  d, isActive, onClick, index,
}: {
  d: Dossier; isActive: boolean; onClick: () => void; index: number;
}) {
  const tColor = THREAT_COLOR[d.threat];
  const sColor = STATUS_COLOR[d.status];

  return (
    <button
      onClick={onClick}
      className={`list-item${isActive ? " active" : ""}`}
      style={{
        display: "flex", flexDirection: "column", gap: 8,
        padding: "13px 16px 11px",
        width: "100%", textAlign: "left", cursor: "pointer",
        background: "transparent", border: "none",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        borderLeft: `3px solid ${isActive ? tColor : "rgba(255,255,255,0.07)"}`,
        opacity: 0, animation: "fadeUp 300ms ease forwards",
        animationDelay: `${index * 45}ms`, animationFillMode: "forwards",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#1f2937", letterSpacing: "0.16em", marginBottom: 3 }}>
            {d.id}
          </div>
          <div style={{
            fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 700,
            color: isActive ? "#f8fafc" : "#64748b", letterSpacing: "0.03em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            transition: "color 150ms",
          }}>
            {d.codename}
          </div>
          <div style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "#374151", marginTop: 2 }}>
            {d.realName === "[REDACTED]"
              ? <span style={{ color: "#4b1515" }}>[REDACTED]</span>
              : d.realName}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end", flexShrink: 0 }}>
          <Tag color={sColor} small>{d.status}</Tag>
          <Tag color={tColor} small>{THREAT_LABEL[d.threat]}</Tag>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#1f2937", letterSpacing: "0.1em" }}>
          {d.sector.split(" · ")[0]}
        </span>
        <span style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: `color-mix(in srgb,${tColor} 70%,#64748b)` }}>
          {d.midiChlorians.toLocaleString()} MC
        </span>
      </div>
    </button>
  );
}

// ── Left Panel ────────────────────────────────────────────────────────────────
function LeftPanel({
  dossiers, selected, onSelect,
  query, setQuery, statusFilter, setStatusFilter,
}: {
  dossiers: Dossier[];
  selected: Dossier | null;
  onSelect: (d: Dossier) => void;
  query: string; setQuery: (v: string) => void;
  statusFilter: Status | "ALL"; setStatusFilter: (v: Status | "ALL") => void;
}) {
  const counts = {
    ACTIVE:     DOSSIERS.filter((d) => d.status === "ACTIVE").length,
    ELIMINATED: DOSSIERS.filter((d) => d.status === "ELIMINATED").length,
    "IN EXILE": DOSSIERS.filter((d) => d.status === "IN EXILE").length,
    UNKNOWN:    DOSSIERS.filter((d) => d.status === "UNKNOWN").length,
  };

  return (
    <div style={{
      width: 300, flexShrink: 0,
      borderRight: "1px solid rgba(255,255,255,0.05)",
      display: "flex", flexDirection: "column",
      overflowY: "hidden",
    }}>
      {/* Sticky header */}
      <div style={{
        flexShrink: 0, padding: "16px 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
      }}>
        {/* Stats mini-row */}
        <div style={{ display: "flex", gap: 1, marginBottom: 12, border: "1px solid rgba(255,255,255,0.04)" }}>
          {(Object.entries(counts) as [Status, number][]).map(([s, n]) => (
            <div
              key={s}
              style={{ flex: 1, padding: "7px 6px", borderRight: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
              onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}
            >
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 14, color: STATUS_COLOR[s], lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 6, color: "#1f2937", letterSpacing: "0.12em", marginTop: 2 }}>
                {s === "IN EXILE" ? "EXILE" : s}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.2, pointerEvents: "none" }}
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="search-inp"
            type="text"
            placeholder="SEARCH TARGETS..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px 8px 30px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#f8fafc", fontFamily: "var(--font-terminal)", fontSize: 10,
              letterSpacing: "0.04em",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 14, lineHeight: 1,
            }}>✕</button>
          )}
        </div>

        {/* Status chips */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(["ALL", ...ALL_STATUSES] as const).map((s) => {
            const active = statusFilter === s;
            const col = s === "ALL" ? "#64748b" : STATUS_COLOR[s as Status];
            return (
              <button
                key={s}
                className={`chip${active ? " active" : ""}`}
                onClick={() => setStatusFilter(s as Status | "ALL")}
                style={{
                  "--chip-col": col,
                  fontFamily: "var(--font-nav)", fontSize: 7, letterSpacing: "0.1em",
                  color: active ? col : "#1f2937",
                  border: `1px solid ${active ? col : "rgba(255,255,255,0.06)"}`,
                  background: active ? `color-mix(in srgb,${col} 10%,transparent)` : "transparent",
                  borderRadius: 999, padding: "2px 8px", cursor: "pointer",
                  transition: "all 150ms",
                } as React.CSSProperties}
              >{s === "ALL" ? "ALL" : s === "IN EXILE" ? "EXILE" : s}</button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {dossiers.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#1f2937", letterSpacing: "0.2em" }}>
              NO TARGETS MATCH
            </div>
            <button onClick={() => { setQuery(""); setStatusFilter("ALL"); }} style={{
              marginTop: 12, fontFamily: "var(--font-nav)", fontSize: 7, letterSpacing: "0.12em",
              color: "#374151", background: "none", border: "1px solid rgba(255,255,255,0.06)",
              padding: "5px 12px", cursor: "pointer",
            }}>CLEAR FILTERS</button>
          </div>
        ) : (
          dossiers.map((d, i) => (
            <ListItem
              key={d.id}
              d={d}
              isActive={selected?.id === d.id}
              onClick={() => onSelect(d)}
              index={i}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        flexShrink: 0, padding: "8px 16px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontFamily: "var(--font-terminal)", fontSize: 8, color: "#1f2937" }}>
          {dossiers.length}/{DOSSIERS.length} FILES
        </span>
        <span style={{ fontFamily: "var(--font-nav)", fontSize: 6, color: "#1f2937", letterSpacing: "0.14em" }}>
          ISB REGISTRY
        </span>
      </div>
    </div>
  );
}

// ── Right Panel — Empty State ─────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100%", gap: 18, opacity: 0,
      animation: "fadeIn 400ms ease 100ms forwards",
    }}>
      <ImperialCrest size={52} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-nav)", fontSize: 9, color: "#1f2937", letterSpacing: "0.28em", lineHeight: 2 }}>
          SELECT A TARGET FILE<br />TO ACCESS DOSSIER
        </div>
      </div>
      <div style={{
        width: 1, height: 40,
        background: "linear-gradient(180deg,rgba(220,38,38,0.3),transparent)",
        marginTop: 8,
      }} />
    </div>
  );
}

// ── Right Panel — Detail View ─────────────────────────────────────────────────
function DetailPanel({ d }: { d: Dossier }) {
  const tColor = THREAT_COLOR[d.threat];
  const sColor = STATUS_COLOR[d.status];
  const capColor = CAPTURE_COLOR[d.capturePriority];
  const midiPct = Math.min(100, Math.round((d.midiChlorians / 20000) * 100));

  return (
    <div
      key={d.id}
      style={{
        position: "relative", display: "flex", flexDirection: "column",
        height: "100%", overflow: "hidden",
        opacity: 0, animation: "slideInR 280ms cubic-bezier(0.22,1,0.36,1) forwards",
      }}
    >
      {/* Diagonal watermark */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        pointerEvents: "none", zIndex: 0, overflow: "hidden",
      }}>
        <div style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(60px,8vw,90px)",
          fontWeight: 900, color: "rgba(220,38,38,0.04)",
          letterSpacing: "0.12em", whiteSpace: "nowrap",
          transform: "rotate(-25deg)", userSelect: "none",
          lineHeight: 1.2, textAlign: "center",
        }}>
          IMPERIAL SECRET<br />IMPERIAL SECRET
        </div>
      </div>

      {/* Scanlines */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(255,255,255,0.008) 3px,rgba(255,255,255,0.008) 4px)",
      }} />

      {/* Accent top line */}
      <div style={{ height: 2, background: `linear-gradient(90deg,${tColor},transparent)`, flexShrink: 0, position: "relative", zIndex: 1 }} />

      {/* Scrollable content */}
      <div className="detail-scroll" style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{
          padding: "22px 28px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.22em", marginBottom: 6 }}>
                {d.id} · CLASSIFIED
              </div>
              <div style={{
                fontFamily: "var(--font-heading)", fontSize: "clamp(20px,2.5vw,28px)",
                color: "#f8fafc", fontWeight: 700, letterSpacing: "0.02em",
                lineHeight: 1.1, marginBottom: 4,
              }}>
                {d.codename}
              </div>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#64748b" }}>
                {d.realName === "[REDACTED]"
                  ? <span style={{ color: "#dc2626" }}>[REDACTED]</span>
                  : d.realName}
                {" · "}{d.species}
              </div>
            </div>

            {/* "Open full view" button */}
            <Link
              href={`/dossiers/${d.id}`}
              className="open-btn"
              style={{
                flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 14px",
                fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.12em",
                color: "rgba(220,38,38,0.7)",
                border: "1px solid rgba(220,38,38,0.25)",
                background: "transparent", textDecoration: "none",
                transition: "all 150ms", whiteSpace: "nowrap",
                clipPath: "polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,0 100%)",
              }}
            >
              FULL FILE <span style={{ fontSize: 10 }}>↗</span>
            </Link>
          </div>

          {/* Pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Tag color={sColor}>{d.status}</Tag>
            <Tag color={tColor}>{THREAT_LABEL[d.threat]} THREAT</Tag>
            <span style={{
              fontFamily: "var(--font-nav)", fontSize: 7, letterSpacing: "0.1em",
              color: "rgba(220,38,38,0.4)", border: "1px solid rgba(220,38,38,0.15)",
              borderRadius: 999, padding: "2px 9px", background: "rgba(220,38,38,0.04)",
            }}>
              IMPERIAL SECRET // EYES ONLY
            </span>
          </div>
        </div>

        {/* ── Body Sections ── */}
        <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* M-Chlorian bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.16em" }}>MIDI-CHLORIAN COUNT</span>
              <span style={{ fontFamily: "var(--font-terminal)", fontSize: 13, color: tColor, fontWeight: 700 }}>
                {d.midiChlorians.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                background: `linear-gradient(90deg,${tColor},color-mix(in srgb,${tColor} 50%,transparent))`,
                boxShadow: `0 0 12px ${tColor}`,
                width: `${midiPct}%`,
                transition: "width 900ms cubic-bezier(0.22,1,0.36,1)",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontFamily: "var(--font-terminal)", fontSize: 7, color: "#1f2937" }}>0</span>
              <span style={{ fontFamily: "var(--font-terminal)", fontSize: 7, color: "#1f2937" }}>EMPEROR LEVEL: 20,000</span>
            </div>
          </div>

          {/* 3-col stat strip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, border: "1px solid rgba(255,255,255,0.05)" }}>
            {[
              { label: "SECTOR", value: d.sector.split(" · ")[0] },
              { label: "SPECIES", value: d.species },
              { label: "INQUISITOR", value: d.inquisitorAssigned },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: "10px 14px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#94a3b8" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Lightsaber + Capture Priority */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Lightsaber swatch */}
            <div style={{ padding: "12px 16px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em" }}>LIGHTSABER</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: d.lightsaberColor,
                  boxShadow: `0 0 12px 4px ${d.lightsaberColor}`,
                  opacity: d.status === "ELIMINATED" ? 0.3 : 0.9,
                }} />
                <span style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "#64748b" }}>{d.lightsaberLabel}</span>
              </div>
            </div>

            {/* Capture priority */}
            <div style={{
              padding: "12px 16px", border: `1px solid color-mix(in srgb,${capColor} 25%,transparent)`,
              background: `color-mix(in srgb,${capColor} 5%,transparent)`,
            }}>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 6 }}>DIRECTIVE</div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: capColor, letterSpacing: "0.1em" }}>
                {d.capturePriority}
              </div>
            </div>
          </div>

          {/* HCET Role */}
          <div style={{ padding: "12px 16px", borderLeft: "2px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.03)" }}>
            <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 5 }}>
              HCET SYNDICATE ROLE
            </div>
            <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "rgba(245,158,11,0.8)" }}>
              {d.hcetRole}
            </div>
          </div>

          {/* Last Sighting */}
          <div>
            <SectionHead>Last Known Sighting</SectionHead>
            <div style={{ padding: "14px 16px", borderLeft: `2px solid ${tColor}`, background: `color-mix(in srgb,${tColor} 4%,transparent)` }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.1em" }}>{d.lastSighting.date}</span>
                <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: tColor, letterSpacing: "0.08em" }}>{d.lastSighting.sector}</span>
              </div>
              <p style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#64748b", lineHeight: 1.7, margin: 0 }}>
                {d.lastSighting.description}
              </p>
            </div>
          </div>

          {/* Known Abilities */}
          <div>
            <SectionHead>Known Force Abilities</SectionHead>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {d.knownAbilities.map((a) => (
                <span key={a} style={{
                  fontFamily: "var(--font-nav)", fontSize: 7, letterSpacing: "0.08em",
                  color: "#475569", border: "1px solid rgba(255,255,255,0.06)",
                  padding: "3px 8px", background: "rgba(255,255,255,0.02)",
                }}>{a}</span>
              ))}
            </div>
          </div>

          {/* Affiliations */}
          {d.affiliations.length > 0 && (
            <div>
              <SectionHead>Known Affiliations</SectionHead>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {d.affiliations.map((af, i) => (
                  <div key={af.name} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "9px 0",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                  }}>
                    <span style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#94a3b8" }}>{af.name}</span>
                    <span style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.1em" }}>{af.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bounty */}
          <div>
            <SectionHead>Imperial Bounty</SectionHead>
            <div style={{
              fontFamily: "var(--font-terminal)", fontSize: 17,
              color: tColor, letterSpacing: "0.04em",
              textShadow: `0 0 20px color-mix(in srgb,${tColor} 40%,transparent)`,
            }}>
              {d.bounty}
            </div>
          </div>

          {/* Intelligence Notes */}
          <div>
            <SectionHead>Intelligence Notes</SectionHead>
            <p style={{
              fontFamily: "var(--font-terminal)", fontSize: 10, color: "#4b5563",
              lineHeight: 1.8, margin: 0,
              borderLeft: "2px solid rgba(255,255,255,0.04)", paddingLeft: 14,
            }}>{d.notes}</p>
          </div>

          {/* Footer note */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)",
          }}>
            <span style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#1f2937", letterSpacing: "0.14em" }}>
              ISB CLASSIFICATION: IMPERIAL SECRET
            </span>
            <Link href={`/dossiers/${d.id}`} className="open-btn" style={{
              fontFamily: "var(--font-nav)", fontSize: 7, letterSpacing: "0.1em",
              color: "rgba(220,38,38,0.4)", border: "1px solid rgba(220,38,38,0.15)",
              padding: "5px 12px", textDecoration: "none", transition: "all 150ms",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              OPEN COMPLETE FILE ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DossiersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [selected, setSelected] = useState<Dossier | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // Reset detail scroll on new selection
  useEffect(() => {
    detailRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [selected?.id]);

  const handleSelect = useCallback((d: Dossier) => {
    setSelected(d);
  }, []);

  const filtered = DOSSIERS.filter((d) => {
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      d.codename.toLowerCase().includes(q) ||
      d.realName.toLowerCase().includes(q) ||
      d.sector.toLowerCase().includes(q) ||
      d.species.toLowerCase().includes(q);
    const matchS = statusFilter === "ALL" || d.status === statusFilter;
    return matchQ && matchS;
  }).sort((a, b) => {
    const order = { critical: 0, high: 1, moderate: 2, low: 3 };
    return order[a.threat] - order[b.threat];
  });

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#000", position: "relative", overflow: "hidden" }}>
        <MinimalBwBackground />

        {/* Nav */}
        <NavBar />

        {/* Panels */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", zIndex: 1 }}>

          {/* Left — list */}
          <LeftPanel
            dossiers={filtered}
            selected={selected}
            onSelect={handleSelect}
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          {/* Divider glow */}
          <div style={{
            width: 1, flexShrink: 0,
            background: "linear-gradient(180deg,transparent,rgba(220,38,38,0.15) 30%,rgba(220,38,38,0.15) 70%,transparent)",
          }} />

          {/* Right — detail */}
          <div ref={detailRef} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {selected ? <DetailPanel d={selected} /> : <EmptyState />}
          </div>
        </div>
      </div>
    </>
  );
}
