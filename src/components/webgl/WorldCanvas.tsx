"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { tierConfig, type Tier } from "@/lib/capability";
import { Artifacts } from "./Artifacts";
import { CameraRig } from "./CameraRig";
import { Constellation } from "./Constellation";
import { Convergence } from "./Convergence";
import { Dust } from "./Dust";
import { Fragments } from "./Fragments";
import { Particles } from "./Particles";
import { Portrait } from "./Portrait";

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
        <CameraRig />
        <Dust count={cfg.dust} />
        <Constellation />
        <Particles count={cfg.particles} />
        <Fragments />
        <Portrait />
        <Artifacts />
        <Convergence />
        {cfg.post && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.42} luminanceSmoothing={0.25} radius={0.7} />
            <Noise opacity={0.035} premultiply />
            <Vignette offset={0.28} darkness={0.75} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
