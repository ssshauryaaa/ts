"use client";
import { useEffect, useRef } from "react";

export function StarfieldCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let w = (canvas.width = window.innerWidth);
        let h = (canvas.height = window.innerHeight);

        const LAYERS = [
            { count: 90, speed: 0.05, size: 1, alpha: 0.5 },
            { count: 50, speed: 0.12, size: 1.4, alpha: 0.75 },
            { count: 25, speed: 0.25, size: 2, alpha: 1 },
        ];
        type Star = { x: number; y: number; z: number };
        const layers: Star[][] = LAYERS.map((l) =>
            Array.from({ length: l.count }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random() }))
        );

        let mouseX = 0, mouseY = 0;
        const onMouse = (e: MouseEvent) => {
            mouseX = (e.clientX / w - 0.5) * 20;
            mouseY = (e.clientY / h - 0.5) * 20;
        };
        window.addEventListener("mousemove", onMouse);

        let streak: { x: number; y: number; len: number; life: number } | null = null;

        const onResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", onResize);

        let raf: number;
        const draw = () => {
            ctx.fillStyle = "#05070c";
            ctx.fillRect(0, 0, w, h);

            layers.forEach((stars, i) => {
                const cfg = LAYERS[i];
                ctx.fillStyle = `rgba(210, 225, 255, ${cfg.alpha})`;
                stars.forEach((s) => {
                    if (!reduceMotion) {
                        s.y += cfg.speed;
                        if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
                    }
                    const px = s.x + mouseX * (i + 1) * 0.4;
                    const py = s.y + mouseY * (i + 1) * 0.4;
                    ctx.beginPath();
                    ctx.arc(px, py, cfg.size, 0, Math.PI * 2);
                    ctx.fill();
                });
            });

            if (!reduceMotion) {
                if (!streak && Math.random() < 0.006) {
                    streak = { x: Math.random() * w, y: 0, len: 0, life: 1 };
                }
                if (streak) {
                    streak.len += 40;
                    streak.life -= 0.02;
                    const grad = ctx.createLinearGradient(streak.x, streak.y, streak.x - streak.len * 0.3, streak.y + streak.len);
                    grad.addColorStop(0, `rgba(120,190,255,0)`);
                    grad.addColorStop(1, `rgba(120,190,255,${Math.max(streak.life, 0)})`);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(streak.x, streak.y);
                    ctx.lineTo(streak.x - streak.len * 0.3, streak.y + streak.len);
                    ctx.stroke();
                    if (streak.life <= 0) streak = null;
                }
            }

            raf = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("mousemove", onMouse);
        };
    }, []);

    return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-10" />;
}