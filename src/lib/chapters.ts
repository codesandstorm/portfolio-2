export type ChapterId =
  | "signal"
  | "akshita"
  | "connect"
  | "collaborate"
  | "build"
  | "learn"
  | "lead"
  | "converge"
  | "continue";

export type Chapter = {
  id: ChapterId;
  n: string;
  title: string;
  /** What the chapter is underneath the metaphor (for screen readers / index). */
  plain: string;
  /** Section height in viewport heights: [desktop, mobile]. */
  vh: [number, number];
};

/**
 * The order a visitor reads her in: who she is, where she has worked, what she
 * has built, what she can do, what she has won, what she is posting now, and
 * how to reach her. Titles are plain words so nobody has to decode a metaphor.
 */
export const chapters: Chapter[] = [
  { id: "signal", n: "00", title: "Home", plain: "Introduction", vh: [100, 100] },
  { id: "akshita", n: "01", title: "About", plain: "About her", vh: [280, 220] },
  { id: "collaborate", n: "02", title: "Experience", plain: "Where she has worked", vh: [560, 480] },
  { id: "build", n: "03", title: "Projects", plain: "What she has built", vh: [620, 520] },
  { id: "learn", n: "04", title: "Skills", plain: "Skills and where she used them", vh: [240, 200] },
  { id: "converge", n: "05", title: "Achievements", plain: "Achievements & participation", vh: [460, 380] },
  { id: "lead", n: "06", title: "Latest", plain: "Latest from LinkedIn", vh: [420, 340] },
  { id: "connect", n: "07", title: "Network", plain: "The people she credits", vh: [240, 200] },
  { id: "continue", n: "08", title: "Connect", plain: "Connect with her", vh: [220, 180] },
];

export const chapterIndex = Object.fromEntries(chapters.map((c, i) => [c.id, i])) as Record<ChapterId, number>;
