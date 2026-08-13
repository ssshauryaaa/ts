"use client";
import { useEffect, useRef, useState } from "react";
import { Terminal, type TerminalProps } from "@/src/components/ui/terminal";
import { cn } from "@/lib/utils";

interface FloatingTerminalProps {
    /** initial position, top-left of the window */
    defaultPosition?: { x: number; y: number };
    title?: string;
    terminalProps?: Partial<TerminalProps>;
}

const DEFAULT_COMMANDS = [
    "whoami",
    "clearance --check",
    "uplink --connect isb-central",
];

const DEFAULT_OUTPUTS: Record<number, string[]> = {
    0: ["AGENT-7 // CLEARANCE: RESTRICTED"],
    1: ["✔ Clearance verified.", "✔ Biometric match confirmed."],
    2: ["✔ Secure uplink established.", "✔ Standing by for orders."],
};

export function FloatingTerminal({
    defaultPosition,
    title = "IMPERIAL TERMINAL",
    terminalProps,
}: FloatingTerminalProps) {
    const [open, setOpen] = useState(true);
    const [flashKey, setFlashKey] = useState(0);
    const [pos, setPos] = useState(defaultPosition ?? { x: 0, y: 0 });
    const [ready, setReady] = useState(false);
    const dragRef = useRef<{ dx: number; dy: number } | null>(null);
    const windowRef = useRef<HTMLDivElement>(null);

    // Position in the bottom-right on first mount (viewport-aware), then flash in.
    useEffect(() => {
        if (!defaultPosition && typeof window !== "undefined") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPos({ x: window.innerWidth - 560, y: window.innerHeight - 460 });
        }
        setReady(true);
        setFlashKey((k) => k + 1);
    }, [defaultPosition]);

    const onPointerDown = (e: React.PointerEvent) => {
        const rect = windowRef.current?.getBoundingClientRect();
        if (!rect) return;
        dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
        (e.target as Element).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragRef.current) return;
        setPos({
            x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragRef.current.dx)),
            y: Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragRef.current.dy)),
        });
    };

    const onPointerUp = () => {
        dragRef.current = null;
    };

    if (!open) {
        return (
            <button
                onClick={() => {
                    setOpen(true);
                    setFlashKey((k) => k + 1);
                }}
                className="fixed bottom-5 right-5 z-50 rounded-md border px-3 py-2 uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{
                    fontFamily: "var(--font-nav)",
                    fontSize: 11,
                    color: "var(--color-data-blue)",
                    background: "var(--color-gunmetal)",
                    borderColor: "var(--color-steel)",
                }}
            >
                ▸ Reopen Terminal
            </button>
        );
    }

    return (
        <div
            ref={windowRef}
            key={flashKey}
            className={cn("fixed z-50 select-none", ready && "terminal-flash-in")}
            style={{ left: pos.x, top: pos.y, visibility: ready ? "visible" : "hidden" }}
        >
            <div
                className="scanlines overflow-hidden rounded-lg border shadow-2xl"
                style={{ borderColor: "var(--color-steel)", background: "var(--color-obsidian)" }}
            >
                {/* Draggable title bar */}
                <div
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    className="flex cursor-grab items-center gap-2 border-b px-4 py-2.5 active:cursor-grabbing"
                    style={{ borderColor: "var(--color-steel)", background: "var(--color-gunmetal)" }}
                >
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setOpen(false)}
                            className="h-3 w-3 rounded-full bg-red-500 transition-colors hover:bg-red-600"
                            aria-label="Close terminal"
                        />
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 text-center">
                        <span
                            className="truncate uppercase tracking-wider"
                            style={{ fontFamily: "var(--font-nav)", fontSize: 11, color: "var(--color-text-dim)" }}
                        >
                            {title}
                        </span>
                    </div>
                    <div className="w-[52px]" />
                </div>

                <Terminal
                    commands={terminalProps?.commands ?? DEFAULT_COMMANDS}
                    outputs={terminalProps?.outputs ?? DEFAULT_OUTPUTS}
                    username={terminalProps?.username ?? "isb-terminal"}
                    typingSpeed={terminalProps?.typingSpeed ?? 45}
                    delayBetweenCommands={terminalProps?.delayBetweenCommands ?? 900}
                    enableSound={terminalProps?.enableSound ?? true}
                    className="px-0"
                />
            </div>
        </div>
    );
}