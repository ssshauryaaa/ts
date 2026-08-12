"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useReducedMotion } from "./hooks/useReducedMotion";
import styles from "./AccessGrantedStamp.module.css";

export default function AccessGrantedStamp() {
  const stampRef = useRef<HTMLDivElement | null>(null);
  const wipeRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const stamp = stampRef.current;
    const wipe = wipeRef.current;
    if (!stamp || !wipe) return;

    if (reducedMotion) {
      gsap.set(stamp, { scale: 1, opacity: 1 });
      const t = setTimeout(() => router.push("/command"), 500);
      return () => clearTimeout(t);
    }

    const tl = gsap.timeline({
      onComplete: () => router.push("/command"),
    });

    tl.fromTo(
      stamp,
      { scale: 1.4, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" }
    ).to(wipe, {
      yPercent: -100,
      duration: 0.8,
      ease: "power4.inOut",
      delay: 0.5,
    });

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return (
    <div className={styles.overlay}>
      <div ref={stampRef} className={styles.stamp}>
        ACCESS GRANTED
      </div>
      <div ref={wipeRef} className={styles.wipePanel} />
    </div>
  );
}
