"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import {
  getAchievementsForExperience,
  getAchievementsForSkill,
  getEdgeConfidence,
  getEntity,
  getExperiencesForSkill,
  getNeighbors,
  getNode,
  getPostsForExperience,
  getProjectsForExperience,
  getProjectsForSkill,
  getRelatedSkills,
  getSignalsForPerson,
  getSignalsForSkill,
  getSkillsForExperience,
  getSkillsForProject,
  isHeadlineSkill,
} from "@/content/graph";
import type { Achievement, Experience, LinkedInSignal, Person, Project, Skill } from "@/content/types";
import { useLive } from "@/content/live";
import { sfx } from "@/audio/useSound";
import { useUI } from "@/lib/store";

function Chip({ id, note }: { id: string; note?: string }) {
  const select = useUI((s) => s.select);
  const read = useUI((s) => s.read);
  const hover = useUI((s) => s.hover);
  const n = getNode(id);
  if (!n) return null;
  return (
    <li>
      <button
        type="button"
        className="group flex w-full items-baseline gap-3 py-1.5 text-left"
        onClick={() => { sfx.shimmer(); if (n.kind === "signal") read(id); else select(id); }}
        onPointerEnter={() => hover(id)}
        onPointerLeave={() => hover(null)}
        data-cursor="link"
      >
        <span className="h-px w-3 shrink-0 translate-y-[-3px] bg-gold/60 transition-all group-hover:w-6 group-hover:bg-gold" aria-hidden />
        <span className="text-[15px] text-ivory/90 transition-colors group-hover:text-gold">{n.label}</span>
        {note && <span className="mono ml-auto shrink-0 text-faint">{note}</span>}
      </button>
    </li>
  );
}

/** Posts published from /admin that show this skill — they are not in the graph, so they get their own list. */
function LivePosts({ skill }: { skill: string }) {
  const read = useUI((s) => s.read);
  const posts = useLive((s) => s.posts).filter((p) => p.skills.includes(skill));
  if (!posts.length) return null;
  return (
    <section className="mt-6">
      <h3 className="mono mb-1 text-gold/90">In her latest posts</h3>
      <ul>
        {posts.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => read(p.id)} className="group flex w-full items-baseline gap-3 py-1.5 text-left" data-cursor="link">
              <span className="h-px w-3 shrink-0 translate-y-[-3px] bg-[#e58237]/70 transition-all group-hover:w-6" aria-hidden />
              <span className="text-[15px] text-ivory/90 transition-colors group-hover:text-gold">{p.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Group({ title, ids, notes }: { title: string; ids: string[]; notes?: Record<string, string> }) {
  if (!ids.length) return null;
  return (
    <section className="mt-6">
      <h3 className="mono mb-1 text-gold/90">{title}</h3>
      <ul>{ids.map((id) => <Chip key={id} id={id} note={notes?.[id]} />)}</ul>
    </section>
  );
}

const inferredNotes = (from: string, ids: string[]) =>
  Object.fromEntries(ids.filter((i) => getEdgeConfidence(from, i) === "inferred").map((i) => [i, "inferred"]));

function Body({ id }: { id: string }) {
  const n = getNode(id)!;
  switch (n.kind) {
    case "skill": {
      const s = getEntity<Skill>(id)!;
      return (
        <>
          {s.note && <p className="mt-3 text-mist">{s.note}</p>}
          {isHeadlineSkill(id) && <p className="mono mt-3 text-gold/80">She leads with this on her profile</p>}
          <Group title="Where she learned and practised it" ids={getExperiencesForSkill(id).map((e) => e.id)} />
          <Group title="Where she applied it" ids={getProjectsForSkill(id).map((p) => p.id)} />
          <Group title="What it helped make happen" ids={getAchievementsForSkill(id).map((a) => a.id)} />
          <LivePosts skill={id} />
          <Group title="Where she wrote about it" ids={getSignalsForSkill(id).map((p) => p.id)} />
          <Group title="Travels with" ids={getRelatedSkills(id).map((r) => r.id)} />
        </>
      );
    }
    case "project": {
      const p = getEntity<Project>(id)!;
      const skills = getSkillsForProject(id).map((s) => s.id);
      return (
        <>
          <p className="mt-3 text-mist">{p.tagline}</p>
          <Group title="Skills it used" ids={skills} />
          <Group title="Born in" ids={p.experience ? [p.experience] : []} notes={p.experience ? inferredNotes(id, [p.experience]) : undefined} />
          <Group title="With" ids={p.people ?? []} />
          <Group title="Evidence" ids={p.signals ?? []} />
          {p.github && (
            <a href={p.github} target="_blank" rel="noreferrer" className="thread-link mono mt-6 text-gold" data-cursor="external">
              Source on GitHub <span aria-hidden>↗</span>
            </a>
          )}
        </>
      );
    }
    case "experience": {
      const e = getEntity<Experience>(id)!;
      const projects = getProjectsForExperience(id).map((p) => p.id);
      return (
        <>
          <p className="mono mt-2 text-faint">{e.period}</p>
          <Group title="Skills it grew" ids={getSkillsForExperience(id).map((s) => s.id)} />
          <Group title="What she built there" ids={projects} notes={inferredNotes(id, projects)} />
          <Group title="What it led to" ids={getAchievementsForExperience(id).map((a) => a.id)} />
          <Group title="On LinkedIn" ids={getPostsForExperience(id).map((s) => s.id)} />
          <Group title="People she named" ids={getNeighbors(id, "person")} />
        </>
      );
    }
    case "person": {
      const p = getEntity<Person>(id)!;
      return (
        <>
          <p className="mt-3 text-mist">{p.context}</p>
          <Group title="Shared stories" ids={[...getNeighbors(id, "experience"), ...getNeighbors(id, "project")]} />
          <Group title="Named in" ids={getSignalsForPerson(id).map((s) => s.id)} />
        </>
      );
    }
    case "achievement": {
      const a = getEntity<Achievement>(id)!;
      return (
        <>
          <p className="mt-3 text-mist">{a.detail}</p>
          <Group title="Paths that met here" ids={[...(a.experiences ?? []), ...(a.projects ?? []), ...(a.skills ?? [])]} />
          <Group title="Evidence" ids={a.signals} />
        </>
      );
    }
    case "signal": {
      const s = getEntity<LinkedInSignal>(id)!;
      return <p className="mt-3 text-mist">{s.summary}</p>;
    }
    default:
      return null;
  }
}

/** The relationship reader: every item in it is itself a doorway to its own connections. */
export function RelationPanel() {
  const selected = useUI((s) => s.selected);
  const select = useUI((s) => s.select);
  const heading = useRef<HTMLHeadingElement>(null);
  const n = selected ? getNode(selected) : null;

  useEffect(() => {
    if (selected) heading.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && select(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, select]);

  return (
    <AnimatePresence>
      {n && (
        <motion.aside
          key="panel"
          aria-label={`Connections of ${n.label}`}
          className="fixed inset-x-0 bottom-0 z-40 max-h-[62svh] overflow-y-auto overscroll-contain border-t border-hair bg-void/90 px-6 pb-10 pt-6 backdrop-blur-md md:inset-x-auto md:bottom-auto md:right-0 md:top-0 md:h-svh md:max-h-none md:w-[400px] md:border-l md:border-t-0 md:bg-void/80 md:pt-24"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          data-lenis-prevent
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mono text-faint">{n.kind === "core" ? "Akshita" : n.kind}</p>
              <h2 ref={heading} tabIndex={-1} className="display mt-1 text-3xl leading-tight text-ivory outline-none">
                <AnimatePresence mode="wait">
                  <motion.span key={n.id} className="block" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                    {n.label}
                  </motion.span>
                </AnimatePresence>
              </h2>
            </div>
            <button type="button" onClick={() => select(null)} className="mono mt-1 shrink-0 text-mist hover:text-gold" aria-label="Close connections" data-cursor="link">
              Close ✕
            </button>
          </div>
          <Body id={n.id} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
