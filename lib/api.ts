export type ClassificationType = "critical" | "warning" | "info";

export interface FlaggedPhrase {
    /** exact substring to highlight in the source text — must appear verbatim in inputText */
    phrase: string;
    type: ClassificationType;
    label: string; // e.g. "FORCE-SENSITIVE MARKERS"
}

export interface AnalysisResult {
    id: string;
    inputText: string;
    threatScore: number; // 0-100
    summary: string;
    flagged: FlaggedPhrase[];
    createdAt: string;
}

export async function analyzeTransmission(inputText: string): Promise<AnalysisResult> {
    const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText }),
    });
    if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
    return res.json();
}

export async function getAnalysisHistory(agentId: string): Promise<AnalysisResult[]> {
    const res = await fetch(`/api/analyze/history?agent_id=${encodeURIComponent(agentId)}`);
    if (!res.ok) throw new Error(`History fetch failed (${res.status})`);
    return res.json();
}