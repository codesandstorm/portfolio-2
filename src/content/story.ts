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
 * About her, in prose. Every sentence is a fact from data.ts or her posts
 * (LI-P8, P12, P13, P14, P16, P19, P20, P10) — qualities are shown through
 * what she did, not claimed.
 */
export const about = {
  line: "Full-stack developer · Public speaker · Indore",
  paragraphs: [
    "Akshita is a computer science (CSIT) student at Symbiosis University of Applied Sciences in Indore, and a full-stack developer who builds things people actually use. A year before her internship at IIT Indore she was the quiet student in class, still learning JavaScript. She built projects, applied every day and took the rejections — then four internship offers arrived in fifteen days.",
    "She works across the whole stack: React and TypeScript on the front end, Node.js, Express, PostgreSQL and MongoDB behind it, with Prisma, REST APIs and JWT auth in between — and she ships. Her enterprise HRMS, with 33 data models, runs live on Vercel and Render. At IIT Indore she built the role-based dashboards of an AI platform for breast cancer detection, validated with a radiation oncologist at AIIMS Bhopal; digital healthcare is where she wants to go next.",
    "She is as at home on a stage as in an editor. She anchored a 36-hour hackathon, coordinated the first ISRO exhibition in Madhya Pradesh, served as Membership Development Vice Chair of SUAS ACM-W and taught cybersecurity, STEM and AI in rural schools with IEEE. She credits the people she works with, by name, and she does not quit: PrakritiOS lost its first hackathon, came back refined, and placed third.",
  ],
} as const;

export const finale = {
  thesis: "Two forces became one person. One person became a network.",
  line: "The next connection hasn’t been made yet.",
  advice: "Just start.",
  adviceSource: "Her advice to anyone still in the quiet seat (LI-P13)",
};
