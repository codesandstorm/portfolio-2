"use client";

import { skills } from "@/content/data";
import { getExperiencesForSkill, getProjectsForSkill, getSignalsForSkill } from "@/content/graph";
import { useLive } from "@/content/live";
import { useUI } from "@/lib/store";
import { Chapter, Kicker, useFlow } from "./Chapter";

function evidenceCount(id: string) {
  const parts = [
    [getProjectsForSkill(id).length, "project"],
    [getExperiencesForSkill(id).length, "place"],
    [getSignalsForSkill(id).length, "post"],
  ] as const;
  return parts.filter(([n]) => n > 0).map(([n, w]) => `${n} ${w}${n > 1 ? "s" : ""}`).join(" · ");
}

function SkillChip({ id, name }: { id: string; name: string }) {
  const select = useUI((s) => s.select);
  const hover = useUI((s) => s.hover);
  const on = useUI((s) => s.selected === id);
  const projectsUsed = getProjectsForSkill(id).length;
  return (
    <li>
      <button
        type="button"
        onClick={() => select(id)}
        onPointerEnter={() => hover(id)}
        onPointerLeave={() => hover(null)}
        title={evidenceCount(id)}
        className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${on ? "border-[#dfbe88]/80 text-[#ecd6b8]" : "border-hair text-ivory/80 hover:border-[#dfbe88]/45 hover:text-ivory"}`}
        data-cursor="link"
      >
        {name}
        {projectsUsed > 0 && <span className="ml-1.5 text-[11px] text-faint">{projectsUsed}</span>}
      </button>
    </li>
  );
}

/** 04 — Skills. What she can do, each with a thread to the projects, places and events that prove it. */
export function LearnChapter() {
  const flow = useFlow();
  const select = useUI((s) => s.select);
  const read = useUI((s) => s.read);
  const live = useLive((s) => s.posts);
  // Skills her new posts show that the site didn't list yet, each with the newest post that shows it.
  const known = new Set(skills.map((s) => s.name.toLowerCase()));
  const fresh = new Map<string, string>();
  for (const p of live) for (const n of p.newSkills) if (!known.has(n.toLowerCase()) && !fresh.has(n)) fresh.set(n, p.id);

  return (
    <Chapter id="learn" scrim="left">
      <div className={flow ? "mx-auto max-w-5xl" : "flex h-full flex-col justify-center pb-[5svh] pt-[11svh]"}>
        <div className="max-w-[31rem]">
          <Kicker id="learn" />
          <h2 id="learn-title" className="display mt-4 text-[clamp(2.2rem,3.6vw,3.4rem)] leading-[0.98] text-ivory">
            Skills, by <span className="italic text-gold">evidence.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-mist">
            No percentages. Choose a skill to see the projects she used it in, the internships where she learned it, and the events and posts that prove it.
          </p>
        </div>

        {flow ? (
          <div className="mt-12 grid gap-12 sm:grid-cols-2">
            {(["built", "human"] as const).map((fam) => (
              <div key={fam}>
                <h3 className="mono text-gold">{fam === "built" ? "Built" : "Human"}</h3>
                <ul className="mt-3">
                  {skills.filter((s) => s.family === fam).map((s) => (
                    <li key={s.id} className="border-b border-hair">
                      <button type="button" onClick={() => select(s.id)} className="flex w-full items-baseline justify-between gap-4 py-2 text-left hover:text-gold" data-cursor="link">
                        <span>{s.name}</span>
                        <span className="mono text-faint">{evidenceCount(s.id)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 max-w-[34rem] space-y-5">
            {(["built", "human"] as const).map((fam) => (
              <div key={fam}>
                <h3 className="mono flex items-center gap-3 text-faint">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${fam === "built" ? "bg-electric/80" : "bg-violet"}`} />
                  {fam === "built" ? "Engineering" : "People & leadership"}
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {skills.filter((s) => s.family === fam).map((s) => <SkillChip key={s.id} id={s.id} name={s.name} />)}
                </ul>
              </div>
            ))}
            {fresh.size > 0 && (
              <div>
                <h3 className="mono flex items-center gap-3 text-faint">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#e58237]" />
                  New, from her latest posts
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {[...fresh].map(([name, post]) => (
                    <li key={name}>
                      <button type="button" onClick={() => read(post)} className="rounded-full border border-[#e58237]/40 px-3 py-1.5 text-[13px] text-ivory/85 transition-colors hover:border-[#e58237]/80 hover:text-ivory" data-cursor="link">
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mono text-faint/80">The number is how many of her projects use it</p>
          </div>
        )}
      </div>
    </Chapter>
  );
}
