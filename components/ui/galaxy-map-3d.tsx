"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// ── Types ─────────────────────────────────────────────────────────────────────
type SectorStatus = "pacified" | "contested" | "lost";
type ThreatLevel = "critical" | "high" | "moderate" | "low";

interface Sector3D {
    label: string;
    radius: number;
    angle: number;
    status: SectorStatus;
}

interface Sighting3D {
    radius: number;
    angle: number;
    level: ThreatLevel;
}

interface HiddenNode3D {
    label: string;
    radius: number;
    angle: number;
}

interface SectorMeta {
    compliance: number; // fake "imperial compliance %"
    contacts: number; // fake "signal contacts logged"
}

interface SightingMeta {
    codename: string;
    coords: string;
    action: "MONITOR" | "FLAG FOR REVIEW" | "ESCALATE";
}

type HoverKind = "sector" | "sighting" | "hidden";

interface TooltipState {
    kind: HoverKind;
    index: number;
}

// ── Data (mirrors the original 2D sector map) ────────────────────────────────
const STATUS_COLOR: Record<SectorStatus, number> = {
    pacified: 0x22c55e,
    contested: 0xf59e0b,
    lost: 0xdc2626,
};

const THREAT_COLOR: Record<ThreatLevel, number> = {
    critical: 0xdc2626,
    high: 0xf59e0b,
    moderate: 0x3b82f6,
    low: 0x22c55e,
};

const THREAT_CYCLE: Record<ThreatLevel, number> = {
    critical: 1.2,
    high: 1.8,
    moderate: 2.5,
    low: 2.5,
};

const SECTORS: Sector3D[] = [
    { label: "OUTER RIM", radius: 3.6, angle: 205, status: "contested" },
    { label: "MID RIM", radius: 2.3, angle: 95, status: "pacified" },
    { label: "INNER RIM", radius: 1.1, angle: 15, status: "pacified" },
    { label: "EXPANSION REGION", radius: 3.0, angle: 260, status: "lost" },
    { label: "COLONIES", radius: 1.85, angle: 325, status: "contested" },
    { label: "WILD SPACE", radius: 4.3, angle: 155, status: "lost" },
];

const SIGHTINGS: Sighting3D[] = [
    { radius: 3.45, angle: 198, level: "critical" },
    { radius: 1.25, angle: 30, level: "moderate" },
    { radius: 3.05, angle: 252, level: "high" },
    { radius: 1.95, angle: 318, level: "low" },
    { radius: 4.05, angle: 162, level: "high" },
];

// Fake per-sector strategic readout, keyed by label so it stays paired with SECTORS.
const SECTOR_META: Record<string, SectorMeta> = {
    "OUTER RIM": { compliance: 41, contacts: 12 },
    "MID RIM": { compliance: 88, contacts: 2 },
    "INNER RIM": { compliance: 96, contacts: 0 },
    "EXPANSION REGION": { compliance: 18, contacts: 27 },
    "COLONIES": { compliance: 63, contacts: 8 },
    "WILD SPACE": { compliance: 9, contacts: 34 },
};

// Fake per-sighting readout, parallel to SIGHTINGS.
const SIGHTING_META: SightingMeta[] = [
    { codename: "ANOMALY-07", coords: "R3.45 / θ198°", action: "ESCALATE" },
    { codename: "ANOMALY-12", coords: "R1.25 / θ30°", action: "MONITOR" },
    { codename: "ANOMALY-03", coords: "R3.05 / θ252°", action: "FLAG FOR REVIEW" },
    { codename: "ANOMALY-19", coords: "R1.95 / θ318°", action: "MONITOR" },
    { codename: "ANOMALY-05", coords: "R4.05 / θ162°", action: "ESCALATE" },
];

// Hidden nodes sit well outside the mapped sectors — unconfirmed signal sources.
const HIDDEN_NODES: HiddenNode3D[] = [
    { label: "UNKNOWN NODE", radius: 5.8, angle: 60 },
    { label: "UNKNOWN NODE", radius: 6.3, angle: 172 },
    { label: "UNKNOWN NODE", radius: 5.6, angle: 235 },
    { label: "UNKNOWN NODE", radius: 6.6, angle: 305 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function polar(radius: number, angleDeg: number, y = 0) {
    const a = (angleDeg * Math.PI) / 180;
    return new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
}

function makeLabelSprite(text: string, colorHex: string, fontSize = 34) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const padding = 10;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.font = `${fontSize}px "IBM Plex Mono", ui-monospace, monospace`;
    const width = Math.ceil(ctx.measureText(text).width) + padding * 2;
    const height = fontSize + padding * 2;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.font = `${fontSize}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = colorHex;
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 14;
    ctx.fillText(text, padding, height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    const scale = 0.014;
    sprite.scale.set(width * scale, height * scale, 1);
    return sprite;
}

// A label sprite whose texture can be regenerated in place — used for the glitching
// "UNKNOWN NODE [ENCRYPTED]" labels.
function makeGlitchLabelSprite(text: string, colorHex: string) {
    const sprite = makeLabelSprite(text, colorHex, 28);
    const scaleX = sprite.scale.x;
    const scaleY = sprite.scale.y;

    function regenerate(newText: string) {
        const old = sprite.material.map;
        const fresh = makeLabelSprite(newText, colorHex, 28);
        sprite.material.map = fresh.material.map;
        sprite.material.needsUpdate = true;
        sprite.scale.set(scaleX, scaleY, 1);
        old?.dispose();
        fresh.material.dispose();
    }

    return { sprite, regenerate };
}

function glitchString(len: number) {
    const chars = "!<>-_\\/[]{}—=+*^?#$0123456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

function makeGlowSprite(colorHex: number, size: number, opacity: number) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const c = new THREE.Color(colorHex);
    const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, `rgba(${rgb},${opacity})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(size, size, 1);
    return sprite;
}

function makeStarfield(count: number, spread: number) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = spread * (0.4 + Math.random() * 0.6);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.cos(phi) * 0.3;
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0x1f2937,
        size: 0.03,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
    });
    return new THREE.Points(geometry, material);
}

// Logarithmic-spiral particle cloud standing in for the galactic disk.
function makeSpiralGalaxy(count: number, arms: number, maxRadius: number) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const coreColor = new THREE.Color(0xc9d4ff);
    const midColor = new THREE.Color(0x6495ed);
    const outerColor = new THREE.Color(0x3b1111);

    const tightness = 0.32; // spiral pitch
    const armSpread = 0.28; // angular jitter around the ideal arm curve

    for (let i = 0; i < count; i++) {
        const armIndex = i % arms;
        const armOffset = (armIndex / arms) * Math.PI * 2;

        // Bias more particles toward the core for density falloff.
        const t = Math.pow(Math.random(), 1.8);
        const radius = 0.15 + t * maxRadius;

        const spiralAngle = armOffset + radius * (1 / tightness) * 0.6;
        const jitter = (Math.random() - 0.5) * armSpread * (0.3 + radius / maxRadius);
        const angle = spiralAngle + jitter;

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 0.3 * Math.min(1, 0.2 + radius / maxRadius);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const frac = radius / maxRadius;
        const color = new THREE.Color();
        if (frac < 0.45) {
            color.lerpColors(coreColor, midColor, frac / 0.45);
        } else {
            color.lerpColors(midColor, outerColor, (frac - 0.45) / 0.55);
        }
        // Brighter/denser near the core.
        const brightness = 1 - frac * 0.55;
        color.multiplyScalar(brightness);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
        size: 0.045,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    return new THREE.Points(geometry, material);
}

// Flat hex-tile floor beneath the holo-table, approximated with ring hexagons.
function makeHexFloor(group: THREE.Group) {
    const hexSize = 0.62;
    const color = 0x1a0505;
    const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
    });
    const hexGeo = new THREE.RingGeometry(hexSize * 0.86, hexSize, 6);
    const meshes: THREE.Mesh[] = [];

    const w = hexSize * Math.sqrt(3);
    const h = hexSize * 1.5;
    let placed = 0;
    for (let row = -3; row <= 3 && placed < 30; row++) {
        for (let col = -3; col <= 3 && placed < 30; col++) {
            const x = w * col + (row % 2 !== 0 ? w / 2 : 0);
            const z = h * row;
            const dist = Math.sqrt(x * x + z * z);
            if (dist > 5.6) continue;
            const mesh = new THREE.Mesh(hexGeo, material);
            mesh.position.set(x, -0.1, z);
            mesh.rotation.x = -Math.PI / 2;
            mesh.rotation.z = Math.PI / 6;
            group.add(mesh);
            meshes.push(mesh);
            placed++;
        }
    }
    return meshes;
}

// A "hologram pillar" — thin vertical line rising from a node.
function makePillar(pos: THREE.Vector3, height: number, colorHex: number) {
    const geo = new THREE.BufferGeometry().setFromPoints([
        pos.clone(),
        pos.clone().add(new THREE.Vector3(0, height, 0)),
    ]);
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.5 }));
}

// Two joined cones ("diamond") representing a patrol fleet marker.
function makeFleetMarker(colorHex: number) {
    const group = new THREE.Group();
    const geo = new THREE.ConeGeometry(0.035, 0.07, 6);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    const top = new THREE.Mesh(geo, mat);
    top.position.y = 0.035;
    const bottom = new THREE.Mesh(geo, mat);
    bottom.position.y = -0.035;
    bottom.rotation.x = Math.PI;
    group.add(top, bottom);
    return group;
}

// ── Component ─────────────────────────────────────────────────────────────────
export interface GalaxyMap3DProps {
    /** Enables drag-to-rotate + scroll-to-zoom (fullscreen mode). */
    interactive?: boolean;
    autoRotate?: boolean;
    cameraDistance?: number;
    className?: string;
    /** Toggle the unconfirmed / hidden signal nodes. */
    showSyndicate?: boolean;
    /** Toggle the animated fleet patrol routes. */
    showPatrols?: boolean;
    /** Sector label to auto-highlight on mount. */
    highlightSector?: string | null;
}

export function GalaxyMap3D({
    interactive = false,
    autoRotate = true,
    cameraDistance = 8.5,
    className,
    showSyndicate = true,
    showPatrols = true,
    highlightSector = null,
}: GalaxyMap3DProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const mount = mountRef.current;
        const wrapper = wrapperRef.current;
        const tooltip = tooltipRef.current;
        if (!mount || !wrapper || !tooltip) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.04);

        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
        const finalCameraPos = new THREE.Vector3(0, cameraDistance * 0.62, cameraDistance);
        // Start high for the bird's-eye dramatic reveal.
        camera.position.set(0, 20, 2);
        camera.lookAt(0, 0, 0);
        // Slight cinematic roll, expressed via the up-vector so OrbitControls preserves it.
        camera.up.set(Math.sin(0.02), Math.cos(0.02), 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.enablePan = false;
        controls.enabled = interactive;
        controls.enableZoom = interactive;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 0.55;
        controls.minPolarAngle = Math.PI / 5;
        controls.maxPolarAngle = Math.PI / 2.15;
        controls.minDistance = 5;
        controls.maxDistance = 16;
        controls.target.set(0, 0, 0);

        const group = new THREE.Group();
        scene.add(group);
        scene.add(makeStarfield(600, 20));

        const ambientRed = new THREE.PointLight(0xdc2626, 0.3, 10);
        ambientRed.position.set(0, 1.5, 0);
        scene.add(ambientRed);

        // ── Spiral galaxy disk ────────────────────────────────────────────
        const spiralGalaxy = makeSpiralGalaxy(3000, 4, 5.2);
        group.add(spiralGalaxy);

        // Faint radial spokes retained as a light structural overlay.
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const geo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(Math.cos(angle) * 4.6, 0, Math.sin(angle) * 4.6),
            ]);
            group.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xdc2626, transparent: true, opacity: 0.04 })));
        }

        // ── Hex floor ─────────────────────────────────────────────────────
        makeHexFloor(group);

        // ── Glowing core ──────────────────────────────────────────────────
        const coreGroup = new THREE.Group();
        const coreSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 24, 24),
            new THREE.MeshBasicMaterial({ color: 0xdc2626, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })
        );
        coreGroup.add(coreSphere);
        const coreGlowLayers = [makeGlowSprite(0xdc2626, 1.4, 0.55), makeGlowSprite(0xdc2626, 0.9, 0.7), makeGlowSprite(0xff8080, 0.5, 0.8)];
        coreGlowLayers.forEach((s) => coreGroup.add(s));
        const centerCore = new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        coreGroup.add(centerCore);
        group.add(coreGroup);

        const centerLabel = makeLabelSprite("CORUSCANT \u2014 IMPERIAL CENTER", "#dc2626");
        centerLabel.position.set(0, 0.5, 0);
        group.add(centerLabel);

        // ── Sectors ───────────────────────────────────────────────────────
        type SectorRig = {
            pos: THREE.Vector3;
            color: number;
            glow: THREE.Sprite;
            ring: THREE.Mesh;
            hitMesh: THREE.Mesh;
            baseGlowScale: number;
            baseRingOpacity: number;
        };
        const sectorRigs: SectorRig[] = [];

        SECTORS.forEach((s, i) => {
            const pos = polar(s.radius, s.angle);
            const color = STATUS_COLOR[s.status];

            const spoke = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos]);
            group.add(new THREE.Line(spoke, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.18 })));

            const glow = makeGlowSprite(color, 0.8, 0.5);
            glow.position.copy(pos).setY(0.01);
            group.add(glow);

            const marker = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), new THREE.MeshBasicMaterial({ color }));
            marker.position.copy(pos);
            group.add(marker);

            // Spinning orbit ring around the node.
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.09, 0.105, 32),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
            );
            ring.position.copy(pos);
            ring.rotation.x = -Math.PI / 2;
            group.add(ring);

            // Hologram pillar rising from the node.
            const pillar = makePillar(pos, 0.3, color);
            group.add(pillar);

            const label = makeLabelSprite(s.label, "#94a3b8");
            label.position.copy(pos).add(new THREE.Vector3(0, 0.45, 0));
            group.add(label);

            // Invisible larger hit target for raycasting.
            const hitMesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.18, 12, 12),
                new THREE.MeshBasicMaterial({ visible: false })
            );
            hitMesh.position.copy(pos);
            hitMesh.userData = { kind: "sector" as HoverKind, index: i };
            group.add(hitMesh);

            sectorRigs.push({ pos, color, glow, ring, hitMesh, baseGlowScale: 0.8, baseRingOpacity: 0.6 });

            if (highlightSector && s.label === highlightSector) {
                glow.scale.set(0.8 * 1.4, 0.8 * 1.4, 1);
                (ring.material as THREE.MeshBasicMaterial).opacity = 1;
            }
        });

        // ── Sightings — radar-ping beacons ──────────────────────────────────
        type SightingRig = {
            pos: THREE.Vector3;
            color: number;
            level: ThreatLevel;
            dot: THREE.Mesh;
            dotGlow: THREE.Sprite;
            ringA: THREE.Mesh;
            ringB: THREE.Mesh;
            hitMesh: THREE.Mesh;
        };
        const sightingRigs: SightingRig[] = [];

        SIGHTINGS.forEach((sig, i) => {
            const pos = polar(sig.radius, sig.angle, 0.02);
            const color = THREAT_COLOR[sig.level];

            const dotGlow = makeGlowSprite(color, 0.4, 0.7);
            dotGlow.position.copy(pos);
            group.add(dotGlow);

            const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), new THREE.MeshBasicMaterial({ color }));
            dot.position.copy(pos);
            group.add(dot);

            const ringMat = () =>
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
            const ringGeo = new THREE.RingGeometry(0.05, 0.062, 32);
            const ringA = new THREE.Mesh(ringGeo, ringMat());
            const ringB = new THREE.Mesh(ringGeo, ringMat());
            [ringA, ringB].forEach((r) => {
                r.position.copy(pos).setY(pos.y + 0.005);
                r.rotation.x = -Math.PI / 2;
                group.add(r);
            });

            const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), new THREE.MeshBasicMaterial({ visible: false }));
            hitMesh.position.copy(pos);
            hitMesh.userData = { kind: "sighting" as HoverKind, index: i };
            group.add(hitMesh);

            sightingRigs.push({ pos, color, level: sig.level, dot, dotGlow, ringA, ringB, hitMesh });
        });

        // ── Hidden nodes ──────────────────────────────────────────────────
        type HiddenRig = {
            pos: THREE.Vector3;
            dot: THREE.Mesh;
            glow: THREE.Sprite;
            labelSprite: THREE.Sprite;
            regenerateLabel: (text: string) => void;
            hitMesh: THREE.Mesh;
        };
        const hiddenRigs: HiddenRig[] = [];
        const hiddenGroup = new THREE.Group();
        hiddenGroup.visible = showSyndicate;
        group.add(hiddenGroup);

        if (showSyndicate) {
            HIDDEN_NODES.forEach((node, i) => {
                const pos = polar(node.radius, node.angle, 0.03);
                const color = 0x00e5ff;

                const glow = makeGlowSprite(color, 0.35, 0.6);
                glow.position.copy(pos);
                hiddenGroup.add(glow);

                const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), new THREE.MeshBasicMaterial({ color }));
                dot.position.copy(pos);
                hiddenGroup.add(dot);

                const { sprite: labelSprite, regenerate } = makeGlitchLabelSprite(`${node.label} [ENCRYPTED]`, "#00e5ff");
                labelSprite.position.copy(pos).add(new THREE.Vector3(0, 0.2, 0));
                hiddenGroup.add(labelSprite);

                // Dashed connective line back toward the core, simulating a jammed signal trace.
                const dashMat = new THREE.LineDashedMaterial({
                    color,
                    transparent: true,
                    opacity: 0.25,
                    dashSize: 0.08,
                    gapSize: 0.06,
                });
                const dashGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos]);
                const dashLine = new THREE.Line(dashGeo, dashMat);
                dashLine.computeLineDistances();
                hiddenGroup.add(dashLine);

                const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), new THREE.MeshBasicMaterial({ visible: false }));
                hitMesh.position.copy(pos);
                hitMesh.userData = { kind: "hidden" as HoverKind, index: i };
                hiddenGroup.add(hitMesh);

                hiddenRigs.push({ pos, dot, glow, labelSprite, regenerateLabel: regenerate, hitMesh });
            });
        }

        // ── Patrol routes ─────────────────────────────────────────────────
        type PatrolRig = { curve: THREE.CatmullRomCurve3; marker: THREE.Group; trail: THREE.Sprite; speed: number; offset: number };
        const patrolRigs: PatrolRig[] = [];
        const patrolGroup = new THREE.Group();
        patrolGroup.visible = showPatrols;
        group.add(patrolGroup);

        if (showPatrols) {
            const patrolTargets = SECTORS.slice(0, 3);
            patrolTargets.forEach((s, i) => {
                const end = polar(s.radius, s.angle);
                const mid = end.clone().multiplyScalar(0.5).add(new THREE.Vector3(0, 0.6 + i * 0.15, 0));
                const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.05, 0), mid, end]);

                const points = curve.getPoints(60);
                const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
                const lineMat = new THREE.LineBasicMaterial({ color: 0x9ca3af, transparent: true, opacity: 0.25 });
                patrolGroup.add(new THREE.Line(lineGeo, lineMat));

                const marker = makeFleetMarker(0x9ca3af);
                patrolGroup.add(marker);

                const trail = makeGlowSprite(0xdc2626, 0.18, 0.6);
                patrolGroup.add(trail);

                patrolRigs.push({ curve, marker, trail, speed: 0.12 + i * 0.03, offset: i * 0.33 });
            });
        }

        // ── Raycasting + tooltip ────────────────────────────────────────────
        const raycaster = new THREE.Raycaster();
        const pointerNDC = new THREE.Vector2(-10, -10);
        const hitTargets: THREE.Object3D[] = [
            ...sectorRigs.map((r) => r.hitMesh),
            ...sightingRigs.map((r) => r.hitMesh),
            ...hiddenRigs.map((r) => r.hitMesh),
        ];

        let hovered: TooltipState | null = null;

        function setHover(next: TooltipState | null) {
            if (hovered && (!next || hovered.kind !== next.kind || hovered.index !== next.index)) {
                if (hovered.kind === "sector") {
                    const rig = sectorRigs[hovered.index];
                    rig.glow.scale.set(rig.baseGlowScale, rig.baseGlowScale, 1);
                    (rig.ring.material as THREE.MeshBasicMaterial).opacity = rig.baseRingOpacity;
                }
            }
            hovered = next;
            if (hovered?.kind === "sector") {
                const rig = sectorRigs[hovered.index];
                const expanded = rig.baseGlowScale * 1.4;
                rig.glow.scale.set(expanded, expanded, 1);
                (rig.ring.material as THREE.MeshBasicMaterial).opacity = 1;
            }
        }

        function onPointerMove(e: PointerEvent) {
            const rect = mount!.getBoundingClientRect();
            pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        }
        function onPointerLeave() {
            pointerNDC.set(-10, -10);
        }
        renderer.domElement.addEventListener("pointermove", onPointerMove);
        renderer.domElement.addEventListener("pointerleave", onPointerLeave);

        function buildTooltipHTML(state: TooltipState): string {
            if (state.kind === "sector") {
                const s = SECTORS[state.index];
                const meta = SECTOR_META[s.label];
                const colorHex = `#${STATUS_COLOR[s.status].toString(16).padStart(6, "0")}`;
                return `
                    <div style="font-weight:700;color:${colorHex};margin-bottom:4px;">${s.label}</div>
                    <div style="display:inline-block;border:1px solid ${colorHex};color:${colorHex};padding:1px 6px;font-size:10px;letter-spacing:0.06em;margin-bottom:6px;">${s.status.toUpperCase()}</div>
                    <div>Imperial compliance: ${meta.compliance}%</div>
                    <div>Signal contacts logged: ${meta.contacts}</div>
                `;
            }
            if (state.kind === "sighting") {
                const sig = SIGHTINGS[state.index];
                const meta = SIGHTING_META[state.index];
                const colorHex = `#${THREAT_COLOR[sig.level].toString(16).padStart(6, "0")}`;
                return `
                    <div style="font-weight:700;color:${colorHex};margin-bottom:4px;">${meta.codename}</div>
                    <div style="display:inline-block;border:1px solid ${colorHex};color:${colorHex};padding:1px 6px;font-size:10px;letter-spacing:0.06em;margin-bottom:6px;">${sig.level.toUpperCase()}</div>
                    <div>Last known: ${meta.coords}</div>
                    <div>Recommended: ${meta.action}</div>
                `;
            }
            return `
                <div style="font-weight:700;color:#00e5ff;margin-bottom:4px;">SIGNAL JAMMED</div>
                <div>LOCATION UNCONFIRMED</div>
            `;
        }

        function updateTooltip() {
            if (!hovered || !tooltip || !mount) {
                if (tooltip) tooltip.style.opacity = "0";
                return;
            }
            let worldPos: THREE.Vector3;
            if (hovered.kind === "sector") worldPos = sectorRigs[hovered.index].pos;
            else if (hovered.kind === "sighting") worldPos = sightingRigs[hovered.index].pos;
            else worldPos = hiddenRigs[hovered.index].pos;

            const vector = worldPos.clone().project(camera);
            const rect = mount.getBoundingClientRect();
            const x = (vector.x * 0.5 + 0.5) * rect.width;
            const y = (-vector.y * 0.5 + 0.5) * rect.height;

            tooltip.innerHTML = buildTooltipHTML(hovered);
            tooltip.style.transform = `translate(${x + 14}px, ${y - 10}px)`;
            tooltip.style.opacity = "1";
            const color =
                hovered.kind === "sector"
                    ? STATUS_COLOR[SECTORS[hovered.index].status]
                    : hovered.kind === "sighting"
                        ? THREAT_COLOR[SIGHTINGS[hovered.index].level]
                        : 0x00e5ff;
            tooltip.style.borderColor = `#${color.toString(16).padStart(6, "0")}`;
        }

        // ── Animation loop ────────────────────────────────────────────────
        const clock = new THREE.Clock();
        let frameId: number;
        let glitchAccumulator = 0;
        const introDuration = 2; // seconds

        function resize() {
            if (!mount) return;
            const { clientWidth, clientHeight } = mount;
            if (clientWidth === 0 || clientHeight === 0) return;
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(clientWidth, clientHeight);
        }
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(mount);

        function animate() {
            frameId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            const dt = clock.getDelta();

            // Bird's-eye reveal: lerp camera position down to its resting spot.
            if (t < introDuration) {
                const k = 1 - Math.pow(1 - t / introDuration, 3);
                camera.position.lerpVectors(new THREE.Vector3(0, 20, 2), finalCameraPos, k);
                camera.lookAt(0, 0, 0);
            }

            // Core pulse.
            const corePulse = 1 + Math.sin(t * Math.PI) * 0.1; // 0.9 - 1.1 over ~2s
            coreGroup.scale.setScalar(corePulse);

            // Sighting radar pings + pulsing dot.
            sightingRigs.forEach((rig, i) => {
                const cycle = THREAT_CYCLE[rig.level];
                const phaseA = (t % cycle) / cycle;
                const phaseB = ((t + cycle / 2) % cycle) / cycle;
                [rig.ringA, rig.ringB].forEach((ring, j) => {
                    const phase = j === 0 ? phaseA : phaseB;
                    const scale = 0.3 + phase * 4;
                    ring.scale.set(scale, scale, 1);
                    (ring.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - phase);
                });
                const pulse = 0.7 + Math.sin(t * 2 + i * 0.6) * 0.3;
                rig.dot.scale.setScalar(pulse);
                (rig.dotGlow.material as THREE.SpriteMaterial).opacity = 0.35 + Math.sin(t * 2 + i * 0.6) * 0.25;
            });

            // Sector orbit rings spin slowly.
            sectorRigs.forEach((rig, i) => {
                rig.ring.rotation.z = t * 0.3 * (i % 2 === 0 ? 1 : -1);
            });

            // Hidden node glitch / jitter.
            if (showSyndicate) {
                glitchAccumulator += dt;
                const relabel = glitchAccumulator >= 0.5;
                if (relabel) glitchAccumulator = 0;
                hiddenRigs.forEach((rig) => {
                    const jitter = 0.75 + Math.random() * 0.5;
                    rig.dot.scale.setScalar(jitter);
                    rig.glow.scale.set(0.35 * jitter, 0.35 * jitter, 1);
                    if (relabel) {
                        const showReal = Math.random() > 0.4;
                        rig.regenerateLabel(showReal ? "UNKNOWN NODE [ENCRYPTED]" : glitchString(18));
                    }
                });
            }

            // Patrol fleets traveling their curves.
            if (showPatrols) {
                patrolRigs.forEach((rig) => {
                    const tt = (t * rig.speed + rig.offset) % 1;
                    const pos = rig.curve.getPoint(tt);
                    rig.marker.position.copy(pos);
                    const trailPos = rig.curve.getPoint(Math.max(0, tt - 0.02));
                    rig.trail.position.copy(trailPos);
                });
            }

            // Raycast against interactive targets.
            raycaster.setFromCamera(pointerNDC, camera);
            const intersections = raycaster.intersectObjects(hitTargets, false);
            if (intersections.length > 0) {
                const obj = intersections[0].object;
                setHover({ kind: obj.userData.kind, index: obj.userData.index });
            } else {
                setHover(null);
            }
            updateTooltip();

            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        return () => {
            cancelAnimationFrame(frameId);
            ro.disconnect();
            renderer.domElement.removeEventListener("pointermove", onPointerMove);
            renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
            controls.dispose();
            renderer.dispose();
            scene.traverse((obj) => {
                const anyObj = obj as THREE.Mesh & THREE.Line & THREE.Points & THREE.Sprite;
                anyObj.geometry?.dispose?.();
                const mat = anyObj.material as THREE.Material | THREE.Material[] | undefined;
                if (Array.isArray(mat)) {
                    mat.forEach((m) => {
                        (m as THREE.MeshBasicMaterial).map?.dispose?.();
                        m.dispose();
                    });
                } else if (mat) {
                    (mat as THREE.MeshBasicMaterial).map?.dispose?.();
                    mat.dispose();
                }
            });
            if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
        };
    }, [interactive, autoRotate, cameraDistance, showSyndicate, showPatrols, highlightSector]);

    return (
        <div ref={wrapperRef} className={className} style={{ width: "100%", height: "100%", position: "relative" }}>
            <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
            <div
                ref={tooltipRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    opacity: 0,
                    pointerEvents: "none",
                    background: "rgba(0,0,0,0.92)",
                    border: "1px solid #dc2626",
                    borderRadius: 0,
                    padding: "8px 10px",
                    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
                    fontSize: "12px",
                    color: "#e5e7eb",
                    lineHeight: 1.5,
                    boxShadow: "0 0 16px rgba(220,38,38,0.35)",
                    transition: "opacity 120ms ease",
                    whiteSpace: "nowrap",
                    zIndex: 10,
                }}
            />
        </div>
    );
}