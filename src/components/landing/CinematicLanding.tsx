"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { profile } from "@/content/data";
import { landing } from "@/content/story";
import { sfx } from "@/audio/useSound";
import { AT, INTRO_SECONDS, introAmounts, introPhase } from "@/lib/intro";
import { useTicker } from "@/lib/hooks";
import { scrollToChapter } from "@/lib/scroll";
import { useUI } from "@/lib/store";
import { useTour } from "@/lib/tour";
import { smooth, world } from "@/lib/world";
import { Chapter, useFlow } from "../chapters/Chapter";
import { AvatarPlayer } from "./AvatarPlayer";
import { ElectricTitle } from "./ElectricTitle";

const SEEN_KEY = "sutra-intro-seen";

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * 00 — The landing. Fire and ice drift in as slow cosmic smoke, she emerges
 * from it, and her name is struck into being like a film title. The WebGL
 * layers (smoke, her photograph) live in the world canvas; this is the type,
 * the controls and the timeline that drives them all.
 */
export function CinematicLanding() {
  const ready = useUI((s) => s.ready);
  const introDone = useUI((s) => s.introDone);
  const finishIntro = useUI((s) => s.finishIntro);
  const setIntroPhase = useUI((s) => s.setIntroPhase);
  const flow = useFlow();
  const tween = useRef<gsap.core.Tween | null>(null);
  const silent = useRef(false);
  const sub = useRef<HTMLParagraphElement>(null);
  const cta = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || tween.current) return;
    if (flow) {
      world.intro = 1;
      setIntroPhase("settled");
      finishIntro();
      return;
    }
    const seen = readSeen();
    const tall = window.innerWidth / window.innerHeight < 0.9;
    const seconds = INTRO_SECONDS / ((seen ? 1.8 : 1) * (tall ? 1.2 : 1));
    // The ambience under the smoke; the title brings its own electricity.
    const cues: [number, () => void][] = [
      [AT.smoke, sfx.iceWake],
      [AT.smoke + 0.04, sfx.fireWake],
      [AT.subtitle, sfx.resolve],
    ];
    let next = 0;
    world.intro = 0;
    tween.current = gsap.to(world, {
      intro: 1,
      duration: seconds,
      ease: "none",
      onUpdate: () => {
        while (next < cues.length && world.intro >= cues[next][0]) {
          if (!silent.current) cues[next][1]();
          next++;
        }
      },
      onComplete: () => {
        finishIntro();
        try {
          localStorage.setItem(SEEN_KEY, "1");
        } catch {
          /* private mode: the intro simply plays in full next time */
        }
      },
    });
  }, [ready, flow, finishIntro, setIntroPhase]);

  const skip = () => {
    silent.current = true;
    tween.current?.progress(1);
    world.intro = 1;
    window.dispatchEvent(new Event("sutra:intro-skip"));
    finishIntro();
  };

  useTicker(() => {
    if (flow) return;
    if (!introDone && world.t > 0.05 && tween.current) skip();
    setIntroPhase(introPhase(world.intro, world.t));
    const amt = introAmounts(world.intro);
    const away = 1 - smooth(0.04, 0.55, world.t);
    const set = (el: HTMLElement | null, v: number, lift = 10) => {
      if (!el) return;
      el.style.opacity = v.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - v) * lift).toFixed(1)}px, 0)`;
      el.style.visibility = v < 0.01 ? "hidden" : "visible";
    };
    const title = document.getElementById("signal-title");
    if (title) title.style.opacity = away.toFixed(3);
    set(sub.current, amt.subtitle * away);
    set(cta.current, amt.cta * away);
    // As the subtitle settles its tracking closes a touch — the last move of a title card.
    if (sub.current) sub.current.style.letterSpacing = `${(0.55 - amt.subtitle * 0.17).toFixed(3)}em`;
  });

  const hidden = flow ? undefined : { opacity: 0, visibility: "hidden" as const };

  return (
    <Chapter id="signal">
      {flow && (
        // Without WebGL: her photograph and two still lights.
        <div aria-hidden className="static-duality absolute inset-0 -z-10 overflow-hidden">
          {profile.portrait && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.portrait}
              alt=""
              className="absolute left-1/2 top-[4%] h-[62%] -translate-x-1/2 object-cover opacity-90 saturate-[0.75] [mask-image:radial-gradient(ellipse_at_58%_38%,black_35%,transparent_68%)]"
            />
          )}
        </div>
      )}
      <div className={`relative h-full ${flow ? "min-h-[86svh]" : ""}`}>
        <ElectricTitle flow={flow} />

        <p
          ref={sub}
          className="title-face absolute inset-x-4 top-[68%] text-center text-[0.62rem] uppercase text-ivory/80 sm:text-[0.72rem] md:top-[79%]"
          style={hidden ?? { letterSpacing: "0.38em" }}
        >
          {landing.roles.map((r, k) => (
            <span key={r}>
              {k > 0 && <span className="mx-[0.9em] text-gold" aria-hidden>·</span>}
              {r}
            </span>
          ))}
        </p>

        <div ref={cta} className="absolute inset-x-0 bottom-[5%] flex flex-col items-center gap-4" style={hidden}>
          <button
            type="button"
            onClick={() => {
              skip();
              sfx.swell();
              scrollToChapter("start");
            }}
            className="group flex items-center gap-4 text-gold"
            data-cursor="link"
          >
            <span className="title-face text-[0.72rem] uppercase tracking-[0.42em]">{landing.explore}</span>
            <span aria-hidden className="relative block h-px w-10 bg-gold/70 transition-all duration-500 group-hover:w-14">
              <span className="absolute -right-0.5 -top-[3px] h-[7px] w-[7px] rotate-45 border-r border-t border-gold/80" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              skip();
              useTour.getState().open();
            }}
            className="mono text-[0.62rem] tracking-[0.3em] text-faint transition-colors hover:text-ivory"
            data-cursor="link"
          >
            {landing.tour} ▸
          </button>
        </div>

        <AvatarPlayer visible={introDone || flow} />
      </div>

      {!flow && !introDone && ready && (
        <button type="button" onClick={skip} className="mono absolute bottom-6 left-[var(--gutter)] z-10 text-faint hover:text-ivory" data-cursor="link">
          Skip intro
        </button>
      )}
      <p className="sr-only">
        {profile.name}: {landing.roles.join(", ")}, from {profile.location}.
      </p>
    </Chapter>
  );
}
