/**
 * Deterministic 3D layout of the constellation. Each kind of node lives on its
 * own shell around Akshita; a small force simulation lets people and signals
 * drift toward the stories they belong to, so threads stay short and bridges
 * (people in more than one story) sit visibly between clusters.
 */
import { achievements, experiences, projects } from "@/content/data";
import { CORE_ID, edges, nodes } from "@/content/graph";
import type { NodeKind } from "@/content/types";

export type Vec3 = [number, number, number];

const SHELL: Record<NodeKind, number> = {
  core: 0,
  experience: 6.5,
  achievement: 9,
  project: 11,
  person: 14,
  skill: 15.5,
  signal: 19,
};
const FLATTEN = 0.42;

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function compute(): Map<string, Vec3> {
  const rand = rng(20260719);
  const pos = new Map<string, Vec3>();
  const byKind = new Map<NodeKind, string[]>();
  for (const n of nodes) byKind.set(n.kind, [...(byKind.get(n.kind) ?? []), n.id]);

  // Seed each shell with an even spiral, rotated per kind so shells interleave.
  let k = 0;
  for (const [kind, ids] of byKind) {
    const r = SHELL[kind];
    ids.forEach((id, i) => {
      if (kind === "core") return pos.set(id, [0, 0, 0]);
      const a = (i / ids.length) * Math.PI * 2 + k * 0.9;
      const y = (rand() - 0.5) * r * 0.7;
      pos.set(id, [Math.cos(a) * r, y, Math.sin(a) * r * FLATTEN]);
    });
    k++;
  }

  const ids = nodes.map((n) => n.id);
  const kindOf = new Map(nodes.map((n) => [n.id, n.kind]));
  for (let iter = 0; iter < 260; iter++) {
    const force = new Map<string, Vec3>(ids.map((id) => [id, [0, 0, 0]]));
    const add = (id: string, x: number, y: number, z: number) => {
      const f = force.get(id)!;
      f[0] += x; f[1] += y; f[2] += z;
    };
    // Repulsion.
    for (let i = 0; i < ids.length; i++) {
      const a = pos.get(ids[i])!;
      for (let j = i + 1; j < ids.length; j++) {
        const b = pos.get(ids[j])!;
        const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
        const d2 = dx * dx + dy * dy + dz * dz + 0.01;
        if (d2 > 64) continue;
        const s = 1.6 / d2;
        add(ids[i], dx * s, dy * s, dz * s);
        add(ids[j], -dx * s, -dy * s, -dz * s);
      }
    }
    // Springs along threads (the core's threads are long and loose).
    for (const e of edges) {
      if (e.a === CORE_ID || e.b === CORE_ID) continue;
      const a = pos.get(e.a)!, b = pos.get(e.b)!;
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      const d = Math.hypot(dx, dy, dz) || 1;
      const s = ((d - 4) / d) * 0.035;
      add(e.a, dx * s, dy * s, dz * s);
      add(e.b, -dx * s, -dy * s, -dz * s);
    }
    // Keep every kind on its shell.
    for (const id of ids) {
      const kind = kindOf.get(id)!;
      if (kind === "core") continue;
      const p = pos.get(id)!;
      const r = Math.hypot(p[0], p[1], p[2] / FLATTEN) || 1;
      const s = ((SHELL[kind] - r) / r) * 0.12;
      add(id, p[0] * s, p[1] * s, p[2] * s);
      add(id, 0, -p[1] * 0.01, -p[2] * 0.02);
    }
    const step = 1 - iter / 300;
    for (const id of ids) {
      if (id === CORE_ID) continue;
      const p = pos.get(id)!, f = force.get(id)!;
      const m = Math.min(1, Math.hypot(...f)) * step;
      const len = Math.hypot(...f) || 1;
      p[0] += (f[0] / len) * m;
      p[1] += (f[1] / len) * m;
      p[2] += (f[2] / len) * m;
    }
  }
  return pos;
}

export const positions = compute();

export function posOf(id: string): Vec3 {
  return positions.get(id) ?? [0, 0, 0];
}

export function centroid(ids: string[]): Vec3 {
  const c: Vec3 = [0, 0, 0];
  for (const id of ids) {
    const p = posOf(id);
    c[0] += p[0]; c[1] += p[1]; c[2] += p[2];
  }
  return ids.length ? [c[0] / ids.length, c[1] / ids.length, c[2] / ids.length] : c;
}

/** Order in which the camera visits things — chronological where it matters. */
export const experienceOrder = [...experiences].sort((a, b) => a.start.localeCompare(b.start)).map((e) => e.id);
export const projectOrder = projects.map((p) => p.id);
export const achievementOrder = achievements.map((a) => a.id);
