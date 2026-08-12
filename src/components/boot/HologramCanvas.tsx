"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useLowPowerDevice } from "./hooks/useLowPowerDevice";
import styles from "./HologramCanvas.module.css";

const CYAN = 0x2fd0c9;

export default function HologramCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const lowPower = useLowPowerDevice();

  useEffect(() => {
    if (lowPower) return; // CSS fallback renders instead — see below
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const latticeGroup = new THREE.Group();
    scene.add(latticeGroup);

    // Inner Surveillance Core (Geodesic sphere)
    const innerGeo = new THREE.IcosahedronGeometry(1.2, 2);
    const innerPoints = new THREE.Points(
      innerGeo,
      new THREE.PointsMaterial({
        color: CYAN,
        size: 0.035,
        transparent: true,
        opacity: 0.9,
      })
    );

    const innerWireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(innerGeo),
      new THREE.LineBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0.25,
      })
    );

    // Outer Orbital Network Ring / Sphere
    const outerGeo = new THREE.IcosahedronGeometry(1.65, 1);
    const outerWireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(outerGeo),
      new THREE.LineBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0.12,
      })
    );

    // Add highlighted "Informant Red Nodes" on outer lattice
    const alertGeo = new THREE.IcosahedronGeometry(1.65, 0);
    const alertNodes = new THREE.Points(
      alertGeo,
      new THREE.PointsMaterial({
        color: 0xc81d25, // Imperial red
        size: 0.045,
        transparent: true,
        opacity: 0.85,
      })
    );

    latticeGroup.add(innerPoints, innerWireframe, outerWireframe, alertNodes);

    // Staggered initial scale-in
    latticeGroup.scale.setScalar(0.001);

    let growProgress = 0;
    let rafId: number;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetX = nx * 0.08;
      targetY = ny * 0.05;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    function animate(t: number) {
      rafId = requestAnimationFrame(animate);

      if (growProgress < 1) {
        growProgress = Math.min(growProgress + 0.02, 1);
        const eased = 1 - Math.pow(1 - growProgress, 3);
        latticeGroup.scale.setScalar(eased);
      }

      // Opposite rotation for inner vs outer elements for high-tech holographic feel
      innerPoints.rotation.y = innerWireframe.rotation.y = t * 0.00018;
      innerPoints.rotation.x = innerWireframe.rotation.x = t * 0.00008;

      outerWireframe.rotation.y = alertNodes.rotation.y = -t * 0.00012;
      outerWireframe.rotation.z = alertNodes.rotation.z = t * 0.00005;

      // Subtle pulse / network activity pulse
      const pulse = 0.8 + 0.2 * Math.sin(t * 0.0025);
      (innerWireframe.material as THREE.LineBasicMaterial).opacity = 0.22 * pulse;
      (alertNodes.material as THREE.PointsMaterial).opacity = 0.7 + 0.3 * Math.sin(t * 0.004);

      // Camera parallax
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (-targetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    rafId = requestAnimationFrame(animate);

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      innerGeo.dispose();
      outerGeo.dispose();
      alertGeo.dispose();
      (innerPoints.material as THREE.Material).dispose();
      (innerWireframe.material as THREE.Material).dispose();
      (outerWireframe.material as THREE.Material).dispose();
      (alertNodes.material as THREE.Material).dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [lowPower]);

  if (lowPower) {
    // Same silhouette, zero WebGL cost: a static CSS-animated radial-gradient orb.
    return (
      <div className={styles.wrap}>
        <div className={styles.fallbackOrb} />
      </div>
    );
  }

  return <div className={styles.wrap} ref={mountRef} />;
}
