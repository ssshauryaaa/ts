"use client";
import { MinimalBwBackground } from "@/components/ui/minimal-bw-background";
import dynamic from "next/dynamic";
import Link from "next/link";

// SSR-safe dynamic import for Three.js 3D model component
const StarDestroyerDashboard = dynamic(
  () => import("@/components/ui/star-destroyer-dashboard").then((m) => m.StarDestroyerDashboard),
  { ssr: false }
);

export default function Page() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#010105", position: "relative", overflow: "hidden" }}>
      <MinimalBwBackground />

      {/* Corner HUD brackets — pure CSS, decorative only */}
      {(["tl", "tr", "bl", "br"] as const).map((corner) => {
        const isTop = corner.startsWith("t");
        const isLeft = corner.endsWith("l");
        return (
          <div
            key={corner}
            aria-hidden="true"
            style={{
              position: "absolute",
              top: isTop ? 12 : undefined,
              bottom: isTop ? undefined : 12,
              left: isLeft ? 12 : undefined,
              right: isLeft ? undefined : 12,
              width: 20,
              height: 20,
              borderTop: isTop ? "1px solid rgba(245,158,11,0.25)" : undefined,
              borderBottom: isTop ? undefined : "1px solid rgba(245,158,11,0.25)",
              borderLeft: isLeft ? "1px solid rgba(245,158,11,0.25)" : undefined,
              borderRight: isLeft ? undefined : "1px solid rgba(245,158,11,0.25)",
              pointerEvents: "none",
              zIndex: 30,
            }}
          />
        );
      })}

      {/* Floating minimal navigation overlay top-right */}
      <div style={{
        position: "absolute", top: 20, right: 24, zIndex: 30,
        display: "flex", alignItems: "center", gap: 20,
        background: "rgba(0, 0, 0, 0.82)", backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderTop: "1px solid rgba(245, 158, 11, 0.15)",
        borderRadius: 0,
        padding: "9px 22px",
        clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
      }}>
        {[
          { label: "CONSOLE", href: "/console" },
          { label: "DOSSIERS", href: "/dossiers" },
          { label: "MISSIONS", href: "/missions" },
          { label: "INTERCEPTS", href: "/intercepts" },
          { label: "INQUISITORS", href: "/inquisitors" },
          { label: "AGENT", href: "/agent" },
        ].map((n) => (
          <Link key={n.href} href={n.href} style={{
            fontFamily: "var(--font-nav)", fontSize: 8, letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 180ms, text-shadow 180ms",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f59e0b";
              e.currentTarget.style.textShadow = "0 0 10px rgba(245,158,11,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.35)";
              e.currentTarget.style.textShadow = "none";
            }}
          >
            {n.label}
          </Link>
        ))}
      </div>

      {/* Floating minimal Imperial title top-left */}
      <div style={{
        position: "absolute", top: 24, left: 28, zIndex: 30, pointerEvents: "none",
      }}>
        <div style={{ fontFamily: "var(--font-nav)", fontSize: 8, color: "#475569", letterSpacing: "0.22em", marginBottom: 3 }}>
          {/* GALACTIC EMPIRE · ISB */}
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, color: "#f8fafc", fontWeight: 700, letterSpacing: "0.06em" }}>
          {/* STAR DESTROYER NEXUS */}
        </div>
      </div>

      {/* Fullscreen 3D Spaceship Canvas rendering /modals/glb.glb */}
      <StarDestroyerDashboard
        scale={1.4}
        verticalOffset={1}
        modelUrl="/modals/glb-compressed.glb"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
}