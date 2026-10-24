/**
 * Narrative copy. Each line is written from the dossier; the `source` fields
 * say where. Kept apart from data.ts so the graph stays purely factual.
 */

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

/**
 * About her: two paragraphs and the plain facts. Every sentence is a fact
 * from data.ts or her posts (LI-P8, P13, P14) — qualities are shown through
 * what she did, not claimed.
 */
export const about = {
  line: "Full-stack developer · Public speaker · Indore",
  paragraphs: [
    "A CSIT student at Symbiosis University of Applied Sciences and a full-stack developer who builds things people use. A year before IIT Indore she was still learning JavaScript — then four internship offers arrived in fifteen days.",
    "She works across the stack — React and TypeScript, Node.js, Express, PostgreSQL and MongoDB — and ships: her enterprise HRMS runs live with 33 data models. At IIT Indore she built the dashboards of an AI platform for breast cancer detection; digital healthcare is where she is headed.",
  ],
  /** The plain facts, as four cards under the prose. */
  facts: [
    { label: "Studying", title: "B.Tech Computer Science (CSIT)", detail: "Symbiosis University of Applied Sciences, Indore · 2025 – 2029" },
    { label: "Interned at", title: "IIT Indore · i-SOFTZONE", detail: "Full Stack Engineer intern · Jun – Aug 2026" },
    { label: "Communities", title: "IEEE · IEEE WIE · SUAS ACM-W", detail: "Member and Membership Development Vice Chair" },
    { label: "Open to", title: "Full Stack Engineer roles", detail: "With an interest in digital healthcare" },
  ],
} as const;

export const finale = {
  thesis: "Two forces became one person. One person became a network.",
  line: "The next connection hasn’t been made yet.",
  advice: "Just start.",
  adviceSource: "Her advice to anyone still in the quiet seat (LI-P13)",
};
