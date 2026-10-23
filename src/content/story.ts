/**
 * Narrative copy. Each line is written from the dossier; the `source` fields
 * say where. Kept apart from data.ts so the graph stays purely factual.
 */
import { people } from "./data";

/**
 * Fire × Ice opening. Fire is the side of her that speaks and acts; ice the
 * side that reasons and builds. Both are evidenced in her headline, which
 * names her a MERN-stack developer and closes on "Public Speaker".
 */
export const landing = {
  /** The line under her name — her own choice of words (CSIT undergraduate, MERN/PERN builder). */
  roles: ["CSIT student", "Full-stack developer", "Project builder"],
  explore: "Explore my work",
  tour: "or take the guided tour",
} as const;

/** Words in depth during the flight — each carries the fact behind it. */
export const fragments = [
  { word: "Ideas", note: "PrakritiOS · a digital identity for Nature" },
  { word: "People", note: `${people.length} named across her posts` },
  { word: "Technology", note: "PERN · MERN · TypeScript" },
  { word: "Communication", note: "Anchor · a 36-hour hackathon" },
  { word: "Curiosity", note: "Beginning research · SLC 2026" },
  { word: "Leadership", note: "Vice Chair · SUAS ACM-W" },
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

export const finale = {
  thesis: "Two forces became one person. One person became a network.",
  line: "The next connection hasn’t been made yet.",
  advice: "Just start.",
  adviceSource: "Her advice to anyone still in the quiet seat (LI-P13)",
};
