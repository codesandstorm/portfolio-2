"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CORE_ID, edges, getNeighbors, getRelatedNodes, latestSignals, nodes } from "@/content/graph";
import { skills } from "@/content/data";
import type { NodeKind } from "@/content/types";
import { chapterIndex } from "@/lib/chapters";
import { focusOf, useUI } from "@/lib/store";
import { chapterProgress, smooth, world } from "@/lib/world";
import { nodeFragment, nodeVertex, threadFragment, threadVertex } from "@/shaders/constellation";
import { posOf } from "@/world/layout";
import { labelElements, nodeBrightness, screenPos } from "@/world/labels";

const SEGMENTS = 14;
const humanSkills = new Set(skills.filter((s) => s.family === "human").map((s) => s.id));

const COLOR: Record<NodeKind, [number, number, number]> = {
  core: [1, 0.72, 0.36],
  experience: [1, 0.62, 0.28],
  project: [0.44, 0.72, 1],
  skill: [0.62, 0.8, 1],
  person: [0.62, 0.56, 1],
  signal: [0.95, 0.9, 0.82],
  achievement: [1, 0.52, 0.14],
};
const SIZE: Record<NodeKind, number> = {
  core: 3.4,
  experience: 1.9,
  project: 1.7,
  achievement: 1.8,
  skill: 1.15,
  person: 0.95,
  signal: 0.85,
};

type Emphasis = Partial<Record<NodeKind, number>> & { rest: number };
const EMPHASIS: Emphasis[] = [
  { rest: 0 },
  { core: 0.9, rest: 0.22 },
  { core: 0, rest: 0.1 },
  { core: 1, person: 0.95, experience: 0.85, project: 0.6, rest: 0.22 },
  { core: 0.7, experience: 0.8, rest: 0.22 },
  { core: 0.7, project: 0.8, rest: 0.22 },
  { core: 0.8, skill: 0.95, project: 0.55, experience: 0.55, rest: 0.18 },
  { core: 0.7, signal: 0.85, experience: 0.55, rest: 0.2 },
  { core: 0.7, achievement: 0.95, rest: 0.22 },
  { core: 1, rest: 0.8 },
];

const TEXT_RIGHT = new Set([chapterIndex.collaborate, chapterIndex.build, chapterIndex.lead, chapterIndex.converge]);
const TEXT_LEFT = new Set([chapterIndex.learn]);

/** Screen regions where a chapter's text lives; node labels stay out of them. */
function labelMask(chapter: number, w: number, h: number) {
  const tall = w / h < 0.9;
  return (x: number, y: number) => {
    if (y < 70 || y > h - 24 || x < 8) return true;
    if (!tall && x > w - 150) return true;
    // Labels run ~150px to the right of their node, so the mask starts early.
    // Projects, achievements and latest posts: the page covers the frame.
    if (chapter === chapterIndex.collaborate || chapter === chapterIndex.build || chapter === chapterIndex.converge || chapter === chapterIndex.lead) return true;
    if (TEXT_RIGHT.has(chapter)) return tall ? y > h * 0.36 : x > w * 0.47 - 150;
    if (TEXT_LEFT.has(chapter)) return tall ? y < h * 0.42 : x < w * (chapter === chapterIndex.learn ? 0.42 : 0.36);
    return false;
  };
}

/** Hops from Akshita to each node — the order in which the opening lights the network. */
const depth = (() => {
  const d = new Map<string, number>([[CORE_ID, 0]]);
  let frontier = [CORE_ID];
  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) for (const nb of getNeighbors(id)) if (!d.has(nb)) { d.set(nb, d.get(id)! + 1); next.push(nb); }
    frontier = next;
  }
  return d;
})();
const DEPTH_STEP = 0.22;

export function Constellation() {
  const { camera, size, gl } = useThree();
  const index = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), []);
  const state = useRef(new Float32Array(nodes.length));
  const focusRef = useRef<string | null>(null);
  const relatedRef = useRef<Set<string> | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const nodeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(nodes.length * 3);
    const c = new Float32Array(nodes.length * 3);
    const s = new Float32Array(nodes.length);
    const seed = new Float32Array(nodes.length);
    nodes.forEach((n, i) => {
      p.set(posOf(n.id), i * 3);
      const col = n.kind === "skill" && humanSkills.has(n.id) ? COLOR.person : COLOR[n.kind];
      c.set(col, i * 3);
      // Her newest posts are new stars: a little larger, so they catch the eye.
      s[i] = SIZE[n.kind] * (latestSignals.has(n.id) ? 1.7 : 1);
      seed[i] = Math.random();
    });
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(c, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(s, 1));
    g.setAttribute("aState", new THREE.BufferAttribute(new Float32Array(nodes.length), 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  const threadGeo = useMemo(() => {
    const verts = edges.length * SEGMENTS * 2;
    const p = new Float32Array(verts * 3);
    const t = new Float32Array(verts);
    const conf = new Float32Array(verts);
    const seed = new Float32Array(verts);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), q = new THREE.Vector3();
    const curve = new THREE.QuadraticBezierCurve3(a, c, b);
    let v = 0;
    edges.forEach((e) => {
      a.set(...posOf(e.a));
      b.set(...posOf(e.b));
      // Threads bow gently toward Akshita, so every line leans on the centre.
      c.copy(a).add(b).multiplyScalar(0.5 * 0.82);
      c.y += 0.4;
      const s = Math.random();
      for (let k = 0; k < SEGMENTS; k++) {
        for (const u of [k / SEGMENTS, (k + 1) / SEGMENTS]) {
          curve.getPoint(u, q);
          p.set([q.x, q.y, q.z], v * 3);
          t[v] = u;
          conf[v] = e.confidence === "inferred" ? 1 : 0;
          seed[v] = s;
          v++;
        }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("aT", new THREE.BufferAttribute(t, 1));
    g.setAttribute("aHi", new THREE.BufferAttribute(new Float32Array(verts), 1));
    g.setAttribute("aDir", new THREE.BufferAttribute(new Float32Array(verts), 1));
    g.setAttribute("aConf", new THREE.BufferAttribute(conf, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  const nodeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: nodeVertex,
        fragmentShader: nodeFragment,
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uOpacity: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const threadMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: threadVertex,
        fragmentShader: threadFragment,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 1 },
          uFocus: { value: 0 },
          uGold: { value: new THREE.Color("#ffb347") },
          uIce: { value: new THREE.Color("#6fb6ff") },
          uIceMix: { value: 0.15 },
          uDim: { value: new THREE.Color("#8d94d6") },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((_, dt) => {
    const ui = useUI.getState();
    const chapter = Math.min(9, Math.floor(world.t));
    const focus = focusOf(ui);
    if (focus !== focusRef.current) {
      focusRef.current = focus;
      relatedRef.current = focus ? getRelatedNodes(focus) : null;
    }
    const related = relatedRef.current;
    const emph = EMPHASIS[chapter];
    // The landing keeps the network hidden behind the smoke; it appears as you fly in.
    const net = 0;
    const k = 1 - Math.exp(-dt * 5);

    const st = state.current;
    const attr = nodeGeo.getAttribute("aState") as THREE.BufferAttribute;
    nodes.forEach((n, i) => {
      let target: number;
      if (chapter === 0) {
        target =
          n.id === CORE_ID ? net : smooth(DEPTH_STEP * (depth.get(n.id) ?? 3), DEPTH_STEP * (depth.get(n.id) ?? 3) + 0.3, net) * ((depth.get(n.id) ?? 3) > 2 ? 0.12 : 0.45);
      } else {
        const base = emph[n.kind] ?? emph.rest;
        target = related ? (n.id === focus ? 1 : related.has(n.id) ? 0.82 : Math.max(0.03, base * 0.22)) : base;
      }
      st[i] += (target - st[i]) * k;
      attr.array[i] = st[i];
      nodeBrightness.set(n.id, st[i]);
    });
    attr.needsUpdate = true;

    // Threads: lit when they touch the focus; in the awakening, the first
    // threads join Akshita to her first places one by one.
    const hi = threadGeo.getAttribute("aHi") as THREE.BufferAttribute;
    const dir = threadGeo.getAttribute("aDir") as THREE.BufferAttribute;
    const inward = chapter === chapterIndex.converge;
    let v = 0;
    for (const e of edges) {
      let h = 0;
      let d = 1;
      if (chapter === 0) {
        // The collision draws the network: energy runs outward from her name, ring by ring.
        const da = depth.get(e.a) ?? 3, db = depth.get(e.b) ?? 3;
        const near = Math.min(da, db);
        // Only the first two rings: enough to show the network being born, calm enough to keep the name clear.
        h = near > 1 ? 0 : smooth(DEPTH_STEP * near, DEPTH_STEP * near + 0.28, net) * (near === 0 ? 0.5 : 0.22);
        d = da <= db ? 1 : 0;
      } else if (chapter === chapterIndex.continue) {
        // Finale: every thread visited lights at once.
        h = smooth(0.1, 0.55, chapterProgress(chapter)) * 0.38;
        d = e.a === CORE_ID ? 1 : 0;
      } else if (focus && (e.a === focus || e.b === focus)) {
        h = 1;
        d = (e.a === focus) !== inward ? 1 : 0;
      }
      for (let s = 0; s < SEGMENTS * 2; s++, v++) {
        hi.array[v] += (h - hi.array[v]) * k;
        dir.array[v] = d;
      }
    }
    hi.needsUpdate = true;
    dir.needsUpdate = true;

    const time = performance.now() / 1000;
    nodeMat.uniforms.uTime.value = time;
    nodeMat.uniforms.uPixelRatio.value = gl.getPixelRatio();
    threadMat.uniforms.uTime.value = time;
    threadMat.uniforms.uIceMix.value += ((chapter === 0 ? 0.45 : chapter === chapterIndex.continue ? 0.4 : 0.15) - threadMat.uniforms.uIceMix.value) * k;
    threadMat.uniforms.uFocus.value += ((focus || chapter === 0 ? 1 : 0) - threadMat.uniforms.uFocus.value) * k;
    const threadOpacity = chapter === 0 ? 0.65 : chapter === 2 ? 0.25 : chapter === 1 ? 0.5 : 1;
    threadMat.uniforms.uOpacity.value += (threadOpacity - threadMat.uniforms.uOpacity.value) * k;

    // Project every node onto the screen; move the DOM labels that exist.
    nodes.forEach((n) => {
      tmp.set(...posOf(n.id)).project(camera);
      const sp = screenPos.get(n.id) ?? { x: 0, y: 0, visible: false };
      sp.x = (tmp.x * 0.5 + 0.5) * size.width;
      sp.y = (-tmp.y * 0.5 + 0.5) * size.height;
      sp.visible = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
      screenPos.set(n.id, sp);
    });
    const masked = labelMask(chapter, size.width, size.height);
    for (const [id, el] of labelElements) {
      const i = index.get(id);
      const sp = screenPos.get(id);
      if (i === undefined || !sp) continue;
      const { x, y } = sp;
      const visible = sp.visible && !masked(x, y);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      const o = visible ? Math.min(1, st[i] * 1.25) : 0;
      el.style.opacity = o.toFixed(2);
      el.style.visibility = o < 0.05 ? "hidden" : "visible";
    }
  });

  return (
    <group>
      <lineSegments geometry={threadGeo} material={threadMat} frustumCulled={false} />
      <points geometry={nodeGeo} material={nodeMat} frustumCulled={false} />
    </group>
  );
}
