"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { introAmounts } from "@/lib/intro";
import { smooth, world } from "@/lib/world";
import { HERO_Z, heroFrame, pxToHero } from "@/world/hero";

const vertex = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragment = /* glsl */ `
  uniform float uDraw;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying float vT;
  void main() {
    if (vT > uDraw) discard;
    float head = smoothstep(uDraw - 0.12, uDraw, vT) * step(uDraw, 0.999);
    float pulse = smoothstep(0.9, 1.0, fract(vT * 3.0 - uTime * 0.35));
    float ends = smoothstep(0.0, 0.15, vT) * smoothstep(1.0, 0.8, vT);
    float a = (0.22 + pulse * 0.8 + head * 1.2) * ends * uOpacity;
    gl_FragColor = vec4(uColor * (1.0 + head + pulse), a);
  }
`;

/**
 * After the collision, two arcs sweep out from her name — warm on the fire
 * side, cold on the ice side — the first paths the new energy draws.
 */
export function EnergyArcs() {
  const { size } = useThree();
  const arcs = useMemo(() => {
    const make = (color: string, from: number, to: number, ring: number) => {
      const N = 160;
      const pos = new Float32Array(N * 3);
      const t = new Float32Array(N);
      for (let i = 0; i < N; i++) t[i] = i / (N - 1);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("aT", new THREE.BufferAttribute(t, 1));
      const m = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: { uDraw: { value: 0 }, uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(color) } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      return { g, m, from, to, ring, line: new THREE.Line(g, m) };
    };
    // Each side gets two close rings so the stroke reads as light, not a hairline.
    return [
      make("#ff9a3d", Math.PI * 0.42, Math.PI * 1.55, 1),
      make("#ffc070", Math.PI * 0.45, Math.PI * 1.5, 1.03),
      make("#5cb0ff", -Math.PI * 0.58, Math.PI * 0.45, 1),
      make("#a8dcff", -Math.PI * 0.52, Math.PI * 0.42, 1.03),
    ];
  }, []);

  useFrame(() => {
    const f = heroFrame(size.width, size.height);
    const r = world.nameRect;
    const c = r ? pxToHero(r.cx, r.cy, size.width, size.height, f) : [0, 0];
    const amt = introAmounts(world.intro);
    const draw = smooth(0, 0.7, amt.network);
    const fade = (1 - smooth(0.6, 1.05, world.t)) * draw;
    const rx = f.tall ? f.hw * 0.86 : Math.min(f.hw * 0.62, (r ? (r.w / size.width) * f.hw * 2 : 20) * 0.62);
    const ry = f.tall ? f.hh * 0.42 : f.hh * 0.38;
    for (const a of arcs) {
      const p = a.g.getAttribute("position") as THREE.BufferAttribute;
      const N = p.count;
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        // Fire arcs run from the centre outward: reverse the cold side so both start at the seam.
        const ang = a.from + (a.to - a.from) * u;
        const tilt = 0.14;
        const x0 = Math.cos(ang) * rx * a.ring, y0 = Math.sin(ang) * ry * a.ring;
        p.setXYZ(i, c[0] + x0 * Math.cos(tilt) - y0 * Math.sin(tilt), c[1] + x0 * Math.sin(tilt) + y0 * Math.cos(tilt), HERO_Z - 1);
      }
      p.needsUpdate = true;
      a.m.uniforms.uDraw.value = draw;
      a.m.uniforms.uOpacity.value = fade;
      a.m.uniforms.uTime.value = world.time;
      a.line.visible = fade > 0.001;
    }
  });

  return (
    <>
      {arcs.map((a, i) => (
        <primitive key={i} object={a.line} frustumCulled={false} />
      ))}
    </>
  );
}
