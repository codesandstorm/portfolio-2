/**
 * Camera shots as a function of story time. The rig damps toward these, so a
 * jump between chapters becomes a flight rather than a cut.
 */
import { chapterIndex } from "@/lib/chapters";
import { introAmounts } from "@/lib/intro";
import { STICKY, smooth, world } from "@/lib/world";
import { achievementOrder, centroid, experienceOrder, projectOrder, type Vec3 } from "./layout";

export type Shot = { pos: Vec3; look: Vec3; fov: number; orbit?: boolean };

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const voiceCentre = centroid(["x-ieee", "x-acm", "x-suas"]);
const projectsCentre = centroid(projectOrder);
const experienceCentre = centroid(experienceOrder);
const achievementsCentre = centroid(achievementOrder);

export function shotAt(t: number, aspect: number): Shot {
  const i = Math.min(chapterIndex.continue, Math.floor(t));
  const p = Math.min(1, (t - i) / STICKY);
  const portrait = aspect < 0.9;
  const fov = portrait ? 62 : 50;

  switch (i) {
    case chapterIndex.signal: {
      // Almost still: the slowest push toward her as she emerges from the smoke.
      const a = introAmounts(world.intro);
      return { pos: [0, 0, 46 - a.portrait * 1.5], look: [0, 0, 0], fov };
    }
    case chapterIndex.akshita:
      // Her portrait sits left of centre; the right half belongs to the words.
      return { pos: [0, 0.2, portrait ? 12 : 9.5], look: portrait ? [0, -1.2, 0] : [3.2, 0.1, 0], fov };
    case chapterIndex.collaborate:
      // The places she has worked, all in view behind the timeline.
      return { pos: add(experienceCentre, [-2 + p * 4, 2.5, portrait ? 30 : 22]), look: experienceCentre, fov };
    case chapterIndex.build: {
      // The whole cluster of projects at once, drifting slowly while the grid is read.
      return { pos: add(projectsCentre, [-2 + p * 4, 3, portrait ? 30 : 22]), look: projectsCentre, fov };
    }
    case chapterIndex.learn: {
      const a = 0.25 - p * 0.5;
      return { pos: [Math.sin(a) * 30, 20, Math.cos(a) * 30], look: portrait ? [0, 3, 0] : [-7, -2, 0], fov, orbit: true };
    }
    case chapterIndex.lead:
      return { pos: add(voiceCentre, [-1 + p * 2, 2.5, portrait ? 20 : 15]), look: add(voiceCentre, portrait ? [0, -2.5, 0] : [3.5, 0, 0]), fov };
    case chapterIndex.converge:
      // Where her paths met, all at once.
      return { pos: add(achievementsCentre, [2 - p * 4, 4, portrait ? 30 : 24]), look: achievementsCentre, fov };
    default: {
      // Pull back until everything visited is in frame at once.
      const e = smooth(0, 0.7, p);
      return { pos: [0, 4 + e * 6, 24 + e * (portrait ? 40 : 24)], look: [0, 0.5, 0], fov };
    }
  }
}
