"use client";

export default function CRTOverlay() {
  return (
    <div aria-hidden="true" style={{ pointerEvents: "none" }}>
      {/* Scanlines */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          pointerEvents: "none",
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 2px)",
          opacity: 0.4,
          mixBlendMode: "overlay",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 51,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* Static grain — single SVG feTurbulence filter, not animated */}
      <svg
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 52,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: 0.03,
        }}
      >
        <filter id="umbra-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#umbra-grain)" />
      </svg>
    </div>
  );
}
