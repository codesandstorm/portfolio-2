"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { profile } from "@/content/data";
import { awakening } from "@/content/story";
import { sfx } from "@/audio/useSound";
import { useTicker } from "@/lib/hooks";
import { scrollToChapter } from "@/lib/scroll";
import { useUI } from "@/lib/store";
import { smooth, world } from "@/lib/world";
import { Chapter, useFlow } from "./Chapter";

const INTRO_SECONDS = 8;

/** 00 — Awakening. One point of light; threads; her name assembled from the dark. */
export function SignalChapter() {
  const ready = useUI((s) => s.ready);
  const introDone = useUI((s) => s.introDone);
  const finishIntro = useUI((s) => s.finishIntro);
  const flow = useFlow();
  const tween = useRef<gsap.core.Tween | null>(null);
  const line = useRef<HTMLParagraphElement>(null);
  const sub = useRef<HTMLDivElement>(null);
  const enter = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || tween.current) return;
    if (flow) {
      world.intro = 1;
      finishIntro();
      return;
    }
    const chimes = [0.17, 0.24, 0.31, 0.38, 0.45];
    let next = 0;
    tween.current = gsap.to(world, {
      intro: 1,
      duration: INTRO_SECONDS,
      ease: "none",
      onUpdate: () => {
        while (next < chimes.length && world.intro >= chimes[next]) sfx.shimmer(next++);
      },
      onComplete: finishIntro,
    });
  }, [ready, flow, finishIntro]);

  const skip = () => {
    tween.current?.progress(1);
    world.intro = 1;
    finishIntro();
  };

  useTicker(() => {
    if (flow) return;
    // Scrolling never waits for the intro.
    if (!introDone && world.t > 0.05 && tween.current) skip();
    const i = world.intro;
    const set = (el: HTMLElement | null, v: number) => {
      if (!el) return;
      el.style.opacity = v.toFixed(3);
      el.style.transform = `translateY(${((1 - v) * 14).toFixed(1)}px)`;
      el.style.filter = v < 1 ? `blur(${((1 - v) * 6).toFixed(1)}px)` : "";
    };
    const fadeOut = 1 - smooth(0.08, 0.5, world.t);
    set(line.current, smooth(0.3, 0.4, i) * (1 - smooth(0.62, 0.72, i)));
    set(sub.current, smooth(0.78, 0.88, i) * fadeOut);
    set(enter.current, smooth(0.86, 0.96, i) * fadeOut);
  });

  return (
    <Chapter id="signal">
      <div className={`relative flex flex-col items-center justify-center text-center ${flow ? "min-h-[70svh]" : "h-full"}`}>
        <h1 id="signal-title" className={flow ? "display text-[clamp(3rem,11vw,9rem)] leading-[0.95] text-ivory" : "sr-only"}>
          {profile.name}
        </h1>
        <p ref={line} className={`display text-2xl italic text-ivory/90 sm:text-4xl ${flow ? "mt-6" : "absolute top-[30%]"}`} style={flow ? undefined : { opacity: 0 }}>
          {awakening.line}
        </p>
        <div
          ref={sub}
          className={`mono flex flex-wrap justify-center gap-x-4 gap-y-1 text-mist ${flow ? "mt-8" : "absolute bottom-[26%] sm:bottom-[24%]"}`}
          style={flow ? undefined : { opacity: 0 }}
        >
          <span>Full-stack engineer</span>
          <span className="text-gold" aria-hidden>·</span>
          <span>Public speaker</span>
          <span className="text-gold" aria-hidden>·</span>
          <span>{profile.location}</span>
        </div>
        <div ref={enter} className={`${flow ? "mt-10" : "absolute bottom-[12%]"}`} style={flow ? undefined : { opacity: 0 }}>
          <button
            type="button"
            onClick={() => { skip(); sfx.swell(); scrollToChapter("start"); }}
            className="group relative flex items-center gap-4 px-2 py-3 text-ivory"
            data-cursor="link"
          >
            <span className="relative flex h-10 w-10 items-center justify-center" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full border border-gold/30 [animation-duration:2.6s]" />
              <span className="absolute inset-0 rounded-full border border-gold/60 transition-transform duration-500 group-hover:scale-110" />
              <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_10px_#ffb347]" />
            </span>
            <span className="mono text-[0.75rem] tracking-[0.25em]">{awakening.enter}</span>
          </button>
        </div>
      </div>
      {!flow && !introDone && ready && (
        <button type="button" onClick={skip} className="mono absolute bottom-6 left-[var(--gutter)] z-10 text-faint hover:text-ivory" data-cursor="link">
          Skip intro
        </button>
      )}
    </Chapter>
  );
}
