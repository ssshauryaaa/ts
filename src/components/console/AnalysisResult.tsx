"use client";
import { useEffect, useState } from "react";
import { RadialGauge } from "@/src/components/RadialGauge";
import { GlitchText } from "@/src/components/ui/GlitchText";
import { HudFrame } from "@/src/components/ui/HudFrame";
import type { AnalysisResult as AnalysisResultType, FlaggedPhrase } from "@/lib/api";

const chipColor: Record<FlaggedPhrase["type"], string> = {
    critical: "var(--accent-critical)",
    warning: "var(--accent-warning)",
    info: "var(--accent-info)",
};

function useTypewriter(text: string, active: boolean, speed = 18) {
    const [out, setOut] = useState("");
    useEffect(() => {
        if (!active) return;
        setOut("");
        let i = 0;
        const id = setInterval(() => {
            i += 1;
            setOut(text.slice(0, i));
            if (i >= text.length) clearInterval(id);
        }, speed);
        return () => clearInterval(id);
    }, [text, active, speed]);
    return out;
}

interface AnalysisResultProps {
    result: AnalysisResultType | null;
    analyzing: boolean;
}

export function AnalysisResult({ result, analyzing }: AnalysisResultProps) {
    const summary = useTypewriter(result?.summary ?? "", !!result);

    const chipTypes: FlaggedPhrase["type"][] = ["critical", "warning", "info"];
    const chipLabels: Record<FlaggedPhrase["type"], string> = {
        critical: "FORCE-SENSITIVE MARKERS",
        warning: "SYNDICATE TERMINOLOGY",
        info: "UNCLEAR",
    };
    const presentTypes = result ? chipTypes.filter((t) => result.flagged.some((f) => f.type === t)) : [];
    const accent = analyzing ? "var(--color-caution-amber)" : "var(--color-imperial-red)";

    return (
        <HudFrame
            accent={accent}
            active={analyzing}
            label="Threat Assessment"
            status={analyzing ? "Processing…" : result ? "Complete" : undefined}
        >
            {!result && !analyzing && (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                    <span className="inline-block h-4 w-2 animate-pulse" style={{ background: "var(--color-text-muted)" }} />
                    <span className="uppercase tracking-wider" style={{ fontFamily: "var(--font-nav)", fontSize: 12, color: "var(--color-text-dim)" }}>
                        Awaiting transmission
                    </span>
                </div>
            )}

            {analyzing && !result && (
                <div className="flex h-full flex-col items-center justify-center gap-4">
                    <div className="scan-ring" />
                    <GlitchText
                        text="Analyzing transmission…"
                        triggerKey="analyzing"
                        className="uppercase tracking-wider"
                        style={{ fontFamily: "var(--font-nav)", fontSize: 12, color: "var(--color-caution-amber)" }}
                    />
                </div>
            )}

            {result && (
                <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
                    <div className="gauge-wrap">
                        <div className="gauge-ring" />
                        <RadialGauge value={result.threatScore} label="Threat Score" color="var(--color-imperial-red)" />
                    </div>

                    {presentTypes.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {presentTypes.map((t) => (
                                <span
                                    key={t}
                                    className="chip"
                                    style={{
                                        fontFamily: "var(--font-nav)",
                                        fontSize: 11,
                                        color: chipColor[t],
                                        borderColor: chipColor[t],
                                        background: `color-mix(in srgb, ${chipColor[t]} 12%, transparent)`,
                                    }}
                                >
                                    {chipLabels[t]}
                                </span>
                            ))}
                        </div>
                    )}

                    <p
                        className="w-full text-center leading-relaxed"
                        style={{ fontFamily: "var(--font-terminal)", fontSize: 14, color: "var(--color-text-muted)", minHeight: "3.5em" }}
                    >
                        {summary}
                        <span className="animate-pulse">_</span>
                    </p>
                </div>
            )}

            <style jsx>{`
                .scan-ring {
                    width: 64px; height: 64px; border-radius: 999px;
                    border: 2px solid transparent;
                    border-top-color: var(--color-caution-amber);
                    border-right-color: color-mix(in srgb, var(--color-caution-amber) 40%, transparent);
                    animation: spin 900ms linear infinite;
                    filter: drop-shadow(0 0 6px var(--color-caution-amber));
                }
                .gauge-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; }
                .gauge-ring {
                    position: absolute;
                    inset: -14px;
                    border-radius: 999px;
                    background: conic-gradient(from 0deg, transparent 0 70%, color-mix(in srgb, var(--color-imperial-red) 70%, transparent) 85%, transparent 100%);
                    animation: spin 6s linear infinite;
                    opacity: 0.6;
                    -webkit-mask: radial-gradient(closest-side, transparent 78%, black 80%, black 100%);
                    mask: radial-gradient(closest-side, transparent 78%, black 80%, black 100%);
                }
                .chip {
                    border-radius: 999px; border-width: 1px; padding: 4px 12px;
                    text-transform: uppercase; letter-spacing: 0.06em;
                    transition: transform 120ms ease, filter 120ms ease;
                }
                .chip:hover { transform: translateY(-1px); filter: brightness(1.25); }
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (prefers-reduced-motion: reduce) {
                    .scan-ring, .gauge-ring { animation: none; }
                }
            `}</style>
        </HudFrame>
    );
}