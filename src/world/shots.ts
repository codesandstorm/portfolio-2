/**
 * Camera shots as a function of story time. The rig damps toward these, so a
 * jump between chapters becomes a flight rather than a cut.
 */
import { chapterIndex } from "@/lib/chapters";
import { introAmounts } from "@/lib/intro";
import { STICKY, smooth, world } from "@/lib/world";
import { achievementOrder, centroid, experienceOrder, posOf, projectOrder, type Vec3 } from "./layout";

export type Shot = { pos: Vec3; look: Vec3; fov: number; orbit?: boolean };

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Index of the active item when a chapter steps through `count` items. */
export function stepOf(progress: number, count: number) {
  const scaled = Math.min(count - 0.0001, Math.max(0, progress * count));
  return { index: Math.floor(scaled), local: scaled - Math.floor(scaled) };
}

const voiceCentre = centroid(["x-ieee", "x-acm", "x-suas"]);

export function shotAt(t: number, aspect: number): Shot {
  const i = Math.min(9, Math.floor(t));
  const p = Math.min(1, (t - i) / STICKY);
  const portrait = aspect < 0.9;
  const fov = portrait ? 62 : 50;
  // Where the subject sits on screen: left of centre on wide screens (text on
  // the right), above centre on tall screens (text below).
  const frame: Vec3 = portrait ? [0, -1.4, 0] : [1.9, 0, 0];

  switch (i) {
    case chapterIndex.signal: {
      // Almost still: the slowest push toward her as she emerges from the smoke.
      const a = introAmounts(world.intro);
      return { pos: [0, 0, 46 - a.portrait * 1.5], look: [0, 0, 0], fov };
    }
    case chapterIndex.start: {
      const e = smooth(0, 1, p);
      const z = 44 - e * 34;
      return { pos: [Math.sin(p * Math.PI) * 1.6, Math.sin(p * Math.PI * 2) * 0.5, z], look: [0, 0, Math.max(0, z - 24)], fov };
    }
    case chapterIndex.akshita:
      return { pos: [0, 0.2, portrait ? 12 : 9.5], look: portrait ? [0, -1.2, 0] : [1.5, 0.1, 0], fov };
    case chapterIndex.connect: {
      const a = -0.35 + p * 0.7;
      // The open network sits right of centre; the chapter's words hold the left.
      return { pos: [Math.sin(a) * 34, 6, Math.cos(a) * 34], look: portrait ? [0, 5, 0] : [-7, 0, 0], fov, orbit: true };
    }
    case chapterIndex.collaborate: {
      const { index, local } = stepOf(p, experienceOrder.length);
      const n = posOf(experienceOrder[index]);
      return { pos: add(n, [0.6 - local * 1.2, 0.8, portrait ? 10 : 7.5]), look: add(n, frame), fov };
    }
    case chapterIndex.build: {
      const { index, local } = stepOf(p, projectOrder.length);
      const n = posOf(projectOrder[index]);
      return { pos: add(n, [0.5 - local, 0.7, portrait ? 8.5 : 6.2]), look: add(n, portrait ? [0, -3, 0] : frame), fov }; // phones: artifact high, words and demo below
    }
    case chapterIndex.learn: {
      const a = 0.25 - p * 0.5;
      return { pos: [Math.sin(a) * 30, 20, Math.cos(a) * 30], look: portrait ? [0, 3, 0] : [-7, -2, 0], fov, orbit: true };
    }
    case chapterIndex.lead:
      return { pos: add(voiceCentre, [-1 + p * 2, 2.5, portrait ? 20 : 15]), look: add(voiceCentre, portrait ? [0, -2.5, 0] : [3.5, 0, 0]), fov };
    case chapterIndex.converge: {
      const { index, local } = stepOf(p, achievementOrder.length);
      const n = posOf(achievementOrder[index]);
      return { pos: add(n, [0, 0.6, (portrait ? 10 : 8) - local * 1.5]), look: add(n, frame), fov };
    }
    default: {
      // Pull back until everything visited is in frame at once.
      const e = smooth(0, 0.7, p);
      return { pos: [0, 4 + e * 6, 24 + e * (portrait ? 40 : 24)], look: [0, 0.5, 0], fov };
    }
  }
}
