import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getDossier,
  STATUS_COLOR,
  THREAT_COLOR,
  THREAT_LABEL,
  CAPTURE_COLOR,
  LOG_COLOR,
  type Dossier,
} from "@/lib/dossiers-data";

// ── Styles injected via <style> ───────────────────────────────────────────────
const STYLES = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
  @keyframes meterW  { from{width:0} to{width:var(--target-w)} }
  @keyframes barGrow { from{width:0} to{width:var(--pct)} }

  * { box-sizing:border-box; }
  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(220,38,38,0.2); border-radius:2px; }

  .back-link:hover { color:#f8fafc !important; }
  .section-block { opacity:0; animation:fadeUp 400ms ease forwards; }
`;

// ── Shared sub-components ────────────────────────────────────────────────────
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

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.1em",
      color, border: `1px solid ${color}`, borderRadius: 999,
      padding: "2px 10px", background: `color-mix(in srgb,${color} 10%,transparent)`,
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151",
      letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ width: 20, height: 1, background: "rgba(220,38,38,0.4)", display: "inline-block" }} />
      {children}
      <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)", display: "inline-block" }} />
    </div>
  );
}

function ThreatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const blocks = Math.round(value / 10);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#475569", letterSpacing: "0.14em" }}>{label}</span>
        <span style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color }}>{value}%</span>
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 5,
            background: i < blocks ? color : "rgba(255,255,255,0.05)",
            boxShadow: i < blocks ? `0 0 6px ${color}` : "none",
            transition: `background 400ms ease ${i * 40}ms`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d: Dossier | undefined = getDossier(id);
  if (!d) notFound();

  const tColor = THREAT_COLOR[d.threat];
  const sColor = STATUS_COLOR[d.status];
  const capColor = CAPTURE_COLOR[d.capturePriority];
  const midiPct = Math.min(100, Math.round((d.midiChlorians / 20000) * 100));

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ minHeight: "100dvh", background: "#000", position: "relative" }}>

        {/* Scanlines */}
        <div aria-hidden style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(255,255,255,0.007) 3px,rgba(255,255,255,0.007) 4px)",
        }} />

        {/* Diagonal watermark */}
        <div aria-hidden style={{
          position: "fixed", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none", zIndex: 0, overflow: "hidden",
        }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              top: `${i * 28}%`,
              left: 0, right: 0,
              fontFamily: "var(--font-heading)", fontSize: "clamp(48px,7vw,80px)",
              fontWeight: 900, color: "rgba(220,38,38,0.03)",
              letterSpacing: "0.15em", whiteSpace: "nowrap",
              transform: "rotate(-25deg)",
              userSelect: "none", textAlign: "center",
            }}>IMPERIAL SECRET // ISB CLASSIFIED</div>
          ))}
        </div>

        {/* Classification banner */}
        <div style={{
          position: "relative", zIndex: 1,
          background: "rgba(220,38,38,0.08)",
          borderBottom: "1px solid rgba(220,38,38,0.2)",
          padding: "10px 40px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ImperialCrest size={16} />
            <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "rgba(220,38,38,0.7)", letterSpacing: "0.22em" }}>
              IMPERIAL SECURITY BUREAU // CLASSIFIED FILE
            </span>
          </div>
          <span style={{ fontFamily: "var(--font-terminal)", fontSize: 8, color: "#374151", letterSpacing: "0.1em" }}>
            {d.id} · IMPERIAL SECRET
          </span>
        </div>

        {/* Back nav */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "18px 40px 0" }}>
          <Link href="/dossiers" className="back-link" style={{
            fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.14em",
            color: "#374151", textDecoration: "none", transition: "color 150ms",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 11 }}>←</span> RETURN TO REGISTRY
          </Link>
        </div>

        {/* Main content */}
        <main style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "32px 40px 80px" }}>

          {/* ── Hero Header ── */}
          <div className="section-block" style={{ animationDelay: "0ms", paddingBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 36 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.26em", marginBottom: 10 }}>
                  GALACTIC EMPIRE · ISB · JEDI TARGET REGISTRY
                </div>
                <h1 style={{
                  fontFamily: "var(--font-heading)", fontSize: "clamp(34px,5vw,52px)",
                  color: "#f8fafc", fontWeight: 700, letterSpacing: "-0.01em",
                  margin: "0 0 8px", lineHeight: 1.05,
                }}>
                  {d.codename}
                </h1>
                <div style={{ fontFamily: "var(--font-terminal)", fontSize: 13, color: "#64748b" }}>
                  {d.realName === "[REDACTED]"
                    ? <span style={{ color: "#dc2626" }}>[REDACTED]</span>
                    : d.realName}
                  {" · "}{d.species}
                </div>
              </div>

              {/* Threat ring */}
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={tColor}
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - midiPct / 100)}`}
                    strokeLinecap="butt"
                    transform="rotate(-90 40 40)"
                    style={{ filter: `drop-shadow(0 0 6px ${tColor})` }}
                  />
                  <text x="40" y="38" textAnchor="middle" fill={tColor}
                    style={{ fontFamily: "var(--font-terminal)", fontSize: 14, fontWeight: 700 }}>
                    {midiPct}%
                  </text>
                  <text x="40" y="52" textAnchor="middle" fill="#374151"
                    style={{ fontFamily: "var(--font-nav)", fontSize: 6, letterSpacing: "0.1em" }}>
                    FORCE
                  </text>
                </svg>
              </div>
            </div>

            {/* Pill row */}
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
              <Tag color={sColor}>{d.status}</Tag>
              <Tag color={tColor}>{THREAT_LABEL[d.threat]} THREAT</Tag>
              <span style={{
                fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.1em",
                color: capColor, border: `1px solid color-mix(in srgb,${capColor} 35%,transparent)`,
                borderRadius: 999, padding: "2px 10px",
                background: `color-mix(in srgb,${capColor} 8%,transparent)`,
              }}>
                {d.capturePriority}
              </span>
              <span style={{
                fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.1em",
                color: "rgba(220,38,38,0.4)", border: "1px solid rgba(220,38,38,0.15)",
                borderRadius: 999, padding: "2px 10px",
                background: "rgba(220,38,38,0.04)",
              }}>IMPERIAL SECRET // EYES ONLY</span>
            </div>

            {/* File meta */}
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {[
                { label: "FILE ID", value: d.id },
                { label: "BOUNTY", value: d.bounty },
                { label: "INQUISITOR", value: d.inquisitorAssigned },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#94a3b8" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Midi-Chlorian Meter ── */}
          <div className="section-block" style={{ animationDelay: "60ms", marginBottom: 36 }}>
            <SectionHead>Midi-Chlorian Assessment</SectionHead>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.14em" }}>
                RAW COUNT
              </span>
              <span style={{ fontFamily: "var(--font-terminal)", fontSize: 16, color: tColor, letterSpacing: "0.04em" }}>
                {d.midiChlorians.toLocaleString()} / 20,000
              </span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.04)", overflow: "hidden", marginBottom: 6 }}>
              <div style={{
                height: "100%", width: `${midiPct}%`,
                background: `linear-gradient(90deg,${tColor},color-mix(in srgb,${tColor} 50%,transparent))`,
                boxShadow: `0 0 16px ${tColor}`,
                transition: "width 1000ms cubic-bezier(0.22,1,0.36,1)",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-terminal)", fontSize: 7, color: "#1f2937" }}>BASELINE HUMAN: ~2,500</span>
              <span style={{ fontFamily: "var(--font-terminal)", fontSize: 7, color: "#1f2937" }}>EMPEROR LEVEL: 20,000+</span>
            </div>
          </div>

          {/* ── Bio Grid ── */}
          <div className="section-block" style={{ animationDelay: "100ms", marginBottom: 36 }}>
            <SectionHead>Target Profile</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, border: "1px solid rgba(255,255,255,0.05)" }}>
              {[
                { label: "SECTOR", value: d.sector },
                { label: "SPECIES", value: d.species },
                { label: "INQUISITOR ASSIGNED", value: d.inquisitorAssigned },
                { label: "LAST SIGHTING DATE", value: d.lastSighting.date },
                { label: "LAST SIGHTING LOCATION", value: d.lastSighting.sector },
                { label: "STATUS", value: d.status },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: "14px 18px",
                  borderRight: "1px solid rgba(255,255,255,0.04)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 5 }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#94a3b8" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Lightsaber + HCET Role ── */}
          <div className="section-block" style={{ animationDelay: "140ms", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 36 }}>
            {/* Lightsaber */}
            <div>
              <SectionHead>Lightsaber Identification</SectionHead>
              <div style={{
                padding: "18px 22px", border: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", gap: 18,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: d.lightsaberColor,
                  boxShadow: `0 0 20px 8px color-mix(in srgb,${d.lightsaberColor} 40%,transparent)`,
                  opacity: d.status === "ELIMINATED" ? 0.3 : 1,
                }} />
                <div>
                  <div style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: "#f8fafc", marginBottom: 4 }}>
                    {d.lightsaberLabel}
                  </div>
                  {d.status === "ELIMINATED" && (
                    <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#22c55e", letterSpacing: "0.12em" }}>
                      WEAPON DESTROYED
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Capture directive */}
            <div>
              <SectionHead>Imperial Directive</SectionHead>
              <div style={{
                padding: "18px 22px",
                border: `1px solid color-mix(in srgb,${capColor} 30%,transparent)`,
                background: `color-mix(in srgb,${capColor} 5%,transparent)`,
              }}>
                <div style={{ fontFamily: "var(--font-nav)", fontSize: 9, color: capColor, letterSpacing: "0.14em", marginBottom: 6 }}>
                  {d.capturePriority}
                </div>
                <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#374151", lineHeight: 1.6 }}>
                  {d.capturePriority === "CAPTURE ALIVE" && "Target to be taken alive for Imperial Intelligence interrogation. Use of lethal force only as last resort."}
                  {d.capturePriority === "ELIMINATE ON SIGHT" && "Target presents immediate threat to Imperial operations. Authorized for immediate neutralization. No quarter."}
                  {d.capturePriority === "OBSERVE & REPORT" && "Maintain surveillance. Do not engage. Report all movement to ISB Command for analysis."}
                </div>
              </div>
            </div>
          </div>

          {/* ── HCET Syndicate Role ── */}
          <div className="section-block" style={{ animationDelay: "160ms", marginBottom: 36 }}>
            <SectionHead>HCET Syndicate Intelligence</SectionHead>
            <div style={{
              padding: "18px 22px",
              borderLeft: "3px solid rgba(245,158,11,0.4)",
              background: "rgba(245,158,11,0.04)",
              border: "1px solid rgba(245,158,11,0.12)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 6 }}>SYNDICATE ROLE</div>
                  <div style={{ fontFamily: "var(--font-terminal)", fontSize: 13, color: "rgba(245,158,11,0.85)" }}>
                    {d.hcetRole}
                  </div>
                </div>
                {d.affiliations.length > 0 && (
                  <div>
                    <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginBottom: 6 }}>AFFILIATIONS</div>
                    <div style={{ fontFamily: "var(--font-terminal)", fontSize: 10, color: "#64748b" }}>
                      {d.affiliations.map((a) => a.name).join(" · ")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Last Sighting ── */}
          <div className="section-block" style={{ animationDelay: "200ms", marginBottom: 36 }}>
            <SectionHead>Last Known Sighting</SectionHead>
            <div style={{
              padding: "20px 24px",
              borderLeft: `3px solid ${tColor}`,
              background: `color-mix(in srgb,${tColor} 4%,transparent)`,
              border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.1em" }}>
                  {d.lastSighting.date}
                </span>
                <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: tColor, letterSpacing: "0.08em" }}>
                  {d.lastSighting.sector}
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: "#64748b", lineHeight: 1.8, margin: 0 }}>
                {d.lastSighting.description}
              </p>
            </div>
          </div>

          {/* ── Activity Log ── */}
          <div className="section-block" style={{ animationDelay: "240ms", marginBottom: 36 }}>
            <SectionHead>ISB Intelligence Activity Log</SectionHead>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {d.activityLog.map((entry, i) => {
                const lc = LOG_COLOR[entry.classification];
                return (
                  <div key={i} style={{ display: "flex", gap: 18, position: "relative" }}>
                    {/* Timeline dot + line */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 4 }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: lc, boxShadow: `0 0 6px ${lc}`, flexShrink: 0,
                      }} />
                      {i < d.activityLog.length - 1 && (
                        <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 4, marginBottom: 0 }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ paddingBottom: i < d.activityLog.length - 1 ? 18 : 0, flex: 1 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-terminal)", fontSize: 9, color: "#374151" }}>{entry.date}</span>
                        <span style={{
                          fontFamily: "var(--font-nav)", fontSize: 6, letterSpacing: "0.12em",
                          color: lc, border: `1px solid ${lc}`, borderRadius: 999, padding: "1px 6px",
                        }}>
                          {entry.classification}
                        </span>
                      </div>
                      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>
                        {entry.event}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Force Abilities ── */}
          <div className="section-block" style={{ animationDelay: "280ms", marginBottom: 36 }}>
            <SectionHead>Known Force Abilities</SectionHead>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {d.knownAbilities.map((a) => (
                <span key={a} style={{
                  fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.08em",
                  color: "#475569", border: "1px solid rgba(255,255,255,0.07)",
                  padding: "5px 12px", background: "rgba(255,255,255,0.02)",
                }}>{a}</span>
              ))}
            </div>
          </div>

          {/* ── Threat Breakdown ── */}
          <div className="section-block" style={{ animationDelay: "320ms", marginBottom: 36 }}>
            <SectionHead>Threat Breakdown Assessment</SectionHead>
            <div style={{ padding: "22px 24px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <ThreatBar label="FORCE SENSITIVITY" value={d.threatBreakdown.forceSensitivity} color={tColor} />
              <ThreatBar label="COMBAT CAPABILITY" value={d.threatBreakdown.combat} color={tColor} />
              <ThreatBar label="RECRUITMENT RISK" value={d.threatBreakdown.recruitmentRisk} color="#f59e0b" />
              <ThreatBar label="EVASION RATING" value={d.threatBreakdown.evasion} color="#3b82f6" />
            </div>
          </div>

          {/* ── Affiliations ── */}
          {d.affiliations.length > 0 && (
            <div className="section-block" style={{ animationDelay: "360ms", marginBottom: 36 }}>
              <SectionHead>Known Affiliations</SectionHead>
              <div style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                {d.affiliations.map((af, i) => (
                  <div key={af.name} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 20px",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                  }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>
                        {af.name}
                      </div>
                    </div>
                    <span style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#374151", letterSpacing: "0.12em" }}>
                      {af.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Inquisitor Assignment ── */}
          <div className="section-block" style={{ animationDelay: "400ms", marginBottom: 36 }}>
            <SectionHead>Inquisitor Assignment</SectionHead>
            <div style={{
              padding: "18px 22px", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontFamily: "var(--font-terminal)", fontSize: 14, color: "#f8fafc", marginBottom: 3 }}>
                  {d.inquisitorAssigned}
                </div>
                <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.12em" }}>
                  {d.inquisitorAssigned === "Unassigned" ? "PENDING ASSIGNMENT" : "ORDER OF INQUISITORS · ACTIVE DEPLOYMENT"}
                </div>
              </div>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: d.inquisitorAssigned === "Unassigned" ? "#374151" : "#dc2626",
                boxShadow: d.inquisitorAssigned === "Unassigned" ? "none" : "0 0 8px #dc2626",
              }} />
            </div>
          </div>

          {/* ── Bounty ── */}
          <div className="section-block" style={{ animationDelay: "440ms", marginBottom: 36 }}>
            <SectionHead>Imperial Bounty</SectionHead>
            <div style={{
              padding: "20px 24px",
              border: `1px solid color-mix(in srgb,${tColor} 20%,transparent)`,
              background: `color-mix(in srgb,${tColor} 4%,transparent)`,
            }}>
              <div style={{
                fontFamily: "var(--font-terminal)", fontSize: "clamp(18px,3vw,28px)",
                color: tColor, letterSpacing: "0.04em",
                textShadow: `0 0 24px color-mix(in srgb,${tColor} 40%,transparent)`,
              }}>
                {d.bounty}
              </div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#374151", letterSpacing: "0.14em", marginTop: 8 }}>
                PAYABLE UPON VERIFIED CONFIRMATION TO ISB COMMAND
              </div>
            </div>
          </div>

          {/* ── Intelligence Notes ── */}
          <div className="section-block" style={{ animationDelay: "480ms", marginBottom: 36 }}>
            <SectionHead>Intelligence Assessment Notes</SectionHead>
            <div style={{
              padding: "20px 24px",
              borderLeft: "3px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.01)",
            }}>
              <p style={{
                fontFamily: "var(--font-terminal)", fontSize: 12, color: "#4b5563",
                lineHeight: 1.9, margin: 0,
              }}>{d.notes}</p>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#1f2937", letterSpacing: "0.18em", marginBottom: 3 }}>
                ISB CLASSIFICATION: IMPERIAL SECRET
              </div>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 7, color: "#1f2937" }}>
                UNAUTHORIZED ACCESS IS PUNISHABLE UNDER IMPERIAL DECREE 15-J
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-nav)", fontSize: 7, color: "#1f2937", letterSpacing: "0.14em", marginBottom: 3 }}>
                FILE: {d.id}
              </div>
              <div style={{ fontFamily: "var(--font-terminal)", fontSize: 7, color: "#1f2937" }}>
                CLEARANCE LEVEL REQUIRED: INQUISITOR / ISB-SENIOR
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
