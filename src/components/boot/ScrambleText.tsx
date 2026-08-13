"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "./hooks/useReducedMotion";

const CHARS = "!<>-_\\/[]{}—=+*^?#________";

interface ScrambleTextProps {
  text: string;
  duration?: number;
  delay?: number;
  charset?: string;
  className?: string;
  as?: React.ElementType;
  onComplete?: () => void;
}

export default function ScrambleText({
  text,
  duration = 900,
  delay = 0,
  charset = CHARS,
  className,
  as: Tag = "span",
  onComplete,
}: ScrambleTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reducedMotion) {
      el.textContent = text;
      onComplete?.();
      return;
    }

    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const run = () => {
      const start = performance.now();
      const frame = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const revealCount = Math.floor(progress * text.length);
        el.textContent = text
          .split("")
          .map((ch, i) => {
            if (ch === " ") return " ";
            return i < revealCount
              ? ch
              : charset[Math.floor(Math.random() * charset.length)];
          })
          .join("");
        if (progress < 1) {
          rafId = requestAnimationFrame(frame);
        } else {
          onComplete?.();
        }
      };
      rafId = requestAnimationFrame(frame);
    };

    // eslint-disable-next-line prefer-const
    timeoutId = setTimeout(run, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, duration, delay, charset, reducedMotion]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = Tag as any;
  return (
    <Component ref={ref} className={className}>
      {text}
    </Component>
  );
}
