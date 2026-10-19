"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { profile } from "@/content/data";
import { AT, introAmounts } from "@/lib/intro";
import { useUI } from "@/lib/store";
import { smooth, world } from "@/lib/world";
import { particlesFragment, particlesVertex } from "@/shaders/particles";
import { HERO_Z, heroFrame, pxToHero, type HeroFrame } from "@/world/hero";
import { getPortraitCanvas } from "@/world/portrait";
import { glyphTarget, nameTarget, splitByX, portraitTarget, seedTarget, tunnelTarget, webTarget } from "@/world/targets";

/**
 * One body of light for the whole site. In the opening it is two systems —
 * fire (first half of the particles) and ice (second half) — that attract,
 * collide and become her name; afterwards it becomes the tunnel, the portrait,
 * the threads of the constellation and the finale.
 */
type Mode = "proc" | "glyph" | "tunnel" | "portrait" | "web" | "finale";

const LOOK: Record<Mode, { opacity: number; size: number }> = {
  proc: { opacity: 1, size: 2.5 },
  glyph: { opacity: 1, size: 1.6 },
  tunnel: { opacity: 0.75, size: 1.5 },
  portrait: { opacity: 1, size: 0.75 },
  web: { opacity: 0.4, size: 0.7 },
  finale: { opacity: 1, size: 2.6 },
};

const FIRE: [number, number, number][] = [[1, 0.32, 0.08], [1, 0.5, 0.12], [1, 0.68, 0.28], [1, 0.86, 0.6]];
const ICE: [number, number, number][] = [[0.3, 0.42, 1], [0.38, 0.72, 1], [0.66, 0.9, 1], [0.92, 0.97, 1]];
const MERGED: [number, number, number] = [1, 0.86, 0.66];
const GOLD: [number, number, number] = [1, 0.72, 0.36];
const SHARDS = 11;
const HEX = Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3), Math.sin((i * Math.PI) / 3)]);

function modeAt(t: number, intro: number): Mode {
  if (t < 1) return intro < AT.collision ? "proc" : "glyph";
  if (t < 1.12) return "glyph";
  if (t < 1.86) return "tunnel";
  if (t < 2.92) return "portrait";
  if (t < 9) return "web";
  return "finale";
}

function visibleWidth(distance: number, fov: number, aspect: number) {
  return 2 * distance * Math.tan((fov * Math.PI) / 360) * aspect;
}

const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

export function Particles({ count }: { count: number }) {
  const { size, gl } = useThree();
  const targets = useRef<Partial<Record<Mode | "seed", Float32Array>>>({});
  const frame = useRef<HeroFrame>(heroFrame(size.width, size.height));
  const half = count >> 1;
  const velocity = useMemo(() => new Float32Array(count * 3), [count]);
  const proc = useMemo(() => new Float32Array(count * 3), [count]);
  const seeds = useMemo(() => Float32Array.from({ length: count * 3 }, () => Math.random()), [count]);
  const stiffness = useMemo(() => Float32Array.from({ length: count }, () => 5 + Math.random() * 11), [count]);
  const look = useRef({ opacity: 0, size: 1 });
  const lastIntro = useRef(0);
  const portraitColor = useRef<Float32Array | null>(null);

  const { geometry, baseColor } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const f = heroFrame(size.width, size.height);
    const start = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const c = i < half ? f.fire : f.ice;
      start.set([c[0], c[1], HERO_Z], i * 3);
      base.set((i < half ? FIRE : ICE)[Math.floor(Math.random() * 4)], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(start, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(base.slice(), 3));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(Float32Array.from({ length: count }, () => Math.random()), 1));
    return { geometry: g, baseColor: base };
    // The starting layout only matters once; resizes update `frame` instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Targets that depend on the viewport: rebuilt on resize.
  useEffect(() => {
    let cancelled = false;
    const aspect = size.width / size.height;
    const f = heroFrame(size.width, size.height);
    frame.current = f;
    const tall = f.tall;
    const fov = tall ? 62 : 50;
    const build = () => {
      if (cancelled) return;
      const r = world.nameRect;
      if (r) {
        const left = r.cx - r.w / 2, top = r.cy - r.h / 2;
        targets.current.glyph = glyphTarget(count, r, (u, v) => pxToHero(left + u * r.w, top + v * r.h, size.width, size.height, f), HERO_Z);
      }
      targets.current.finale = splitByX(nameTarget(count, {
        width: Math.min(30, visibleWidth(tall ? 58 : 42, fov, aspect) * (tall ? 0.8 : 0.5)),
        center: [0, tall ? 6 : 1.5, 6],
        stacked: tall,
      }), count);
      useUI.getState().setReady();
    };
    // Wait for the type, then two frames so the <h1> has been measured.
    void document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(build)));
    window.addEventListener("sutra:name-measured", build);
    return () => {
      cancelled = true;
      window.removeEventListener("sutra:name-measured", build);
    };
  }, [count, size.width, size.height]);

  useEffect(() => {
    targets.current.tunnel = tunnelTarget(count);
    targets.current.web = webTarget(count);
    targets.current.seed = seedTarget(count);
    void getPortraitCanvas(profile.portrait).then((c) => {
      const p = portraitTarget(count, c, 6.6, [0, 0.2, 0.6]);
      targets.current.portrait = p.pos;
      // A real photograph lends its own colours to the point cloud.
      if (profile.portrait) portraitColor.current = p.col;
    });
  }, [count]);

  /** Fire and ice as functions of time: where each particle wants to be now. */
  function procedural(T: number, amt: ReturnType<typeof introAmounts>) {
    const f = frame.current;
    const S = f.s;
    const r = world.nameRect;
    const cx = r ? pxToHero(r.cx, r.cy, size.width, size.height, f) : [0, 0];
    const px = world.pointer.x * f.hw, py = world.pointer.y * f.hh;
    const a = amt.attract;
    const pull = a * 0.92;
    const gather = smooth(0.8, 1, a);
    for (let i = 0; i < count; i++) {
      const fire = i < half;
      const k = fire ? i : i - half;
      const n = fire ? half : count - half;
      const r1 = seeds[i * 3], r2 = seeds[i * 3 + 1], r3 = seeds[i * 3 + 2];
      const src = fire ? f.fire : f.ice;
      const C0 = src[0] + (cx[0] - src[0]) * pull;
      const C1 = src[1] + (cx[1] - src[1]) * pull;
      let x: number, y: number, z: number;
      const grow = fire ? amt.fire : amt.ice;
      const act = smooth((k / n) * 0.92, (k / n) * 0.92 + 0.08, Math.pow(grow, 1.4));
      if (fire && r3 < 0.55) {
        // Organic: three plasma arms spiral out of the spark and keep turning.
        const arm = Math.floor(r2 * 3);
        const u = (r1 + T * 0.12) % 1;
        const ang = arm * 2.094 + T * 0.7 + u * 3.6;
        const rad = (0.06 + u * 0.55) * S * (0.4 + 0.6 * grow) * (1 - 0.7 * a);
        const wob = Math.sin(u * 18 + T * 3 + r2 * 40) * S * 0.025 * u;
        x = C0 + Math.cos(ang) * (rad + wob) * 1.15;
        y = C1 + Math.sin(ang) * (rad + wob) * 0.62;
        x += (px - x) * 0.03 * u;
        y += (py - y) * 0.02 * u;
        z = HERO_Z + Math.sin(ang) * rad * 0.3;
      } else if (fire) {
        // Embers swirl, rise and recycle through a turbulent field.
        const life = (r1 + T * (0.16 + 0.28 * r2)) % 1;
        const R = S * (0.08 + 0.32 * r3 * r3) * (0.4 + 0.6 * grow) * (1 - 0.7 * a);
        const ang = r2 * 6.283 + T * (0.2 + 0.45 * r3) * (r1 > 0.5 ? 1 : -1) * 0.6 + life * 2.4;
        x = C0 + Math.cos(ang) * R * (0.75 + 0.5 * life);
        y = C1 + Math.sin(ang) * R * 0.55 + (life - 0.4) * R * 0.9;
        x += Math.sin(y * 0.45 + T * 1.7 + r1 * 9) * S * 0.05;
        y += Math.cos(x * 0.4 + T * 1.3 + r2 * 9) * S * 0.045;
        // The cursor bends the flames a little.
        x += (px - x) * 0.04 * life;
        y += (py - y) * 0.03 * life;
        z = HERO_Z + (r3 - 0.5) * 3;
      } else if (r3 > 0.8) {
        // Precise: tracers run along straight hexagonal paths, in steps.
        const d = HEX[Math.floor(r2 * 6)];
        const dist = ((r1 + T * 0.2) % 1) * S * 0.7 * (0.3 + 0.7 * grow) * (1 - 0.6 * a);
        const step = Math.floor(dist / (S * 0.08)) * S * 0.08;
        x = C0 + d[0] * step;
        y = C1 + d[1] * step;
        z = HERO_Z + (r1 - 0.5) * 1.5;
      } else {
        // Crystalline: particles sit on tapered shards radiating from the glint.
        const j = k % SHARDS;
        const h = hash(j + 1);
        const ang = (j / SHARDS) * 6.283 + Math.sin(j * 1.7) * 0.3 + T * 0.04 + world.pointer.x * 0.12;
        const L = S * (0.16 + 0.34 * h) * (0.25 + 0.75 * grow) * (1 - 0.6 * a);
        const u = Math.pow(r1, 0.8);
        const w = (r2 - 0.5) * L * 0.2 * (1 - u);
        x = C0 + Math.cos(ang) * u * L - Math.sin(ang) * w;
        y = C1 + Math.sin(ang) * u * L + Math.cos(ang) * w;
        z = HERO_Z + (h - 0.5) * 4 + (r3 - 0.5) * 0.3;
      }
      // Attraction: a growing share of each system streams along an arc to the centre.
      if (r3 < a * 1.15) {
        const u = (r1 + T * 0.85) % 1;
        const side = fire ? 1 : -1;
        const m0 = f.tall ? side * S * 0.6 : src[0] * 0.35;
        const m1 = f.tall ? src[1] * 0.35 : src[1] * 0.35 + side * S * 0.55;
        const q = 1 - u;
        x = q * q * C0 + 2 * q * u * m0 + u * u * cx[0];
        y = q * q * C1 + 2 * q * u * m1 + u * u * cx[1];
        z = HERO_Z + (r2 - 0.5);
      }
      // Inactive particles wait inside their spark.
      x = src[0] + (x - src[0]) * act;
      y = src[1] + (y - src[1]) * act;
      // Just before impact, everything gathers at the point of collision.
      x += (cx[0] + (r1 - 0.5) * 0.5 - x) * gather;
      y += (cx[1] + (r2 - 0.5) * 0.5 - y) * gather;
      proc[i * 3] = x;
      proc[i * 3 + 1] = y;
      proc[i * 3 + 2] = z;
    }
    return proc;
  }

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const t = world.t;
    const intro = world.intro;
    world.time += rawDt;
    const amt = introAmounts(intro);
    const mode = modeAt(t, intro);
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const p = pos.array as Float32Array;

    // Collision: the moment the timeline crosses impact, everything is thrown outward.
    if (lastIntro.current < AT.collision && intro >= AT.collision && t < 1) {
      const r = world.nameRect;
      const c = r ? pxToHero(r.cx, r.cy, size.width, size.height, frame.current) : [0, 0];
      for (let i = 0; i < count; i++) {
        const dx = p[i * 3] - c[0], dy = p[i * 3 + 1] - c[1];
        const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.6;
        const s = 8 + Math.random() * 26;
        velocity[i * 3] += Math.cos(a) * s;
        velocity[i * 3 + 1] += Math.sin(a) * s * 0.7;
        velocity[i * 3 + 2] += (Math.random() - 0.5) * s * 0.6;
      }
    }
    lastIntro.current = intro;

    const target =
      mode === "proc" ? procedural(world.time, amt) : (targets.current[mode] ?? targets.current.glyph ?? targets.current.seed ?? proc);

    // As the camera pushes into the name its letters loosen toward the viewer — reversible with scroll.
    const loosen = mode === "glyph" ? smooth(0.9, 1.12, t) : 0;
    // After impact a few embers stay on the fire side and a little frost on the ice side.
    const remnants = mode === "glyph" && t < 1;
    const f = frame.current;
    const T = world.time;
    const rem = [0, 0, 0];
    const damp = Math.exp(-dt * 4.2);
    for (let i = 0; i < count; i++) {
      const s = stiffness[i] * dt;
      const spread = 1 + loosen * (0.6 + seeds[i * 3] * 1.6);
      const r1 = seeds[i * 3], r2 = seeds[i * 3 + 1];
      const isRem = remnants && seeds[i * 3 + 2] > 0.9;
      if (isRem) {
        if (i < half) {
          const life = (r1 + T * 0.07) % 1;
          rem[0] = f.fire[0] + (r2 - 0.5) * f.s * 0.9 + Math.sin(T * 0.8 + r1 * 20) * 0.3;
          rem[1] = f.fire[1] - f.s * 0.55 + life * f.s * 1.1;
        } else {
          rem[0] = f.ice[0] + (r1 - 0.5) * f.s * 0.9;
          rem[1] = f.ice[1] + (r2 - 0.5) * f.s * 1.1 + Math.sin(T * 0.3 + r1 * 6) * 0.1;
        }
        rem[2] = HERO_Z + (r2 - 0.5) * 4;
      }
      for (let j = 0; j < 3; j++) {
        const k = i * 3 + j;
        let tg = isRem ? rem[j] : target[k];
        if (loosen > 0) tg = j < 2 ? tg * spread : tg + loosen * (seeds[i * 3 + 1] - 0.3) * 14;
        velocity[k] = velocity[k] * damp + (tg - p[k]) * s;
        p[k] += velocity[k] * dt;
      }
    }
    pos.needsUpdate = true;

    // Per-particle presence and colour.
    const alpha = geometry.getAttribute("aAlpha") as THREE.BufferAttribute;
    const col = geometry.getAttribute("aColor") as THREE.BufferAttribute;
    const al = alpha.array as Float32Array;
    const cl = col.array as Float32Array;
    // Fire and ice keep their identity in the name, then lean warm as the story goes on.
    const merge = t < 1.5 ? amt.crisp * 0.45 : t < 9 ? 0.6 : 0.3;
    const toward = t < 1.5 ? MERGED : GOLD;
    const photo = mode === "portrait" ? portraitColor.current : null;
    const ck = 1 - Math.exp(-dt * 2.5);
    for (let i = 0; i < count; i++) {
      const fire = i < half;
      const k = fire ? i : i - half;
      const n = fire ? half : count - half;
      let a = 1;
      if (mode === "proc") {
        const grow = fire ? amt.fire : amt.ice;
        const act = smooth((k / n) * 0.92, (k / n) * 0.92 + 0.08, Math.pow(grow, 1.4));
        // Before a system wakes, a handful of particles make its spark.
        a = Math.max(act, k < 14 ? amt.spark * (fire ? 1 : 0.8) : 0);
      }
      const isRem = mode === "glyph" && t < 1 && seeds[i * 3 + 2] > 0.9;
      al[i] = isRem ? 0.55 : a;
      const m = isRem ? 0 : merge;
      for (let j = 0; j < 3; j++) {
        const k = i * 3 + j;
        // Her photo, lifted and warmed a touch so it reads as light, not a print.
        const want = photo ? Math.min(1, photo[k] * 1.35 + 0.06) * 0.8 + GOLD[j] * 0.2 : baseColor[k] + (toward[j] - baseColor[k]) * m;
        cl[k] += (want - cl[k]) * (photo || mode === "portrait" || t >= 1.5 ? ck : 1);
      }
    }
    alpha.needsUpdate = true;
    col.needsUpdate = true;

    const want = LOOK[mode];
    // Once the crisp name resolves, the particles become its aura.
    const aura = mode === "glyph" && t < 1 ? 1 - amt.crisp * 0.55 : 1;
    const e = 1 - Math.exp(-dt * 3);
    look.current.opacity += (want.opacity * aura - look.current.opacity) * e;
    look.current.size += (want.size - look.current.size) * e;
    material.uniforms.uOpacity.value = look.current.opacity;
    material.uniforms.uSize.value = look.current.size;
    material.uniforms.uTime.value = world.time;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
