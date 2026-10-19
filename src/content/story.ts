/**
 * Narrative copy. Each line is written from the dossier; the `source` fields
 * say where. Kept apart from data.ts so the graph stays purely factual.
 */
import { people } from "./data";

export const awakening = {
  line: "Every connection begins with a signal.",
  enter: "Enter the constellation",
};

/** Words in depth during the flight — each carries the fact behind it. */
export const fragments = [
  { word: "Ideas", note: "PrakritiOS · a digital identity for Nature" },
  { word: "People", note: `${people.length} named across her posts` },
  { word: "Technology", note: "PERN · MERN · TypeScript" },
  { word: "Communication", note: "Anchor · a 36-hour hackathon" },
  { word: "Curiosity", note: "Beginning research · SLC 2026" },
  { word: "Leadership", note: "Vice Chair · SUAS ACM-W" },
] as const;

/** LI-P13, "4 internships in 15 days". */
export const origin = [
  { kicker: "July 2026, looking back a year", text: "She was the quiet student in class," },
  { kicker: "", text: "still learning JavaScript." },
  { kicker: "Then", text: "She built projects. Applied every day. Took the rejections." },
  { kicker: "Then", text: "A first offer." },
  { kicker: "Then", text: "Four offers in fifteen days — one of them, IIT Indore." },
] as const;

/** Identity facets — each only with evidence. */
export const facets = [
  { word: "Builder", proof: "An enterprise HRMS with 33 data models, live on Vercel + Render.", focus: "p-hrms" },
  { word: "Connector", proof: "Nearly every post she writes ends by naming the people who helped.", focus: "s-networking" },
  { word: "Communicator", proof: "On stage as anchor for a 36-hour hackathon. ‘Public Speaker’ closes her headline.", focus: "s-speaking" },
  { word: "Leader", proof: "Membership Development Vice Chair, SUAS ACM-W. Represented SUAS at IEEE SLC 2026.", focus: "s-leadership" },
  { word: "Teacher", proof: "Took cybersecurity, STEM and AI to rural schools with IEEE CS SUAS.", focus: "s-teaching" },
  { word: "Learner", proof: "Lost at Green Tech. Came back with PrakritiOS and placed third.", focus: "p-prakriti" },
] as const;

/** Kinetic statements for "Lead" — her words, where the dossier quotes them. */
export const statements = [
  { words: ["Connect.", "Collaborate.", "Learn.", "Lead."], source: "Her sign-off, SLC 2026 (LI-P4)" },
  { words: ["We", "went", "there", "to", "teach", "technology."], tail: "We came back having learned…", source: "Rural school outreach (LI-P10)" },
  { words: ["Just", "another", "project", "→", "Ours."], source: "Her IIT Indore journey (LI-P8)" },
] as const;

export const finale = {
  line: "The next connection hasn’t been made yet.",
  advice: "Just start.",
  adviceSource: "Her advice to anyone still in the quiet seat (LI-P13)",
};
