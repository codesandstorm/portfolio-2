export type ChapterId =
  | "signal"
  | "start"
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

export const chapters: Chapter[] = [
  { id: "signal", n: "00", title: "Signal", plain: "Introduction", vh: [100, 100] },
  { id: "start", n: "01", title: "Just start", plain: "Origin story", vh: [320, 240] },
  { id: "akshita", n: "02", title: "Akshita", plain: "About her", vh: [280, 220] },
  { id: "connect", n: "03", title: "Connect", plain: "The people she names", vh: [240, 200] },
  { id: "collaborate", n: "04", title: "Collaborate", plain: "Experience", vh: [560, 480] },
  { id: "build", n: "05", title: "Build", plain: "Projects", vh: [620, 520] },
  { id: "learn", n: "06", title: "Learn", plain: "Skills and evidence", vh: [240, 200] },
  { id: "lead", n: "07", title: "Lead", plain: "Voice, leadership and LinkedIn", vh: [420, 340] },
  { id: "converge", n: "08", title: "Converge", plain: "Achievements", vh: [460, 380] },
  { id: "continue", n: "09", title: "Continue", plain: "Connect with her", vh: [220, 180] },
];

export const chapterIndex = Object.fromEntries(chapters.map((c, i) => [c.id, i])) as Record<ChapterId, number>;
