"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

// ── Module definitions ─────────────────────────────────────────────────────────
// Anchors are semantic, not raw x/y/z — { length, width, height } — where
// "length" is the ship's nose-to-tail axis and "width" is wing-to-wing.
// setupModuleNodes() below figures out at runtime whether X or Z is actually
// the long axis of whatever model gets loaded and maps accordingly, so these
// hotspots land in sensible places regardless of how the source GLB was
// authored (Star Destroyer, X-wing, whatever — long axis could be X or Z).
export interface ShipModuleAnchor {
  length: number; // -1 (tail) .. 1 (nose)
  width: number;  // -1 (left) .. 1 (right)
  height: number; // -1 (belly) .. 1 (top)
}

export interface ShipModule {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  color: number;      // THREE hex
  cssColor: string;   // CSS hex for HTML overlay
  anchor: ShipModuleAnchor;
}

// Flip this to -1 if the loaded model's nose turns out to point the opposite
// way once you eyeball it in-browser — every "length" anchor below is signed
// relative to this, so one flip corrects bow/engine placement for all modules.
const SHIP_FORWARD_SIGN = 1;

// NOTE: These fractions are tuned for a roughly Star-Destroyer-shaped hull
// (long wedge, wide at the back, narrow at the nose). If your actual GLB is
// shaped differently (e.g. much narrower, or wings that taper hard), nudge
// the `width`/`height` fractions down (e.g. ±0.5 -> ±0.35) so the hotspots
// stay ON the hull surface instead of floating off its edge. Easiest way to
// tune: temporarily bump each reticle's glow size up in makeGlowSprite calls
// so they're easy to spot, then adjust anchors one at a time.
const MODULES: ShipModule[] = [
  {
    id: "bridge",
    label: "THREAT CONSOLE",
    sublabel: "Real-time intel & 3D holo-map",
    href: "/console",
    color: 0xdc2626,
    cssColor: "#dc2626",
    anchor: { length: -0.1, width: 0, height: 0.2 },
  },
  {
    id: "hull-left",
    label: "TARGET REGISTRY",
    sublabel: "Jedi fugitive dossiers",
    href: "/dossiers",
    color: 0xe2e8f0,
    cssColor: "#e2e8f0",
    anchor: { length: -0.05, width: 0.5, height: 0.05 },
  },
  {
    id: "hull-right",
    label: "INQUISITOR COMMAND",
    sublabel: "Hunter cadre & deployments",
    href: "/inquisitors",
    color: 0x94a3b8,
    cssColor: "#94a3b8",
    anchor: { length: -0.05, width: -0.5, height: 0.05 },

  },
  {
    id: "hangar",
    label: "OPERATIONS BOARD",
    sublabel: "Active strike missions",
    href: "/missions",
    color: 0x22c55e,
    cssColor: "#22c55e",
    anchor: { length: 0, width: 0, height: -0.45 },
  },
  {
    id: "bow",
    label: "HOLONET INTERCEPTS",
    sublabel: "Decrypted rebel transmissions",
    href: "/intercepts",
    color: 0x3b82f6,
    cssColor: "#3b82f6",
    anchor: { length: 0.5, width: 0, height: 0.15 },
  },
  {
    id: "engines",
    label: "AGENT PROFILE",
    sublabel: "Clearance & audit log",
    href: "/agent",
    color: 0x64748b,
    cssColor: "#64748b",
    anchor: { length: -0.45, width: 0, height: 0 },
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeGlowSprite(colorHex: number, size: number, opacity: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const c = new THREE.Color(colorHex);
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, `rgba(${rgb},${opacity})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(size, size, 1);
  return sprite;
}

// Small idle/hover hotspot marker — a thin ring with four corner ticks and a
// center dot, drawn on canvas. Deliberately not a filled sphere: it should
// read as a discreet HUD reticle sitting on the hull, not a glowing ball.
function makeReticleSprite(colorHex: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const c = new THREE.Color(colorHex);
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;

  ctx.strokeStyle = `rgba(${rgb},1)`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(64, 64, 32, 0, Math.PI * 2);
  ctx.stroke();

  const r = 32, gap = 7, tick = 13;
  [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].forEach((a) => {
    const x1 = 64 + Math.cos(a) * (r + gap);
    const y1 = 64 + Math.sin(a) * (r + gap);
    const x2 = 64 + Math.cos(a) * (r + gap + tick);
    const y2 = 64 + Math.sin(a) * (r + gap + tick);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  ctx.fillStyle = `rgba(${rgb},1)`;
  ctx.beginPath();
  ctx.arc(64, 64, 4.5, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, opacity: 0.5, rotation: 0,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 20;
  return sprite;
}

// Outer "lock-on" ring — thin, plain, no ticks — scaled to 0 and invisible
// until hover, then expands out and slowly counter-rotates against the
// reticle's own spin for a targeting-computer feel.
function makeLockRingSprite(colorHex: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const c = new THREE.Color(colorHex);
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;

  ctx.strokeStyle = `rgba(${rgb},1)`;
  ctx.lineWidth = 2;
  // Two open arcs rather than a full ring reads as more "targeting" and less
  // like a plain circle.
  ctx.beginPath();
  ctx.arc(64, 64, 50, -0.35, 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(64, 64, 50, Math.PI - 0.35, Math.PI + 1.2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, opacity: 0, rotation: 0,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 19;
  return sprite;
}

// Calm background starfield — subtle size/brightness variance per-star via a
// custom point size, plus a gentle per-star twinkle so it reads as a real
// ambient sky rather than a flat sprinkle of identical dots.
function makeStars(count: number, spread: number) {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count); // per-star twinkle phase
  for (let i = 0; i < count; i++) {
    const r = spread * (0.5 + Math.random() * 0.5);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi) * 0.4;
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    seed[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xdbe8ff,
      size: 0.045,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  return { points, seed };
}

// ── Hyperspace intro field ──────────────────────────────────────────────────────
// A field of stars rendered as tapered "fat line" streaks (via LineSegments2 so
// they actually have pixel width, unlike the 1px-only LineBasicMaterial lines).
// Each streak's head is a bright colored spark; its tail fades to pure black so
// additive blending dissolves it smoothly into the background rather than
// showing a hard-edged line. Streak length scales with current speed, so as
// speed decays to 0 the streaks shrink back into ordinary points — a clean
// hand-off into the calm starfield.
const HYPER_COUNT = 420;
const HYPER_RADIUS = 26;
const HYPER_Z_MIN = -150;
const HYPER_Z_MAX = 16; // just past the camera before recycling
const HYPER_HUES = [0.58, 0.62, 0.55, 0.66, 0.6]; // blue/violet variety

interface HyperStar { x: number; y: number; z: number; hue: number; }

function createHyperspaceField(initialWidth: number, initialHeight: number) {
  const geometry = new LineSegmentsGeometry();
  geometry.setPositions(new Float32Array(HYPER_COUNT * 6));
  geometry.setColors(new Float32Array(HYPER_COUNT * 6));

  const material = new LineMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    linewidth: 2.4, // pixels
  });
  material.resolution.set(Math.max(initialWidth, 1), Math.max(initialHeight, 1));

  const lines = new LineSegments2(geometry, material);
  lines.frustumCulled = false;

  const data: HyperStar[] = [];

  function respawn(): HyperStar {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * HYPER_RADIUS;
    return {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r * 0.55,
      z: HYPER_Z_MIN + Math.random() * (HYPER_Z_MAX - HYPER_Z_MIN),
      hue: HYPER_HUES[Math.floor(Math.random() * HYPER_HUES.length)] + (Math.random() - 0.5) * 0.03,
    };
  }

  for (let i = 0; i < HYPER_COUNT; i++) data.push(respawn());

  // Interleaved instance buffers created by setPositions/setColors — write
  // directly into their backing arrays each frame instead of reallocating.
  const posArr = (geometry.attributes.instanceStart as any).data.array as Float32Array;
  const colArr = (geometry.attributes.instanceColorStart as any).data.array as Float32Array;
  const tmpColor = new THREE.Color();

  function update(delta: number, speed: number) {
    const trailLen = THREE.MathUtils.clamp(speed * 0.16, 0.15, 11);
    for (let i = 0; i < HYPER_COUNT; i++) {
      const s = data[i];
      s.z += speed * delta;
      if (s.z > HYPER_Z_MAX) {
        const fresh = respawn();
        s.x = fresh.x; s.y = fresh.y; s.z = HYPER_Z_MIN; s.hue = fresh.hue;
      }
      const i6 = i * 6;
      // head (leading edge, bright colored spark)
      posArr[i6] = s.x; posArr[i6 + 1] = s.y; posArr[i6 + 2] = s.z;
      // tail (trailing edge, fades to black — vanishes cleanly under additive blending)
      posArr[i6 + 3] = s.x; posArr[i6 + 4] = s.y; posArr[i6 + 5] = s.z - trailLen;

      tmpColor.setHSL(s.hue, 0.6, 0.92);
      colArr[i6] = tmpColor.r; colArr[i6 + 1] = tmpColor.g; colArr[i6 + 2] = tmpColor.b;
      colArr[i6 + 3] = 0; colArr[i6 + 4] = 0; colArr[i6 + 5] = 0;
    }
    (geometry.attributes.instanceStart as any).data.needsUpdate = true;
    (geometry.attributes.instanceColorStart as any).data.needsUpdate = true;
  }

  function setResolution(w: number, h: number) {
    material.resolution.set(Math.max(w, 1), Math.max(h, 1));
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
  }

  return { lines, update, dispose, setResolution };
}

// Procedural fallback spaceship model when no GLTF file is provided or while loading
function createFallbackSpaceship(): THREE.Group {
  const group = new THREE.Group();
  const HULL_BASE = 0x3d4a5c;

  const hullShape = new THREE.Shape();
  hullShape.moveTo(0, 4.5);
  hullShape.lineTo(-3.5, -3);
  hullShape.lineTo(3.5, -3);
  hullShape.lineTo(0, 4.5);

  const extrudeSettings = { depth: 0.45, bevelEnabled: false };
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
  hullGeo.rotateX(-Math.PI / 2);
  hullGeo.translate(0, 0.225, -0.3);

  const hullMesh = new THREE.Mesh(
    hullGeo,
    new THREE.MeshStandardMaterial({ color: HULL_BASE, metalness: 0.75, roughness: 0.35 })
  );
  group.add(hullMesh);

  const bridgeGeo = new THREE.BoxGeometry(0.55, 0.9, 0.6);
  const bridgeMesh = new THREE.Mesh(
    bridgeGeo,
    new THREE.MeshStandardMaterial({ color: 0x7a1a1a, emissive: 0x3a0a0a, emissiveIntensity: 0.6, metalness: 0.9, roughness: 0.2 })
  );
  bridgeMesh.position.set(0, 0.67, 2.1);
  group.add(bridgeMesh);

  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.45, 6),
    new THREE.MeshStandardMaterial({ color: 0x4a5060, metalness: 0.9, roughness: 0.2 })
  );
  spire.position.set(0, 1.2, 2.1);
  group.add(spire);

  const wingL = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.18, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x475569, emissive: 0x0f172a, emissiveIntensity: 0.35, metalness: 0.65, roughness: 0.45 })
  );
  wingL.position.set(-1.7, 0, -0.3);
  wingL.rotation.z = -0.06;
  group.add(wingL);

  const wingR = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.18, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x475569, emissive: 0x0f172a, emissiveIntensity: 0.35, metalness: 0.65, roughness: 0.45 })
  );
  wingR.position.set(1.7, 0, -0.3);
  wingR.rotation.z = 0.06;
  group.add(wingR);

  const hangar = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.1, 1.9),
    new THREE.MeshStandardMaterial({ color: 0x0f2a15, emissive: 0x041008, emissiveIntensity: 0.5, metalness: 0.4, roughness: 0.7 })
  );
  hangar.position.set(0, -0.28, -0.2);
  group.add(hangar);

  const bowGeo = new THREE.ConeGeometry(0.25, 1.0, 5);
  bowGeo.rotateX(-Math.PI / 2);
  const bowMesh = new THREE.Mesh(
    bowGeo,
    new THREE.MeshStandardMaterial({ color: 0x0f2040, emissive: 0x061020, emissiveIntensity: 0.7, metalness: 0.9, roughness: 0.15 })
  );
  bowMesh.position.set(0, 0.18, 3.6);
  group.add(bowMesh);

  [-1.2, 0, 1.2].forEach((ex) => {
    const eng = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.36, 0.6, 14),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e, emissive: 0x1a2060, emissiveIntensity: 0.8, metalness: 0.95, roughness: 0.05 })
    );
    eng.rotation.x = Math.PI / 2;
    eng.position.set(ex, -0.05, -3.2);
    group.add(eng);

    const glow = makeGlowSprite(0x4488ff, 1.6, 0.9);
    glow.position.set(ex, -0.05, -3.65);
    group.add(glow);
  });

  return group;
}

// ── Component Props ────────────────────────────────────────────────────────────
export interface StarDestroyerProps {
  className?: string;
  style?: React.CSSProperties;
  modelUrl?: string;
  scale?: number;
  verticalOffset?: number;
}

export function StarDestroyerDashboard({ className, style, modelUrl, scale = 1, verticalOffset = 0 }: StarDestroyerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "fallback">(modelUrl ? "loading" : "fallback");
  const router = useRouter();

  useEffect(() => {
    const mount = mountRef.current;
    const wrapper = wrapRef.current;
    const tooltip = tooltipRef.current;
    if (!mount || !wrapper || !tooltip) return;

    const SHIP_SCALE = scale;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    // ── Scene Setup ────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.025);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(0, 4.5, 11);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
      stencil: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ── Controls ───────────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.minPolarAngle = Math.PI / 8;
    controls.maxPolarAngle = Math.PI / 1.6;
    controls.minDistance = 6;
    controls.maxDistance = 22;

    // ── Lighting ───────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xd0e8ff, 3.0);
    keyLight.position.set(4, 9, 7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xcbd5e1, 1.6);
    rimLight.position.set(-6, 3, -6);
    scene.add(rimLight);

    const redFill = new THREE.PointLight(0xdc2626, 2.8, 20);
    redFill.position.set(0, 3, 8);
    scene.add(redFill);

    const underLight = new THREE.PointLight(0x3b82f6, 1.8, 18);
    underLight.position.set(0, -6, 0);
    scene.add(underLight);

    // ── Starfields ─────────────────────────────────────────────────────────────
    // Calm field: always present, starts invisible, fades in as hyperspace fades out.
    const calm = makeStars(900, 80);
    scene.add(calm.points);

    // Hyperspace field: fast streaking lines, active only during the intro.
    const initW = mount.clientWidth || window.innerWidth;
    const initH = mount.clientHeight || window.innerHeight;
    const hyperspace = createHyperspaceField(initW, initH);
    scene.add(hyperspace.lines);

    // ── Ship Container ─────────────────────────────────────────────────────────
    const shipContainer = new THREE.Group();
    // Start collapsed — it "materializes" as the hyperspace jump ends.
    shipContainer.scale.setScalar(reducedMotion ? 1 : 0.01);
    scene.add(shipContainer);

    const MOTION = {
      bobSpeed: 0.55, bobAmp: 0.16,
      driftSpeed: 0.23, driftAmp: 0.28,
      surgeSpeed: 0.31, surgeAmp: 0.12,
      rollSpeed: 0.47, rollAmp: 0.035,
      pitchSpeed: 0.38, pitchAmp: 0.02,
      yawSpeed: 0.19, yawAmp: 0.045,
    };

    let mixer: THREE.AnimationMixer | null = null;
    const interactableObjects: THREE.Object3D[] = [];
    const moduleGlows: Map<string, THREE.Sprite> = new Map();
    const moduleReticles: Map<string, THREE.Sprite> = new Map();
    const moduleLockRings: Map<string, THREE.Sprite> = new Map();
    const moduleHitAreas: Map<string, THREE.Mesh> = new Map();
    const hotspotPositions: Record<string, THREE.Vector3> = {};

    function setupModuleNodes(bounds: THREE.Box3) {
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bounds.getSize(size);
      bounds.getCenter(center);

      // The long ("length") axis of the hull could be X or Z depending on
      // how the source model was authored — detect it from the actual
      // bounding box instead of assuming, so hotspots land correctly on
      // whatever GLB gets loaded. Height stays Y (up) per glTF convention.
      const lengthAxis: "x" | "z" = size.x >= size.z ? "x" : "z";
      const widthAxis: "x" | "z" = lengthAxis === "x" ? "z" : "x";

      MODULES.forEach((mod) => {
        const lengthOffset = mod.anchor.length * SHIP_FORWARD_SIGN * size[lengthAxis];
        const widthOffset = mod.anchor.width * size[widthAxis];
        const pos = new THREE.Vector3(
          center.x + (lengthAxis === "x" ? lengthOffset : widthOffset),
          center.y + mod.anchor.height * size.y,
          center.z + (lengthAxis === "z" ? lengthOffset : widthOffset)
        );
        hotspotPositions[mod.id] = pos;

        // Small visible reticle — the actual hover indicator.
        const reticle = makeReticleSprite(mod.color);
        reticle.scale.set(0.5, 0.5, 1);
        reticle.position.copy(pos);
        reticle.userData = { moduleId: mod.id };
        shipContainer.add(reticle);
        interactableObjects.push(reticle);
        moduleReticles.set(mod.id, reticle);

        // Outer lock-on ring, hidden until hover.
        const lockRing = makeLockRingSprite(mod.color);
        lockRing.scale.set(0.5, 0.5, 1);
        lockRing.position.copy(pos);
        shipContainer.add(lockRing);
        moduleLockRings.set(mod.id, lockRing);

        // Soft ambient bloom behind the reticle so it reads at a distance.
        const glow = makeGlowSprite(mod.color, 1.0, 0.18);
        glow.position.copy(pos);
        shipContainer.add(glow);
        moduleGlows.set(mod.id, glow);

        // Generous invisible hit area layered on top so the small reticle
        // stays easy to click without needing to be visually large.
        const hitGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitArea = new THREE.Mesh(hitGeo, hitMat);
        hitArea.position.copy(pos);
        hitArea.userData = { moduleId: mod.id };
        shipContainer.add(hitArea);
        interactableObjects.push(hitArea);
        moduleHitAreas.set(mod.id, hitArea);
      });
    }

    // ── Hyperspace → calm timing ────────────────────────────────────────────────
    // clock is created here (rather than lower down) so the load callbacks
    // below can stamp "model ready" against the same running clock.
    const clock = new THREE.Clock();
    const HYPER_MAX_SPEED = 95;
    const MIN_INTRO_SECONDS = reducedMotion ? 0 : 1.0;
    const DECEL_SECONDS = reducedMotion ? 0.001 : 1.3;
    let modelReadyAt: number | null = reducedMotion ? 0 : null;

    function markModelReady() {
      if (modelReadyAt === null) modelReadyAt = clock.getElapsedTime();
    }

    // ── Load 3D Model or Fallback ──────────────────────────────────────────────
    // IMPORTANT: the bounding box used for hotspot placement must be computed
    // from the model/fallback object itself BEFORE it is parented under
    // `shipContainer`. `shipContainer` starts at scale 0.01 and animates up
    // during the hyperspace-arrival intro; if we measure the box after
    // `shipContainer.add(...)`, Box3.setFromObject will fold in whatever
    // `shipContainer.scale` happens to be at that moment (~0.01), and the
    // resulting bounds — and every hotspot offset derived from them — end up
    // shrunk by that same factor. Since the offsets are then applied as
    // LOCAL positions under `shipContainer` (which gets scaled again at
    // render time), the error compounds and every hotspot collapses to
    // essentially the same point at the ship's center. Measuring the object
    // while it's still unparented (matrixWorld === local matrix) avoids this
    // entirely.
    if (modelUrl) {
      import("three/examples/jsm/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            const model = gltf.scene;

            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetScale = (8 * SHIP_SCALE) / (maxDim || 1);
            model.scale.setScalar(targetScale);

            const center = new THREE.Vector3();
            box.getCenter(center);
            model.position.sub(center.multiplyScalar(targetScale));

            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).matrixAutoUpdate = false;
                (child as THREE.Mesh).updateMatrix();
              }
            });

            // Measure BEFORE adding to shipContainer — model.parent is still
            // null here, so matrixWorld reflects only model's own (now
            // final) scale/position, not shipContainer's animating scale.
            const finalBox = new THREE.Box3().setFromObject(model);

            shipContainer.add(model);

            if (gltf.animations && gltf.animations.length > 0) {
              mixer = new THREE.AnimationMixer(model);
              gltf.animations.forEach((clip) => mixer?.clipAction(clip).play());
            }

            setupModuleNodes(finalBox);

            setLoadState("loaded");
            markModelReady();
          },
          undefined,
          (err) => {
            console.warn("Failed to load 3D GLTF model, rendering procedural spaceship fallback:", err);
            const fallback = createFallbackSpaceship();
            fallback.scale.setScalar(SHIP_SCALE);
            const box = new THREE.Box3().setFromObject(fallback); // before adding — see note above
            shipContainer.add(fallback);
            setupModuleNodes(box);
            setLoadState("fallback");
            markModelReady();
          }
        );
      }).catch((err) => {
        console.warn("Failed to import GLTFLoader dynamically:", err);
        const fallback = createFallbackSpaceship();
        fallback.scale.setScalar(SHIP_SCALE);
        const box = new THREE.Box3().setFromObject(fallback); // before adding — see note above
        shipContainer.add(fallback);
        setupModuleNodes(box);
        setLoadState("fallback");
        markModelReady();
      });
    } else {
      const fallback = createFallbackSpaceship();
      fallback.scale.setScalar(SHIP_SCALE);
      const box = new THREE.Box3().setFromObject(fallback); // before adding — see note above
      shipContainer.add(fallback);
      setupModuleNodes(box);
      markModelReady();
    }

    // ── Raycasting & Interaction ───────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2(-10, -10);
    let hoveredId: string | null = null;
    let isHovering = false;

    function onPointerMove(e: PointerEvent) {
      const rect = mount!.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onPointerLeave() {
      pointerNDC.set(-10, -10);
    }

    function onClick(e: PointerEvent) {
      if (!hoveredId) return;
      const mod = MODULES.find((m) => m.id === hoveredId);
      if (mod) router.push(mod.href);
    }

    renderer.domElement.addEventListener("pointermove", onPointerMove, { passive: true });
    renderer.domElement.addEventListener("pointerleave", onPointerLeave, { passive: true });
    renderer.domElement.addEventListener("click", onClick);

    // ── Animation Loop ─────────────────────────────────────────────────────────
    let frameId: number;
    let isVisible = true;

    function resize() {
      if (!mount) return;
      const { clientWidth: w, clientHeight: h } = mount;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      hyperspace.setResolution(w, h);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const io = new IntersectionObserver(
      (entries) => { isVisible = entries[0]?.isIntersecting ?? true; },
      { threshold: 0 }
    );
    io.observe(mount);

    function animate() {
      frameId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden) return;

      const delta = clock.getDelta();
      const t = clock.getElapsedTime();

      if (mixer) mixer.update(delta);

      // ── Hyperspace deceleration curve ──────────────────────────────────────
      // 0 = full hyperspeed, 1 = fully settled into calm cruise.
      const decelStart = modelReadyAt === null ? Infinity : Math.max(modelReadyAt, MIN_INTRO_SECONDS);
      const decelT = t >= decelStart ? THREE.MathUtils.clamp((t - decelStart) / DECEL_SECONDS, 0, 1) : 0;
      const eased = 1 - Math.pow(1 - decelT, 3); // easeOutCubic

      const hyperSpeed = HYPER_MAX_SPEED * (1 - eased);
      hyperspace.lines.material.opacity = 1 - eased;
      if (eased < 0.999) hyperspace.update(delta, Math.max(hyperSpeed, 4));
      hyperspace.lines.visible = eased < 0.999;

      // Calm stars fade in slightly ahead of the hyperspace lines finishing
      // their fade-out, so the two overlap and there's never a dim/empty gap
      // between "warp lines gone" and "background fully visible".
      const calmT = THREE.MathUtils.clamp(eased * 1.2, 0, 1);
      const twinkle = 1 + Math.sin(t * 1.6) * 0.04;
      calm.points.material.opacity = 0.85 * calmT * twinkle;

      // Ship "materializes" out of the jump in step with the same easing.
      const shipScale = THREE.MathUtils.lerp(0.01, 1, eased);
      shipContainer.scale.setScalar(shipScale);

      // Idle motion only kicks in once the ship has mostly resolved, so it
      // doesn't fight with the scale-in.
      const idleAmt = eased;
      shipContainer.position.y = verticalOffset + Math.sin(t * MOTION.bobSpeed) * MOTION.bobAmp * idleAmt;
      shipContainer.position.x = Math.sin(t * MOTION.driftSpeed) * MOTION.driftAmp * idleAmt;
      shipContainer.position.z = Math.cos(t * MOTION.surgeSpeed) * MOTION.surgeAmp * idleAmt;

      shipContainer.rotation.z = Math.sin(t * MOTION.rollSpeed) * MOTION.rollAmp * idleAmt;
      shipContainer.rotation.x = Math.cos(t * MOTION.pitchSpeed * 0.8) * MOTION.pitchAmp * idleAmt;
      shipContainer.rotation.y = Math.sin(t * MOTION.yawSpeed) * MOTION.yawAmp * idleAmt;

      // Raycast check (only meaningful once the ship has size)
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = eased > 0.05 ? raycaster.intersectObjects(interactableObjects, true) : [];
      let newHoverId: string | null = null;

      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && obj !== scene) {
          if (obj.userData?.moduleId) {
            newHoverId = obj.userData.moduleId;
            break;
          }
          obj = obj.parent;
        }
      }

      if (newHoverId !== hoveredId) {
        hoveredId = newHoverId;
        isHovering = !!hoveredId;
        renderer.domElement.style.cursor = isHovering ? "pointer" : "grab";
        controls.autoRotate = !isHovering;
      }

      MODULES.forEach((mod, idx) => {
        const glow = moduleGlows.get(mod.id);
        const reticle = moduleReticles.get(mod.id);
        const lockRing = moduleLockRings.get(mod.id);
        const isActive = mod.id === hoveredId;
        const breathe = 1 + Math.sin(t * 1.8 + idx) * 0.06;

        if (glow) {
          const targetOpacity = isActive ? 0.85 : 0.16 + Math.sin(t * 2.0 + idx) * 0.05;
          const mat = glow.material as THREE.SpriteMaterial;
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity * idleAmt, 0.15);
          const targetGlowScale = isActive ? 1.5 : 1.0;
          glow.scale.setScalar(THREE.MathUtils.lerp(glow.scale.x, targetGlowScale, 0.15));
        }

        if (reticle) {
          const mat = reticle.material as THREE.SpriteMaterial;
          const targetScale = isActive ? 0.82 : 0.5 * breathe;
          const newScale = THREE.MathUtils.lerp(reticle.scale.x, targetScale, 0.18);
          reticle.scale.set(newScale, newScale, 1);
          const targetOpacity = isActive ? 1 : 0.42 + Math.sin(t * 1.8 + idx) * 0.1;
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity * idleAmt, 0.15);
          mat.rotation += isActive ? 0.02 : 0.0035;
        }

        if (lockRing) {
          const mat = lockRing.material as THREE.SpriteMaterial;
          const targetScale = isActive ? 1.0 : 0.6;
          const newScale = THREE.MathUtils.lerp(lockRing.scale.x, targetScale, 0.16);
          lockRing.scale.set(newScale, newScale, 1);
          const targetOpacity = isActive ? 0.9 : 0;
          mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity * idleAmt, 0.16);
          mat.rotation -= isActive ? 0.018 : 0.004;
        }
      });

      if (tooltip) {
        if (hoveredId && hotspotPositions[hoveredId] && eased > 0.05) {
          const mod = MODULES.find((m) => m.id === hoveredId)!;
          const worldPos = hotspotPositions[hoveredId].clone().applyMatrix4(shipContainer.matrixWorld);
          const v = worldPos.project(camera);
          const rect = mount!.getBoundingClientRect();
          const sx = (v.x * 0.5 + 0.5) * rect.width;
          const sy = (-v.y * 0.5 + 0.5) * rect.height;

          tooltip.style.transform = `translate(${sx + 12}px, ${sy - 8}px) scale(1)`;
          tooltip.style.opacity = "1";
          tooltip.style.borderColor = mod.cssColor;
          tooltip.innerHTML = `
            <div style="height:2px;background:${mod.cssColor};margin:-7px -10px 6px;box-shadow:0 0 6px ${mod.cssColor};"></div>
            <div style="font-weight:700;color:${mod.cssColor};letter-spacing:0.07em;font-size:10.5px;">${mod.label}</div>
            <div style="color:#8b98a8;font-size:9px;margin-top:2px;">${mod.sublabel}</div>
            <div style="color:#5b6472;font-size:8px;margin-top:4px;letter-spacing:0.09em;">▸ OPEN MODULE</div>
          `;
        } else {
          tooltip.style.opacity = "0";
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // ── Cleanup ────────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      io.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      renderer.domElement.removeEventListener("click", onClick);
      controls.dispose();
      renderer.dispose();
      hyperspace.dispose();
      scene.traverse((obj) => {
        const o = obj as THREE.Mesh;
        o.geometry?.dispose?.();
        const mat = o.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => { (m as THREE.MeshBasicMaterial).map?.dispose?.(); m.dispose(); });
        else if (mat) { (mat as THREE.MeshBasicMaterial).map?.dispose?.(); mat.dispose(); }
      });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [router, modelUrl, scale, verticalOffset]);

  return (
    <div ref={wrapRef} className={className} style={{ width: "100%", height: "100%", position: "relative", ...style }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {loadState === "loading" && (
        <div style={{
          position: "absolute", top: 20, left: 20,
          background: "rgba(0,0,0,0.85)", border: "1px solid rgba(220,38,38,0.4)",
          borderRadius: 4, padding: "8px 14px",
          fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#f8fafc",
          display: "flex", alignItems: "center", gap: 10, pointerEvents: "none", zIndex: 20,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", animation: "pulse 1s infinite" }} />
          LOADING 3D SPACESHIP MODEL...
        </div>
      )}

      <div
        ref={tooltipRef}
        style={{
          position: "absolute", top: 0, left: 0,
          opacity: 0, pointerEvents: "none",
          background: "rgba(8,10,14,0.92)",
          backdropFilter: "blur(3px)",
          border: "1px solid #dc2626",
          clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)",
          padding: "9px 10px 7px",
          fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
          fontSize: "11px", color: "#e5e7eb", lineHeight: 1.4,
          boxShadow: "0 4px 16px rgba(0,0,0,0.55), 0 0 12px rgba(220,38,38,0.22)",
          transition: "opacity 140ms ease, transform 140ms ease",
          transformOrigin: "0 50%",
          whiteSpace: "nowrap", zIndex: 10,
        }}
      />

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 20,
        padding: "12px 24px",
        background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
        pointerEvents: "none", zIndex: 5,
      }}>
        {MODULES.map((mod) => (
          <div key={mod.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: mod.cssColor, boxShadow: `0 0 8px ${mod.cssColor}` }} />
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: "#94a3b8", letterSpacing: "0.1em" }}>
              {mod.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}