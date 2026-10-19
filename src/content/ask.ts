/**
 * "Ask the constellation": a deterministic, grounded answerer. It never
 * generates claims — it matches a question to her verified data and composes a
 * short spoken answer from it, plus where the world should take the visitor.
 * Questions it can't ground get an honest "I don't know that" instead.
 */
import type { ChapterId } from "@/lib/chapters";
import { experiences, people, profile, projects, skills } from "./data";
import { getExperiencesForSkill, getProjectsForSkill, getSkillsForProject, joinWords, summarizePeople } from "./graph";

export type Answer = {
  /** On-screen answer. */
  text: string;
  /** Spoken version when pronunciation needs help. */
  say?: string;
  /** Node to light up and open. */
  focus?: string;
  /** Chapter to travel to. */
  chapter?: ChapterId;
  /** True when the question could not be grounded in her data. */
  unknown?: boolean;
};

export const ASK_DISCLOSURE =
  "AI guide — it answers only from Akshita's verified LinkedIn and GitHub, and the voice is AI-generated, not hers.";

export const SUGGESTIONS = [
  "Where has she used React?",
  "Tell me about her internships",
  "What has she won?",
  "Show me her leadership",
  "What is PRAHARI?",
  "How do I contact her?",
];

const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9+#./ ]+/g, " ").replace(/\s+/g, " ").trim()} `;
const has = (q: string, ...words: string[]) => words.some((w) => q.includes(` ${w} `) || (w.includes(" ") && q.includes(w)));

/** Spoken forms for acronyms the narrator would otherwise mangle. */
const speak = (t: string) =>
  t
    .replace(/\bHRMS\b/g, "H R M S")
    .replace(/\bIIT\b/g, "I I T")
    .replace(/\bi-SOFTZONE\b/g, "i SOFTZONE")
    .replace(/\bIEEE\b/g, "I triple E")
    .replace(/\bACM-W\b/g, "A C M W")
    .replace(/\bAI\b/g, "A I")
    .replace(/\bPrakritiOS\b/g, "Prakriti O S")
    .replace(/\bPRAHARI\b/g, "Prahari")
    .replace(/\bJWT\b/g, "J W T");

const SKILL_ALIASES: Record<string, string[]> = {
  "s-react": ["react", "reactjs", "react.js", "frontend", "front end"],
  "s-typescript": ["typescript", "ts"],
  "s-javascript": ["javascript", "js"],
  "s-node": ["node", "nodejs", "node.js", "backend", "back end"],
  "s-express": ["express", "expressjs"],
  "s-postgresql": ["postgres", "postgresql", "sql"],
  "s-mongodb": ["mongo", "mongodb", "nosql"],
  "s-prisma": ["prisma", "orm"],
  "s-rest": ["rest", "api", "apis"],
  "s-auth": ["jwt", "auth", "authentication"],
  "s-deploy": ["deploy", "deployment", "vercel", "render"],
  "s-fullstack": ["full stack", "fullstack", "full-stack", "mern", "pern"],
  "s-uiux": ["ui", "ux", "design"],
  "s-aiml": ["ai", "ml", "machine learning", "artificial intelligence"],
  "s-java": ["java"],
  "s-dsa": ["dsa", "data structures", "algorithms"],
  "s-cpp": ["c++", "cpp"],
  "s-python": ["python"],
  "s-git": ["git", "github", "code review"],
  "s-agile": ["agile", "scrum"],
  "s-communication": ["communication", "communicate"],
  "s-speaking": ["public speaking", "speaker", "speaking", "anchor", "anchoring", "stage"],
  "s-pr": ["public relations", "pr"],
  "s-events": ["event", "events", "event management", "organise", "organize"],
  "s-networking": ["networking", "network"],
  "s-teaching": ["teaching", "teach", "outreach", "rural"],
  "s-teamwork": ["teamwork", "team player", "collaboration"],
  "s-research": ["research"],
};

const PROJECT_ALIASES: Record<string, string[]> = {
  "p-hrms": ["hrms", "hr system", "employee management", "flagship", "payroll"],
  "p-breastcare": ["breastcare", "breast care", "breast cancer", "cancer", "healthcare", "medical"],
  "p-banquet": ["banquet", "eventhub", "event hub", "booking"],
  "p-foodhub": ["foodhub", "food hub", "food", "ordering"],
  "p-prahari": ["prahari", "paimana", "mospi", "early warning", "infrastructure"],
  "p-prakriti": ["prakriti", "prakritios", "mitti khata", "green tech", "nature"],
  "p-fitness": ["fitness", "posture", "sih internal"],
};

const EXPERIENCE_ALIASES: Record<string, string[]> = {
  "x-iit": ["iit", "iit indore", "drishti"],
  "x-isoftzone": ["isoftzone", "i softzone", "softzone"],
  "x-acm": ["acm", "acm w", "vice chair", "membership"],
  "x-ieee": ["ieee", "wie", "slc", "leadership congress"],
  "x-suas": ["symbiosis", "suas", "college", "university", "degree", "study", "studies", "studying", "education", "btech", "b tech"],
};

function skillAnswer(id: string): Answer {
  const s = skills.find((x) => x.id === id)!;
  const ps = getProjectsForSkill(id).map((p) => p.name);
  const xs = getExperiencesForSkill(id).map((e) => e.organization);
  const parts = [];
  if (ps.length) parts.push(`in ${joinWords(ps)}`);
  if (xs.length) parts.push(`${ps.length ? "and " : ""}at ${joinWords(xs)}`);
  const text = parts.length
    ? `She has used ${s.name} ${parts.join(ps.length && xs.length ? ", " : " ")}.${s.note ? ` ${s.note}` : ""}`
    : `${s.name} is on her profile${s.note ? ` — ${s.note}` : "."}`;
  return { text, say: speak(text), focus: id, chapter: "learn" };
}

function projectAnswer(id: string): Answer {
  const p = projects.find((x) => x.id === id)!;
  const sk = getSkillsForProject(id).slice(0, 4).map((s) => s.name);
  const text = `${p.name}: ${p.tagline} ${p.role}.${p.after ? ` ${p.after}` : ""}${sk.length ? ` It drew on ${joinWords(sk)}.` : ""}`;
  return { text, say: speak(text), focus: id, chapter: "build" };
}

function experienceAnswer(id: string): Answer {
  const e = experiences.find((x) => x.id === id)!;
  const text = `${e.organization}, ${e.period}: ${e.role}. ${e.work.slice(0, 2).join(". ")}.`;
  return { text, say: speak(text), focus: id, chapter: id === "x-suas" ? "akshita" : "collaborate" };
}

function findAlias(q: string, table: Record<string, string[]>) {
  let best: { id: string; len: number } | null = null;
  for (const [id, words] of Object.entries(table))
    for (const w of words) if (has(q, w) && (!best || w.length > best.len)) best = { id, len: w.length };
  return best?.id ?? null;
}

export function answer(question: string): Answer {
  const q = norm(question);
  const say = (text: string, rest: Omit<Answer, "text" | "say"> = {}): Answer => ({ text, say: speak(text), ...rest });

  if (q.trim().length < 2) return say("Ask me anything about Akshita's work — her projects, skills, internships or how to reach her.", { unknown: true });

  // Contact first: "how do I reach her" should never turn into a skill answer.
  if (has(q, "contact", "reach", "hire", "email", "mail", "linkedin", "connect with", "get in touch", "message"))
    return say("The best way to reach her is LinkedIn — the Connect button at the top. Her code is on GitHub. She hasn't listed a public email.", { chapter: "continue" });
  if (has(q, "resume", "cv", "one page", "one-page", "pdf", "printable"))
    return say("There's a one-page summary built from the same verified data — the One-page summary link at the end of the site — and you can print it or save it as a PDF.", { chapter: "continue" });
  if (has(q, "github", "code", "repo", "repos", "repository"))
    return say("Her public code is on GitHub: the HRMS, BreastCare AI and FoodHub repositories. Each project chapter links straight to its source.", { chapter: "build" });

  if (has(q, "won", "win", "wins", "award", "awards", "prize", "prizes", "achievement", "achievements", "hackathon", "hackathons", "results"))
    return say(
      "Third prize at Tech Kutumb 5.0 with Team PRAHARI, and a place in the next round of SIH. Third place for PrakritiOS on the team's second attempt. Four internship offers in fifteen days. And she coordinated the first ISRO exhibition in Madhya Pradesh.",
      { focus: "a-techkutumb", chapter: "converge" },
    );

  const project = findAlias(q, PROJECT_ALIASES);
  if (project) return projectAnswer(project);

  if (has(q, "internship", "internships", "intern", "experience", "work experience", "worked", "jobs", "job"))
    return say(
      "Two internships as a full-stack engineer: i-SOFTZONE in June and July 2026, where she built and deployed an HRMS, and IIT Indore in July and August 2026, on an AI platform for breast cancer detection.",
      { focus: "x-iit", chapter: "collaborate" },
    );

  const exp = findAlias(q, EXPERIENCE_ALIASES);
  if (exp) return experienceAnswer(exp);

  if (has(q, "lead", "leader", "leadership", "voice", "speaker", "speak", "anchor", "community"))
    return say(
      "She was Membership Development Vice Chair of SUAS ACM-W, coordinated the first ISRO exhibition in Madhya Pradesh, anchored the 36-hour Symbiosis Skill Hackathon, taught technology in rural schools, and represented her university at the IEEE Student Leadership Congress.",
      { focus: "s-leadership", chapter: "lead" },
    );

  const skill = findAlias(q, SKILL_ALIASES);
  if (skill) return skillAnswer(skill);

  if (has(q, "skills", "skill", "stack", "tech", "technologies", "languages", "good at", "know"))
    return say(
      "She builds full-stack with React, TypeScript, Node, Express, PostgreSQL and MongoDB, and lists Java, data structures and C++. Her strongest human skills: communication, public speaking, event management and networking.",
      { chapter: "learn" },
    );

  if (has(q, "people", "mentor", "mentors", "team", "teammates", "colleagues", "who did she work with"))
    return say(`She has credited ${people.length} people by name across her posts — ${summarizePeople(people.map((p) => p.id))}. Out of respect for them, this site shows their roles, not their names.`, { chapter: "connect" });

  if (has(q, "where", "location", "based", "city", "live", "lives"))
    return say(`She's based in ${profile.location}.`, { chapter: "akshita" });

  if (has(q, "open to", "looking for", "available", "role", "roles", "opportunity", "opportunities"))
    return say(`She's open to ${profile.openTo}, with a particular interest in ${profile.interest.toLowerCase()}.`, { chapter: "continue" });

  if (has(q, "who", "about", "herself", "introduce", "tell me", "summary", "akshita"))
    return say(
      "Akshita Mahajan is a full-stack engineer and public speaker from Indore, studying computer science at Symbiosis University of Applied Sciences. She has interned at IIT Indore and i-SOFTZONE, and placed third at two hackathons.",
      { focus: "core", chapter: "akshita" },
    );

  return say(
    "I only answer from what's verified on her LinkedIn and GitHub, and I don't have that. Try asking about her projects, skills, internships, hackathons or how to reach her.",
    { unknown: true },
  );
}
