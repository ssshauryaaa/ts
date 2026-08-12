"use client";

import styles from "./InsigniaMark.module.css";

/**
 * Original geometric mark — hexagonal outer ring, inset trapezoid, single
 * horizontal bar through the center. Inspired by the ISB terminal aesthetic
 * without reproducing the trademarked Imperial logo. Single-stroke paths so
 * the whole thing can be animated with stroke-dashoffset.
 */
export default function InsigniaMark({ size = 120 }: { size?: number }) {
  return (
    <svg
      className={styles.insignia}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Imperial Security Bureau insignia"
    >
      {/* Outer hexagon */}
      <polygon
        points="60,6 108,33 108,87 60,114 12,87 12,33"
        className={styles.stroke}
        style={{ animationDelay: "0ms" }}
      />
      {/* Inset trapezoid */}
      <polygon
        points="60,34 86,50 78,86 42,86 34,50"
        className={styles.stroke}
        style={{ animationDelay: "220ms" }}
      />
      {/* Horizontal bar through center */}
      <line
        x1="18"
        y1="60"
        x2="102"
        y2="60"
        className={styles.stroke}
        style={{ animationDelay: "440ms" }}
      />
    </svg>
  );
}
