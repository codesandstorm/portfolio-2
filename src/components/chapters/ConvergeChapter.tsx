"use client";

import { achievements, credentials, participation } from "@/content/data";
import { monthYear, useLive } from "@/content/live";
import { useUI } from "@/lib/store";
import { Chapter, Kicker } from "./Chapter";

/** 05 — Achievements & participation. What she won, what she showed up for, and what she is certified in — on one page. */
export function ConvergeChapter() {
  const read = useUI((s) => s.read);
  const select = useUI((s) => s.select);
  const hover = useUI((s) => s.hover);
  const live = useLive((s) => s.posts);

  // Posts published from /admin join the lists they belong to, newest first.
  const wins = [
    ...live.filter((p) => p.kind === "achievement" && p.achievement).map((p) => ({ id: p.id, date: monthYear(p.date), result: p.achievement!.result, title: p.achievement!.title, detail: p.achievement!.detail, post: true })),
    ...achievements.map((a) => ({ ...a, post: false })),
  ];
  const events = [
    ...live.filter((p) => p.kind === "participation").map((p) => ({ id: p.id, title: p.title, role: p.role ?? p.summary, date: monthYear(p.date), signal: p.id })),
    ...participation,
  ];
  const certs = [
    ...live.filter((p) => p.kind === "certification" && p.certification).map((p) => ({ name: p.certification!.name, issuer: p.certification!.issuer, date: monthYear(p.date) })),
    ...credentials,
  ];

  return (
    <Chapter id="converge" free>
      <div className="mx-auto max-w-[78rem]">
        <Kicker id="converge" />
        <h2 id="converge-title" className="display mt-6 text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.98] text-ivory">
          Achievements <span className="italic text-gold">&amp; participation.</span>
        </h2>

        <div className="mt-12 grid gap-14 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <section aria-labelledby="wins-h">
            <h3 id="wins-h" className="mono text-[#e58237]">Wins &amp; milestones</h3>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {wins.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => (a.post ? read(a.id) : select(a.id))}
                    onPointerEnter={() => !a.post && hover(a.id)}
                    onPointerLeave={() => hover(null)}
                    className="group flex h-full w-full flex-col border border-hair bg-[#050608]/70 p-5 text-left transition-colors duration-500 hover:border-[#e58237]/45"
                    data-cursor="link"
                  >
                    <span className="mono text-faint">{a.date}</span>
                    <span className="display mt-3 block text-[2.3rem] leading-none text-[#e58237] [text-shadow:0_0_28px_rgba(229,130,55,0.3)]">{a.result}</span>
                    <span className="display mt-2 block text-xl leading-tight text-ivory">{a.title}</span>
                    <span className="mt-2 block text-sm leading-relaxed text-mist">{a.detail}</span>
                    <span className="mono mt-auto pt-4 text-[#dfbe88] opacity-70 transition-opacity group-hover:opacity-100">
                      {a.post ? "Read the post" : "What led here"} <span aria-hidden>→</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-12">
            <section aria-labelledby="took-part-h">
              <h3 id="took-part-h" className="mono text-[#8fc3f5]">Took part in</h3>
              <ol className="mt-5 border-l border-hair">
                {events.map((e) => (
                  <li key={e.id} className="relative pl-6">
                    <span aria-hidden className="absolute -left-[3.5px] top-[1.15rem] h-1.5 w-1.5 rounded-full bg-[#8fc3f5]/70" />
                    <button type="button" onClick={() => read(e.signal)} className="group w-full py-2.5 text-left" data-cursor="link">
                      <span className="mono text-faint">{e.date}</span>
                      <span className="mt-1 block text-[15px] text-ivory/90 transition-colors group-hover:text-[#ecd6b8]">{e.title}</span>
                      <span className="block text-sm text-mist">{e.role}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="certs-h">
              <h3 id="certs-h" className="mono text-[#dfbe88]">Certifications</h3>
              <ul className="mt-4 space-y-2">
                {certs.map((c) => (
                  <li key={c.name} className="flex gap-4 border-t border-hair pt-2 text-sm text-mist">
                    <span className="mono w-20 shrink-0 text-faint">{c.date}</span>
                    <span>
                      {c.name} <span className="text-faint">· {c.issuer}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Chapter>
  );
}
