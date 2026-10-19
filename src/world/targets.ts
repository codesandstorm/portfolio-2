/**
 * Morph targets for the energy particles. Every function returns N×3 floats.
 * The same particles become her name, the tunnel, her portrait, the threads
 * of the constellation and the finale — one body of light, many forms.
 */
import { CORE_ID, edges } from "@/content/graph";
import { posOf } from "./layout";

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function cssFont(varName: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

/** Pixels where a drawing is lit, as [x, y, weight] in 0…1 canvas space. */
function litPixels(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, stride = 2) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  draw(ctx, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const out: number[] = [];
  for (let y = 0; y < h; y += stride) {
    for (let x = 0; x < w; x += stride) {
      const i = (y * w + x) * 4;
      const a = data[i + 3] / 255;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 765;
      const weight = a * (0.25 + lum * 0.75);
      if (weight > 0.2) out.push(x / w, y / h, weight);
    }
  }
  return { pixels: out, canvas: c };
}

function fill(n: number, pixels: number[], map: (u: number, v: number, out: Float32Array, i: number) => void) {
  const out = new Float32Array(n * 3);
  const count = pixels.length / 3;
  if (!count) return out;
  for (let i = 0; i < n; i++) {
    // Weighted pick: brighter pixels attract more particles.
    let k = Math.floor(Math.random() * count);
    for (let tries = 0; tries < 3 && pixels[k * 3 + 2] < Math.random(); tries++) k = Math.floor(Math.random() * count);
    map(pixels[k * 3] + rand(-0.002, 0.002), pixels[k * 3 + 1] + rand(-0.002, 0.002), out, i);
  }
  return out;
}

/** Her name, set in the display face, centred at `center`, `width` world units wide. */
export function nameTarget(n: number, opts: { width: number; center: [number, number, number]; stacked: boolean }) {
  const family = cssFont("--font-instrument", "serif");
  const lines = opts.stacked ? ["AKSHITA", "MAHAJAN"] : ["AKSHITA MAHAJAN"];
  const W = 1400;
  const H = opts.stacked ? 520 : 240;
  const { pixels } = litPixels(
    (ctx, w, h) => {
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let size = opts.stacked ? 230 : 170;
      ctx.font = `400 ${size}px ${family}`;
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      size *= Math.min(1, (w * 0.94) / widest);
      ctx.font = `400 ${size}px ${family}`;
      lines.forEach((l, i) => ctx.fillText(l, w / 2, (h / (lines.length + 0)) * (i + 0.5)));
    },
    W,
    H,
  );
  const wWorld = opts.width;
  const hWorld = wWorld * (H / W);
  const [cx, cy, cz] = opts.center;
  return fill(n, pixels, (u, v, out, i) => {
    out[i * 3] = cx + (u - 0.5) * wWorld;
    out[i * 3 + 1] = cy - (v - 0.5) * hWorld;
    out[i * 3 + 2] = cz + rand(-0.12, 0.12);
  });
}

/**
 * Her name sampled from the exact font, size and spacing of the DOM <h1>, so
 * the particles land on the crisp type. The first half of the particles (fire)
 * takes the left of the name, the second half (ice) the right, along a jagged
 * seam rather than a clean cut between the words.
 */
export function glyphTarget(
  n: number,
  rect: { w: number; h: number; fontPx: number; spacingPx: number; lines: string[] },
  toWorld: (u: number, v: number) => [number, number],
  z: number,
) {
  const family = cssFont("--font-instrument", "serif");
  const s = Math.min(3, 1400 / rect.w);
  const W = Math.ceil(rect.w * s);
  const H = Math.ceil(rect.h * s);
  const { pixels } = litPixels(
    (ctx) => {
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `400 ${rect.fontPx * s}px ${family}`;
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${rect.spacingPx * s}px`;
      rect.lines.forEach((l, i) => ctx.fillText(l, W / 2 + (rect.spacingPx * s) / 2, (H / rect.lines.length) * (i + 0.5)));
    },
    W,
    H,
    2,
  );
  const pts = fill(n, pixels, (u, v, out, i) => {
    const [x, y] = toWorld(u, v);
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z + rand(-0.08, 0.08);
  });
  return splitByX(pts, n);
}

/** Order points so the first half (fire) lies left of a jagged seam and the second half (ice) right of it. */
export function splitByX(pts: Float32Array, n: number) {
  const key = Array.from({ length: n }, (_, i) => pts[i * 3] + Math.sin(pts[i * 3 + 1] * 1.7) * 0.6 + rand(-0.45, 0.45));
  const order = key.map((_, i) => i).sort((a, b) => key[a] - key[b]);
  const out = new Float32Array(n * 3);
  order.forEach((src, dst) => out.set(pts.subarray(src * 3, src * 3 + 3), dst * 3));
  // Shuffle within each half so neighbouring particles don't fill in strict order.
  for (const [lo, hi] of [[0, n >> 1], [n >> 1, n]]) {
    for (let i = hi - 1; i > lo; i--) {
      const j = lo + Math.floor(Math.random() * (i - lo + 1));
      for (let k = 0; k < 3; k++) [out[i * 3 + k], out[j * 3 + k]] = [out[j * 3 + k], out[i * 3 + k]];
    }
  }
  return out;
}

/** A loose cloud far away: where the light waits before the awakening. */
export function seedTarget(n: number) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = rand(30, 70);
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(rand(-1, 1));
    out[i * 3] = r * Math.sin(b) * Math.cos(a);
    out[i * 3 + 1] = r * Math.sin(b) * Math.sin(a);
    out[i * 3 + 2] = r * Math.cos(b) + 20;
  }
  return out;
}

/** A corridor of light the camera flies through (z from 44 down to 6). */
export function tunnelTarget(n: number) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const z = rand(4, 46);
    const a = Math.random() * Math.PI * 2;
    const r = rand(2.2, 13) * (0.6 + (z / 46) * 0.6);
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = Math.sin(a) * r * 0.7;
    out[i * 3 + 2] = z;
  }
  return out;
}

/** Canvas of the portrait source: a supplied photo or the placeholder silhouette. */
export async function portraitCanvas(src: string | null): Promise<HTMLCanvasElement> {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  if (src) {
    const img = new Image();
    img.src = src;
    await img.decode();
    const s = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, S, S);
    // Luminance becomes alpha so the point cloud follows the light in the photo.
    const d = ctx.getImageData(0, 0, S, S);
    for (let i = 0; i < d.data.length; i += 4) {
      const l = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3;
      d.data[i + 3] = l;
    }
    ctx.putImageData(d, 0, 0);
    return c;
  }
  // Placeholder: an abstract head-and-shoulders form lit from above. Not a likeness.
  const g = ctx.createRadialGradient(S * 0.5, S * 0.3, 8, S * 0.5, S * 0.55, S * 0.6);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0.4)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(S * 0.5, S * 0.32, S * 0.115, S * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(S * 0.455, S * 0.44);
  ctx.quadraticCurveTo(S * 0.45, S * 0.52, S * 0.44, S * 0.55);
  ctx.bezierCurveTo(S * 0.3, S * 0.58, S * 0.2, S * 0.62, S * 0.16, S * 0.74);
  ctx.lineTo(S * 0.1, S * 1.0);
  ctx.lineTo(S * 0.9, S * 1.0);
  ctx.lineTo(S * 0.84, S * 0.74);
  ctx.bezierCurveTo(S * 0.8, S * 0.62, S * 0.7, S * 0.58, S * 0.56, S * 0.55);
  ctx.quadraticCurveTo(S * 0.55, S * 0.52, S * 0.545, S * 0.44);
  ctx.closePath();
  ctx.fill();
  // Dissolve downward so the figure becomes light rather than an object.
  ctx.globalCompositeOperation = "destination-in";
  const fade = ctx.createLinearGradient(0, S * 0.55, 0, S);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, S, S);
  ctx.globalCompositeOperation = "source-over";
  return c;
}

export function portraitTarget(n: number, canvas: HTMLCanvasElement, height: number, center: [number, number, number]) {
  // Keep the faint, dissolving pixels in play so the fade still reads as a figure.
  const { pixels } = litPixels((ctx) => ctx.drawImage(canvas, 0, 0, 256, 256), 256, 256, 1);
  for (let k = 2; k < pixels.length; k += 3) pixels[k] = Math.max(pixels[k], 0.25);
  const [cx, cy, cz] = center;
  return fill(n, pixels, (u, v, out, i) => {
    out[i * 3] = cx + (u - 0.5) * height;
    out[i * 3 + 1] = cy - (v - 0.5) * height;
    out[i * 3 + 2] = cz + rand(-0.15, 0.15) + (1 - Math.abs(u - 0.5) * 2) * 0.4;
  });
}

/** Particles strung along every thread of the constellation. */
export function webTarget(n: number) {
  const out = new Float32Array(n * 3);
  const usable = edges.filter((e) => e.a !== CORE_ID && e.b !== CORE_ID);
  for (let i = 0; i < n; i++) {
    const e = usable[i % usable.length];
    const a = posOf(e.a), b = posOf(e.b);
    const t = Math.random();
    const bow = Math.sin(t * Math.PI) * 0.6;
    out[i * 3] = a[0] + (b[0] - a[0]) * t - a[0] * 0.04 * bow + rand(-0.08, 0.08);
    out[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + bow * 0.4 + rand(-0.08, 0.08);
    out[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + rand(-0.08, 0.08);
  }
  return out;
}

/** Converging on a point (achievements) or the core (finale). */
export function haloTarget(n: number, center: [number, number, number], radius: number) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(rand(-1, 1));
    const r = radius * Math.pow(Math.random(), 0.5);
    out[i * 3] = center[0] + r * Math.sin(b) * Math.cos(a);
    out[i * 3 + 1] = center[1] + r * Math.sin(b) * Math.sin(a);
    out[i * 3 + 2] = center[2] + r * Math.cos(b) * 0.5;
  }
  return out;
}
