"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { profile } from "@/content/data";
import { smooth, world } from "@/lib/world";
import { particlesFragment, particlesVertex } from "@/shaders/particles";
import { chapterIndex } from "@/lib/chapters";
import { getPortraitCanvas } from "@/world/portrait";
import { nameTarget, portraitTarget, seedTarget, splitByX, webTarget } from "@/world/targets";

/**
 * One body of light for the story after the opening: it waits unseen behind
 * the landing, streams into the corridor you fly through, becomes her portrait,
 * shatters into the threads of the constellation and finally writes her name.
 * Warm and cool particles keep the landing's fire-and-ice DNA throughout.
 */
type Mode = "hidden" | "portrait" | "shatter" | "web" | "finale";

const LOOK: Record<Mode, { opacity: number; size: number }> = {
  hidden: { opacity: 0, size: 1 },
  portrait: { opacity: 1, size: 0.75 },
  shatter: { opacity: 0.9, size: 0.9 },
  web: { opacity: 0.4, size: 0.7 },
  finale: { opacity: 1, size: 2.6 },
};

const FIRE: [number, number, number][] = [[1, 0.32, 0.08], [1, 0.5, 0.12], [1, 0.68, 0.28], [1, 0.86, 0.6]];
const ICE: [number, number, number][] = [[0.3, 0.42, 1], [0.38, 0.72, 1], [0.66, 0.9, 1], [0.92, 0.97, 1]];
const GOLD: [number, number, number] = [1, 0.72, 0.36];
/** Story time over which her portrait breaks apart and becomes the network (end of About into Experience). */
export const SHATTER: [number, number] = [chapterIndex.akshita + 0.7, chapterIndex.akshita + 1.2];

function modeAt(t: number): Mode {
  if (t < chapterIndex.akshita - 0.14) return "hidden";
  if (t < SHATTER[0]) return "portrait";
  if (t < SHATTER[1]) return "shatter";
  if (t < chapterIndex.continue) return "web";
  return "finale";
}

function visibleWidth(distance: number, fov: number, aspect: number) {
  return 2 * distance * Math.tan((fov * Math.PI) / 360) * aspect;
}

export function Particles({ count }: { count: number }) {
  const { size, gl, camera } = useThree();
  const projected = useMemo(() => new THREE.Vector3(), []);
  const targets = useRef<Partial<Record<Mode | "seed", Float32Array>>>({});
  const half = count >> 1;
  const velocity = useMemo(() => new Float32Array(count * 3), [count]);
  const proc = useMemo(() => new Float32Array(count * 3), [count]);
  const seeds = useMemo(() => Float32Array.from({ length: count * 3 }, () => Math.random()), [count]);
  const stiffness = useMemo(() => Float32Array.from({ length: count }, () => 5 + Math.random() * 11), [count]);
  const look = useRef({ opacity: 0, size: 1 });
  const portraitColor = useRef<Float32Array | null>(null);
  /** Each portrait point's distance from her face, 0…1 — cracks spread outward from there. */
  const portraitDist = useRef<Float32Array | null>(null);
  /** Per-particle progress through the shatter, 0…1. */
  const shatterK = useMemo(() => new Float32Array(count), [count]);

  const { geometry, baseColor } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seed = seedTarget(count);
    targets.current.seed = seed;
    const base = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) base.set((i < half ? FIRE : ICE)[Math.floor(Math.random() * 4)], i * 3);
    g.setAttribute("position", new THREE.BufferAttribute(seed.slice(), 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(base.slice(), 3));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(count).fill(1), 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(Float32Array.from({ length: count }, () => Math.random()), 1));
    return { geometry: g, baseColor: base };
  }, [count, half]);

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

  // The finale name depends on the viewport: rebuilt on resize.
  useEffect(() => {
    let cancelled = false;
    const aspect = size.width / size.height;
    const tall = aspect < 0.9;
    const fov = tall ? 62 : 50;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      targets.current.finale = splitByX(
        nameTarget(count, {
          width: Math.min(30, visibleWidth(tall ? 58 : 42, fov, aspect) * (tall ? 0.8 : 0.5)),
          center: [0, tall ? 6 : 1.5, 6],
          stacked: tall,
        }),
        count,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [count, size.width, size.height]);

  useEffect(() => {
    targets.current.web = webTarget(count);
    void getPortraitCanvas(profile.portrait).then((c) => {
      const p = portraitTarget(count, c, 6.6, [0, 0.2, 0.6]);
      targets.current.portrait = p.pos;
      const d = new Float32Array(count);
      for (let i = 0; i < count; i++) d[i] = Math.min(1, Math.hypot(p.pos[i * 3], p.pos[i * 3 + 1] - 1.2) / 4.2);
      portraitDist.current = d;
      // A real photograph lends its own colours to the point cloud.
      if (profile.portrait) portraitColor.current = p.col;
    });
  }, [count]);

  /**
   * Her portrait breaks apart from the face outward: each fragment is thrown
   * toward the viewer, then pulled onto a thread of the network. Driven by
   * scroll, so scrolling back reassembles her.
   */
  function shatter(t: number) {
    const P = targets.current.portrait, W = targets.current.web;
    const D = portraitDist.current;
    if (!P || !W) return P ?? W ?? proc;
    const kg = smooth(SHATTER[0], SHATTER[1] - 0.04, t);
    for (let i = 0; i < count; i++) {
      const d = D ? D[i] : seeds[i * 3];
      const raw = Math.min(1, Math.max(0, kg * 1.7 - d * 0.7));
      const k = raw * raw * (3 - 2 * raw);
      shatterK[i] = k;
      const px = P[i * 3], py = P[i * 3 + 1] - 0.2, pz = P[i * 3 + 2];
      const len = Math.hypot(px, py) || 1;
      const burst = Math.sin(Math.PI * k) * (1.4 + 3.2 * seeds[i * 3]);
      proc[i * 3] = P[i * 3] + (W[i * 3] - P[i * 3]) * k + (px / len) * burst;
      proc[i * 3 + 1] = P[i * 3 + 1] + (W[i * 3 + 1] - P[i * 3 + 1]) * k + (py / len) * burst * 0.8;
      proc[i * 3 + 2] = pz + (W[i * 3 + 2] - pz) * k + burst * (0.8 + seeds[i * 3 + 1]);
    }
    return proc;
  }

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const t = world.t;
    world.time += rawDt;
    const mode = modeAt(t);
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const p = pos.array as Float32Array;

    const target = mode === "shatter" ? shatter(t) : mode === "hidden" ? targets.current.seed! : (targets.current[mode] ?? targets.current.seed!);
    const damp = Math.exp(-dt * 4.2);
    for (let i = 0; i < count; i++) {
      // Scroll-scrubbed moments track the scroll tightly so they reverse cleanly.
      const s = stiffness[i] * dt * (mode === "shatter" ? 2.5 : 1);
      for (let j = 0; j < 3; j++) {
        const k = i * 3 + j;
        velocity[k] = velocity[k] * damp + (target[k] - p[k]) * s;
        p[k] += velocity[k] * dt;
      }
    }
    pos.needsUpdate = true;

    // Colour: warm and cool particles leaning gold through the story; her own colours while she is the portrait.
    const col = geometry.getAttribute("aColor") as THREE.BufferAttribute;
    const cl = col.array as Float32Array;
    const merge = t < 9 ? 0.6 : 0.3;
    const photo = mode === "portrait" || mode === "shatter" ? portraitColor.current : null;
    const ck = 1 - Math.exp(-dt * 2.5);
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < 3; j++) {
        const k = i * 3 + j;
        const web = baseColor[k] + (GOLD[j] - baseColor[k]) * merge;
        const her = photo ? Math.min(1, photo[k] * 1.35 + 0.06) * 0.8 + GOLD[j] * 0.2 : web;
        // While shattering, each fragment cools from her colours into the network's.
        const want = mode === "shatter" ? her + (web - her) * shatterK[i] : photo ? her : web;
        cl[k] += (want - cl[k]) * ck;
      }
    }
    col.needsUpdate = true;

    if (mode === "finale") {
      // Tell the DOM where her name is, so the visitor's thread can reach it.
      projected.set(0, size.width / size.height < 0.9 ? 6 : 1.5, 6).project(camera);
      world.finaleScreen.x = (projected.x * 0.5 + 0.5) * size.width;
      world.finaleScreen.y = (-projected.y * 0.5 + 0.5) * size.height;
    }
    const want = LOOK[mode];
    const e = 1 - Math.exp(-dt * 3);
    look.current.opacity += (want.opacity - look.current.opacity) * e;
    look.current.size += (want.size - look.current.size) * e;
    material.uniforms.uOpacity.value = look.current.opacity;
    // Her point cloud swells a little with the narrator's voice.
    material.uniforms.uSize.value = look.current.size * (mode === "portrait" ? 1 + world.voice * 0.35 : 1);
    material.uniforms.uTime.value = world.time;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
