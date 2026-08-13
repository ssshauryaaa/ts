"use client";

import { useEffect, useRef, useState } from "react";
import CRTOverlay from "@/src/components/boot/CRTOverlay";
import BootFlicker from "@/src/components/boot/BootFlicker";
import ScrambleText from "@/src/components/boot/ScrambleText";
import BootLog from "@/src/components/boot/BootLog";
import { CallsignForm } from "@/src/components/boot/CallsignForm";
import AccessGrantedStamp from "@/src/components/boot/AccessGrantedStamp";
import { useReducedMotion } from "@/src/components/boot/hooks/useReducedMotion";
import VoidHorizon from "@/src/components/StarfieldBackground2";
import styles from "./page.module.css";

const STORAGE_KEY = "umbra.boot.seen";

type Phase = "void" | "power-on" | "wordmark" | "log" | "prompt" | "granted";

export default function BootPage() {
  const [phase, setPhase] = useState<Phase>("void");
  const [skipVisible, setSkipVisible] = useState(false);
  const [clock, setClock] = useState("--:--:--");
  const reducedMotion = useReducedMotion();
  const skippedRef = useRef(false);

  useEffect(() => {
    const seen = typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY);
    if (seen) {
      skippedRef.current = true;
      setPhase("prompt");
    } else {
      setPhase("power-on");
    }
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
    await new Promise((r) => setTimeout(r, 500));
    markSeenAndGoto("granted");
  };

  const wordmarkVisible =
    phase === "wordmark" || phase === "log" || phase === "prompt" || phase === "granted";

  return (
    <main className={styles.stage}>
      <VoidHorizon className="fixed inset-0 z-0" />

      <CRTOverlay />

      <BootFlicker onComplete={() => phase === "power-on" && setPhase("wordmark")}>
        <div className={styles.card}>
          <div className={styles.cardInner}>

            <div className={styles.wordmark}>
              {wordmarkVisible && (
                <div className={styles.wordmarkGroup}>
                  <h1 className={styles.wordmarkTop}>
                    <ScrambleText
                      text="EMPIRE STATE"
                      duration={reducedMotion ? 0 : 900}
                      onComplete={() => phase === "wordmark" && setPhase("log")}
                    />
                  </h1>
                  <span className={styles.wordmarkTick} aria-hidden="true" />
                  <p className={styles.wordmarkBottom}>OF MIND</p>
                </div>
              )}
              {wordmarkVisible && (
                <p className={styles.statusLine}>NEURAL SYNC ACTIVE</p>
              )}
            </div>

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
        </div>
      </BootFlicker>

      {skipVisible && phase !== "prompt" && phase !== "granted" && (
        <button className={styles.skipLink} onClick={handleSkip}>
          [ BYPASS PROTOCOL ]
        </button>
      )}

      <footer className={styles.footer}>
        <div className={styles.footerCol}>
          <span className={styles.statusDot} />
          <span>SECTOR TIME {clock}</span>
        </div>
        <span>NY // EST. 1989</span>
      </footer>

      {phase === "granted" && <AccessGrantedStamp />}
    </main>
  );
}