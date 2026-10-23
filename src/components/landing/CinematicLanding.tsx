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
import { smooth, world } from "@/lib/world";
import { useFlow } from "../chapters/Chapter";
import { AvatarPlayer } from "./AvatarPlayer";
import { HeroTitle } from "./HeroTitle";
import { HeroDissolve, PHOTO_HANDOVER } from "./HeroDissolve";
import HeroParticles from "./HeroParticles";
import SmokeCanvas from "./SmokeCanvas";
import "./landing.css";

const SEEN_KEY = "sutra-intro-seen";
const HERO_IMAGE = "/landing/images/hero-clean.png";

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * 00 — The landing. Her photograph breathes under live smoke, her name gathers
 * out of the smoke grain by grain, and as you scroll the whole frame dissolves
 * into the night the rest of the site lives in. This component owns the
 * timeline (`world.intro`) that the title, sound and navigation all read.
 */
export function CinematicLanding() {
  const ready = useUI((s) => s.ready);
  const introDone = useUI((s) => s.introDone);
  const finishIntro = useUI((s) => s.finishIntro);
  const setIntroPhase = useUI((s) => s.setIntroPhase);
  const flow = useFlow();
  const tween = useRef<gsap.core.Tween | null>(null);
  const silent = useRef(false);
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const cta = useRef<HTMLDivElement>(null);

  // The loader holds until the type and her photograph are both in hand.
  useEffect(() => {
    const img = new Image();
    img.src = HERO_IMAGE;
    const photo = img.decode().catch(() => undefined);
    void Promise.all([document.fonts.ready, photo]).then(() => useUI.getState().setReady());
  }, []);

  useEffect(() => {
    if (!ready || tween.current) return;
    if (flow) {
      world.intro = 1;
      setIntroPhase("settled");
      finishIntro();
      return;
    }
    const seen = readSeen();
    const seconds = INTRO_SECONDS / (seen ? 1.6 : 1);
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
    // The hero stays pinned for one screen of scroll while it breaks into grains.
    const sec = section.current;
    const pinned = sec ? sec.offsetHeight - window.innerHeight : 0;
    world.heroDissolve = flow || pinned <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / pinned));
    if (!flow && !introDone && world.heroDissolve > 0 && tween.current) skip();
    if (!flow) setIntroPhase(introPhase(world.intro, world.t));
    // The type hands over to its grains at once; the living photograph stays until its own grains start to move.
    const away = flow ? 1 - smooth(0.08, 0.7, world.t) : 1 - smooth(PHOTO_HANDOVER, PHOTO_HANDOVER + 0.08, world.heroDissolve);
    if (stage.current) {
      stage.current.style.opacity = away.toFixed(3);
      stage.current.style.visibility = away < 0.005 ? "hidden" : "visible";
      const type = stage.current.querySelector<HTMLElement>(".hero-title-wrapper");
      if (type && !flow) type.style.opacity = (1 - smooth(0, 0.025, world.heroDissolve)).toFixed(3);
    }
    if (flow) return;
    const amt = introAmounts(world.intro);
    const set = (el: HTMLElement | null, v: number) => {
      if (!el) return;
      el.style.opacity = v.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - v) * 6).toFixed(1)}px, 0)`;
      el.style.visibility = v < 0.01 ? "hidden" : "visible";
    };
    set(sub.current, amt.subtitle * 0.95);
    set(cta.current, amt.cta);
  });

  const hidden = flow ? undefined : { opacity: 0, visibility: "hidden" as const };

  return (
    <section ref={section} id="signal" data-chapter="signal" aria-labelledby="signal-title" className={`relative z-10 ${flow ? "h-svh" : "h-[200svh]"}`}>
      {/* Pinned for one screen of scroll while the hero breaks into grains. */}
      <div className="sticky top-0 h-svh overflow-hidden">
        <div ref={stage} className="cinematic-experience">
          <div className="cinematic-backdrop" aria-hidden="true">
            {/* Mounted with the loader's exit so the fade from black is seen, not spent behind it. */}
            {ready && <SmokeCanvas reducedMotion={flow} />}
          </div>
          {ready && <HeroParticles reducedMotion={flow} />}

          <HeroTitle flow={flow}>
            <p ref={sub} className="hero-sub-descriptor" style={hidden}>
              {landing.roles.map((r, k) => (
                <span key={r}>
                  {k > 0 && <span className="descriptor-separator" aria-hidden>·</span>}
                  {r}
                </span>
              ))}
            </p>
            <div ref={cta} className="hero-explore-cta" style={hidden}>
              <button
                type="button"
                className="explore-link"
                onClick={() => {
                  skip();
                  sfx.swell();
                  scrollToChapter("build");
                }}
                data-cursor="link"
              >
                <span>{landing.explore.toUpperCase()}</span>
                <span className="explore-arrow" aria-hidden="true">→</span>
              </button>
            </div>
          </HeroTitle>

          <div className="hero-floor" aria-hidden />
        </div>
        {!flow && <HeroDissolve host={stage} image={HERO_IMAGE} />}

        <AvatarPlayer visible={introDone || flow} />

        {!flow && !introDone && ready && (
          <button type="button" onClick={skip} className="mono absolute bottom-6 left-[var(--gutter)] z-30 text-faint hover:text-ivory" data-cursor="link">
            Skip intro
          </button>
        )}
      </div>
      <p className="sr-only">
        {profile.name}: {landing.roles.join(", ")}, from {profile.location}.
      </p>
    </section>
  );
}
