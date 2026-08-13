"use client";
import { MinimalBwBackground } from "@/components/ui/minimal-bw-background";
import dynamic from "next/dynamic";
import Link from "next/link";

// SSR-safe dynamic import for Three.js 3D model component
const StarDestroyerDashboard = dynamic(
  () => import("@/components/ui/star-destroyer-dashboard").then((m) => m.StarDestroyerDashboard),
  { ssr: false }
);

export default function DashboardPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000", position: "relative", overflow: "hidden" }}>
      <MinimalBwBackground />

      {/* Floating minimal navigation overlay top-right */}
      <div style={{
        position: "absolute", top: 20, right: 24, zIndex: 30,
        display: "flex", alignItems: "center", gap: 18,
        background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 999, padding: "8px 20px",
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
            fontFamily: "var(--font-nav)", fontSize: 9, letterSpacing: "0.14em",
            color: "#94a3b8", textDecoration: "none", transition: "color 150ms",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f8fafc")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
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
