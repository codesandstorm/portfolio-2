/**
 * Procedural artifacts. Each project grows from a seed into a form whose
 * structure is a real number from its evidence (see `Project.artifact`):
 * the HRMS lattice has one cell per data model, BreastCare one ring per role
 * portal, PRAHARI one tick per hour of the hackathon, and so on.
 */
import * as THREE from "three";
import type { ArtifactForm } from "@/content/types";

type Seg = number[];

function pushBoxEdges(out: Seg, cx: number, cy: number, cz: number, s: number) {
  const h = s / 2;
  const c = [
    [-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h],
    [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h],
  ];
  const e = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (const [a, b] of e) out.push(cx + c[a][0], cy + c[a][1], cz + c[a][2], cx + c[b][0], cy + c[b][1], cz + c[b][2]);
}

function pushCircle(out: Seg, r: number, seg: number, transform?: THREE.Matrix4, y = 0) {
  const v = new THREE.Vector3();
  const w = new THREE.Vector3();
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const b = ((i + 1) / seg) * Math.PI * 2;
    v.set(Math.cos(a) * r, y, Math.sin(a) * r);
    w.set(Math.cos(b) * r, y, Math.sin(b) * r);
    if (transform) { v.applyMatrix4(transform); w.applyMatrix4(transform); }
    out.push(v.x, v.y, v.z, w.x, w.y, w.z);
  }
}

function lattice(count: number): Seg {
  const out: Seg = [];
  const side = Math.ceil(Math.cbrt(count));
  const gap = 0.3;
  let n = 0;
  for (let x = 0; x < side && n < count; x++)
    for (let y = 0; y < side && n < count; y++)
      for (let z = 0; z < side && n < count; z++, n++)
        pushBoxEdges(out, (x - (side - 1) / 2) * gap, (y - (side - 1) / 2) * gap, (z - (side - 1) / 2) * gap, 0.19);
  return out;
}

function rings(count: number): Seg {
  const out: Seg = [];
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    m.makeRotationFromEuler(new THREE.Euler(0.5 + i * 0.32, i * 0.45, 0));
    pushCircle(out, 0.3 + i * 0.19, 64, m);
  }
  return out;
}

function grid(count: number): Seg {
  const out: Seg = [];
  const side = Math.ceil(Math.sqrt(count));
  for (let i = 0; i < count; i++) {
    const x = (i % side) - (side - 1) / 2;
    const y = Math.floor(i / side) - (side - 1) / 2;
    const s = 0.8;
    const cx = x * 0.95, cy = y * 0.95;
    const h = s / 2;
    out.push(cx - h, cy - h, 0, cx + h, cy - h, 0, cx + h, cy - h, 0, cx + h, cy + h, 0, cx + h, cy + h, 0, cx - h, cy + h, 0, cx - h, cy + h, 0, cx - h, cy - h, 0);
    // Inner divisions: the module's moving parts.
    for (let k = 1; k < 3; k++) out.push(cx - h + (s * k) / 3, cy - h, 0, cx - h + (s * k) / 3, cy + h, 0);
  }
  return out;
}

function loop(count: number): Seg {
  const out: Seg = [];
  pushCircle(out, 1.15, 96);
  const m = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  pushCircle(out, 1.15, 96, m);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    out.push(Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0, Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3);
  }
  return out;
}

function sentinel(count: number): Seg {
  const out: Seg = [0, -1.3, 0, 0, 1.3, 0];
  pushCircle(out, 1.25, 96);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const l = i % 6 === 0 ? 0.32 : 0.16;
    out.push(Math.cos(a) * 1.25, 0, Math.sin(a) * 1.25, Math.cos(a) * (1.25 + l), 0, Math.sin(a) * (1.25 + l));
  }
  return out;
}

function shell(radius: number): Seg {
  const g = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(radius, 1));
  return Array.from(g.getAttribute("position").array as Float32Array);
}

function arc(count: number): Seg {
  const out: Seg = [];
  for (let i = 0; i < count; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2 + i * 0.05, -1.2, 0),
      new THREE.Vector3(0.25 - i * 0.1, -0.3, 0.1 * i),
      new THREE.Vector3(-0.15 + i * 0.12, 0.5, -0.1 * i),
      new THREE.Vector3(0.05, 1.2, 0),
    ]);
    const pts = curve.getPoints(48);
    const off = (i - (count - 1) / 2) * 0.5;
    for (let k = 0; k < pts.length - 1; k++) out.push(pts[k].x + off, pts[k].y, pts[k].z, pts[k + 1].x + off, pts[k + 1].y, pts[k + 1].z);
  }
  return out;
}

export function artifactGeometry(form: ArtifactForm, count: number): THREE.BufferGeometry[] {
  const make = (s: Seg) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(s, 3));
    return g;
  };
  switch (form) {
    case "lattice": return [make(lattice(count))];
    case "rings": return [make(rings(count))];
    case "grid": return [make(grid(count))];
    case "loop": return [make(loop(count))];
    case "sentinel": return [make(sentinel(count))];
    // Two shells: the first attempt, and the one that grew back larger.
    case "seed": return [make(shell(0.55)), make(shell(1.25))];
    case "arc": return [make(arc(count))];
  }
}
