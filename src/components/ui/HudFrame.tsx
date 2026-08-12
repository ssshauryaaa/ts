"use client";

import { useRef } from "react";



interface HudFrameProps {

    children: React.ReactNode;

    accent: string; // css color/var

    active?: boolean; // pulses the border, e.g. while analyzing

    label?: string;

    status?: string;

    className?: string;

}



export function HudFrame({ children, accent, active, label, status, className }: HudFrameProps) {

    const cardRef = useRef<HTMLDivElement>(null);



    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {

        if (!cardRef.current || window.matchMedia("(pointer: coarse)").matches) return;

        const rect = cardRef.current.getBoundingClientRect();

        const px = (e.clientX - rect.left) / rect.width - 0.5;

        const py = (e.clientY - rect.top) / rect.height - 0.5;

        cardRef.current.style.transform = `perspective(1000px) rotateX(${py * -6}deg) rotateY(${px * 8}deg) translateZ(0)`;

    };



    const handleLeave = () => {

        if (!cardRef.current) return;

        cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";

    };



    return (

        <div

            className={`hud-outer ${className ?? ""}`}

            style={{ perspective: "1000px" }}

            onMouseMove={handleMove}

            onMouseLeave={handleLeave}

        >

            <div ref={cardRef} className="hud-card" style={{ borderColor: accent, ["--hud-accent" as any]: accent }}>

                {(label || status) && (

                    <div className="hud-topbar">

                        {label && <span className="hud-label">{label}</span>}

                        {status && <span className="hud-status" style={{ color: accent }}>{status}</span>}

                    </div>

                )}



                <div className="hud-body">{children}</div>



                {/* targeting-computer corner brackets */}

                {["tl", "tr", "bl", "br"].map((c) => (

                    <span key={c} className={`hud-corner hud-corner-${c}`} style={{ borderColor: accent }} />

                ))}



                {active && <div className="hud-sweep" style={{ background: `linear-gradient(180deg, transparent, ${accent}55, transparent)` }} />}

            </div>



            <style jsx>{`

                .hud-outer { height: 100%; transform-style: preserve-3d; }

                .hud-card {

                    position: relative;

                    height: 100%;

                    display: flex;

                    flex-direction: column;

                    border: 1px solid;

                    border-radius: 10px;

                    background: linear-gradient(160deg, var(--color-gunmetal) 0%, color-mix(in srgb, var(--color-gunmetal) 92%, black) 100%);

                    box-shadow: 0 0 0 1px color-mix(in srgb, var(--hud-accent) 25%, transparent), 0 20px 60px -20px black, inset 0 0 40px -20px var(--hud-accent);

                    transition: transform 120ms ease-out, box-shadow 300ms ease;

                    overflow: hidden;

                    will-change: transform;

                }

                .hud-topbar {

                    display: flex;

                    justify-content: space-between;

                    align-items: center;

                    padding: 10px 16px;

                    border-bottom: 1px solid color-mix(in srgb, var(--hud-accent) 30%, var(--color-steel));

                    font-family: var(--font-nav);

                    font-size: 11px;

                    letter-spacing: 0.08em;

                    text-transform: uppercase;

                }

                .hud-label { color: var(--color-text-dim); }

                .hud-body { flex: 1; min-height: 0; position: relative; }

                .hud-corner {

                    position: absolute;

                    width: 16px;

                    height: 16px;

                    border-style: solid;

                    border-width: 0;

                    opacity: 0.9;

                    filter: drop-shadow(0 0 4px var(--hud-accent));

                    pointer-events: none;

                }

                .hud-corner-tl { top: 6px; left: 6px; border-top-width: 2px; border-left-width: 2px; }

                .hud-corner-tr { top: 6px; right: 6px; border-top-width: 2px; border-right-width: 2px; }

                .hud-corner-bl { bottom: 6px; left: 6px; border-bottom-width: 2px; border-left-width: 2px; }

                .hud-corner-br { bottom: 6px; right: 6px; border-bottom-width: 2px; border-right-width: 2px; }

                .hud-sweep {

                    position: absolute;

                    left: 0; right: 0;

                    height: 40%;

                    animation: sweep 2.4s linear infinite;

                    pointer-events: none;

                    mix-blend-mode: screen;

                }

                @keyframes sweep {

                    0% { top: -40%; }

                    100% { top: 100%; }

                }

                @media (prefers-reduced-motion: reduce) {

                    .hud-sweep { display: none; }

                    .hud-card { transition: none; }

                }

            `}</style>

        </div>

    );

}