"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface RadialGaugeProps {
    /** 0–100 */
    value: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
    /** stroke color — defaults to var(--color-imperial-red) */
    color?: string;
    className?: string;
    /** duration of the count-up + arc fill, ms */
    duration?: number;
}

export function RadialGauge({
    value,
    size = 140,
    strokeWidth = 10,
    label,
    color = "var(--color-imperial-red)",
    className,
    duration = 1100,
}: RadialGaugeProps) {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const start = performance.now();
        const from = 0;
        const to = Math.max(0, Math.min(100, value));

        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            // ease-out-cubic — a gauge should settle, not overshoot
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(from + (to - from) * eased));
            if (t < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [value, duration]);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - display / 100);

    return (
        <div className={cn("relative inline-flex flex-col items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-steel)" strokeWidth={strokeWidth} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke 300ms var(--ease-terminal)" }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="tabular-nums" style={{ fontFamily: "var(--font-mono-stat)", fontSize: size * 0.26, color: "var(--color-text-primary)" }}>
                    {display}
                </span>
                {label && (
                    <span
                        className="mt-1 text-center uppercase tracking-wider"
                        style={{ fontFamily: "var(--font-nav)", fontSize: size * 0.075, color: "var(--color-text-dim)" }}
                    >
                        {label}
                    </span>
                )}
            </div>
        </div>
    );
}