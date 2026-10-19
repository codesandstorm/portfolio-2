"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useUI } from "@/lib/store";
import { world } from "@/lib/world";
import { posOf } from "@/world/layout";

/** Level-4 event: the light burst where an achievement's paths meet. */
export function Convergence() {
  const group = useRef<THREE.Group>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.MeshBasicMaterial({
            color: new THREE.Color("#ff8a1f").multiplyScalar(2),
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
      ),
    [],
  );

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    world.flash = Math.max(0, world.flash - dt * 0.7);
    g.visible = world.flash > 0.001;
    if (!g.visible) return;
    const id = useUI.getState().scrollFocus;
    if (id) g.position.set(...posOf(id));
    const life = 1 - world.flash;
    rings.current.forEach((m, i) => {
      if (!m) return;
      const l = Math.max(0, life - i * 0.12);
      m.scale.setScalar(0.1 + l * (3 + i * 1.5));
      mats[i].opacity = Math.max(0, 1 - l) * (0.9 - i * 0.25);
    });
  });

  return (
    <group ref={group}>
      {mats.map((m, i) => (
        <mesh key={i} ref={(r) => { rings.current[i] = r; }} material={m} rotation={[i * 0.6, i * 0.4, 0]}>
          <ringGeometry args={[0.96, 1, 128]} />
        </mesh>
      ))}
    </group>
  );
}
