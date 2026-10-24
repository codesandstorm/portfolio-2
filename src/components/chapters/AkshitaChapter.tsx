"use client";

import { profile } from "@/content/data";
import { about } from "@/content/story";
import { scrollToChapter } from "@/lib/scroll";
import { Chapter, Kicker, useFlow } from "./Chapter";

/** 01 — About. Her portrait in light on the left; who she is, in her own facts, on the right. */
export function AkshitaChapter() {
  const flow = useFlow();

  return (
    <Chapter id="akshita" scrim="right">
      <div className={flow ? "mx-auto max-w-3xl" : "flex h-full items-end pb-[8svh] md:items-center md:justify-end md:pb-0"}>
        <div className="w-full max-w-[36rem] md:mr-[4vw]">
          <Kicker id="akshita" />
          <h2 id="akshita-title" className="display mt-5 text-[clamp(2.4rem,5vw,4.4rem)] leading-[0.95] text-ivory">
            Akshita <span className="italic text-gold">Mahajan</span>
          </h2>
          <p className="title-face mt-4 text-[0.74rem] uppercase tracking-[0.28em] text-[#e58237]">{about.line}</p>

          <div className="mt-6 space-y-4 text-[15px] leading-[1.75] text-ivory/80">
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>

          <table className="mt-6 w-full border-collapse overflow-hidden rounded-xl text-left text-[13.5px]">
            <caption className="sr-only">Facts about Akshita</caption>
            <tbody>
              {about.facts.map(([k, v, when], i) => (
                <tr key={i} className={k || i === 0 ? "border-t border-hair" : ""}>
                  <th scope="row" className="title-face w-[6.5rem] py-2 pr-4 align-top text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[#e58237]">{k}</th>
                  <td className="py-2 pr-3 align-top leading-snug text-ivory/85">{v}</td>
                  <td className="mono whitespace-nowrap py-2 text-right align-top text-faint">{when}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
            <button type="button" onClick={() => scrollToChapter("build")} className="thread-link mono text-gold" data-cursor="link">
              See what she has built <span aria-hidden>→</span>
            </button>
            <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="thread-link mono text-mist" data-cursor="external">
              LinkedIn <span aria-hidden>↗</span>
            </a>
            <a href={profile.links.github} target="_blank" rel="noreferrer" className="thread-link mono text-mist" data-cursor="external">
              GitHub <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </div>
      {!profile.portrait && !flow && (
        <p className="mono absolute bottom-5 left-[var(--gutter)] hidden text-faint/70 md:block">Portrait · abstract placeholder until her photograph is supplied</p>
      )}
    </Chapter>
  );
}
