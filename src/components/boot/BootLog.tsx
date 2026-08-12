"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./hooks/useReducedMotion";
import styles from "./BootLog.module.css";

interface LogLine {
  text: string;
  status: "OK" | "WARN" | null;
  /** Target progress % once this line resolves. */
  progress: number;
}

const LINES: LogLine[] = [
  { text: "INITIALIZING SURVEILLANCE LATTICE...", status: "OK", progress: 20 },
  { text: "CROSS-REFERENCING HOLOCRON DATABASE...", status: "OK", progress: 55 },
  { text: "VERIFYING SECTOR CLEARANCE...", status: "OK", progress: 80 },
  { text: "AWAITING CALLSIGN...", status: null, progress: 100 },
];

const CHAR_INTERVAL = 14; // ms per character, diegetic typewriter

export default function BootLog({ onComplete }: { onComplete: () => void }) {
  const [resolvedLines, setResolvedLines] = useState<
    { text: string; status: "OK" | "WARN" | null }[]
  >([]);
  const [currentTyped, setCurrentTyped] = useState("");
  const [progress, setProgress] = useState(0);
  const reducedMotion = useReducedMotion();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (reducedMotion) {
      setResolvedLines(LINES.map((l) => ({ text: l.text, status: l.status })));
      setProgress(100);
      const t = setTimeout(onComplete, 200);
      return () => clearTimeout(t);
    }

    let cancelled = false;

    async function typeLine(line: LogLine) {
      for (let i = 1; i <= line.text.length; i++) {
        if (cancelled) return;
        setCurrentTyped(line.text.slice(0, i));
        await new Promise((r) => setTimeout(r, CHAR_INTERVAL));
      }
      if (cancelled) return;
      setResolvedLines((prev) => [...prev, { text: line.text, status: line.status }]);
      setCurrentTyped("");
      setProgress(line.progress);
      await new Promise((r) => setTimeout(r, 220));
    }

    (async () => {
      for (const line of LINES) {
        if (cancelled) return;
        await typeLine(line);
      }
      if (!cancelled) {
        await new Promise((r) => setTimeout(r, 300));
        onComplete();
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return (
    <div className={styles.log}>
      <div className={styles.lines}>
        {resolvedLines.map((line, i) => (
          <div key={i} className={styles.line}>
            <span>&gt; {line.text}</span>
            {line.status && (
              <span className={styles.status} data-status={line.status}>
                [{line.status}]
              </span>
            )}
          </div>
        ))}
        {currentTyped && (
          <div className={styles.line}>
            <span>
              &gt; {currentTyped}
              <span className={styles.cursor}>▮</span>
            </span>
          </div>
        )}
      </div>

      <div className={styles.progressTrack} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.progressLabel}>{Math.floor(progress)}%</div>
    </div>
  );
}
