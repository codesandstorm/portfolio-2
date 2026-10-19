"use client";

import { useRef } from "react";
import { profile } from "@/content/data";
import { stats } from "@/content/graph";
import { finale } from "@/content/story";
import { chapterIndex } from "@/lib/chapters";
import { useTicker } from "@/lib/hooks";
import { scrollToChapter } from "@/lib/scroll";
import { chapterProgress, smooth } from "@/lib/world";
import { Chapter, Kicker, useFlow } from "./Chapter";

/** 09 — Continue. The whole structure at once; the next connection is the visitor's. */
export function ContinueChapter() {
  const flow = useFlow();
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);

  useTicker(() => {
    if (flow) return;
    const p = chapterProgress(chapterIndex.continue);
    const show = (el: HTMLElement | null, v: number) => {
      if (!el) return;
      el.style.opacity = v.toFixed(3);
      el.style.transform = `translateY(${((1 - v) * 20).toFixed(1)}px)`;
    };
    show(a.current, smooth(0.12, 0.3, p));
    show(b.current, smooth(0.35, 0.55, p));
  });

  return (
    <Chapter id="continue">
      {/* Top and bottom hold the words; the middle is left to her name in light. */}
      <div className={flow ? "mx-auto max-w-4xl text-center" : "flex h-full flex-col items-center justify-between pb-[4svh] pt-[13svh] text-center"}>
        <div ref={a} style={flow ? undefined : { opacity: 0 }}>
          <Kicker id="continue" className="justify-center" />
          <p className="mono mt-4 text-faint">
            {stats.people} people · {stats.projects} builds · {stats.skills} skills · {stats.signals} signals · {stats.edges} threads
          </p>
          <h2 id="continue-title" className="display mt-4 text-[clamp(1.8rem,4vw,3.4rem)] italic leading-[1.02] text-ivory">
            {finale.line}
          </h2>
        </div>
        <div ref={b} className={`flex flex-col items-center ${flow ? "mt-10" : ""}`} style={flow ? undefined : { opacity: 0 }}>
          <a
            href={profile.links.linkedin}
            target="_blank"
            rel="noreferrer"
            className="group relative inline-flex items-center gap-4 px-2 py-3"
            data-cursor="external"
          >
            <span className="relative flex h-3 w-3" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full bg-gold/50 [animation-duration:2.4s]" />
              <span className="absolute inset-0 rounded-full bg-gold shadow-[0_0_16px_#ffb347]" />
            </span>
            <span className="display text-[clamp(1.5rem,4vw,3rem)] text-ivory transition-colors group-hover:text-gold">Make the connection on LinkedIn</span>
            <span className="display text-3xl text-gold transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden>↗</span>
            <span className="absolute inset-x-0 -bottom-1 h-px origin-left scale-x-50 bg-gradient-to-r from-gold to-transparent transition-transform duration-700 group-hover:scale-x-100" aria-hidden />
          </a>
          <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2">
            <a href={profile.links.github} target="_blank" rel="noreferrer" className="thread-link mono" data-cursor="external">
              Explore her GitHub <span aria-hidden>↗</span>
            </a>
            <a href={profile.links.linkedinActivity} target="_blank" rel="noreferrer" className="thread-link mono" data-cursor="external">
              Follow her signals <span aria-hidden>↗</span>
            </a>
          </div>
          <p className="display mt-8 text-2xl italic text-gold">{finale.advice}</p>
          <p className="mono mt-2 text-faint">{finale.adviceSource}</p>
          <button type="button" onClick={() => scrollToChapter("signal")} className="mono mt-6 text-faint hover:text-ivory" data-cursor="link">
            ↺ Return to the first signal
          </button>
          <p className="mono mt-5 max-w-xl text-[10px] leading-relaxed text-faint/70">
            Every fact here comes from her LinkedIn and GitHub, verified 19 Oct 2026. Sound is synthesised in your browser. No voice is hers but her words.
          </p>
        </div>
      </div>
    </Chapter>
  );
}
