/**
 * Turns the content model into one undirected relationship graph.
 * The 3D world, the panels and the accessible lists all read from here.
 */
import {
  achievements,
  experiences,
  headlineSkills,
  people,
  profile,
  projects,
  signals,
  skills,
} from "./data";
import type {
  Achievement,
  Confidence,
  Experience,
  GraphEdge,
  GraphNode,
  LinkedInSignal,
  NodeKind,
  Person,
  Project,
  Skill,
} from "./types";

export const CORE_ID = "core";

type Entity = Experience | Project | Skill | Person | LinkedInSignal | Achievement;

const nodeList: GraphNode[] = [
  { id: CORE_ID, kind: "core", label: profile.name },
  ...experiences.map((e) => ({ id: e.id, kind: "experience" as const, label: e.organization, sublabel: e.role })),
  ...projects.map((p) => ({ id: p.id, kind: "project" as const, label: p.name, sublabel: p.tagline })),
  ...skills.map((s) => ({ id: s.id, kind: "skill" as const, label: s.name, sublabel: s.family === "human" ? "human" : "built" })),
  ...people.map((p) => ({ id: p.id, kind: "person" as const, label: p.name, sublabel: p.context })),
  ...signals.map((s) => ({ id: s.id, kind: "signal" as const, label: s.title, sublabel: formatDate(s.date) })),
  ...achievements.map((a) => ({ id: a.id, kind: "achievement" as const, label: a.title, sublabel: a.result })),
];

const entityById = new Map<string, Entity>();
for (const list of [experiences, projects, skills, people, signals, achievements] as Entity[][]) {
  for (const e of list) entityById.set(e.id, e);
}

const edgeMap = new Map<string, GraphEdge>();
function link(a: string | undefined, b: string | undefined, confidence: Confidence = "verified") {
  if (!a || !b || a === b) return;
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  const existing = edgeMap.get(key);
  // A verified source wins over an inferred one for the same pair.
  if (existing && (existing.confidence === "verified" || confidence === "inferred")) return;
  edgeMap.set(key, { a, b, confidence });
}
const linkAll = (a: string, ids: readonly string[] | undefined) => ids?.forEach((b) => link(a, b));

for (const e of experiences) {
  link(CORE_ID, e.id);
  linkAll(e.id, e.skills);
  linkAll(e.id, e.people);
  linkAll(e.id, e.signals);
}
for (const id of headlineSkills) link(CORE_ID, id);
for (const p of projects) {
  linkAll(p.id, p.skills);
  linkAll(p.id, p.people);
  linkAll(p.id, p.signals);
  link(p.id, p.experience, p.experienceConfidence ?? "verified");
}
for (const s of signals) {
  linkAll(s.id, s.experiences);
  linkAll(s.id, s.projects);
  linkAll(s.id, s.skills);
  linkAll(s.id, s.people);
  linkAll(s.id, s.achievements);
  // Certifications with no wider story still belong to her.
  const related = [s.experiences, s.projects, s.skills, s.people, s.achievements].some((l) => l?.length);
  if (!related) link(CORE_ID, s.id);
}
for (const a of achievements) {
  linkAll(a.id, a.experiences);
  linkAll(a.id, a.projects);
  linkAll(a.id, a.skills);
  linkAll(a.id, a.signals);
}

export const nodes: readonly GraphNode[] = nodeList;
export const edges: readonly GraphEdge[] = [...edgeMap.values()];

const nodeById = new Map(nodeList.map((n) => [n.id, n]));
const adjacency = new Map<string, Set<string>>();
for (const n of nodeList) adjacency.set(n.id, new Set());
for (const e of edges) {
  adjacency.get(e.a)?.add(e.b);
  adjacency.get(e.b)?.add(e.a);
}

export function getNode(id: string): GraphNode | undefined {
  return nodeById.get(id);
}

export function getEntity<T extends Entity = Entity>(id: string): T | undefined {
  return entityById.get(id) as T | undefined;
}

export function getNeighbors(id: string, kind?: NodeKind): string[] {
  const out = [...(adjacency.get(id) ?? [])];
  return kind ? out.filter((n) => nodeById.get(n)?.kind === kind) : out;
}

/** Ids of everything one hop from `id`, plus `id` itself. */
export function getRelatedNodes(id: string): Set<string> {
  const set = new Set(adjacency.get(id) ?? []);
  set.add(id);
  return set;
}

export function getEdgeConfidence(a: string, b: string): Confidence | undefined {
  return edgeMap.get(a < b ? `${a}|${b}` : `${b}|${a}`)?.confidence;
}

const byKind = <T extends Entity>(ids: string[]) => ids.map((i) => entityById.get(i) as T).filter(Boolean);

export const getProjectsForSkill = (skillId: string) => byKind<Project>(getNeighbors(skillId, "project"));
export const getExperiencesForSkill = (skillId: string) => byKind<Experience>(getNeighbors(skillId, "experience"));
export const getSignalsForSkill = (skillId: string) => byKind<LinkedInSignal>(getNeighbors(skillId, "signal"));
export const getSkillsForProject = (projectId: string) => byKind<Skill>(getNeighbors(projectId, "skill"));
export const getSkillsForExperience = (expId: string) => byKind<Skill>(getNeighbors(expId, "skill"));
export const getPostsForExperience = (expId: string) => byKind<LinkedInSignal>(getNeighbors(expId, "signal"));
export const getProjectsForExperience = (expId: string) => byKind<Project>(getNeighbors(expId, "project"));
export const getSignalsForPerson = (personId: string) => byKind<LinkedInSignal>(getNeighbors(personId, "signal"));

export function getAchievementsForExperience(expId: string): Achievement[] {
  // Direct links, plus achievements reached through the experience's projects.
  const ids = new Set(getNeighbors(expId, "achievement"));
  for (const p of getNeighbors(expId, "project")) getNeighbors(p, "achievement").forEach((a) => ids.add(a));
  for (const s of getNeighbors(expId, "signal")) getNeighbors(s, "achievement").forEach((a) => ids.add(a));
  return byKind<Achievement>([...ids]);
}

/** Skills that share a project or experience with this skill. */
export function getRelatedSkills(skillId: string, limit = 6): Skill[] {
  const counts = new Map<string, number>();
  for (const host of [...getNeighbors(skillId, "project"), ...getNeighbors(skillId, "experience")]) {
    for (const s of getNeighbors(host, "skill")) if (s !== skillId) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => entityById.get(id) as Skill);
}

export function isHeadlineSkill(id: string) {
  return headlineSkills.includes(id);
}

/** People named in more than one story — the bridges in her network. */
export function getBridgePeople(): Person[] {
  return people.filter((p) => {
    const hosts = new Set([...getNeighbors(p.id, "experience"), ...getNeighbors(p.id, "project")]);
    return hosts.size > 1;
  });
}

export function signalUrl(s: LinkedInSignal): { href: string; exact: boolean } {
  return s.sourceUrl ? { href: s.sourceUrl, exact: true } : { href: profile.links.linkedinActivity, exact: false };
}

export function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export const stats = {
  people: people.length,
  postsNamingPeople: signals.filter((s) => (s.people?.length ?? 0) > 0).length,
  signals: signals.length,
  projects: projects.length,
  skills: skills.length,
  edges: edges.length,
};
