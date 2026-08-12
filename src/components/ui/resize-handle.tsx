"use client";
import React, { useRef, useState } from "react";

interface ResizeHandleProps {
  direction: "h" | "v";
  onDrag: (delta: number) => void;
  accentColor?: string;
}

export function ResizeHandle({ direction, onDrag, accentColor = "#dc2626" }: ResizeHandleProps) {
  const dragging = useRef(false);
  const last = useRef(0);
  const [hot, setHot] = useState(false);
  const onDown = (e: React.PointerEvent) => {
    dragging.current = true; setHot(true);
    last.current = direction === "h" ? e.clientX : e.clientY;
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const cur = direction === "h" ? e.clientX : e.clientY;
    onDrag(cur - last.current); last.current = cur;
  };
  const onUp = () => { dragging.current = false; setHot(false); };
  const isH = direction === "h";
  return (
    <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
      style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30,
        background: hot ? `color-mix(in srgb,${accentColor} 20%,transparent)` : "rgba(10,12,16,0.5)",
        transition: "background 150ms",
        ...(isH ? { width: 7, cursor: "col-resize", height: "100%" } : { height: 7, cursor: "row-resize", width: "100%" }) }}>
      <div style={{ ...(isH ? { width: 2, height: 24, borderRadius: 2 } : { height: 2, width: 24, borderRadius: 2 }),
        background: hot ? accentColor : `color-mix(in srgb,${accentColor} 35%,transparent)`,
        boxShadow: hot ? `0 0 8px ${accentColor}` : "none", transition: "all 150ms" }} />
    </div>
  );
}
