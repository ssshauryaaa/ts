'use client';

import { useEffect, useRef } from 'react';

type StarfieldBackgroundProps = {
    /** Number of stars rendered at once */
    starCount?: number;
    /** Base travel speed (higher = faster hyperspace) */
    speed?: number;
    /** Hex color of the stars/trails */
    color?: string;
    /** CSS background behind the canvas */
    backgroundColor?: string;
    className?: string;
};

type Star = {
    x: number; // -1..1 position on the projection plane
    y: number;
    z: number; // depth, large = far away, 0 = at the camera
    pz: number; // previous z, used to draw the streak
};

/**
 * Full-bleed animated "hyperspace" starfield, similar to the iOS
 * spatial wallpapers / classic Star Wars jump-to-lightspeed effect.
 *
 * Usage:
 *   <StarfieldBackground className="fixed inset-0 -z-10" />
 * Place it as a fixed/absolute layer behind your page content.
 */
export default function StarfieldBackground({
    starCount = 800,
    speed = 2,
    color = '255, 255, 255',
    backgroundColor = '#000000',
    className = '',
}: StarfieldBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        let width = 0;
        let height = 0;
        let cx = 0;
        let cy = 0;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);
        let animationId = 0;
        let stars: Star[] = [];
        // gentle drift so it doesn't feel perfectly static/mechanical
        let driftX = 0;
        let driftY = 0;
        let targetDriftX = 0;
        let targetDriftY = 0;

        const FAR = 1000; // starting depth for a fresh star
        const SPEED = speed;

        function resetStar(s: Star, randomizeZ = false) {
            s.x = Math.random() * 2 - 1;
            s.y = Math.random() * 2 - 1;
            s.z = randomizeZ ? Math.random() * FAR : FAR;
            s.pz = s.z;
        }

        function init() {
            const rect = canvas!.getBoundingClientRect();
            width = rect.width || window.innerWidth || 800;
            height = rect.height || window.innerHeight || 600;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas!.width = width * dpr;
            canvas!.height = height * dpr;
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
            cx = width / 2;
            cy = height / 2;

            stars = new Array(starCount).fill(null).map(() => {
                const s: Star = { x: 0, y: 0, z: 0, pz: 0 };
                resetStar(s, true);
                return s;
            });
        }

        function frame() {
            ctx!.fillStyle = backgroundColor;
            ctx!.fillRect(0, 0, width, height);

            // slow parallax drift toward a wandering target, keeps the field alive
            targetDriftX += (Math.random() - 0.5) * 0.002;
            targetDriftY += (Math.random() - 0.5) * 0.002;
            targetDriftX = Math.max(-0.3, Math.min(0.3, targetDriftX));
            targetDriftY = Math.max(-0.3, Math.min(0.3, targetDriftY));
            driftX += (targetDriftX - driftX) * 0.02;
            driftY += (targetDriftY - driftY) * 0.02;

            const scale = Math.max(width, height) * 0.7;

            for (const s of stars) {
                s.pz = s.z;
                s.z -= SPEED * (prefersReducedMotion ? 0.15 : 1);

                if (s.z <= 1) {
                    resetStar(s, false);
                    continue;
                }

                const sx = (s.x + driftX * s.z * 0.002) / s.z;
                const sy = (s.y + driftY * s.z * 0.002) / s.z;
                const px = (s.x + driftX * s.pz * 0.002) / s.pz;
                const py = (s.y + driftY * s.pz * 0.002) / s.pz;

                const screenX = cx + sx * scale * FAR;
                const screenY = cy + sy * scale * FAR;
                const prevX = cx + px * scale * FAR;
                const prevY = cy + py * scale * FAR;

                if (
                    screenX < -50 ||
                    screenX > width + 50 ||
                    screenY < -50 ||
                    screenY > height + 50
                ) {
                    continue;
                }

                const depthRatio = 1 - s.z / FAR; // 0 far, 1 near
                const alpha = Math.min(1, depthRatio * 1.5 + 0.2);
                const lineWidth = Math.max(0.6, depthRatio * 2.8);

                ctx!.strokeStyle = `rgba(${color}, ${alpha})`;
                ctx!.lineWidth = lineWidth;
                ctx!.beginPath();
                ctx!.moveTo(prevX, prevY);
                ctx!.lineTo(screenX, screenY);
                ctx!.stroke();

                // bright core dot for the near stars, sells the 3D depth
                if (depthRatio > 0.6) {
                    ctx!.fillStyle = `rgba(${color}, ${alpha})`;
                    ctx!.beginPath();
                    ctx!.arc(screenX, screenY, lineWidth * 0.6, 0, Math.PI * 2);
                    ctx!.fill();
                }
            }

            animationId = requestAnimationFrame(frame);
        }

        init();
        frame();

        const handleResize = () => init();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [starCount, speed, color, backgroundColor]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ display: 'block', width: '100%', height: '100%' }}
            aria-hidden="true"
        />
    );
}