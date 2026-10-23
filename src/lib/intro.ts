/**
 * The opening as an explicit state machine. `world.intro` runs 0 → 1 over the
 * timeline; smoke, portrait, title, sound and navigation all read their phase
 * and amounts from here so they never disagree.
 *
 *   void → smoke (fire and ice drift in) → portrait (she emerges)
 *        → strike (her name is struck into being) → title → settled
 */
import { smooth } from "./world";

export type IntroPhase = "void" | "smoke" | "portrait" | "strike" | "title" | "settled" | "transitioning" | "complete";

/** Full-length timeline in seconds (first visit). */
export const INTRO_SECONDS = 7;

/** Phase start points as fractions of the timeline. */
export const AT = {
  smoke: 0.02,
  portrait: 0.02,
  strike: 0.27,
  mahajan: 0.5,
  subtitle: 0.62,
  cta: 0.72,
  settled: 0.86,
} as const;

export function introPhase(intro: number, t: number): IntroPhase {
  if (t >= 1) return "complete";
  if (t > 0.05 && intro >= 1) return "transitioning";
  if (intro >= AT.settled) return "settled";
  if (intro >= AT.mahajan) return "title";
  if (intro >= AT.strike) return "strike";
  if (intro >= AT.portrait) return "portrait";
  if (intro >= AT.smoke) return "smoke";
  return "void";
}

/** How present each layer is at a point in the timeline. */
export function introAmounts(intro: number) {
  return {
    smoke: smooth(AT.smoke, 0.42, intro),
    portrait: smooth(AT.portrait, 0.55, intro),
    title: smooth(AT.strike, AT.mahajan, intro),
    subtitle: smooth(AT.subtitle, 0.74, intro),
    cta: smooth(AT.cta, 0.84, intro),
  };
}
