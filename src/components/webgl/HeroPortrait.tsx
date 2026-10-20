"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { profile } from "@/content/data";
import { introAmounts } from "@/lib/intro";
import { useUI } from "@/lib/store";
import { smooth, world } from "@/lib/world";
import { heroPortraitFragment, heroPortraitVertex } from "@/shaders/heroPortrait";
import { getHeroPortrait } from "@/world/portrait";

/** Her photograph at the centre of the landing, between the two smoke layers. */
export function HeroPortrait() {
  const { size } = useThree();
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: heroPortraitVertex,
        fragmentShader: heroPortraitFragment,
        uniforms: {
          uTex: { value: null },
          uRect: { value: new THREE.Vector4(-0.5, -0.9, 1, 1.8) },
          uReveal: { value: 0 },
          uOpacity: { value: 1 },
          uTime: { value: 0 },
          uFlash: { value: 0 },
          uVoice: { value: 0 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    let tex: THREE.CanvasTexture | null = null;
    const portrait = getHeroPortrait(profile.portrait).catch(() => null);
    // The opening may begin once the type and her photograph are ready.
    void Promise.all([document.fonts.ready, portrait]).then(() => useUI.getState().setReady());
    void portrait.then((c) => {
      if (!c) return;
      tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      material.uniforms.uTex.value = tex;
    });
    return () => {
      tex?.dispose();
      material.dispose();
    };
  }, [material]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const amount = introAmounts(world.intro).portrait;
    const away = 1 - smooth(0.02, 0.6, world.t);
    m.visible = !!material.uniforms.uTex.value && away > 0.002 && amount > 0.001;
    if (!m.visible) return;
    const aspect = size.width / size.height;
    const tall = aspect < 0.9;
    // A square image: tall on wide screens (her name overlaps her shoulders), full-width on phones.
    const h = tall ? Math.min(1.25, 1.9 * aspect) : 1.88;
    const w = h / aspect;
    const top = tall ? 0.84 : 0.97;
    // As the visitor scrolls in she drifts up and back, and the pointer leans her gently.
    const lift = smooth(0.02, 0.6, world.t) * 0.25;
    (material.uniforms.uRect.value as THREE.Vector4).set(-w / 2 + world.pointer.x * 0.008, top - h + lift - world.pointer.y * 0.006, w, h);
    material.uniforms.uReveal.value = amount;
    material.uniforms.uOpacity.value = away;
    material.uniforms.uTime.value = world.time;
    material.uniforms.uFlash.value = world.heroFlash;
    material.uniforms.uVoice.value = world.voice;
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={-800} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
