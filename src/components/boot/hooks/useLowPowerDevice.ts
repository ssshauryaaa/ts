"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Rough heuristic for "should we skip the WebGL hologram and use the CSS
 * fallback instead": low logical core count, a coarse (touch) pointer as
 * the primary input, or reduced-motion already requested.
 */
export function useLowPowerDevice(): boolean {
  const reducedMotion = useReducedMotion();
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 8;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLowPower(cores <= 4 || coarsePointer);
  }, []);

  return lowPower || reducedMotion;
}
