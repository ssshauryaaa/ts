"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import CRTOverlay from "@/src/components/boot/CRTOverlay";
import BootFlicker from "@/src/components/boot/BootFlicker";
import ScrambleText from "@/src/components/boot/ScrambleText";
import InsigniaMark from "@/src/components/boot/InsigniaMark";
import BootLog from "@/src/components/boot/BootLog";
import CallsignForm from "@/src/components/boot/CallsignForm";
import AccessGrantedStamp from "@/src/components/boot/AccessGrantedStamp";
import { useReducedMotion } from "@/src/components/boot/hooks/useReducedMotion";
import styles from "./page.module.css";

// Three.js scene must never touch the server render.
const HologramCanvas = dynamic(() => import("@/src/components/boot/HologramCanvas"), {
  ssr: false,
});

const STORAGE_KEY = "umbra.boot.seen";

type Phase =
  | "void"
  | "power-on"
  | "wordmark"
  | "hologram"
  | "log"
  | "prompt"
  | "granted";

export default function BootPage() {
  const [phase, setPhase] = useState<Phase>("void");
  const [skipVisible, setSkipVisible] = useState(false);
  const [clock, setClock] = useState("--:--:--");
  const reducedMotion = useReducedMotion();
  const skippedRef = useRef(false);

  // Return-visitor short-circuit: jump straight to the prompt.
  useEffect(() => {
    const seen =
      typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY);
    if (seen) {
      skippedRef.current = true;
      setPhase("prompt");
    } else {
      setPhase("power-on");
    }
  }, []);

  // Sector-time footer clock.
  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Skip-boot link appears at 1.5s on a fresh boot only.
  useEffect(() => {
    if (skippedRef.current) return;
    const t = setTimeout(() => setSkipVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const markSeenAndGoto = (target: Phase) => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setPhase(target);
  };

  const handleSkip = () => {
    setSkipVisible(false);
    markSeenAndGoto("prompt");
  };

  const handleCallsignSubmit = async (_callsign: string) => {
    // Stubbed — real integration hits POST /api/agents per the architecture
    // doc. Swap this body for the real call without touching any animation
    // code above it.
    await new Promise((r) => setTimeout(r, 500));
    markSeenAndGoto("granted");
  };

  return (
    <main className={styles.stage}>
      <CRTOverlay />

      <BootFlicker onComplete={() => phase === "power-on" && setPhase("wordmark")}>
        <div className={styles.content}>
          <div className={styles.hologramSlot}>
            {(phase === "hologram" ||
              phase === "log" ||
              phase === "prompt" ||
              phase === "granted") && <HologramCanvas />}
          </div>

          <div className={styles.insigniaRow}>
            <InsigniaMark size={56} />
          </div>

          <h1 className={styles.wordmark}>
            {(phase === "wordmark" ||
              phase === "hologram" ||
              phase === "log" ||
              phase === "prompt" ||
              phase === "granted") && (
                <ScrambleText
                  text="IMPERIAL SECURITY BUREAU"
                  duration={reducedMotion ? 0 : 900}
                  onComplete={() => phase === "wordmark" && setPhase("hologram")}
                />
              )}
          </h1>
          <div className={styles.rule} />

          <div className={styles.logSlot}>
            {(phase === "log" || phase === "prompt" || phase === "granted") && (
              <BootLog onComplete={() => phase === "log" && setPhase("prompt")} />
            )}
          </div>

          <CallsignForm
            visible={phase === "prompt" || phase === "granted"}
            onSubmit={handleCallsignSubmit}
          />
        </div>
      </BootFlicker>

      {/* Small breather after the hologram fades/scales in before the log starts */}
      {phase === "hologram" && (
        <PhaseAdvancer delayMs={200} onDone={() => setPhase("log")} />
      )}

      {skipVisible && phase !== "prompt" && phase !== "granted" && (
        <button className={styles.skipLink} onClick={handleSkip}>
          SKIP BOOT SEQUENCE →
        </button>
      )}

      <footer className={styles.footer}>
        <span>SECTOR TIME {clock}</span>
        <span>BUILD 0x7F2A</span>
      </footer>

      {phase === "granted" && <AccessGrantedStamp />}
    </main>
  );
}

/** Tiny helper: fires onDone once after delayMs, used to chain phases that
 *  don't already have a natural "I'm finished" callback of their own. */
function PhaseAdvancer({ delayMs, onDone }: { delayMs: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, delayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}