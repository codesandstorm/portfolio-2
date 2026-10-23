/**
 * Posts added through /admin after the site was built. Each one is a LinkedIn
 * post she published: it appears under Latest, and — depending on its kind —
 * also joins Achievements, Participation or Certifications, and links itself
 * to the skills and projects it shows. Shared by the server and the browser.
 */
import { create } from "zustand";
import type { LinkedInSignal } from "./types";

export type LiveKind = "update" | "achievement" | "participation" | "certification";

export type LivePost = {
  /** "live-…", so it never collides with the curated `sig-…` ids. */
  id: string;
  url: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  summary: string;
  quote?: string;
  kind: LiveKind;
  /** For an achievement: the headline result ("3rd place"), what it was, one line of detail. */
  achievement?: { result: string; title: string; detail: string };
  /** For participation: what she did there, in a few words. */
  role?: string;
  /** For a certification. */
  certification?: { name: string; issuer: string };
  /** Ids of skills already on the site. */
  skills: string[];
  /** Skills the post shows that the site does not list yet — added to Skills as they come. */
  newSkills: string[];
  /** Ids of projects already on the site. */
  projects: string[];
  createdAt: string;
};

export const LIVE_PREFIX = "live-";
export const isLive = (id: string) => id.startsWith(LIVE_PREFIX);

/** A live post in the shape the reader and panels already understand. */
export function asSignal(p: LivePost): LinkedInSignal {
  return { id: p.id, post: 0, date: p.date, title: p.title, summary: p.summary, quote: p.quote, skills: p.skills, projects: p.projects, sourceUrl: p.url };
}

/** "2026-10-14" → "Oct 2026", matching how curated dates are written. */
export function monthYear(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

/** The posts the page was rendered with, newest first. */
export const useLive = create<{ posts: LivePost[]; set: (posts: LivePost[]) => void }>((set) => ({
  posts: [],
  set: (posts) => set({ posts: [...posts].sort((a, b) => b.date.localeCompare(a.date)) }),
}));

export function getLive(id: string) {
  return useLive.getState().posts.find((p) => p.id === id) ?? null;
}
