"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useReducedMotion } from "./hooks/useReducedMotion";

interface BootFlickerProps {
  onComplete: () => void;
  children: React.ReactNode;
}

/**
 * Phase 0 (void) -> Phase 1 (power-on): a couple of quick brightness/scaleY
 * flickers plus one chromatic-aberration pulse, ramping the whole frame
 * from black to visible. Purely orchestration — content underneath is
 * unaware this is happening.
 */
export default function BootFlicker({ onComplete, children }: BootFlickerProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const aberrationRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const frame = frameRef.current;
    const aberration = aberrationRef.current;
    if (!frame) return;

    if (reducedMotion) {
      gsap.set(frame, { opacity: 1 });
      onComplete();
      return;
    }

    const tl = gsap.timeline({ onComplete });

    tl.set(frame, { opacity: 0, scaleY: 1 })
      .to(frame, { opacity: 0.6, duration: 0.05 })
      .to(frame, { opacity: 0.1, scaleY: 0.98, duration: 0.04 })
      .to(frame, { opacity: 0.8, scaleY: 1, duration: 0.06 })
      .to(frame, { opacity: 0.2, duration: 0.03 })
      .to(frame, { opacity: 1, duration: 0.42, ease: "power2.out" }, ">")
      .fromTo(
        aberration,
        { opacity: 0.5 },
        { opacity: 0, duration: 0.35, ease: "power2.out" },
        "<"
      );

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={frameRef}>{children}</div>
      <div
        ref={aberrationRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          pointerEvents: "none",
          opacity: 0,
          mixBlendMode: "screen",
          background:
            "linear-gradient(90deg, rgba(255,0,60,0.35) 0%, transparent 2%, transparent 98%, rgba(0,220,255,0.35) 100%)",
        }}
      />
    </div>
  );
}
