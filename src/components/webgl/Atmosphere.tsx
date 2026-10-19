"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { chapterIndex } from "@/lib/chapters";
import { introAmounts } from "@/lib/intro";
import { smooth, world } from "@/lib/world";
import { atmosphereFragment, atmosphereVertex } from "@/shaders/atmosphere";
import { heroFrame } from "@/world/hero";
import { indoreSky } from "@/lib/indore";

/** The environment reacting to fire and ice: warm left, cold right, combined at impact. */
export function Atmosphere() {
  const { size } = useThree();
  const state = useRef({ fire: 0, ice: 0 });
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: {
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uFirePos: { value: new THREE.Vector2(0.2, 0.5) },
          uIcePos: { value: new THREE.Vector2(0.8, 0.5) },
          uCenter: { value: new THREE.Vector2(0.5, 0.5) },
          uFire: { value: 0 },
          uIce: { value: 0 },
          uFlash: { value: 0 },
          uHaze: { value: 0 },
          uTall: { value: 0 },
          uSky: { value: new THREE.Color(0.0035, 0.004, 0.012) },
          uSeam: { value: 0 },
        },
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  useFrame((_, dt) => {
    const f = heroFrame(size.width, size.height);
    const u = material.uniforms;
    const t = world.t;
    const amt = introAmounts(world.intro);
    const toUv = (x: number, y: number) => [0.5 + x / (2 * f.hw), 0.5 + y / (2 * f.hh)] as const;
    const r = world.nameRect;
    const c = r ? [r.cx / size.width, 1 - r.cy / size.height] : [0.5, 0.5];
    const [fx, fy] = toUv(...f.fire);
    const [ix, iy] = toUv(...f.ice);
    const a = amt.attract;

    let fire: number, ice: number, edge = 0;
    if (t < 1.4) {
      // Hero: each light wakes with its system; after impact both settle, balanced.
      const after = amt.glyph;
      const hero = (1 - after) * 1 + after * 0.55;
      fire = Math.max(amt.spark * 0.25, amt.fire) * hero;
      ice = Math.max(amt.spark * 0.2, amt.ice) * hero;
      const fade = 1 - smooth(0.9, 1.4, t);
      fire *= fade;
      ice *= fade;
    } else if (t >= chapterIndex.continue) {
      // Finale: fire and ice return at opposite edges, joined by the network.
      const p = smooth(9, 9.5, t);
      fire = ice = 0.6 * p;
      edge = p;
    } else {
      fire = ice = 0.12;
    }
    const k = 1 - Math.exp(-dt * 3);
    state.current.fire += (fire - state.current.fire) * k;
    state.current.ice += (ice - state.current.ice) * k;

    const pull = t < 1.4 ? a * 0.85 : 0;
    const lerp = (x: number, y: number, m: number) => x + (y - x) * m;
    // In the finale the two lights sit at opposite edges of the frame.
    const fpx = lerp(lerp(fx, c[0], pull), f.tall ? 0.5 : 0.03, edge);
    const fpy = lerp(lerp(fy, c[1], pull), f.tall ? 0.97 : 0.5, edge);
    const ipx = lerp(lerp(ix, c[0], pull), f.tall ? 0.5 : 0.97, edge);
    const ipy = lerp(lerp(iy, c[1], pull), f.tall ? 0.03 : 0.5, edge);
    (u.uFirePos.value as THREE.Vector2).set(fpx, fpy);
    (u.uIcePos.value as THREE.Vector2).set(ipx, ipy);
    (u.uCenter.value as THREE.Vector2).set(c[0], c[1]);
    u.uFire.value = state.current.fire;
    u.uIce.value = state.current.ice;
    u.uFlash.value = world.heroFlash;
    u.uHaze.value = Math.min(1, amt.spark + (t > 0.5 ? 1 : 0));
    u.uAspect.value = size.width / size.height;
    u.uTall.value = f.tall ? 1 : 0;
    (u.uSky.value as THREE.Color).setRGB(...indoreSky(), THREE.LinearSRGBColorSpace);
    // The seam marks the duality; once they have met, it is gone.
    u.uSeam.value = smooth(0.3, 0.45, world.intro) * (1 - amt.glyph);
    u.uTime.value = world.time;
  });

  return (
    <mesh material={material} renderOrder={-1000} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
