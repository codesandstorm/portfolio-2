"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { sfx } from "@/audio/useSound";
import { AT } from "@/lib/intro";
import { useTicker } from "@/lib/hooks";
import { smooth, world } from "@/lib/world";

type Pt = [number, number];
type Bolt = { a: Pt; b: Pt; disp: number; born: number; life: number; tone: "ice" | "fire" | "white"; width: number };

const FIRST = "AKSHITA";
const SECOND = "MAHAJAN";
/** The order letters are struck in: outside-in, never left-to-right like a typewriter. */
const ORDER = [0, 6, 3, 1, 5, 2, 4];
const GAP = 115;
/** Cool rim on the ice side, warm on the fire side, neutral at the centre — as in the reference frame. */
const RIM = ["rim-cool", "rim-cool", "rim-cool", "rim-centre", "rim-warm", "rim-warm", "rim-warm"];

/** A jagged path between two points by repeated midpoint displacement — re-rolled every frame, so it flickers. */
function jag(a: Pt, b: Pt, disp: number): Pt[] {
  let pts: Pt[] = [a, b];
  let d = disp;
  for (let it = 0; it < 6; it++) {
    const next: Pt[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      next.push([(ax + bx) / 2 + (Math.random() - 0.5) * d, (ay + by) / 2 + (Math.random() - 0.5) * d], [bx, by]);
    }
    pts = next;
    d *= 0.55;
  }
  return pts;
}

const TONE = {
  ice: { glow: "rgba(111,182,255,0.55)", mid: "rgba(190,222,255,0.9)", core: "#ffffff" },
  fire: { glow: "rgba(255,150,70,0.5)", mid: "rgba(255,214,170,0.9)", core: "#fffaf2" },
  white: { glow: "rgba(200,225,255,0.6)", mid: "rgba(235,244,255,0.95)", core: "#ffffff" },
};

/**
 * Her name, struck into being like a film title: a bolt from the sky hits the
 * centre of the name, then each letter of AKSHITA is hit
 * by a bolt and flickers alight, a single white flash lights the whole scene,
 * the letters cool into warm metal, and MAHAJAN is scanned in by a crackling
 * sweep. Afterwards an occasional faint arc keeps the title alive.
 */
export function ElectricTitle({ flow, children }: { flow: boolean; children?: ReactNode }) {
  const first = useRef<(HTMLSpanElement | null)[]>([]);
  const second = useRef<(HTMLSpanElement | null)[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const bolts = useRef<Bolt[]>([]);
  const timers = useRef<number[]>([]);
  const stage = useRef<"wait" | "strike" | "line2" | "done">("wait");
  const nextCrackle = useRef(0);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  const set = (el: HTMLSpanElement | null | undefined, s: string) => el && (el.dataset.s = s);

  /** Centre-top of a letter in canvas pixels. */
  const anchor = (el: HTMLSpanElement | null | undefined, dy = 0.08): Pt => {
    const c = canvas.current?.getBoundingClientRect();
    const r = el?.getBoundingClientRect();
    if (!c || !r) return [0, 0];
    return [r.left + r.width / 2 - c.left, r.top + r.height * dy - c.top];
  };
  const bolt = (a: Pt, b: Pt, tone: Bolt["tone"], life = 130, disp = 70, width = 1.4) =>
    bolts.current.push({ a, b, disp, born: performance.now(), life, tone, width });

  const finish = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    [...first.current, ...second.current].forEach((el) => set(el, "lit"));
    wrap.current?.setAttribute("data-flared", "");
    stage.current = "done";
  };

  const strike = () => {
    stage.current = "strike";
    const c = canvas.current?.getBoundingClientRect();
    const w = c?.width ?? 1000;
    // The first strike comes straight down out of the smoke onto the centre of her name.
    const [hx, hy] = anchor(first.current[3], 0.1);
    bolt([hx + (Math.random() - 0.5) * 160, -30], [hx, hy], "white", 260, 170, 2.4);
    world.heroFlash = Math.max(world.heroFlash, 0.45);
    sfx.zap(1.2);
    ORDER.forEach((i, k) => {
      later(220 + k * GAP, () => {
        const el = first.current[i];
        const left = i < 3 || (i === 3 && k % 2 === 0);
        const [x, y] = anchor(el);
        // Bolts come in from the ice side or the fire side of the frame.
        bolt([left ? -20 : w + 20, y - 60 - Math.random() * 120], [x, y], left ? "ice" : "fire", 150, 90, 1.6);
        sfx.zap(0.8);
        // Flicker like a tube catching: hot, out, hot, out, hot — then it holds.
        set(el, "hot");
        later(45, () => set(el, "dim"));
        later(85, () => set(el, "hot"));
        later(120, () => set(el, "dim"));
        later(150, () => set(el, "hot"));
      });
    });
    const flashAt = 220 + ORDER.length * GAP + 200;
    later(flashAt, () => {
      // One full strike: the whole name goes white, the scene is lit, then it cools.
      first.current.forEach((el) => set(el, "flash"));
      world.heroFlash = 1;
      world.shake = Math.max(world.shake, 0.35);
      sfx.thunder();
      for (let k = 0; k < FIRST.length - 1; k++) bolt(anchor(first.current[k], 0.5), anchor(first.current[k + 1], 0.5), "white", 180, 26, 1.2);
      const [lx, ly] = anchor(first.current[0], 0.5);
      const [rx, ry] = anchor(first.current[FIRST.length - 1], 0.5);
      // Two more out of the sky, one on each side, landing on the outer A's.
      bolt([lx - 60 - Math.random() * 80, -30], [lx, ly], "ice", 240, 150, 2.2);
      bolt([rx + 60 + Math.random() * 80, -30], [rx, ry], "fire", 240, 150, 2.2);
      wrap.current?.setAttribute("data-flared", "");
    });
    later(flashAt + 150, () => first.current.forEach((el) => set(el, "lit")));
  };

  const scanSecond = () => {
    stage.current = "line2";
    SECOND.split("").forEach((_, j) => {
      later(j * 70, () => {
        const el = second.current[j];
        set(el, "hot");
        const [x, y] = anchor(el, 0.2);
        bolt([x - 14, y - 18], [x + 10, y + 4], "white", 90, 14, 1);
        if (j === 0 || j === SECOND.length - 1) sfx.zap(0.35);
        later(140, () => set(el, "lit"));
      });
    });
    later(SECOND.length * 70 + 200, () => (stage.current = "done"));
  };

  // Keep the canvas matched to its box at device resolution.
  useEffect(() => {
    const c = canvas.current;
    const w = wrap.current;
    if (!c || !w) return;
    const fit = () => {
      const r = w.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    // Skip intro finishes the title at once, wherever the strike had got to.
    const onSkip = () => finish();
    window.addEventListener("sutra:intro-skip", onSkip);
    const ro = new ResizeObserver(fit);
    ro.observe(w);
    return () => {
      ro.disconnect();
      window.removeEventListener("sutra:intro-skip", onSkip);
      timers.current.forEach(clearTimeout);
    };
    // finish is stable for the life of the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useTicker(() => {
    if (flow) {
      if (stage.current !== "done") finish();
      return;
    }
    const intro = world.intro;
    // Skipped, or arrived late: no strike, just the finished title.
    if (intro >= 1 && stage.current !== "done" && (stage.current === "wait" || world.t > 0.05)) finish();
    if (stage.current === "wait" && intro >= AT.strike) strike();
    if (stage.current === "strike" && intro >= AT.mahajan) scanSecond();

    const now = performance.now();
    // Now and then, a faint arc between two letters — the title is still live.
    if (stage.current === "done" && world.t < 0.3 && now > nextCrackle.current) {
      if (nextCrackle.current) {
        const i = Math.floor(Math.random() * (FIRST.length - 1));
        bolt(anchor(first.current[i], 0.3 + Math.random() * 0.4), anchor(first.current[i + 1], 0.3 + Math.random() * 0.4), i < 3 ? "ice" : "fire", 110, 18, 0.9);
        sfx.zap(0.2);
      }
      nextCrackle.current = now + 3500 + Math.random() * 4500;
    }

    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    c.style.opacity = (1 - smooth(0.04, 0.4, world.t)).toFixed(3);
    bolts.current = bolts.current.filter((b) => now - b.born < b.life);
    ctx.globalCompositeOperation = "lighter";
    for (const b of bolts.current) {
      const age = (now - b.born) / b.life;
      // Real lightning stutters: the bolt drops out for a frame here and there.
      const alpha = (1 - age * age) * (Math.random() < 0.22 ? 0.25 : 1);
      const pts = jag(b.a, b.b, b.disp);
      const tone = TONE[b.tone];
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (const [x, y] of pts) ctx.lineTo(x, y);
      };
      ctx.globalAlpha = alpha;
      ctx.lineJoin = "round";
      ctx.shadowColor = tone.glow;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = tone.glow;
      ctx.lineWidth = b.width * 5;
      path();
      ctx.stroke();
      ctx.shadowBlur = 6;
      ctx.strokeStyle = tone.mid;
      ctx.lineWidth = b.width * 2;
      path();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = tone.core;
      ctx.lineWidth = b.width * 0.8;
      path();
      ctx.stroke();
      // A short branch off the main channel.
      if (b.disp > 40) {
        const k = Math.floor(pts.length * (0.3 + Math.random() * 0.4));
        const [sx, sy] = pts[k];
        const branch = jag([sx, sy], [sx + (Math.random() - 0.5) * 120, sy + 30 + Math.random() * 60], 30);
        ctx.strokeStyle = tone.mid;
        ctx.lineWidth = b.width * 0.8;
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        ctx.moveTo(branch[0][0], branch[0][1]);
        for (const [x, y] of branch) ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  });

  return (
    <div ref={wrap} className="electric-title" data-flared={flow ? "" : undefined}>
      <canvas ref={canvas} aria-hidden className="electric-title-canvas" />
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
