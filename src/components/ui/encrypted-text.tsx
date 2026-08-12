"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

type EncryptedTextProps = {
  text: string;
  className?: string;
  revealDelayMs?: number;
  charset?: string;
  flipDelayMs?: number;
  encryptedClassName?: string;
  revealedClassName?: string;
};

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";

function generateRandomCharacter(charset: string): string {
  return charset.charAt(Math.floor(Math.random() * charset.length));
}

function generateGibberish(original: string, charset: string): string {
  return original.split("").map((ch) => (ch === " " ? " " : generateRandomCharacter(charset))).join("");
}

export const EncryptedText: React.FC<EncryptedTextProps> = ({
  text, className, revealDelayMs = 50, charset = DEFAULT_CHARSET, flipDelayMs = 50, encryptedClassName, revealedClassName,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [revealCount, setRevealCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const lastFlipRef = useRef(0);
  const scrambleRef = useRef<string[]>(generateGibberish(text, charset).split(""));

  useEffect(() => {
    if (!isInView) return;
    scrambleRef.current = generateGibberish(text, charset).split("");
    startRef.current = performance.now();
    lastFlipRef.current = startRef.current;
    setRevealCount(0);
    let cancelled = false;
    const update = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startRef.current;
      const revealed = Math.min(text.length, Math.floor(elapsed / Math.max(1, revealDelayMs)));
      setRevealCount(revealed);
      if (revealed >= text.length) return;
      if (now - lastFlipRef.current >= Math.max(0, flipDelayMs)) {
        scrambleRef.current = scrambleRef.current.map((ch, i) => i >= revealed && text[i] !== " " ? generateRandomCharacter(charset) : ch);
        lastFlipRef.current = now;
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => { cancelled = true; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isInView, text, revealDelayMs, charset, flipDelayMs]);

  if (!text) return null;
  return (
    <motion.span ref={ref} className={cn(className)} aria-label={text} role="text" suppressHydrationWarning>
      {text.split("").map((char, i) => {
        const isRevealed = i < revealCount;
        const display = isRevealed ? char : char === " " ? " " : (scrambleRef.current[i] ?? generateRandomCharacter(charset));
        return <span key={i} className={cn(isRevealed ? revealedClassName : encryptedClassName)} suppressHydrationWarning>{display}</span>;
      })}
    </motion.span>
  );
};
