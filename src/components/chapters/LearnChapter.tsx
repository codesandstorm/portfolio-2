"use client";

import {
  Briefcase, CheckCircle2, ChevronDown, ChevronRight, Code2, GraduationCap, Layers, Search, Sparkles, Users, type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { credentials, experiences, participation, projects, signals, skills } from "@/content/data";
import { getAchievementsForSkill, getExperiencesForSkill, getProjectsForSkill, getRelatedSkills, getSignalsForSkill } from "@/content/graph";
import { useLive } from "@/content/live";
import type { Skill } from "@/content/types";
import { sfx } from "@/audio/useSound";
import { useUI } from "@/lib/store";
import { SkillLogo, StackLogos } from "../ui/TechLogo";
import { Chapter, Kicker } from "./Chapter";
import { ProjectArt } from "./ProjectArt";

/** Her skills, grouped the way a recruiter scans them. */
const GROUPS: { title: string; ids: string[] }[] = [
  { title: "Frontend", ids: ["s-react", "s-typescript", "s-javascript", "s-uiux"] },
  { title: "Backend", ids: ["s-node", "s-express", "s-rest", "s-auth"] },
  { title: "Databases", ids: ["s-postgresql", "s-mongodb", "s-prisma"] },
  { title: "AI & machine learning", ids: ["s-aiml", "s-python"] },
  { title: "Languages & CS", ids: ["s-java", "s-cpp", "s-dsa"] },
  { title: "Tools & platforms", ids: ["s-git", "s-deploy", "s-agile", "s-fullstack"] },
  { title: "People & leadership", ids: skills.filter((s) => s.family === "human").map((s) => s.id) },
];
const groupOf = (id: string) => GROUPS.find((g) => g.ids.includes(id))?.title ?? "Skills";
const byId = (id: string) => skills.find((s) => s.id === id)!;

/** The four ways she grows a skill, each counted from her record. */
const PATHS: { title: string; note: string; icon: LucideIcon; count: number; warm: boolean }[] = [
  { title: "Build", note: "Through projects and hands-on coding", icon: Code2, count: projects.length, warm: false },
  { title: "Experience", note: "Through internships and real-world work", icon: Briefcase, count: experiences.filter((e) => e.kind === "internship").length, warm: true },
  { title: "Connect", note: "Through conferences, collaboration and leadership", icon: Users, count: participation.length, warm: false },
  { title: "Explore", note: "Through courses, certifications and research", icon: GraduationCap, count: credentials.length, warm: true },
];

function Stage({ n, title, note, items, tone }: { n: string; title: string; note: string; items: string[]; tone: "ice" | "fire" | "violet" }) {
  const c = { ice: ["#8fc3f5", "border-[#8fc3f5]/35", "bg-[#8fc3f5]/[0.06]"], fire: ["#ffb27a", "border-[#e58237]/40", "bg-[#e58237]/[0.07]"], violet: ["#b9a7ff", "border-[#9b8cff]/40", "bg-[#9b8cff]/[0.07]"] }[tone];
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-[15px] font-semibold" style={{ borderColor: c[0], color: c[0], boxShadow: `0 0 14px ${c[0]}66` }}>{n}</span>
        <span aria-hidden className="h-[2px] flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${c[0]}, transparent)` }} />
      </div>
      <p className="title-face mt-3 text-[0.78rem] uppercase tracking-[0.24em] text-ivory">{title}</p>
      <p className="mt-1 text-[13px] leading-snug text-mist">{note}</p>
      <ul className={`mt-3 flex-1 space-y-2 rounded-xl border p-3.5 ${c[1]} ${c[2]}`}>
        {items.length ? (
          items.slice(0, 5).map((it) => (
            <li key={it} className="flex gap-2 text-[13px] leading-snug text-ivory/85">
              <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0" style={{ color: c[0] }} />
              {it}
            </li>
          ))
        ) : (
          <li className="text-[13px] italic text-faint">Nothing on record here yet.</li>
        )}
      </ul>
    </div>
  );
}

/** 04 — Skills. Every skill has a story: where she learned it, where she applied it, and what it led to. */
export function LearnChapter() {
  const select = useUI((s) => s.select);
  const live = useLive((s) => s.posts);
  const [current, setCurrent] = useState("s-react");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({ Frontend: true, "People & leadership": true });

  const q = query.trim().toLowerCase();
  const skill: Skill = byId(current);
  const learned = getExperiencesForSkill(current);
  const applied = getProjectsForSkill(current);
  const proven = [...getAchievementsForSkill(current).map((a) => `${a.result} — ${a.title}`), ...getSignalsForSkill(current).map((s) => s.title), ...live.filter((p) => p.skills.includes(current)).map((p) => p.title)];
  const related = useMemo(() => {
    const mine = new Set(getProjectsForSkill(current).map((p) => p.id));
    return getRelatedSkills(current, 4).map((r) => ({ ...r, shared: getProjectsForSkill(r.id).filter((p) => mine.has(p.id)).length }));
  }, [current]);
  const fresh = [...new Set(live.flatMap((p) => p.newSkills))].filter((n) => !skills.some((s) => s.name.toLowerCase() === n.toLowerCase()));

  const pick = (id: string) => {
    sfx.shimmer();
    setCurrent(id);
  };

  return (
    <Chapter id="learn" free>
      <div className="mx-auto max-w-[84rem]">
        <div className="grid gap-8 xl:grid-cols-[1fr_1.35fr] xl:items-end">
          <div>
            <Kicker id="learn" />
            <h2 id="learn-title" className="display mt-5 text-[clamp(2.4rem,5vw,4.4rem)] leading-[1] text-ivory">
              Every skill has <span className="italic text-gold">a story.</span>
            </h2>
            <p className="mt-4 text-[15px] text-mist">Built through projects. Refined through experience. Proven through action.</p>
          </div>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PATHS.map((p, i) => (
              <li key={p.title} className={`relative rounded-xl border bg-[#07080a]/80 p-4 ${p.warm ? "border-[#e58237]/35 shadow-[0_0_30px_-14px_rgba(229,130,55,0.7)]" : "border-[#8fc3f5]/35 shadow-[0_0_30px_-14px_rgba(110,170,240,0.7)]"}`}>
                <span className="mono absolute right-3 top-3 text-faint">0{i + 1}</span>
                <p.icon aria-hidden strokeWidth={1.3} className={`h-8 w-8 ${p.warm ? "text-[#ffb27a]" : "text-[#8fc3f5]"}`} />
                <p className="title-face mt-3 text-[0.8rem] uppercase tracking-[0.2em] text-ivory">{p.title}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-mist">{p.note}</p>
                <p className="display mt-2 text-xl text-ivory/90">{p.count}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[17rem_1fr] xl:grid-cols-[17rem_1fr_18rem]">
          {/* Sidebar: search and every skill by group, with its logo */}
          <aside aria-label="All skills" className="rounded-2xl border border-hair bg-[#07080a]/85 p-3" data-lenis-prevent>
            <label className="flex items-center gap-2 rounded-lg border border-hair bg-[#0b0c10] px-3 py-2">
              <Search aria-hidden className="h-4 w-4 text-faint" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search skills…" className="w-full bg-transparent text-[13px] text-ivory outline-none placeholder:text-faint" aria-label="Search skills" />
            </label>
            <div className="mt-2 max-h-[34rem] overflow-y-auto pr-1">
              {GROUPS.map((g) => {
                const ids = g.ids.filter((id) => !q || byId(id).name.toLowerCase().includes(q));
                if (!ids.length) return null;
                const expanded = q ? true : !!open[g.title];
                return (
                  <section key={g.title} className="border-b border-hair last:border-0">
                    <button type="button" onClick={() => setOpen((o) => ({ ...o, [g.title]: !expanded }))} aria-expanded={expanded} className="flex w-full items-center justify-between px-2 py-2.5 text-left" data-cursor="link">
                      <span className="title-face text-[0.68rem] uppercase tracking-[0.2em] text-[#ffb27a]">
                        {g.title} <span className="text-faint">({ids.length})</span>
                      </span>
                      <ChevronDown aria-hidden className={`h-4 w-4 text-faint transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    {expanded && (
                      <ul className="pb-2">
                        {ids.map((id) => {
                          const on = id === current;
                          return (
                            <li key={id}>
                              <button
                                type="button"
                                onClick={() => pick(id)}
                                aria-pressed={on}
                                className={`flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left text-[13.5px] transition-colors ${on ? "border-[#e58237]/60 bg-[#e58237]/10 text-ivory" : "border-transparent text-ivory/80 hover:bg-white/[0.03] hover:text-ivory"}`}
                                data-cursor="link"
                              >
                                <span className="flex h-6 w-6 items-center justify-center"><SkillLogo id={id} size={17} /></span>
                                {byId(id).name}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })}
              {fresh.length > 0 && !q && (
                <section className="px-2 py-2.5">
                  <p className="title-face text-[0.68rem] uppercase tracking-[0.2em] text-[#ffb27a]">New from her posts</p>
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {fresh.map((n) => <span key={n} className="rounded-full border border-[#e58237]/40 px-2.5 py-1 text-[12px] text-ivory/80">{n}</span>)}
                  </p>
                </section>
              )}
            </div>
          </aside>

          {/* The selected skill's story */}
          <article aria-live="polite" aria-labelledby="skill-name" className="rounded-2xl border border-[#e58237]/25 bg-[#07080a]/85 p-5 shadow-[0_0_60px_-30px_rgba(229,130,55,0.8)] sm:p-7">
            <div className="flex flex-wrap items-start gap-5">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-hair bg-[#0b0c10] shadow-[inset_0_0_24px_rgba(110,170,240,0.12)]">
                <SkillLogo id={current} size={44} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="title-face text-[0.68rem] uppercase tracking-[0.24em] text-faint">{groupOf(current)}</p>
                <h3 id="skill-name" className="display mt-1 text-[clamp(2rem,3.6vw,3rem)] leading-none text-ivory">{skill.name}</h3>
                <p className="mt-2 text-[14px] text-mist">
                  {skill.note ?? `Practised in ${learned.length} place${learned.length === 1 ? "" : "s"}, used in ${applied.length} project${applied.length === 1 ? "" : "s"}.`}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-hair px-3 py-1.5 text-[12.5px] text-ivory/85">
                <span aria-hidden className="h-2 w-2 rounded-full bg-[#5fd38a] shadow-[0_0_8px_#5fd38a]" />
                Used in {applied.length} project{applied.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-3">
              <Stage n="01" title="Learned" note="Where she picked it up and practised it." items={learned.map((e) => `${e.organization} — ${e.role.split("·")[0].trim()}`)} tone="ice" />
              <Stage n="02" title="Applied" note="Real projects that use it." items={applied.map((p) => p.name)} tone="fire" />
              <Stage n="03" title="Proven" note="Wins and posts that show it." items={proven} tone="violet" />
            </div>

            {applied.length > 0 && (
              <section className="mt-8" aria-labelledby="skill-projects-h">
                <h4 id="skill-projects-h" className="title-face flex items-center gap-3 text-[0.74rem] uppercase tracking-[0.24em] text-[#ffb27a]">
                  <Layers aria-hidden className="h-4 w-4" /> Real projects using {skill.name}
                </h4>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {applied.slice(0, 3).map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => select(p.id)} className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-hair bg-[#0b0c10] p-6 pb-4 text-left transition-colors hover:border-[#e58237]/50" data-cursor="link">
                        <ProjectArt p={p} />
                        <span className="display text-[1.2rem] leading-tight text-ivory">{p.name}</span>
                        <span className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-mist">{p.tagline}</span>
                        <span className="mt-3"><StackLogos stack={p.stack} skills={[]} size={15} /></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>

          {/* Journey and related skills */}
          <aside aria-label="Related skills" className="space-y-5 lg:col-span-2 xl:col-span-1">
            <section className="rounded-2xl border border-hair bg-[#07080a]/85 p-5">
              <h4 className="title-face flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.24em] text-[#ffb27a]">
                <Sparkles aria-hidden className="h-4 w-4" /> Related skills
              </h4>
              <ul className="mt-3 space-y-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => pick(r.id)} className="flex w-full items-center gap-3 rounded-lg border border-hair bg-[#0b0c10] px-3 py-2.5 text-left transition-colors hover:border-[#e58237]/50" data-cursor="link">
                      <span className="flex h-7 w-7 items-center justify-center"><SkillLogo id={r.id} size={18} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] text-ivory">{r.name}</span>
                        <span className="block text-[11.5px] text-faint">{r.shared ? `Used together in ${r.shared} project${r.shared === 1 ? "" : "s"}` : "Practised in the same places"}</span>
                      </span>
                      <ChevronRight aria-hidden className="h-4 w-4 text-faint" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => select(current)}
                className="group mt-4 flex w-full items-center gap-3 rounded-full border border-[#e58237]/60 px-4 py-3 text-left transition-[border-color,box-shadow] hover:border-[#ffb27a] hover:shadow-[0_0_26px_-6px_rgba(229,130,55,0.8)]"
                data-cursor="link"
              >
                <span className="min-w-0 flex-1">
                  <span className="title-face block text-[0.72rem] uppercase tracking-[0.2em] text-ivory">Trace the skill journey</span>
                  <span className="block text-[11.5px] text-faint">Light every thread to {skill.name}</span>
                </span>
                <ChevronRight aria-hidden className="h-4 w-4 text-[#ffb27a] transition-transform group-hover:translate-x-1" />
              </button>
            </section>
          </aside>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: Code2, value: skills.filter((s) => s.family === "built").length, label: "Technologies" },
            { icon: Layers, value: projects.length, label: "Projects" },
            { icon: Sparkles, value: signals.length + live.length, label: "LinkedIn posts" },
            { icon: Briefcase, value: experiences.length, label: "Experience sources" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4 rounded-xl border border-hair bg-[#07080a]/80 px-4 py-3">
              <s.icon aria-hidden strokeWidth={1.4} className="h-7 w-7 text-[#e58237]" />
              <div>
                <dt className="sr-only">{s.label}</dt>
                <dd className="display text-[1.7rem] leading-none text-ivory">{s.value}</dd>
                <dd className="mono mt-1 text-faint">{s.label}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </Chapter>
  );
}
