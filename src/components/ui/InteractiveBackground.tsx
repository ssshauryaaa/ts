"use client";

import { useEffect, useRef } from "react";

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking with smooth lerp
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      isHovered: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isHovered = true;
    };

    const handleMouseLeave = () => {
      mouse.isHovered = false;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.012;

      // Smooth lerp mouse position
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // 1. Deep obsidian base fill
      ctx.fillStyle = "#030508";
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle dark ambient radial background (no red)
      const baseGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        0,
        width * 0.5,
        height * 0.4,
        Math.max(width, height) * 0.8
      );
      baseGrad.addColorStop(0, "rgba(15, 23, 42, 0.5)");
      baseGrad.addColorStop(0.6, "rgba(6, 9, 15, 0.95)");
      baseGrad.addColorStop(1, "#010204");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Ultra-subtle monochrome slate spotlight on hover
      if (mouse.isHovered) {
        const spotGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          300
        );
        spotGrad.addColorStop(0, "rgba(148, 163, 184, 0.04)");
        spotGrad.addColorStop(0.5, "rgba(51, 65, 85, 0.015)");
        spotGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 300, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Muted slate dot matrix (no white, no red)
      const spacing = 32;
      const dotRadius = 0.75;

      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          let alpha = 0.04;

          if (mouse.isHovered) {
            const dx = mouse.x - x;
            const dy = mouse.y - y;
            const distSq = dx * dx + dy * dy;
            const maxDistSq = 250 * 250;

            if (distSq < maxDistSq) {
              const factor = 1 - Math.sqrt(distSq) / 250;
              alpha += factor * 0.16;
            }
          }

          // Subtle breathing effect
          const breath = Math.sin(time + x * 0.008 + y * 0.008) * 0.01;
          const finalAlpha = Math.max(0.015, Math.min(0.2, alpha + breath));

          // Muted slate gray dot color
          ctx.fillStyle = `rgba(100, 116, 139, ${finalAlpha})`;
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
}
