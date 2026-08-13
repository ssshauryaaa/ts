"use client";

import { useEffect, useRef } from "react";

interface VoidHorizonProps {
    /** grayscale only — keep this component monochrome by design */
    className?: string;
}

/**
 * Replaces a literal starfield with a "signal field": a converging
 * horizon grid, one slow radar sweep, and sparse drifting dust motes.
 * Monochrome, restrained, and tied to the boot terminal's own vocabulary
 * (SECTOR TIME, NEURAL SYNC ACTIVE) rather than a generic space cliché.
 */
export default function VoidHorizon({ className = "fixed inset-0 z-0" }: VoidHorizonProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const reduced =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let width = 0;
        let height = 0;
        let dpr = 1;
        let frameId: number;
        let sweepAngle = 0;

        const motes = Array.from({ length: 46 }, () => ({
            x: Math.random(),
            y: Math.random(),
            r: Math.random() * 1.2 + 0.4,
            drift: Math.random() * 0.00012 + 0.00004,
            phase: Math.random() * Math.PI * 2,
        }));

        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener("resize", resize);

        const horizonY = () => height * 0.62;

        const drawGrid = (t: number) => {
            const hy = horizonY();
            const vanishX = width / 2;
            ctx.strokeStyle = "rgba(255,255,255,0.05)";
            ctx.lineWidth = 1;

            // radial lines converging toward the vanishing point
            const lineCount = 9;
            for (let i = 0; i <= lineCount; i++) {
                const spread = (i / lineCount - 0.5) * width * 1.6;
                ctx.beginPath();
                ctx.moveTo(vanishX + spread, height);
                ctx.lineTo(vanishX, hy);
                ctx.stroke();
            }

            // horizontal rungs, closer together near the horizon
            const rungs = 7;
            for (let i = 1; i <= rungs; i++) {
                const p = Math.pow(i / rungs, 2.1);
                const y = height - p * (height - hy);
                const drift = reduced ? 0 : Math.sin(t * 0.00015 + i) * 2;
                ctx.strokeStyle = `rgba(255,255,255,${0.045 * (1 - p * 0.6)})`;
                ctx.beginPath();
                ctx.moveTo(0, y + drift);
                ctx.lineTo(width, y + drift);
                ctx.stroke();
            }
        };

        const drawGlow = (t: number) => {
            const hy = horizonY();
            const pulse = reduced ? 1 : 0.85 + Math.sin(t * 0.0006) * 0.15;
            const g = ctx.createRadialGradient(
                width / 2,
                hy,
                0,
                width / 2,
                hy,
                Math.max(width, height) * 0.55 * pulse
            );
            g.addColorStop(0, "rgba(255,255,255,0.10)");
            g.addColorStop(0.35, "rgba(255,255,255,0.03)");
            g.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, width, height);
        };

        const drawSweep = () => {
            const hy = horizonY();
            const radius = Math.max(width, height) * 0.75;
            ctx.save();
            ctx.translate(width / 2, hy);
            ctx.rotate(sweepAngle);
            const sweepGrad = ctx.createLinearGradient(0, 0, radius, 0);
            sweepGrad.addColorStop(0, "rgba(255,255,255,0.09)");
            sweepGrad.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = sweepGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, -0.09, 0.09);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            if (!reduced) sweepAngle += 0.0022;
        };

        const drawMotes = (t: number) => {
            motes.forEach((m) => {
                const y = reduced ? m.y : (m.y + t * m.drift) % 1;
                const flicker = reduced ? 0.5 : 0.35 + Math.sin(t * 0.0012 + m.phase) * 0.25;
                ctx.beginPath();
                ctx.arc(m.x * width, y * height, m.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${Math.max(0.05, flicker)})`;
                ctx.fill();
            });
        };

        const render = (t: number) => {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, width, height);
            drawGlow(t);
            drawGrid(t);
            drawSweep();
            drawMotes(t);
            frameId = requestAnimationFrame(render);
        };
        frameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(frameId);
        };
    }, []);

    return <canvas ref={canvasRef} className={className} style={{ pointerEvents: "none" }} />;
}