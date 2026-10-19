"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { profile } from "@/content/data";
import { chapterIndex } from "@/lib/chapters";
import { chapterProgress, smooth, world } from "@/lib/world";
import { holoFragment, holoVertex } from "@/shaders/holo";
import { getPortraitCanvas } from "@/world/portrait";
import { SHATTER } from "./Particles";

/** The holographic plane behind the point-cloud portrait in "Akshita". */
export function Portrait() {
  const group = useRef<THREE.Group>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: holoVertex,
        fragmentShader: holoFragment,
        uniforms: {
          uTex: { value: null },
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uOpacity: { value: 0 },
          uPointer: { value: new THREE.Vector2() },
          uGold: { value: new THREE.Color("#ffb347") },
          uElectric: { value: new THREE.Color("#6fb6ff") },
          uPhoto: { value: profile.portrait ? 1 : 0 },
          uShatter: { value: 0 },
          uVoice: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useEffect(() => {
    let tex: THREE.CanvasTexture | null = null;
    void getPortraitCanvas(profile.portrait).then((c) => {
      tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      material.uniforms.uTex.value = tex;
    });
    return () => {
      tex?.dispose();
      material.dispose();
    };
  }, [material]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const i = chapterIndex.akshita;
    const p = chapterProgress(i);
    const inChapter = world.t > i - 0.15 && world.t < SHATTER[1];
    g.visible = inChapter && !!material.uniforms.uTex.value;
    if (!g.visible) return;
    const presence = smooth(i - 0.12, i + 0.05, world.t) * (1 - smooth(SHATTER[1] - 0.15, SHATTER[1], world.t));
    material.uniforms.uVoice.value = world.voice;
    material.uniforms.uShatter.value = smooth(SHATTER[0], SHATTER[1] - 0.12, world.t);
    material.uniforms.uOpacity.value = presence * 0.9;
    material.uniforms.uReveal.value = smooth(0, 0.3, p) * 1.02;
    material.uniforms.uTime.value = performance.now() / 1000;
    const k = 1 - Math.exp(-dt * 3);
    const ptr = material.uniforms.uPointer.value as THREE.Vector2;
    ptr.x += (world.pointer.x - ptr.x) * k;
    ptr.y += (world.pointer.y - ptr.y) * k;
    // Perspective follows the cursor through the camera rig, so the plane and
    // the point cloud stay locked together.
  });

  return (
    <group ref={group} position={[0, 0.2, 0.2]}>
      <mesh material={material}>
        <planeGeometry args={[6.6, 6.6, 48, 48]} />
      </mesh>
    </group>
  );
}
