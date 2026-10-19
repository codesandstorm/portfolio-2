/**
 * Per-frame values shared between the DOM scroll system and the WebGL world.
 * Deliberately a plain mutable object: it changes every frame and must never
 * trigger React renders. React-facing state lives in `store.ts`.
 */
export const world = {
  /** Story time: chapter index + progress through it (0 … chapters.length). */
  t: 0,
  /** Intro (awakening) timeline progress 0 … 1. */
  intro: 0,
  /** Normalised pointer, -1 … 1. */
  pointer: { x: 0, y: 0 },
  /** Accumulated drag rotation for interactive chapters (radians). */
  drag: { x: 0, y: 0 },
  /** Convergence flash 0 … 1, triggered by the converge chapter. */
  flash: 0,
  /** Fire × Ice collision flash 0 … 1, decays after the hero collision. */
  heroFlash: 0,
  /** Camera micro-shake 0 … 1. */
  shake: 0,
  /** Seconds since page start, advanced by the intro clock (for procedural motion). */
  time: 0,
  /** Hero name rectangle in CSS px, measured from the DOM <h1> for particle alignment. */
  nameRect: null as null | { cx: number; cy: number; w: number; h: number; fontPx: number; spacingPx: number; lines: string[]; lineHeightPx: number },
};

/**
 * Share of a chapter's story time spent while its stage is pinned; the rest is
 * the hand-over to the next chapter.
 */
export const STICKY = 0.88;

/** Progress through chapter `i`'s pinned content (0 … 1). */
export function chapterProgress(i: number) {
  return Math.min(1, Math.max(0, (world.t - i) / STICKY));
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (a: number, b: number, v: number) => {
  const x = clamp01((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
