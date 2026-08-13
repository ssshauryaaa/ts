"use client";
import { useEffect, useState } from "react";

interface GlitchTextProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    /** replay the glitch-in animation whenever this flips */
    triggerKey?: string | number;
    as?: "span" | "h1" | "h2";
}

export function GlitchText({ text, className, style, triggerKey, as = "span" }: GlitchTextProps) {
    const [play, setPlay] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Tag = as as any;

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlay(false);
        const id = requestAnimationFrame(() => setPlay(true));
        return () => cancelAnimationFrame(id);
    }, [triggerKey, text]);

    return (
        <Tag
            className={className}
            data-text={text}
            style={{ ...style, position: "relative", display: "inline-block" }}
        >
            <span style={{ position: "relative", zIndex: 1 }}>{text}</span>
            {play && (
                <>
                    <span aria-hidden className="glitch-layer glitch-cyan">{text}</span>
                    <span aria-hidden className="glitch-layer glitch-red">{text}</span>
                </>
            )}
            <style jsx>{`
                .glitch-layer {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    overflow: hidden;
                    opacity: 0.85;
                }
                .glitch-cyan {
                    color: var(--color-jedi-cyan, #5eead4);
                    animation: glitchShift 420ms steps(2, end) 1;
                    mix-blend-mode: screen;
                }
                .glitch-red {
                    color: var(--color-imperial-red);
                    animation: glitchShift 420ms steps(2, end) 1 reverse;
                    mix-blend-mode: screen;
                }
                @keyframes glitchShift {
                    0% { clip-path: inset(0 0 85% 0); transform: translate3d(-3px, 0, 0); }
                    20% { clip-path: inset(20% 0 60% 0); transform: translate3d(3px, 0, 0); }
                    40% { clip-path: inset(60% 0 5% 0); transform: translate3d(-2px, 0, 0); }
                    60% { clip-path: inset(10% 0 70% 0); transform: translate3d(2px, 0, 0); }
                    80% { clip-path: inset(75% 0 2% 0); transform: translate3d(-1px, 0, 0); }
                    100% { clip-path: inset(0 0 0 0); transform: translate3d(0, 0, 0); opacity: 0; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .glitch-layer { display: none; }
                }
            `}</style>
        </Tag>
    );
}