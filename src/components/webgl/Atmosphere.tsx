"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { chapterIndex } from "@/lib/chapters";
import { indoreSky } from "@/lib/indore";
import { smooth, world } from "@/lib/world";
import { atmosphereFragment, atmosphereVertex } from "@/shaders/atmosphere";

/**
 * The environment light behind the story. (The landing has its own cosmic
 * smoke.) Its haze follows the sky over Indore, and in the finale fire and ice
 * return at opposite edges of the frame.
 */
export function Atmosphere() {
  const { size } = useThree();
  const state = useRef({ glow: 0 });
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: {
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uFirePos: { value: new THREE.Vector2(0.97, 0.5) },
          uIcePos: { value: new THREE.Vector2(0.03, 0.5) },
          uCenter: { value: new THREE.Vector2(0.5, 0.5) },
          uFire: { value: 0 },
          uIce: { value: 0 },
          uFlash: { value: 0 },
          uHaze: { value: 1 },
          uTall: { value: 0 },
          uSeam: { value: 0 },
          uSky: { value: new THREE.Color(0.0035, 0.004, 0.012) },
        },
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  useFrame((_, dt) => {
    const u = material.uniforms;
    const t = world.t;
    const tall = size.width / size.height < 0.9;
    // Fire and ice glow only in the finale (the landing draws its own); elsewhere a faint presence.
    const want = t >= chapterIndex.continue ? 0.6 * smooth(chapterIndex.continue, chapterIndex.continue + 0.5, t) : t < 1 ? 0 : 0.12;
    state.current.glow += (want - state.current.glow) * (1 - Math.exp(-dt * 3));
    u.uFire.value = u.uIce.value = state.current.glow;
    // Ice on the left and fire on the right, as on the landing (top and bottom on phones).
    (u.uIcePos.value as THREE.Vector2).set(tall ? 0.5 : 0.03, tall ? 0.97 : 0.5);
    (u.uFirePos.value as THREE.Vector2).set(tall ? 0.5 : 0.97, tall ? 0.03 : 0.5);
    u.uAspect.value = size.width / size.height;
    u.uTall.value = tall ? 1 : 0;
    (u.uSky.value as THREE.Color).setRGB(...indoreSky(), THREE.LinearSRGBColorSpace);
    u.uTime.value = world.time;
  });

  return (
    <mesh material={material} renderOrder={-1000} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
