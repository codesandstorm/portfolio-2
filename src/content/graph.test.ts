import { describe, expect, it } from "vitest";
import { achievements, experiences, people, profile, projects, signals, skills } from "./data";
import {
  edges,
  getAchievementsForExperience,
  getAchievementsForSkill,
  getBridgePeople,
  getNeighbors,
  getNode,
  getPostsForExperience,
  getProjectsForSkill,
  getRelatedNodes,
  getSkillsForExperience,
  getSkillsForProject,
  nodes,
  signalUrl,
} from "./graph";

describe("content integrity", () => {
  it("has unique ids", () => {
    const ids = nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only references ids that exist", () => {
    for (const e of edges) {
      expect(getNode(e.a), e.a).toBeDefined();
      expect(getNode(e.b), e.b).toBeDefined();
    }
    const refs = [
      ...experiences.flatMap((e) => [...e.skills, ...(e.projects ?? []), ...(e.people ?? []), ...(e.signals ?? [])]),
      ...projects.flatMap((p) => [...p.skills, ...(p.people ?? []), ...(p.signals ?? []), ...(p.experience ? [p.experience] : [])]),
      ...signals.flatMap((s) => [...(s.experiences ?? []), ...(s.projects ?? []), ...(s.skills ?? []), ...(s.people ?? []), ...(s.achievements ?? [])]),
      ...achievements.flatMap((a) => [...(a.experiences ?? []), ...(a.projects ?? []), ...(a.skills ?? []), ...a.signals]),
    ];
    for (const r of refs) expect(getNode(r), r).toBeDefined();
  });

  it("leaves no node disconnected", () => {
    for (const n of nodes) expect(getNeighbors(n.id).length, n.id).toBeGreaterThan(0);
  });

  it("gives every skill, project, person and experience a source", () => {
    for (const e of [...skills, ...projects, ...people, ...experiences]) expect(e.sources.length, e.id).toBeGreaterThan(0);
  });

  it("covers all 21 LinkedIn activity items in order", () => {
    expect(signals.map((s) => s.post)).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
  });

  it("keeps the verified results exactly as researched", () => {
    const r = Object.fromEntries(achievements.map((a) => [a.id, a.result]));
    expect(r["a-techkutumb"]).toBe("3rd prize");
    expect(r["a-prakriti"]).toBe("3rd place");
    expect(signals.find((s) => s.post === 5)?.summary).toMatch(/Not in the top 3/);
    expect(experiences.find((e) => e.id === "x-iit")?.period).toBe("Jul – Aug 2026");
    expect(experiences.find((e) => e.id === "x-isoftzone")?.period).toBe("Jun – Jul 2026");
  });

  it("shows the people she credits as roles, never by name", () => {
    for (const p of people) expect(p.name, p.id).toMatch(/ · /);
    const blob = JSON.stringify({ people, signals, experiences, projects });
    for (const name of ["Saikat", "Sandarbh", "Bhasin", "Subhash", "Marathe", "Shrivash"]) expect(blob).not.toContain(name);
  });

  it("does not credit HR-Enterprise- or expose private contact data", () => {
    // The one address she chose to publish is allowed; no other email may appear.
    const blob = JSON.stringify({ profile: { ...profile, email: "" }, projects, signals, experiences });
    expect(blob).not.toMatch(/HR-Enterprise/);
    expect(blob).not.toMatch(/@[a-z0-9-]+\.(com|in|org)/i);
    expect(profile.email).toBe("mahajanakshita03@gmail.com");
  });
});

describe("relationship queries", () => {
  it("answers: which projects used React?", () => {
    const ids = getProjectsForSkill("s-react").map((p) => p.id).sort();
    expect(ids).toEqual(["p-breastcare", "p-foodhub", "p-hrms"]);
  });

  it("answers: which skills did the HRMS use? (reverse)", () => {
    const ids = getSkillsForProject("p-hrms").map((s) => s.id);
    expect(ids).toContain("s-react");
    expect(getProjectsForSkill("s-prisma").map((p) => p.id)).toEqual(["p-hrms"]);
  });

  it("answers: what did IIT Indore connect to?", () => {
    expect(getSkillsForExperience("x-iit").map((s) => s.id)).toContain("s-aiml");
    expect(getPostsForExperience("x-iit").map((s) => s.id)).toContain("sig-p8");
    expect(getAchievementsForExperience("x-iit").map((a) => a.id)).toContain("a-offers");
    expect(getRelatedNodes("x-iit").has("p-breastcare")).toBe(true);
  });

  it("answers: what did teamwork help make happen? (without overclaiming via experiences)", () => {
    const ids = getAchievementsForSkill("s-teamwork").map((a) => a.id).sort();
    expect(ids).toEqual(["a-prakriti", "a-techkutumb"]);
    expect(getAchievementsForSkill("s-react").map((a) => a.id)).toEqual([]);
  });

  it("finds people who bridge more than one story", () => {
    expect(getBridgePeople().map((p) => p.id)).toContain("pe-sbhasin");
  });

  it("falls back to the activity feed when a post url is missing", () => {
    const u = signalUrl(signals[0]);
    expect(u.exact).toBe(false);
    expect(u.href).toBe(profile.links.linkedinActivity);
  });
});
