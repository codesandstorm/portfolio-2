"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import type { BloomEffect, ChromaticAberrationEffect } from "postprocessing";
import * as THREE from "three";
import { tierConfig, type Tier } from "@/lib/capability";
import { world } from "@/lib/world";
import { Artifacts } from "./Artifacts";
import { Atmosphere } from "./Atmosphere";
import { CameraRig } from "./CameraRig";
import { CollisionSystem } from "./CollisionSystem";
import { Constellation } from "./Constellation";
import { Convergence } from "./Convergence";
import { Dust } from "./Dust";
import { EnergyArcs } from "./EnergyArcs";
import { Fragments } from "./Fragments";
import { IceShards } from "./IceShards";
import { Particles } from "./Particles";
import { Portrait } from "./Portrait";

const BLOOM = 0.85;

/** Post-processing that answers the collision: a bloom spike and a brief chromatic split. */
function PostFX() {
  const bloom = useRef<BloomEffect>(null);
  const ca = useRef<ChromaticAberrationEffect>(null);
  const offset = useRef(new THREE.Vector2());
  useFrame(() => {
    const f = world.heroFlash;
    if (bloom.current) bloom.current.intensity = BLOOM + f * f * 1.1;
    offset.current.set(f * f * f * 0.0022, f * f * f * 0.0008);
    if (ca.current) ca.current.offset = offset.current;
  });
  return (
    <EffectComposer multisampling={0}>
      <Bloom ref={bloom} mipmapBlur intensity={BLOOM} luminanceThreshold={0.42} luminanceSmoothing={0.25} radius={0.7} />
      <ChromaticAberration ref={ca} offset={offset.current} radialModulation={false} modulationOffset={0} />
      <Noise opacity={0.035} premultiply />
      <Vignette offset={0.28} darkness={0.75} />
    </EffectComposer>
  );
}

/** The one persistent WebGL world behind every chapter. */
export default function WorldCanvas({ tier }: { tier: Exclude<Tier, "static"> }) {
  const cfg = tierConfig[tier];
  const [dpr, setDpr] = useState(cfg.dpr[1]);

  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <Canvas
        dpr={[cfg.dpr[0], dpr]}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false }}
        camera={{ fov: 50, near: 0.1, far: 400, position: [0, 0, 46] }}
      >
        <color attach="background" args={["#04040a"]} />
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(cfg.dpr[0], d - 0.25))}
          onIncline={() => setDpr((d) => Math.min(cfg.dpr[1], d + 0.25))}
        />
        <Atmosphere />
        <CameraRig />
        <Dust count={cfg.dust} />
        <Constellation />
        <EnergyArcs />
        <IceShards count={cfg.shards} />
        <Particles count={cfg.particles} />
        <CollisionSystem />
        <Fragments />
        <Portrait />
        <Artifacts />
        <Convergence />
        {cfg.post && <PostFX />}
      </Canvas>
    </div>
  );
}
