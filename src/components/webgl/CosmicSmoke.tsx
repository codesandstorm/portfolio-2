"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { introAmounts } from "@/lib/intro";
import { smooth, world } from "@/lib/world";
import { smokeFragment, smokeVertex } from "@/shaders/smoke";

/**
 * The landing's fire-and-ice smoke, in two layers: a deep layer behind her
 * portrait and thin wisps in front of it. It fades as the visitor flies in,
 * and stops drawing entirely once it's gone.
 */
export function CosmicSmoke({ lite = false }: { lite?: boolean }) {
  const { size } = useThree();
  const backMesh = useRef<THREE.Mesh>(null);
  const frontMesh = useRef<THREE.Mesh>(null);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const [back, front] = useMemo(() => {
    const make = (layer: number) =>
      new THREE.ShaderMaterial({
        vertexShader: smokeVertex,
        // Phones get fewer noise octaves: the same smoke, a little softer, much cheaper.
        fragmentShader: lite ? smokeFragment.replace(/i < 6/g, "i < 4").replace(/i < 5/g, "i < 3") : smokeFragment,
        uniforms: {
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uAmount: { value: 0 },
          uLayer: { value: layer },
          uFlash: { value: 0 },
          uPointer: { value: new THREE.Vector2() },
          uCenter: { value: new THREE.Vector2(0.5, 0.5) },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    return [make(0), make(1)];
  }, [lite]);

  useFrame((_, dt) => {
    // The title's lightning flash decays here.
    world.heroFlash = Math.max(0, world.heroFlash - dt * 2.2);
    const amount = introAmounts(world.intro).smoke * (1 - smooth(0.05, 1.15, world.t));
    pointer.lerp({ x: world.pointer.x, y: world.pointer.y } as THREE.Vector2, 0.03);
    for (const m of [back, front]) {
      const u = m.uniforms;
      u.uTime.value = world.time + 40;
      u.uAspect.value = size.width / size.height;
      u.uAmount.value = amount;
      u.uFlash.value = world.heroFlash;
      (u.uPointer.value as THREE.Vector2).copy(pointer);
      (u.uCenter.value as THREE.Vector2).set(0.5, size.width / size.height < 0.9 ? 0.58 : 0.5);
    }
    const on = amount > 0.002;
    if (backMesh.current) backMesh.current.visible = on;
    if (frontMesh.current) frontMesh.current.visible = on;
  });

  return (
    <>
      <mesh ref={backMesh} material={back} renderOrder={-900} frustumCulled={false}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <mesh ref={frontMesh} material={front} renderOrder={-700} frustumCulled={false}>
        <planeGeometry args={[2, 2]} />
      </mesh>
    </>
  );
}
