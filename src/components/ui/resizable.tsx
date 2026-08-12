"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface ResizablePanelGroupProps {
  direction: "horizontal" | "vertical";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultSize?: number; // percent
  minSize?: number;
  maxSize?: number;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

const PanelContext = React.createContext<{
  sizes: number[];
  setSizes: React.Dispatch<React.SetStateAction<number[]>>;
  direction: "horizontal" | "vertical";
  panelCount: number;
  registerPanel: () => number;
}>({
  sizes: [],
  setSizes: () => {},
  direction: "horizontal",
  panelCount: 0,
  registerPanel: () => 0,
});

export function ResizablePanelGroup({ direction, children, className, style }: ResizablePanelGroupProps) {
  const panelIdxRef = useRef(0);
  const childArray = React.Children.toArray(children).filter(
    (c) => React.isValidElement(c) && (c.type as any).displayName === "ResizablePanel"
  );
  const count = childArray.length;
  const [sizes, setSizes] = useState<number[]>(() => Array(count).fill(100 / count));
  const registerPanel = useCallback(() => { const idx = panelIdxRef.current; panelIdxRef.current++; return idx; }, []);

  return (
    <PanelContext.Provider value={{ sizes, setSizes, direction, panelCount: count, registerPanel }}>
      <div
        className={className}
        style={{ display: "flex", flexDirection: direction === "horizontal" ? "row" : "column", width: "100%", height: "100%", ...style }}
      >
        {React.Children.map(children, (child, i) => {
          if (!React.isValidElement(child)) return child;
          const isHandle = (child.type as any).displayName === "ResizableHandle";
          if (isHandle) return React.cloneElement(child as React.ReactElement<any>, { panelIndex: Math.floor(i / 2) });
          return child;
        })}
      </div>
    </PanelContext.Provider>
  );
}

export function ResizablePanel({ children, defaultSize, minSize = 10, maxSize = 90, className, style, id }: ResizablePanelProps) {
  const { sizes, direction, registerPanel } = React.useContext(PanelContext);
  const idxRef = useRef(-1);
  if (idxRef.current === -1) idxRef.current = registerPanel();
  const idx = idxRef.current;
  const size = sizes[idx] ?? defaultSize ?? (100 / Math.max(sizes.length, 1));

  return (
    <div
      id={id}
      className={className}
      style={{
        ...(direction === "horizontal" ? { width: `${size}%`, minWidth: `${minSize}%`, maxWidth: `${maxSize}%` } : { height: `${size}%`, minHeight: `${minSize}%`, maxHeight: `${maxSize}%` }),
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
ResizablePanel.displayName = "ResizablePanel";

interface ResizableHandleProps {
  panelIndex?: number;
  withHandle?: boolean;
  className?: string;
}

export function ResizableHandle({ panelIndex = 0, withHandle = true, className }: ResizableHandleProps) {
  const { direction, setSizes, sizes, panelCount } = React.useContext(PanelContext);
  const dragging = useRef(false);
  const startPos = useRef(0);
  const startSizes = useRef<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    setActive(true);
    startPos.current = direction === "horizontal" ? e.clientX : e.clientY;
    startSizes.current = [...sizes];
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const parent = containerRef.current.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const total = direction === "horizontal" ? rect.width : rect.height;
    const delta = ((direction === "horizontal" ? e.clientX : e.clientY) - startPos.current) / total * 100;
    setSizes((prev) => {
      const next = [...prev];
      const a = panelIndex;
      const b = panelIndex + 1;
      if (a < 0 || b >= panelCount) return prev;
      const newA = Math.max(10, Math.min(85, startSizes.current[a] + delta));
      const diff = newA - startSizes.current[a];
      const newB = Math.max(10, Math.min(85, startSizes.current[b] - diff));
      next[a] = newA;
      next[b] = newB;
      return next;
    });
  }, [direction, panelIndex, panelCount, setSizes]);

  const onPointerUp = useCallback(() => { dragging.current = false; setActive(false); }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => { window.removeEventListener("pointermove", onPointerMove); window.removeEventListener("pointerup", onPointerUp); };
  }, [onPointerMove, onPointerUp]);

  const isH = direction === "horizontal";
  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      className={className}
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        ...(isH ? { width: 8, cursor: "col-resize", height: "100%" } : { height: 8, cursor: "row-resize", width: "100%" }),
        background: active ? "rgba(220,38,38,0.3)" : "rgba(31,36,43,0.8)",
        transition: "background 150ms",
        position: "relative",
      }}
    >
      {withHandle && (
        <div style={{
          ...(isH ? { width: 2, height: 32, borderRadius: 2 } : { height: 2, width: 32, borderRadius: 2 }),
          background: active ? "#dc2626" : "rgba(220,38,38,0.4)",
          transition: "background 150ms, box-shadow 150ms",
          boxShadow: active ? "0 0 8px #dc2626" : "none",
        }} />
      )}
    </div>
  );
}
ResizableHandle.displayName = "ResizableHandle";
