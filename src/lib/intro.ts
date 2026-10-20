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

/** Full-length timeline in seconds (first visit, desktop). */
export const INTRO_SECONDS = 8;

/** Phase start points as fractions of the timeline. */
export const AT = {
  smoke: 0.04,
  portrait: 0.22,
  strike: 0.5,
  mahajan: 0.68,
  subtitle: 0.8,
  cta: 0.88,
  settled: 0.97,
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
    subtitle: smooth(AT.subtitle, 0.9, intro),
    cta: smooth(AT.cta, 0.97, intro),
  };
}
