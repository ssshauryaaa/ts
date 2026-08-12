"use client";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/api";

interface CaseFileHistoryProps {
    history: AnalysisResult[];
    selectedId: string | null;
    onSelect: (item: AnalysisResult) => void;
}

export function CaseFileHistory({ history, selectedId, onSelect }: CaseFileHistoryProps) {
    if (history.length === 0) return null;

    return (
        <div className="flex gap-3 overflow-x-auto pb-1 lg:w-40 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0 lg:pr-1">
            {history.map((item) => {
                const active = item.id === selectedId;
                return (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className={cn(
                            "shrink-0 rounded-lg border px-3 py-2 text-left transition-all lg:shrink",
                            active ? "opacity-100" : "opacity-60 hover:opacity-90"
                        )}
                        style={{
                            background: "var(--color-gunmetal)",
                            borderColor: active ? "var(--color-imperial-red)" : "var(--color-steel)",
                            minWidth: 140,
                        }}
                    >
                        <div
                            className="uppercase tracking-wider"
                            style={{ fontFamily: "var(--font-nav)", fontSize: 10, color: "var(--color-text-dim)" }}
                        >
                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </div>
                        <div
                            className="mt-1 truncate"
                            style={{ fontFamily: "var(--font-terminal)", fontSize: 12, color: "var(--color-text-muted)" }}
                        >
                            {item.inputText.slice(0, 28) || "—"}
                        </div>
                        <div
                            className="mt-1 tabular-nums"
                            style={{ fontFamily: "var(--font-mono-stat)", fontSize: 14, color: "var(--color-imperial-red)" }}
                        >
                            {item.threatScore}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}