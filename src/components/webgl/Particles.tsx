"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { profile } from "@/content/data";
import { useUI } from "@/lib/store";
import { world } from "@/lib/world";
import { particlesFragment, particlesVertex } from "@/shaders/particles";
import { getPortraitCanvas } from "@/world/portrait";
import { nameTarget, portraitTarget, seedTarget, tunnelTarget, webTarget } from "@/world/targets";

type Mode = "seed" | "name" | "tunnel" | "portrait" | "web" | "finale";

const LOOK: Record<Mode, { opacity: number; size: number }> = {
  seed: { opacity: 0.45, size: 1 },
  name: { opacity: 1, size: 1.4 },
  tunnel: { opacity: 0.75, size: 1.5 },
  portrait: { opacity: 1, size: 0.75 },
  web: { opacity: 0.4, size: 0.7 },
  finale: { opacity: 1, size: 2.6 },
};

function modeAt(t: number, intro: number): Mode {
  if (t < 1) return intro < 0.42 ? "seed" : "name";
  if (t < 1.12) return "name";
  if (t < 1.86) return "tunnel";
  if (t < 2.92) return "portrait";
  if (t < 9) return "web";
  return "finale";
}

/** Width of the visible frustum (world units) at `distance` from the camera. */
function visibleWidth(distance: number, fov: number, aspect: number) {
  return 2 * distance * Math.tan((fov * Math.PI) / 360) * aspect;
}

export function Particles({ count }: { count: number }) {
  const { size, gl } = useThree();
  const targets = useRef<Partial<Record<Mode, Float32Array>>>({});
  const velocity = useMemo(() => new Float32Array(count * 3), [count]);
  const stiffness = useMemo(() => Float32Array.from({ length: count }, () => 5 + Math.random() * 11), [count]);
  const look = useRef({ opacity: 0, size: 1 });

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seed = seedTarget(count);
    targets.current.seed = seed;
    g.setAttribute("position", new THREE.BufferAttribute(seed.slice(), 3));
    const colors = new Float32Array(count * 3);
    const palette: [number, [number, number, number]][] = [
      [0.68, [1, 0.7, 0.32]],
      [0.86, [0.98, 0.92, 0.82]],
      [0.97, [0.45, 0.72, 1]],
      [1, [1, 0.32, 0.42]],
    ];
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      colors.set(palette.find(([p]) => r <= p)![1], i * 3);
      seeds[i] = Math.random();
    }
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particlesVertex,
        fragmentShader: particlesFragment,
        uniforms: { uTime: { value: 0 }, uSize: { value: 1 }, uPixelRatio: { value: 1 }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  // Name targets depend on the viewport, so rebuild them when it changes.
  useEffect(() => {
    let cancelled = false;
    const aspect = size.width / size.height;
    const tall = aspect < 0.9;
    const fov = tall ? 62 : 50;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      targets.current.name = nameTarget(count, {
        width: Math.min(26, visibleWidth(22, fov, aspect) * (tall ? 0.86 : 0.8)),
        center: [0, tall ? 0.6 : 0.3, 24],
        stacked: tall,
      });
      // Her name re-forms at the centre of the finished structure.
      targets.current.finale = nameTarget(count, {
        width: Math.min(30, visibleWidth(tall ? 58 : 42, fov, aspect) * (tall ? 0.8 : 0.5)),
        center: [0, tall ? 6 : 1.5, 6],
        stacked: tall,
      });
      useUI.getState().setReady();
    });
    return () => {
      cancelled = true;
    };
  }, [count, size.width, size.height]);

  useEffect(() => {
    targets.current.tunnel = tunnelTarget(count);
    targets.current.web = webTarget(count);
    void getPortraitCanvas(profile.portrait).then((c) => {
      targets.current.portrait = portraitTarget(count, c, 6.6, [0, 0.2, 0.6]);
    });
  }, [count]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const mode = modeAt(world.t, world.intro);
    const target = targets.current[mode] ?? targets.current.seed!;
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const p = pos.array as Float32Array;
    const damp = Math.exp(-dt * 4.2);
    for (let i = 0; i < count; i++) {
      const s = stiffness[i] * dt;
      for (let j = 0; j < 3; j++) {
        const k = i * 3 + j;
        velocity[k] = velocity[k] * damp + (target[k] - p[k]) * s;
        p[k] += velocity[k] * dt;
      }
    }
    pos.needsUpdate = true;

    const want = LOOK[mode];
    const e = 1 - Math.exp(-dt * 3);
    look.current.opacity += ((world.t < 1 ? Math.min(1, world.intro * 3) : 1) * want.opacity - look.current.opacity) * e;
    look.current.size += (want.size - look.current.size) * e;
    material.uniforms.uOpacity.value = look.current.opacity;
    material.uniforms.uSize.value = look.current.size;
    material.uniforms.uTime.value = performance.now() / 1000;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
