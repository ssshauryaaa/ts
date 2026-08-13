"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useReducedMotion } from "./hooks/useReducedMotion";
import styles from "./AccessGrantedStamp.module.css";

export default function AccessGrantedStamp() {
  const stampRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const wipeRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const stamp = stampRef.current;
    const glow = glowRef.current;
    const wipe = wipeRef.current;
    if (!stamp || !glow || !wipe) return;

    if (reducedMotion) {
      gsap.set(stamp, { scale: 1, opacity: 1 });
      const t = setTimeout(() => router.push("/command"), 500);
      return () => clearTimeout(t);
    }

    const tl = gsap.timeline({
      onComplete: () => router.push("/command"),
    });

    tl
      // 1. Stamp materializes — slow, deliberate scale from slightly above
      .fromTo(
        stamp,
        { scale: 1.08, opacity: 0, y: -4 },
        { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
      )
      // 2. Glow breathes in
      .fromTo(
        glow,
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
        "<0.15"
      )
      // 3. Hold — let the user read it
      .to({}, { duration: 0.9 })
      // 4. Stamp pulses once — a subtle brightness flash
      .to(stamp, { opacity: 0.7, scale: 0.98, duration: 0.12, ease: "power2.in" })
      .to(stamp, { opacity: 1, scale: 1, duration: 0.12, ease: "power2.out" })
      // 5. Hold a beat more
      .to({}, { duration: 0.4 })
      // 6. Wipe from bottom to top — smooth easeInOut, covers stamp + glow
      .set(wipe, { yPercent: 100, opacity: 1 })
      .to(wipe, {
        yPercent: 0,
        duration: 0.55,
        ease: "power4.inOut",
      })
      // 7. Wipe continues off screen upward
      .to(wipe, {
        yPercent: -100,
        duration: 0.45,
        ease: "power4.inOut",
      });

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return (
    <div className={styles.overlay}>
      <div ref={glowRef} className={styles.glowRing} />
      <div ref={stampRef} className={styles.stamp}>
        ACCESS GRANTED
      </div>
      <div ref={wipeRef} className={styles.wipePanel} />
    </div>
  );
}
