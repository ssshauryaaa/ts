"use client";
import { useEffect, useRef, useState } from "react";
import { HudFrame } from "@/src/components/ui/HudFrame";
import type { FlaggedPhrase } from "@/lib/api";

const GLYPHS = "アイウエオカキクケコサシスセソ0123456789!<>-_/\\|#$%&*+=";
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

function splitWithFlags(text: string, flagged: FlaggedPhrase[]) {
    if (flagged.length === 0) return [{ text, flag: null as FlaggedPhrase | null }];
    const segments: { text: string; flag: FlaggedPhrase | null }[] = [];
    let cursor = 0;
    const matches = flagged
        .map((f) => ({ f, idx: text.indexOf(f.phrase) }))
        .filter((m) => m.idx !== -1)
        .sort((a, b) => a.idx - b.idx);
    for (const { f, idx } of matches) {
        if (idx < cursor) continue;
        if (idx > cursor) segments.push({ text: text.slice(cursor, idx), flag: null });
        segments.push({ text: f.phrase, flag: f });
        cursor = idx + f.phrase.length;
    }
    if (cursor < text.length) segments.push({ text: text.slice(cursor), flag: null });
    return segments;
}

const flagColor: Record<FlaggedPhrase["type"], string> = {
    critical: "var(--accent-critical)",
    warning: "var(--accent-warning)",
    info: "var(--accent-info)",
};

interface EvidenceIntakeProps {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    analyzing: boolean;
    flagged: FlaggedPhrase[];
    resolved: boolean;
}

export function EvidenceIntake({ value, onChange, onSubmit, analyzing, flagged, resolved }: EvidenceIntakeProps) {
    const [scrambled, setScrambled] = useState(value);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!analyzing) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(() => {
            setScrambled(
                value.split("").map((ch) => (ch === "\n" || ch === " " ? ch : Math.random() < 0.35 ? randomGlyph() : ch)).join("")
            );
        }, 45);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [analyzing, value]);

    const canSubmit = value.trim().length > 0 && !analyzing;
    const accent = analyzing ? "var(--color-caution-amber)" : "var(--color-imperial-red)";

    return (
        <HudFrame
            accent={accent}
            active={analyzing}
            label="Intercepted Transmission"
            status={analyzing ? "Decrypting…" : resolved ? "Decrypted" : "Standing By"}
        >
            <div className="scanlines flex h-full flex-col">
                <div className="relative flex-1 overflow-y-auto p-4 intake-text" style={{ fontFamily: "var(--font-terminal)", fontSize: 14, lineHeight: 1.7 }}>
                    {analyzing ? (
                        <div className="whitespace-pre-wrap glitch-flicker" style={{ color: "var(--color-text-primary)" }} aria-live="polite">
                            {scrambled}
                        </div>
                    ) : resolved ? (
                        <div className="whitespace-pre-wrap" style={{ color: "var(--color-text-primary)" }}>
                            {splitWithFlags(value, flagged).map((seg, i) =>
                                seg.flag ? (
                                    <span
                                        key={i}
                                        className="flag-span"
                                        style={{ color: flagColor[seg.flag.type], textShadow: `0 0 8px ${flagColor[seg.flag.type]}` }}
                                        title={seg.flag.label}
                                    >
                                        {seg.text}
                                    </span>
                                ) : (
                                    <span key={i}>{seg.text}</span>
                                )
                            )}
                        </div>
                    ) : (
                        <textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="Paste an intercepted transmission..."
                            className="h-full w-full resize-none bg-transparent outline-none placeholder:opacity-40"
                            style={{ color: "var(--color-text-primary)", fontFamily: "inherit", fontSize: "inherit" }}
                        />
                    )}

                    {!analyzing && !resolved && value.length === 0 && (
                        <span className="pointer-events-none absolute bottom-4 left-4 inline-block h-4 w-2 animate-pulse" style={{ background: "var(--color-text-muted)" }} />
                    )}
                </div>

                <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: "var(--color-steel)" }}>
                    {resolved && !analyzing ? (
                        <button
                            onClick={() => onChange("")}
                            className="uppercase tracking-wider transition-opacity hover:opacity-80"
                            style={{ fontFamily: "var(--font-nav)", fontSize: 12, color: "var(--color-text-dim)" }}
                        >
                            ← New transmission
                        </button>
                    ) : (
                        <span style={{ fontFamily: "var(--font-nav)", fontSize: 12, color: "var(--color-text-dim)" }}>{value.length} chars</span>
                    )}
                    <button onClick={onSubmit} disabled={!canSubmit} className="submit-btn">
                        Analyze
                    </button>
                </div>
            </div>

            <style jsx>{`
                .flag-span { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 2px; animation: flagPulse 1.6s ease-in-out infinite; }
                @keyframes flagPulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
                .glitch-flicker { animation: flicker 2.5s infinite; }
                @keyframes flicker {
                    0%, 100% { opacity: 1; } 92% { opacity: 1; } 93% { opacity: 0.4; } 94% { opacity: 1; } 96% { opacity: 0.6; } 97% { opacity: 1; }
                }
                .submit-btn {
                    font-family: var(--font-nav);
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    padding: 8px 18px;
                    border-radius: 6px;
                    color: var(--color-text-primary);
                    background: linear-gradient(135deg, var(--color-imperial-red), color-mix(in srgb, var(--color-imperial-red) 60%, black));
                    box-shadow: 0 0 16px -2px var(--color-imperial-red);
                    transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
                }
                .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 0 24px 0 var(--color-imperial-red); }
                .submit-btn:disabled { cursor: not-allowed; opacity: 0.3; box-shadow: none; }
                @media (prefers-reduced-motion: reduce) {
                    .glitch-flicker, .flag-span { animation: none; }
                }
            `}</style>
        </HudFrame>
    );
}