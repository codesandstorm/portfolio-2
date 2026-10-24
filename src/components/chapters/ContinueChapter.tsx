"use client";

import { useCallback } from "react";
import { profile } from "@/content/data";
import { finale } from "@/content/story";
import { sfx } from "@/audio/useSound";
import { scrollToChapter } from "@/lib/scroll";
import { LastThread } from "../finale/LastThread";
import { HerVoice } from "../ui/HerVoice";
import { Chapter, Kicker, useChapterArrived, useFlow } from "./Chapter";

/** 07 — Connect. Her name in light, and one thread left to draw: yours. */
export function ContinueChapter() {
  const flow = useFlow();
  const arrived = useChapterArrived();

  // Reaching her name is the whole message: the sound resolves and her profile opens.
  const connect = useCallback(() => {
    sfx.resolve();
    [0, 2, 4].forEach((n, i) => setTimeout(() => sfx.shimmer(n), 250 + i * 140));
    window.open(profile.links.linkedin, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <Chapter id="continue">
      {!flow && <LastThread onConnect={connect} visible={arrived} />}
      {/* Top and bottom hold a few words; the middle is left to her name in light and your thread. */}
      <div className={flow ? "mx-auto max-w-4xl text-center" : "flex h-full flex-col items-center justify-between pb-[5svh] pt-[14svh] text-center"}>
        <div>
          <Kicker id="continue" className="justify-center" />
          <h2 id="continue-title" className="display mt-5 text-[clamp(1.9rem,4vw,3.4rem)] italic leading-[1.05] text-ivory">
            {finale.line}
          </h2>
        </div>

        <div className={`flex flex-col items-center ${flow ? "mt-10" : ""}`}>
          <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-3 rounded-full border border-[#e58237]/50 bg-[#07080a]/80 px-6 py-3 transition-[border-color,box-shadow] hover:border-[#ffb27a] hover:shadow-[0_0_28px_-4px_rgba(229,130,55,0.75)]" data-cursor="external">
            <span className="display text-[clamp(1.1rem,2vw,1.5rem)] text-ivory">Connect with her on LinkedIn</span>
            <span aria-hidden className="text-xl text-[#ffb27a] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
          </a>
          <div className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-2">
            <a href={profile.links.github} target="_blank" rel="noreferrer" className="thread-link mono" data-cursor="external">
              GitHub <span aria-hidden>↗</span>
            </a>
            <a href="/one-page" className="thread-link mono" data-cursor="link">
              One-page summary
            </a>
            <button type="button" onClick={() => scrollToChapter("signal")} className="thread-link mono" data-cursor="link">
              ↺ Back to the start
            </button>
          </div>
          <HerVoice clip="justStart" />
          <p className="mono mt-6 max-w-xl text-[10px] leading-relaxed text-faint/70">
            {finale.advice} — her advice to anyone still in the quiet seat. Every fact here comes from her LinkedIn and GitHub.
          </p>
        </div>
      </div>
    </Chapter>
  );
}
