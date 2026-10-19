/**
 * The Fire × Ice opening as an explicit state machine. `world.intro` runs
 * 0 → 1 over the timeline; everything (particles, light, sound, DOM) reads its
 * phase and amounts from here so the systems never disagree.
 */
import { smooth } from "./world";

export type IntroPhase =
  | "void"
  | "awakening"
  | "duality"
  | "attraction"
  | "collision"
  | "nameReveal"
  | "settled"
  | "transitioning"
  | "complete";

/** Full-length timeline in seconds (first visit, desktop). */
export const INTRO_SECONDS = 9.6;

/** Phase start points as fractions of the timeline. */
export const AT = {
  awakening: 0.1,
  iceWakes: 0.26,
  duality: 0.44,
  attraction: 0.56,
  collision: 0.72,
  nameReveal: 0.735,
  crisp: 0.82,
  network: 0.84,
  settled: 0.97,
} as const;

export function introPhase(intro: number, t: number): IntroPhase {
  if (t >= 1) return "complete";
  if (t > 0.05 && intro >= 1) return "transitioning";
  if (intro >= AT.settled) return "settled";
  if (intro >= AT.nameReveal) return "nameReveal";
  if (intro >= AT.collision) return "collision";
  if (intro >= AT.attraction) return "attraction";
  if (intro >= AT.duality) return "duality";
  if (intro >= AT.awakening) return "awakening";
  return "void";
}

/** How present each system is at a point in the timeline. */
export function introAmounts(intro: number) {
  return {
    spark: smooth(0.03, 0.09, intro),
    fire: smooth(AT.awakening, 0.3, intro),
    ice: smooth(AT.iceWakes, 0.44, intro),
    attract: smooth(AT.attraction, AT.collision, intro),
    glyph: intro >= AT.collision ? 1 : 0,
    crisp: smooth(AT.crisp, 0.92, intro),
    network: smooth(AT.network, 1, intro),
  };
}
