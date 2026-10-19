"use client";

import { credentials, skills } from "@/content/data";
import { getExperiencesForSkill, getProjectsForSkill, getSignalsForSkill } from "@/content/graph";
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

/** 06 — Learn. Skills as an evidence constellation: no bars, only threads to where they were used. */
export function LearnChapter() {
  const flow = useFlow();
  const select = useUI((s) => s.select);

  return (
    <Chapter id="learn" scrim="left">
      <div className={flow ? "mx-auto max-w-5xl" : "flex h-full flex-col justify-between pb-[7svh] pt-[16svh]"}>
        <div className="max-w-[26rem]">
          <Kicker id="learn" />
          <h2 id="learn-title" className="display mt-5 text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.98] text-ivory">
            Skills, by <span className="italic text-gold">evidence.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-mist">
            No percentages. Each skill is a point of light with a thread to every place she used it.
            <span className="hidden sm:inline"> Choose one and everything else falls dark — the energy runs out to the projects, internships and posts that prove it, and back.</span>
            <span className="sm:hidden"> Tap one to see where.</span>
          </p>
          {!flow && (
            <p className="mono mt-5 flex flex-wrap gap-x-5 gap-y-1 text-faint">
              <span><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-electric/80" />Built</span>
              <span><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-violet" />Human</span>
              <span>Dashed thread = inferred</span>
            </p>
          )}
        </div>

        {flow && (
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
        )}

        <div className={`max-w-[30rem] ${flow ? "mt-12" : "hidden sm:block"}`}>
          <h3 className="mono text-gold/90">Credentials</h3>
          <ul className="mt-2 space-y-1">
            {credentials.map((c) => (
              <li key={c.name} className="flex gap-4 text-sm text-mist">
                <span className="mono w-20 shrink-0 text-faint">{c.date}</span>
                <span>
                  {c.name} <span className="text-faint">· {c.issuer}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Chapter>
  );
}
