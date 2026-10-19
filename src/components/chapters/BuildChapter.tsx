"use client";

import { projects } from "@/content/data";
import { getEdgeConfidence, getNode, getSkillsForProject } from "@/content/graph";
import type { Project } from "@/content/types";
import { useUI } from "@/lib/store";
import { Chapter, Kicker, useFlow } from "./Chapter";
import { Arrive, Label, Stepped } from "./Stepped";

const STATUS: Record<Project["status"], string> = {
  live: "Live",
  internship: "Internship work",
  built: "Built",
  hackathon: "Hackathon",
};

function Artifact({ p, i, reveal }: { p: Project; i: number; reveal: number }) {
  const select = useUI((s) => s.select);
  const read = useUI((s) => s.read);
  const skills = getSkillsForProject(p.id);
  const inferred = p.experience && getEdgeConfidence(p.id, p.experience) === "inferred";

  return (
    <article className="max-w-[34rem]" aria-labelledby={`${p.id}-h`}>
      <p className="mono text-faint">
        Seed {String(i + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")} · {STATUS[p.status]} · {p.period}
      </p>
      <h3 id={`${p.id}-h`} className="display mt-2 text-[clamp(2rem,3.8vw,3.4rem)] leading-[0.95] text-ivory">
        {p.name}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-ivory/80">{p.tagline}</p>
      <p className="mono mt-3 text-electric/90">
        Form · {p.artifact.count} {p.artifact.countMeaning}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-x-8">
        {p.problem && (
          <Arrive at={0.1} reveal={reveal} className="sm:col-span-2">
            <Label>Why it existed</Label>
            <p className="text-sm leading-relaxed text-mist">{p.problem}</p>
          </Arrive>
        )}
        <Arrive at={0.2} reveal={reveal}>
          <Label>What she did</Label>
          <p className="mb-1 text-sm text-ivory/85">{p.role}</p>
          <ul className="hidden text-sm leading-snug text-mist sm:block">{p.built.map((b) => <li key={b}>{b}</li>)}</ul>
        </Arrive>
        {p.difficult && (
          <Arrive at={0.34} reveal={reveal}>
            <Label>The hard part</Label>
            <p className="text-sm leading-relaxed text-mist">{p.difficult}</p>
          </Arrive>
        )}
        <Arrive at={0.46} reveal={reveal} className="sm:col-span-2">
          <Label>Technologies</Label>
          <p className="mono leading-relaxed text-ivory/70">{p.stack.join(" · ")}</p>
        </Arrive>
        <Arrive at={0.56} reveal={reveal}>
          <Label>Skills it strengthened</Label>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            {skills.map((s) => (
              <button key={s.id} type="button" onClick={() => select(s.id)} className="mono text-mist hover:text-gold" data-cursor="link">
                {s.name}
              </button>
            ))}
          </p>
        </Arrive>
        {(p.experience || p.learned) && (
          <Arrive at={0.64} reveal={reveal}>
            {p.experience && (
              <>
                <Label>Born in</Label>
                <button type="button" onClick={() => select(p.experience!)} className="text-sm text-ivory/85 underline decoration-gold/40 underline-offset-4 hover:text-gold" data-cursor="link">
                  {getNode(p.experience)?.label}
                </button>
                {inferred && <span className="mono ml-2 text-faint">inferred from dates</span>}
              </>
            )}
            {p.learned && (
              <p className="mt-3 text-sm leading-relaxed text-mist">
                <span className="mono mr-2 text-gold/90">Learned</span>
                {p.learned.join(" · ")}
              </p>
            )}
          </Arrive>
        )}
        {p.after && (
          <Arrive at={0.74} reveal={reveal} className="sm:col-span-2">
            <Label>What came after</Label>
            <p className="text-sm leading-relaxed text-ivory/85">{p.after}</p>
          </Arrive>
        )}
        <Arrive at={0.8} reveal={reveal} className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
          {p.github && (
            <a href={p.github} target="_blank" rel="noreferrer" className="thread-link mono text-gold" data-cursor="external">
              Source on GitHub <span aria-hidden>↗</span>
            </a>
          )}
          {p.signals?.map((s) => (
            <button key={s} type="button" onClick={() => read(s)} className="thread-link text-sm" data-cursor="link">
              <span className="mono text-gold">LI</span> {getNode(s)?.label}
            </button>
          ))}
        </Arrive>
      </div>
    </article>
  );
}

/** 05 — Build. Idea → form: each project grows from a seed into its artifact. */
export function BuildChapter() {
  const flow = useFlow();
  return (
    <Chapter id="build" scrim="right">
      <div className={flow ? "mx-auto max-w-3xl" : "flex h-full flex-col justify-end pb-[7svh] pt-[38svh] md:items-end md:justify-center md:pb-0 md:pt-20"}>
        <div className="w-full md:w-[min(36rem,44vw)] md:mr-[7.5rem]">
          <Kicker id="build" className="mb-6" />
          <h2 id="build-title" className="sr-only">Build — her projects</h2>
          <Stepped chapter="build" items={projects} render={(p, i, r) => <Artifact p={p} i={i} reveal={r} />} />
        </div>
      </div>
    </Chapter>
  );
}
