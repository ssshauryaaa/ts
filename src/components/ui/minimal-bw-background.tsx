"use client";

import { memo, useEffect, useRef } from "react";

export const MinimalBwBackground = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    let time = 0;

    const render = () => {
      time += 0.012;

      // Pure solid black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Clean, minimal black & white dot matrix
      const gridSize = 36;
      for (let x = gridSize / 2; x < width; x += gridSize) {
        for (let y = gridSize / 2; y < height; y += gridSize) {
          // Slow, ambient monochromatic pulse
          const wave = Math.sin(time + x * 0.004 + y * 0.004) * 0.015;
          const alpha = Math.max(0.01, Math.min(0.08, 0.025 + wave));

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 0.75, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
});

MinimalBwBackground.displayName = "MinimalBwBackground";
export default MinimalBwBackground;
