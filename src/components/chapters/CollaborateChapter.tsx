"use client";

import { experiences } from "@/content/data";
import { getAchievementsForExperience, getNode, getPostsForExperience, getSkillsForExperience } from "@/content/graph";
import type { Experience } from "@/content/types";
import { useUI } from "@/lib/store";
import { experienceOrder } from "@/world/layout";
import { Chapter, Kicker, useFlow } from "./Chapter";
import { Arrive, Label, Stepped } from "./Stepped";

const ordered = experienceOrder.map((id) => experiences.find((e) => e.id === id)!);
const KIND: Record<Experience["kind"], string> = {
  internship: "Internship",
  leadership: "Leadership",
  community: "Community",
  education: "Education",
};

function Memory({ e, i, reveal }: { e: Experience; i: number; reveal: number }) {
  const read = useUI((s) => s.read);
  const select = useUI((s) => s.select);
  const skills = getSkillsForExperience(e.id);
  const posts = getPostsForExperience(e.id);
  const ach = getAchievementsForExperience(e.id);
  const people = e.people ?? [];
  const next = ordered[i + 1];

  return (
    <article className="max-w-[34rem]" aria-labelledby={`${e.id}-h`}>
      <p className="mono text-faint">
        Memory {String(i + 1).padStart(2, "0")} / {String(ordered.length).padStart(2, "0")} · {KIND[e.kind]} · {e.period}
      </p>
      <h3 id={`${e.id}-h`} className="display mt-2 text-[clamp(2rem,3.8vw,3.4rem)] leading-[0.95] text-ivory">
        {e.organization}
      </h3>
      <p className="mt-2 text-[15px] text-gold/90">{e.role}</p>
      {e.place && <p className="mono mt-1 text-faint">{e.place}</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-x-8">
        {e.opportunity && (
          <Arrive at={0.12} reveal={reveal} className="sm:col-span-2">
            <Label>The opportunity</Label>
            <p className="text-[15px] leading-relaxed text-mist">{e.opportunity}</p>
          </Arrive>
        )}
        <Arrive at={0.2} reveal={reveal} className="sm:col-span-2">
          <Label>The work</Label>
          <ul className="space-y-1 text-sm leading-snug text-ivory/85">
            {e.work.map((w) => <li key={w} className="flex gap-3"><span className="mt-[0.6em] h-px w-3 shrink-0 bg-gold/60" aria-hidden />{w}</li>)}
          </ul>
        </Arrive>
        {people.length > 0 && (
          <Arrive at={0.38} reveal={reveal} className="hidden sm:block">
            <Label>The people</Label>
            <p className="text-sm leading-relaxed text-mist">
              She named {people.length}: {people.slice(0, 4).map((p) => getNode(p)?.label).join(", ")}
              {people.length > 4 ? ` and ${people.length - 4} more` : ""}.
            </p>
          </Arrive>
        )}
        {e.learning && (
          <Arrive at={0.48} reveal={reveal}>
            <Label>The learning</Label>
            <ul className="text-sm leading-relaxed text-ivory/85">{e.learning.map((l) => <li key={l}>{l}</li>)}</ul>
          </Arrive>
        )}
        <Arrive at={0.56} reveal={reveal} className={e.learning ? "" : "sm:col-span-2"}>
          <Label>Skills it grew</Label>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            {skills.map((s) => (
              <button key={s.id} type="button" onClick={() => select(s.id)} className="mono text-mist hover:text-gold" data-cursor="link">
                {s.name}
              </button>
            ))}
          </p>
        </Arrive>
        {(e.enabled || ach.length > 0) && (
          <Arrive at={0.68} reveal={reveal} className="sm:col-span-2">
            <Label>What it enabled</Label>
            {e.enabled && <p className="text-sm leading-relaxed text-mist">{e.enabled}</p>}
            {ach.length > 0 && (
              <p className="mt-1 text-sm text-ivory/85">
                {ach.map((a) => (
                  <button key={a.id} type="button" onClick={() => select(a.id)} className="mr-4 underline decoration-gold/40 underline-offset-4 hover:text-gold" data-cursor="link">
                    {a.title} — {a.result}
                  </button>
                ))}
              </p>
            )}
          </Arrive>
        )}
        {posts.length > 0 && (
          <Arrive at={0.78} reveal={reveal} className="sm:col-span-2">
            <Label>Evidence</Label>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {posts.map((s) => (
                <button key={s.id} type="button" onClick={() => read(s.id)} className="thread-link text-sm" data-cursor="link">
                  <span className="mono text-gold">LI</span> {s.title}
                </button>
              ))}
            </div>
          </Arrive>
        )}
      </div>
      {next && (
        <Arrive at={0.9} reveal={reveal}>
          <p className="mono mt-6 text-faint">
            Energy travels on → <span className="text-ivory/80">{next.organization}</span>
          </p>
        </Arrive>
      )}
    </article>
  );
}

/** 04 — Collaborate. Each experience is a memory space the camera enters. */
export function CollaborateChapter() {
  const flow = useFlow();
  return (
    <Chapter id="collaborate" scrim="right">
      <div className={flow ? "mx-auto max-w-3xl" : "flex h-full flex-col justify-end pb-[7svh] pt-[38svh] md:items-end md:justify-center md:pb-0 md:pt-20"}>
        <div className="w-full md:w-[min(36rem,44vw)] md:mr-[7.5rem]">
          <Kicker id="collaborate" className="mb-6" />
          <h2 id="collaborate-title" className="sr-only">Collaborate — her experiences, in order</h2>
          <Stepped chapter="collaborate" items={ordered} render={(e, i, r) => <Memory e={e} i={i} reveal={r} />} />
        </div>
      </div>
    </Chapter>
  );
}
