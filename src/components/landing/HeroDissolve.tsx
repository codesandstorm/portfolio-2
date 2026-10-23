"use client";

import { useEffect, useRef } from "react";
import { useTicker } from "@/lib/hooks";
import { world } from "@/lib/world";

/** Grid spacing in CSS px for the photograph's grains, and for the denser grains of the type. */
const IMAGE_STEP = 3;
const TEXT_STEP = 2;
/** How much of the scroll each grain spends in flight once it lets go. */
const FLIGHT = 0.5;
/** Scroll point where the real photograph begins handing over to its grains (matches the landing's fade). */
export const PHOTO_HANDOVER = 0.08;

type Grains = {
  w: number;
  h: number;
  n: number;
  x: Float32Array;
  y: Float32Array;
  /** Packed 0xAABBGGRR, ready for a Uint32 view of ImageData. */
  rgba: Uint32Array;
  /** When the grain lets go (0 … 1 of the dissolve). */
  delay: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  wobble: Float32Array;
  /** Block size at rest: image grains tile the frame, type grains are finer. */
  size: Uint8Array;
  /** 1 for grains of the photograph, 0 for type. */
  photo: Uint8Array;
};

const ICE = [150, 205, 255];
const FIRE = [255, 168, 78];

function drawText(ctx: CanvasRenderingContext2D, el: HTMLElement, text: string, fill: string | CanvasGradient, rect = el.getBoundingClientRect()) {
  const cs = getComputedStyle(el);
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  ctx.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  ctx.fillStyle = fill;
  const m = ctx.measureText(text);
  // Same baseline the browser uses for a one-line box: centre the font's ascent+descent in the line.
  const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize);
  const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
  const baseline = rect.top + (Math.min(rect.height, lineH) - (asc + desc)) / 2 + asc;
  return { m, baseline };
}

/**
 * Snapshot of the hero exactly as it stands — the live smoke frame and every
 * letter — turned into grains. Type is sampled densely so the name stays
 * legible until it lets go.
 */
function capture(host: HTMLElement, w: number, h: number, photo: HTMLImageElement | null): Grains | null {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const origin = host.getBoundingClientRect();

  // 1 · Photograph and smoke, from the shader's own canvas (it keeps its last frame);
  // if the shader hasn't drawn yet (scrolling during the loader), the photograph itself.
  const smoke = host.querySelector<HTMLCanvasElement>(".webgl-smoke-canvas");
  ctx.fillStyle = "#050608";
  ctx.fillRect(0, 0, w, h);
  if (smoke && smoke.width > 1) ctx.drawImage(smoke, 0, 0, w, h);
  else if (photo?.complete && photo.naturalWidth) {
    // background-size: cover; background-position: center
    const k = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
    const dw = photo.naturalWidth * k, dh = photo.naturalHeight * k;
    ctx.drawImage(photo, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }
  const image = ctx.getImageData(0, 0, w, h).data;

  // 2 · Type, on its own layer so it can be sampled finer and let go first.
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(-origin.left, -origin.top);
  host.querySelectorAll<HTMLElement>(".ttl").forEach((el) => {
    const r = el.getBoundingClientRect();
    const line2 = el.classList.contains("ttl-line2");
    const g = ctx.createLinearGradient(0, r.top, 0, r.bottom);
    if (line2) {
      g.addColorStop(0, "#fff7e6");
      g.addColorStop(0.52, "#dfbe88");
      g.addColorStop(1, "#c29653");
    } else {
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.4, "#fff4e6");
      g.addColorStop(1, "#e2b98a");
    }
    const ch = el.firstChild?.textContent ?? "";
    const { baseline } = drawText(ctx, el, ch, g, r);
    // Each letter is its own box and its tracking is space after the glyph, so the ink starts at the box's left edge.
    ctx.letterSpacing = "0px";
    ctx.fillText(ch, r.left, baseline);
  });
  for (const sel of [".hero-sub-descriptor", ".explore-link"]) {
    const el = host.querySelector<HTMLElement>(sel);
    if (!el || getComputedStyle(el.closest(".hero-explore-cta, .hero-sub-descriptor") ?? el).visibility === "hidden") continue;
    // Walk the text runs so separators keep their own colour.
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      if (!text.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      const parent = node.parentElement!;
      const color = getComputedStyle(parent).color;
      const { baseline } = drawText(ctx, parent, sel === ".hero-sub-descriptor" ? text.toUpperCase() : text, color, r);
      ctx.fillText(sel === ".hero-sub-descriptor" ? text.toUpperCase() : text, r.left, baseline);
    }
  }
  ctx.restore();
  const type = ctx.getImageData(0, 0, w, h).data;

  // 3 · Sample both layers into grains.
  const cap = Math.ceil((w / IMAGE_STEP) * (h / IMAGE_STEP)) + Math.ceil((w / TEXT_STEP) * (h / TEXT_STEP) * 0.12);
  const g: Grains = {
    w, h, n: 0,
    x: new Float32Array(cap), y: new Float32Array(cap), rgba: new Uint32Array(cap),
    delay: new Float32Array(cap), vx: new Float32Array(cap), vy: new Float32Array(cap),
    wobble: new Float32Array(cap), size: new Uint8Array(cap), photo: new Uint8Array(cap),
  };
  const cx = w / 2;
  const push = (x: number, y: number, r: number, gr: number, b: number, a: number, delay: number, size: number, photo = 0) => {
    if (g.n >= cap) return;
    const i = g.n++;
    const side = (x - cx) / cx; // -1 ice … +1 fire
    g.x[i] = x;
    g.y[i] = y;
    g.rgba[i] = (a << 24) | (b << 16) | (gr << 8) | r;
    g.delay[i] = delay;
    // Grains rise like embers and drift outward toward their own side of the frame.
    g.vx[i] = side * (0.18 + Math.random() * 0.32) + (Math.random() - 0.5) * 0.25;
    g.vy[i] = -(0.35 + Math.random() * 0.75);
    g.wobble[i] = Math.random() * Math.PI * 2;
    g.size[i] = size;
    g.photo[i] = photo;
  };
  for (let y = 0; y < h; y += IMAGE_STEP) {
    for (let x = 0; x < w; x += IMAGE_STEP) {
      const k = (y * w + x) * 4;
      const r = image[k], gr = image[k + 1], b = image[k + 2];
      // Pure black adds nothing; everything else (hair, shadow) is kept so the frame has no holes.
      if (r + gr + b < 6) continue;
      // The photograph lets go from the bottom up, unevenly, after the type has started.
      const d = 0.12 + (1 - y / h) * 0.3 + Math.random() * 0.14;
      push(x, y, r, gr, b, 255, d, IMAGE_STEP, 1);
    }
  }
  for (let y = 0; y < h; y += TEXT_STEP) {
    for (let x = 0; x < w; x += TEXT_STEP) {
      const k = (y * w + x) * 4;
      if (type[k + 3] < 90) continue;
      // Drawn last, so the type sits over the photograph. The name goes first, centre outward.
      const d = Math.abs(x - cx) / cx * 0.12 + Math.random() * 0.06;
      push(x, y, type[k], type[k + 1], type[k + 2], 255, d, TEXT_STEP + 1);
    }
  }
  return g;
}

/**
 * The hero breaking into grains as you scroll toward About: her name first,
 * then the line beneath it, then the photograph from the bottom up, every
 * grain rising and drifting toward its own side — ice to the left, fire to
 * the right. Scroll back and it reassembles. Drawn on a 2D canvas at CSS
 * resolution straight into an ImageData buffer, so tens of thousands of
 * grains stay cheap; it only runs while the dissolve is under way.
 */
export function HeroDissolve({ host, image }: { host: React.RefObject<HTMLElement | null>; image: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const grains = useRef<Grains | null>(null);
  const frame = useRef<ImageData | null>(null);
  const last = useRef(-1);
  const photo = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = image;
    photo.current = img;
  }, [image]);

  useTicker(() => {
    const c = canvas.current;
    const p = world.heroDissolve;
    if (!c) return;
    if (p <= 0) {
      // Back at rest: the next scroll takes a fresh snapshot of the living frame.
      if (last.current !== 0) {
        c.style.visibility = "hidden";
        grains.current = null;
        last.current = 0;
      }
      return;
    }
    if (p >= 1) {
      if (last.current !== 1) {
        c.style.visibility = "hidden";
        last.current = 1;
      }
      return;
    }
    if (Math.abs(p - last.current) < 0.0005) return;
    last.current = p;

    const w = Math.round(c.clientWidth), h = Math.round(c.clientHeight);
    if (!w || !h) return;
    if (!grains.current || grains.current.w !== w || grains.current.h !== h) {
      if (!host.current) return;
      grains.current = capture(host.current, w, h, photo.current);
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
      frame.current = null;
    }
    const g = grains.current;
    const ctx = c.getContext("2d");
    if (!g || !ctx) return;
    frame.current ??= ctx.createImageData(w, h);
    const buf = new Uint32Array(frame.current.data.buffer);
    buf.fill(0);
    c.style.visibility = "visible";

    const reach = Math.max(w, h);
    for (let i = 0; i < g.n; i++) {
      const q = Math.min(1, Math.max(0, (p - g.delay[i]) / FLIGHT));
      const fade = 1 - q;
      if (fade <= 0) continue;
      // Until the living photograph starts to fade, its resting grains stay hidden; the real one shows through.
      if (q === 0 && g.photo[i] && p < PHOTO_HANDOVER) continue;
      // Lift off promptly, then accelerate: grains read as flying, not just fading.
      const e = q * 0.55 + q * q * 0.45;
      const x = g.x[i] + (g.vx[i] * reach * 0.45 + Math.sin(g.wobble[i] + q * 7) * 14) * e;
      const y = g.y[i] + g.vy[i] * reach * 0.5 * e;
      // In flight a grain shrinks from its tile to a single bright point.
      const s = q === 0 ? g.size[i] : Math.max(1, Math.round(g.size[i] * (1 - q * 1.6)));
      const xi = x | 0, yi = y | 0;
      if (xi < 0 || yi < 0 || xi + s > w || yi + s > h) continue;
      let col = g.rgba[i];
      if (q > 0) {
        // Grains catch the light of their side as they go: ice left, fire right.
        const tint = Math.min(1, q * 1.4) * 0.55;
        const lit = g.x[i] < w / 2 ? ICE : FIRE;
        const r = (col & 255) * (1 - tint) + lit[0] * tint;
        const gg = ((col >> 8) & 255) * (1 - tint) + lit[1] * tint;
        const b = ((col >> 16) & 255) * (1 - tint) + lit[2] * tint;
        const a = Math.round(255 * Math.pow(fade, 1.6));
        col = ((a << 24) | ((b | 0) << 16) | ((gg | 0) << 8) | (r | 0)) >>> 0;
      }
      for (let dy = 0; dy < s; dy++) {
        const row = (yi + dy) * w + xi;
        for (let dx = 0; dx < s; dx++) buf[row + dx] = col;
      }
    }
    ctx.putImageData(frame.current, 0, 0);
  });

  return <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 z-[25] h-full w-full" style={{ visibility: "hidden" }} />;
}
