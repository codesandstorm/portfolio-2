"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { world } from "@/lib/world";
import { HERO_Z, heroFrame, pxToHero } from "@/world/hero";

/**
 * The Fire × Ice impact: a warm hairline ring and a cold one leave the point
 * of contact. Short, then gone.
 */
export function CollisionSystem() {
  const { size } = useThree();
  const group = useRef<THREE.Group>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const colors = ["#ffa24a", "#62b6ff"];
  const mats = useMemo(
    () =>
      colors.map(
        (c) =>
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(c).multiplyScalar(1.6),
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((_, dt) => {
    world.heroFlash = Math.max(0, world.heroFlash - dt * 1.1);
    world.shake = Math.max(0, world.shake - dt * 3);
    const g = group.current;
    if (!g) return;
    g.visible = world.heroFlash > 0.001;
    if (!g.visible) return;
    const f = heroFrame(size.width, size.height);
    const r = world.nameRect;
    const c = r ? pxToHero(r.cx, r.cy, size.width, size.height, f) : [0, 0];
    g.position.set(c[0], c[1], HERO_Z + 0.5);
    const life = 1 - world.heroFlash;
    rings.current.forEach((m, i) => {
      if (!m) return;
      const l = Math.min(1, Math.max(0, life * 1.3 - i * 0.08));
      const ease = 1 - Math.pow(1 - l, 3);
      m.scale.set(0.2 + ease * f.s * (1.1 + i * 0.25), (0.2 + ease * f.s * (1.1 + i * 0.25)) * 0.62, 1);
      mats[i].opacity = Math.pow(1 - l, 2.2) * 0.75;
    });
  });

  return (
    <group ref={group}>
      {mats.map((m, i) => (
        <mesh key={i} ref={(r) => { rings.current[i] = r; }} material={m}>
          <ringGeometry args={[0.994, 1, 200]} />
        </mesh>
      ))}
    </group>
  );
}
