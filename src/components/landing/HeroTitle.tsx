"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { sfx } from "@/audio/useSound";
import { AT } from "@/lib/intro";
import { useTicker } from "@/lib/hooks";
import { world } from "@/lib/world";
import { drawLetters } from "./typeLayer";

const FIRST = "AKSHITA";
const SECOND = "MAHAJAN";
/** Cool rim on the ice side, warm on the fire side, neutral at the centre — as in the reference frame. */
const RIM = ["rim-cool", "rim-cool", "rim-cool", "rim-centre", "rim-warm", "rim-warm", "rim-warm"];
const STEP = 2;
/** After the grains have settled, how long they take to give way to the crisp letters (ms). */
const HANDOVER = 900;

type Group = {
  n: number;
  /** Where each grain comes from and where it settles (CSS px within the title box). */
  sx: Float32Array; sy: Float32Array; tx: Float32Array; ty: Float32Array;
  rgba: Uint32Array;
  /** Start delay and flight time, ms. */
  delay: Float32Array; dur: Float32Array;
  swirl: Float32Array;
  /** Side of the frame each grain drifts in from: 0 ice, 1 fire. */
  side: Uint8Array;
  started: number;
  settled: number;
  end: number;
};

const ICE = [150, 205, 255];
const FIRE = [255, 168, 78];
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Grains for one line of the name: sampled from the letters as set, each given a place in the smoke to drift in from. */
function sample(host: HTMLElement, w: number, h: number, selector: string, spread: number, now: number): Group | null {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const origin = host.getBoundingClientRect();
  ctx.translate(-origin.left, -origin.top);
  drawLetters(ctx, host, selector);
  const px = ctx.getImageData(0, 0, w, h).data;

  let left = w, right = 0;
  const hits: number[] = [];
  for (let y = 0; y < h; y += STEP) {
    for (let x = 0; x < w; x += STEP) {
      const k = (y * w + x) * 4;
      if (px[k + 3] < 90) continue;
      hits.push(x, y, k);
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  const n = hits.length / 3;
  if (!n) return null;
  const g: Group = {
    n,
    sx: new Float32Array(n), sy: new Float32Array(n), tx: new Float32Array(n), ty: new Float32Array(n),
    rgba: new Uint32Array(n), delay: new Float32Array(n), dur: new Float32Array(n), swirl: new Float32Array(n),
    side: new Uint8Array(n), started: now, settled: 0, end: 0,
  };
  const cx = (left + right) / 2, span = Math.max(1, right - left);
  for (let i = 0; i < n; i++) {
    const x = hits[i * 3], y = hits[i * 3 + 1], k = hits[i * 3 + 2];
    const fire = x >= cx ? 1 : 0;
    g.tx[i] = x;
    g.ty[i] = y;
    g.side[i] = fire;
    // They drift in out of the smoke on their own side, a little above and below the line.
    g.sx[i] = x + (fire ? 1 : -1) * (60 + Math.random() * spread) + (Math.random() - 0.5) * 40;
    g.sy[i] = y + (Math.random() - 0.5) * spread * 0.9;
    g.rgba[i] = ((255 << 24) | (px[k + 2] << 16) | (px[k + 1] << 8) | px[k]) >>> 0;
    // The name resolves left to right, softly: each letter gathers a moment after the last.
    g.delay[i] = ((x - left) / span) * 650 + Math.random() * 380;
    g.dur[i] = 900 + Math.random() * 500;
    g.swirl[i] = Math.random() * Math.PI * 2;
  }
  let last = 0;
  for (let i = 0; i < n; i++) last = Math.max(last, g.delay[i] + g.dur[i]);
  g.settled = now + last;
  g.end = g.settled + HANDOVER;
  return g;
}

/**
 * Her name, gathered out of the smoke: fine grains drift in from both sides —
 * ice from the left, fire from the right — and settle into AKSHITA, then
 * MAHAJAN, before the crisp letters take over in warm gold and orange. After
 * the intro the title is plain, real text.
 */
export function HeroTitle({ flow, children }: { flow: boolean; children?: ReactNode }) {
  const first = useRef<(HTMLSpanElement | null)[]>([]);
  const second = useRef<(HTMLSpanElement | null)[]>([]);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const groups = useRef<Group[]>([]);
  const frame = useRef<ImageData | null>(null);
  const stage = useRef<"wait" | "first" | "second" | "done">("wait");

  const light = (els: (HTMLSpanElement | null)[]) => els.forEach((el) => el && (el.dataset.s = "lit"));

  const finish = () => {
    light(first.current);
    light(second.current);
    wrap.current?.setAttribute("data-flared", "");
    groups.current = [];
    if (canvas.current) canvas.current.style.visibility = "hidden";
    stage.current = "done";
  };

  const gather = (line: 1 | 2) => {
    const host = wrap.current, c = canvas.current;
    if (!host || !c) return;
    const w = Math.round(c.clientWidth), h = Math.round(c.clientHeight);
    // Not laid out yet (a hidden or unsized window): try again next frame.
    if (!w || !h) return;
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
      frame.current = null;
    }
    const g = sample(host, w, h, line === 1 ? ".ttl:not(.ttl-line2)" : ".ttl-line2", line === 1 ? 300 : 180, performance.now());
    if (g) groups.current.push(g);
    stage.current = line === 1 ? "first" : "second";
  };

  useEffect(() => {
    // Skip intro finishes the title at once, wherever it had got to.
    const onSkip = () => finish();
    window.addEventListener("sutra:intro-skip", onSkip);
    return () => window.removeEventListener("sutra:intro-skip", onSkip);
    // finish only touches refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useTicker(() => {
    if (flow) {
      if (stage.current !== "done") finish();
      return;
    }
    const intro = world.intro;
    // Skipped, or arrived late: no formation, just the finished title.
    if (intro >= 1 && stage.current === "wait") return finish();
    if (stage.current === "wait" && intro >= AT.strike) gather(1);
    if (stage.current === "first" && intro >= AT.mahajan) gather(2);

    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !groups.current.length) return;
    const now = performance.now();
    const w = c.width, h = c.height;
    frame.current ??= ctx.createImageData(w, h);
    const buf = new Uint32Array(frame.current.data.buffer);
    buf.fill(0);
    c.style.visibility = "visible";

    for (const g of groups.current) {
      // Settled: the letters themselves fade in while their grains fade out.
      if (now >= g.settled) light(g === groups.current[0] ? first.current : second.current);
      if (now >= g.settled && g === groups.current[0]) wrap.current?.setAttribute("data-flared", "");
      const handover = now < g.settled ? 1 : 1 - Math.min(1, (now - g.settled) / HANDOVER);
      if (handover <= 0) continue;
      for (let i = 0; i < g.n; i++) {
        const t = Math.min(1, Math.max(0, (now - g.started - g.delay[i]) / g.dur[i]));
        if (t <= 0) continue;
        const e = easeOut(t);
        const drift = (1 - e) * 18;
        const x = (g.sx[i] + (g.tx[i] - g.sx[i]) * e + Math.sin(g.swirl[i] + t * 5) * drift) | 0;
        const y = (g.sy[i] + (g.ty[i] - g.sy[i]) * e + Math.cos(g.swirl[i] + t * 4) * drift) | 0;
        if (x < 0 || y < 0 || x + STEP > w || y + STEP > h) continue;
        // Out of the smoke they carry its colour; settling, they take the gold of the letter.
        const lit = g.side[i] ? FIRE : ICE;
        const col = g.rgba[i];
        const r = lit[0] + ((col & 255) - lit[0]) * e;
        const gg = lit[1] + (((col >> 8) & 255) - lit[1]) * e;
        const b = lit[2] + (((col >> 16) & 255) - lit[2]) * e;
        const a = Math.round(255 * Math.min(1, t * 2.5) * handover);
        const px = ((a << 24) | ((b | 0) << 16) | ((gg | 0) << 8) | (r | 0)) >>> 0;
        for (let dy = 0; dy < STEP; dy++) {
          const row = (y + dy) * w + x;
          for (let dx = 0; dx < STEP; dx++) buf[row + dx] = px;
        }
      }
    }
    ctx.putImageData(frame.current, 0, 0);

    const last = groups.current[groups.current.length - 1];
    if (stage.current === "second" && now >= last.end) {
      sfx.shimmer(2);
      finish();
    }
  });

  return (
    <div ref={wrap} className="electric-title" data-flared={flow ? "" : undefined}>
      <canvas ref={canvas} aria-hidden className="electric-title-canvas" style={{ visibility: "hidden" }} />
      <div className="hero-title-wrapper">
        <h1 id="signal-title" aria-label="Akshita Mahajan" className="title-face hero-name-stack uppercase">
          <span aria-hidden className="hero-first">
            {FIRST.split("").map((ch, i) => (
              <span key={i} ref={(el) => { first.current[i] = el; }} className={`ttl ${RIM[i]}`} data-s={flow ? "lit" : "off"}>
                {ch}
                {(i === 0 || i === FIRST.length - 1) && <span aria-hidden className={`ttl-flare ${i === 0 ? "ttl-flare-cool" : "ttl-flare-warm"}`} />}
              </span>
            ))}
          </span>
          <span aria-hidden className="hero-second">
            {SECOND.split("").map((ch, i) => (
              <span key={i} ref={(el) => { second.current[i] = el; }} className="ttl ttl-line2" data-s={flow ? "lit" : "off"}>
                {ch}
              </span>
            ))}
          </span>
        </h1>
        {children}
      </div>
    </div>
  );
}
