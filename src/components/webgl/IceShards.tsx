"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AT, introAmounts } from "@/lib/intro";
import { smooth, world } from "@/lib/world";
import { iceFragment, iceVertex } from "@/shaders/ice";
import { HERO_Z, heroFrame, pxToHero } from "@/world/hero";

type Shard = {
  home: [number, number];
  rest: [number, number, number];
  keeper: boolean;
  length: number;
  axis: THREE.Vector3;
  spin: number;
  dir: number;
  delay: number;
};

/**
 * Instanced crystals around the ice glint. They grow, are drawn to the centre,
 * shatter at the collision, and a few come to rest on the cold side of the frame.
 */
export function IceShards({ count }: { count: number }) {
  const { size } = useThree();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const hitAt = useRef<number | null>(null);
  const last = useRef(0);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), p: new THREE.Vector3() }), []);

  const shards = useMemo<Shard[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = Math.random() * Math.PI * 2;
        const r = 0.15 + Math.random() * 0.6;
        return {
          home: [Math.cos(a) * r, Math.sin(a) * r * 0.8],
          // Resting places on the cold side, clear of the name band (normalised to the frame).
          rest: [0.56 + Math.random() * 0.26, (Math.random() < 0.5 ? -1 : 1) * (0.26 + Math.random() * 0.26), (Math.random() - 0.5) * 6],
          keeper: i % 4 === 0,
          length: 0.35 + Math.random() * 0.9,
          axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
          spin: (Math.random() - 0.5) * 0.6,
          dir: a,
          delay: Math.random(),
        };
      }),
    [count],
  );

  const geometry = useMemo(() => {
    const g = new THREE.OctahedronGeometry(1, 0).toNonIndexed();
    g.computeVertexNormals();
    return g;
  }, []);
  const life = useMemo(() => new THREE.InstancedBufferAttribute(new Float32Array(count), 1), [count]);
  useEffect(() => {
    geometry.setAttribute("aLife", life);
  }, [geometry, life]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: iceVertex,
        fragmentShader: iceFragment,
        uniforms: { uTime: { value: 0 }, uCold: { value: new THREE.Color("#5fb4ff") }, uWhite: { value: new THREE.Color("#eaf6ff") } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const t = world.t;
    m.visible = t < 1.2;
    if (!m.visible) return;
    const f = heroFrame(size.width, size.height);
    const amt = introAmounts(world.intro);
    if (last.current < AT.collision && world.intro >= AT.collision) hitAt.current = world.time;
    if (world.intro < AT.collision) hitAt.current = null;
    last.current = world.intro;
    const r = world.nameRect;
    const c = r ? pxToHero(r.cx, r.cy, size.width, size.height, f) : [0, 0];
    const T = world.time;
    const fade = 1 - smooth(0.85, 1.15, t);

    shards.forEach((s, i) => {
      let x: number, y: number, z = HERO_Z + (s.delay - 0.5) * 3;
      let scale = s.length * f.s * 0.075;
      let alive: number;
      if (hitAt.current === null) {
        const grow = smooth(s.delay * 0.7, s.delay * 0.7 + 0.3, amt.ice);
        const hx = f.ice[0] + s.home[0] * f.s, hy = f.ice[1] + s.home[1] * f.s;
        const a = amt.attract;
        x = hx + (c[0] - hx) * a * 0.92;
        y = hy + (c[1] - hy) * a * 0.92;
        scale *= grow * (1 - 0.45 * a);
        alive = grow;
      } else {
        // Shatter: thrown outward, then the keepers drift to rest on the cold side.
        const e = T - hitAt.current;
        const burst = 1 - Math.exp(-e * 2.2);
        const tx = f.tall ? (s.rest[1] * 0.8) * f.hw : s.rest[0] * f.hw;
        const ty = f.tall ? -(0.35 + Math.abs(s.rest[0] - 0.38)) * f.hh : s.rest[1] * f.hh;
        const ox = Math.cos(s.dir) * e * 10, oy = Math.sin(s.dir) * e * 7;
        x = s.keeper ? c[0] + (tx - c[0]) * burst + Math.sin(T * 0.3 + i) * 0.15 : c[0] + ox;
        y = s.keeper ? c[1] + (ty - c[1]) * burst + Math.cos(T * 0.25 + i) * 0.12 : c[1] + oy;
        z = HERO_Z + s.rest[2] * burst;
        alive = s.keeper ? 0.85 : Math.exp(-e * 1.6);
        scale *= s.keeper ? 0.5 : 1;
      }
      tmp.q.setFromAxisAngle(s.axis, T * s.spin + i);
      tmp.s.set(scale * 0.32, scale, scale * 0.32);
      tmp.p.set(x, y, z);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      m.setMatrixAt(i, tmp.m);
      life.array[i] = alive * fade;
    });
    m.instanceMatrix.needsUpdate = true;
    life.needsUpdate = true;
    material.uniforms.uTime.value = T;
  });

  return <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false} />;
}
