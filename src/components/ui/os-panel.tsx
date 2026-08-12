"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface OSPanelProps {
  id: string;
  title: string;
  icon?: string;
  accentColor?: string;
  status?: string;
  statusColor?: string;
  children: React.ReactNode;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  /** Called when panel z-index should be raised */
  onFocus?: (id: string) => void;
  zIndex?: number;
  className?: string;
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}`,
        animation: "osPanelPulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

export function OSPanel({
  id,
  title,
  icon,
  accentColor = "#dc2626",
  status,
  statusColor,
  children,
  defaultX = 100,
  defaultY = 80,
  defaultWidth = 360,
  defaultHeight = 280,
  minWidth = 220,
  minHeight = 160,
  maxWidth = 1400,
  maxHeight = 1000,
  onFocus,
  zIndex = 10,
}: OSPanelProps) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight });
  const [mounted, setMounted] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; panelX: number; panelY: number } | null>(null);
  const resizeState = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Drag
  const onTitlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = { startX: e.clientX, startY: e.clientY, panelX: pos.x, panelY: pos.y };
      onFocus?.(id);
    },
    [pos.x, pos.y, onFocus, id]
  );

  const onTitlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const newX = Math.max(0, dragState.current.panelX + dx);
    const newY = Math.max(0, dragState.current.panelY + dy);
    setPos({ x: newX, y: newY });
  }, []);

  const onTitlePointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  // Resize
  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      resizeState.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
    },
    [size]
  );

  const onResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!resizeState.current) return;
      const dx = e.clientX - resizeState.current.startX;
      const dy = e.clientY - resizeState.current.startY;
      const newW = Math.max(minWidth, Math.min(maxWidth, resizeState.current.startW + dx));
      const newH = Math.max(minHeight, Math.min(maxHeight, resizeState.current.startH + dy));
      setSize({ w: newW, h: newH });
    },
    [minWidth, minHeight, maxWidth, maxHeight]
  );

  const onResizePointerUp = useCallback(() => {
    resizeState.current = null;
  }, []);

  const sc = statusColor ?? accentColor;

  return (
    <>
      <style>{`
        @keyframes osPanelPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes osPanelMount { from{opacity:0;transform:scale(0.92) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes osPanelShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
      `}</style>
      <div
        ref={panelRef}
        onClick={() => onFocus?.(id)}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: size.w,
          height: size.h,
          zIndex,
          display: "flex",
          flexDirection: "column",
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(5,8,16,0.78)",
          border: `1px solid color-mix(in srgb,${accentColor} 25%,rgba(30,36,50,0.9))`,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          boxShadow: `0 0 0 1px color-mix(in srgb,${accentColor} 12%,transparent), 0 24px 64px -12px rgba(0,0,0,0.85), inset 0 0 80px -30px color-mix(in srgb,${accentColor} 8%,transparent)`,
          animation: mounted ? "none" : "osPanelMount 350ms cubic-bezier(0.34,1.56,0.64,1) forwards",
          transition: "box-shadow 200ms ease",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 1px color-mix(in srgb,${accentColor} 40%,transparent), 0 32px 80px -16px rgba(0,0,0,0.9), inset 0 0 80px -20px color-mix(in srgb,${accentColor} 12%,transparent)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 1px color-mix(in srgb,${accentColor} 12%,transparent), 0 24px 64px -12px rgba(0,0,0,0.85), inset 0 0 80px -30px color-mix(in srgb,${accentColor} 8%,transparent)`;
        }}
      >
        {/* Corner brackets */}
        {(["tl", "tr", "bl", "br"] as const).map((c) => (
          <span
            key={c}
            style={{
              position: "absolute",
              width: 12,
              height: 12,
              borderStyle: "solid",
              borderWidth: 0,
              borderColor: accentColor,
              opacity: 0.5,
              zIndex: 5,
              pointerEvents: "none",
              ...(c === "tl"
                ? { top: 4, left: 4, borderTopWidth: 1.5, borderLeftWidth: 1.5 }
                : c === "tr"
                ? { top: 4, right: 4, borderTopWidth: 1.5, borderRightWidth: 1.5 }
                : c === "bl"
                ? { bottom: 4, left: 4, borderBottomWidth: 1.5, borderLeftWidth: 1.5 }
                : { bottom: 4, right: 4, borderBottomWidth: 1.5, borderRightWidth: 1.5 }),
            }}
          />
        ))}

        {/* Inner glass sheen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 55%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Animated shimmer border top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent 0%, color-mix(in srgb,${accentColor} 60%,#fff) 50%, transparent 100%)`,
            backgroundSize: "200% 100%",
            animation: "osPanelShimmer 3s linear infinite",
            opacity: 0.6,
            zIndex: 6,
            pointerEvents: "none",
          }}
        />

        {/* Title bar — drag handle */}
        <div
          onPointerDown={onTitlePointerDown}
          onPointerMove={onTitlePointerMove}
          onPointerUp={onTitlePointerUp}
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderBottom: `1px solid color-mix(in srgb,${accentColor} 20%,rgba(25,30,42,0.9))`,
            background: "rgba(0,0,0,0.35)",
            cursor: "grab",
            zIndex: 4,
          }}
        >
          {/* Traffic lights */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#ff5f57",
                boxShadow: "0 0 4px #ff5f57",
                cursor: "default",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#febc2e",
                boxShadow: "0 0 4px #febc2e",
                cursor: "default",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#28c840",
                boxShadow: "0 0 4px #28c840",
                cursor: "default",
                flexShrink: 0,
              }}
            />
          </div>

          {/* Title */}
          <div style={{ flex: 1, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {icon && (
              <span style={{ color: accentColor, fontSize: 9 }}>{icon}</span>
            )}
            <span
              style={{
                fontFamily: "var(--font-nav)",
                fontSize: 9,
                color: "#94a3b8",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              {title}
            </span>
          </div>

          {/* Status */}
          {status && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Dot color={sc} />
              <span
                style={{
                  fontFamily: "var(--font-nav)",
                  fontSize: 8,
                  color: sc,
                  letterSpacing: "0.12em",
                }}
              >
                {status}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            position: "relative",
            zIndex: 2,
            scrollbarWidth: "thin",
            scrollbarColor: `${accentColor} transparent`,
          }}
        >
          {children}
        </div>

        {/* Resize grip */}
        <div
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          title="Drag to resize"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 18,
            height: 18,
            cursor: "nwse-resize",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.35,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.35")}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <line x1="9" y1="1" x2="1" y2="9" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
            <line x1="9" y1="5" x2="5" y2="9" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </>
  );
}
