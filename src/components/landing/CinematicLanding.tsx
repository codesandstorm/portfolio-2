"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { profile } from "@/content/data";
import { landing } from "@/content/story";
import { sfx } from "@/audio/useSound";
import { AT, INTRO_SECONDS, introAmounts, introPhase } from "@/lib/intro";
import { useTicker } from "@/lib/hooks";
import { scrollToChapter } from "@/lib/scroll";
import { useUI } from "@/lib/store";
import { smooth, world } from "@/lib/world";
import { Chapter, useFlow } from "../chapters/Chapter";

const SEEN_KEY = "sutra-intro-seen";

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * 00 — Fire × Ice. Two systems wake on opposite sides, are drawn together and
 * collide; the collision forms her name, and its leftover energy draws the
 * network the rest of the site explores. The <h1> is real text at all times —
 * the particles land on it, then it resolves crisp over them.
 */
export function CinematicLanding() {
  const ready = useUI((s) => s.ready);
  const introDone = useUI((s) => s.introDone);
  const finishIntro = useUI((s) => s.finishIntro);
  const setIntroPhase = useUI((s) => s.setIntroPhase);
  const flow = useFlow();
  const tween = useRef<gsap.core.Tween | null>(null);
  const silent = useRef(false);
  const h1 = useRef<HTMLHeadingElement>(null);
  const fireCap = useRef<HTMLDivElement>(null);
  const iceCap = useRef<HTMLDivElement>(null);
  const sub = useRef<HTMLDivElement>(null);
  const marks = useRef<HTMLDivElement>(null);
  const invite = useRef<HTMLDivElement>(null);

  // The particles need to know exactly where the name is set.
  useLayoutEffect(() => {
    const el = h1.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const fontPx = parseFloat(cs.fontSize);
      const lineHeightPx = parseFloat(cs.lineHeight) || fontPx;
      const twoLines = r.height > lineHeightPx * 1.5;
      world.nameRect = {
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        w: r.width,
        h: r.height,
        fontPx,
        spacingPx: parseFloat(cs.letterSpacing) || 0,
        lineHeightPx,
        lines: twoLines ? ["AKSHITA", "MAHAJAN"] : ["AKSHITA MAHAJAN"],
      };
      window.dispatchEvent(new Event("sutra:name-measured"));
    };
    measure();
    void document.fonts.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
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
    const tall = window.innerWidth / window.innerHeight < 0.9;
    const seconds = INTRO_SECONDS / ((seen ? 2.2 : 1) * (tall ? 1.3 : 1));
    const attractionSeconds = (AT.collision - AT.attraction) * seconds;
    const cues: [number, () => void][] = [
      [AT.awakening, sfx.fireWake],
      [AT.iceWakes, sfx.iceWake],
      [AT.attraction, () => sfx.riser(attractionSeconds)],
      [AT.collision, () => { world.heroFlash = 1; world.shake = 1; sfx.impact(); }],
      [AT.crisp, sfx.resolve],
      ...[0, 1, 2, 3, 4].map((i) => [AT.network + 0.02 + i * 0.025, () => sfx.shimmer(i)] as [number, () => void]),
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
    finishIntro();
  };

  useTicker(() => {
    if (flow) return;
    if (!introDone && world.t > 0.05 && tween.current) skip();
    const i = world.intro;
    const t = world.t;
    setIntroPhase(introPhase(i, t));
    const amt = introAmounts(i);
    const away = 1 - smooth(0.04, 0.55, t);
    const set = (el: HTMLElement | null, v: number, lift = 12) => {
      if (!el) return;
      el.style.opacity = v.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - v) * lift).toFixed(1)}px, 0)`;
      el.style.visibility = v < 0.01 ? "hidden" : "visible";
    };
    if (h1.current) {
      h1.current.style.opacity = (amt.crisp * away).toFixed(3);
      h1.current.style.filter = amt.crisp < 1 ? `blur(${((1 - amt.crisp) * 6).toFixed(1)}px)` : "";
    }
    const leave = 1 - smooth(AT.attraction, AT.attraction + 0.07, i);
    set(fireCap.current, smooth(0.15, 0.24, i) * leave);
    set(iceCap.current, smooth(0.31, 0.4, i) * leave);
    set(sub.current, smooth(0.86, 0.95, i) * away);
    set(marks.current, smooth(0.92, 1, i) * away, 0);
    set(invite.current, smooth(0.95, 1, i) * away);
  });

  const hidden = flow ? undefined : { opacity: 0, visibility: "hidden" as const };

  return (
    <Chapter id="signal">
      {flow && <div aria-hidden className="static-duality absolute inset-0 -z-10" />}
      <div className={`relative flex flex-col items-center justify-center text-center ${flow ? "min-h-[78svh]" : "h-full"}`}>
        <h1
          id="signal-title"
          ref={h1}
          className="display hero-name text-[clamp(2.9rem,13.5vw,5.5rem)] uppercase leading-[0.98] tracking-[0.06em] md:whitespace-nowrap md:text-[clamp(3.2rem,7.2vw,8.6rem)]"
          style={flow ? undefined : { opacity: 0 }}
        >
          <span className="block md:inline">Akshita</span>
          <span className="hidden md:inline"> </span>
          <span className="block md:inline">Mahajan</span>
        </h1>

        <div ref={sub} className={flow ? "mt-8" : "absolute left-0 right-0 top-[calc(50%+min(16vw,7.5rem))] md:top-[calc(50%+min(6vw,6.5rem))]"} style={hidden}>
          <p className="mono flex flex-wrap justify-center gap-x-3 text-[0.68rem] tracking-[0.42em] text-ivory/75 sm:gap-x-5">
            {landing.signoff.map((w, k) => (
              <span key={w} className="flex items-center gap-3 sm:gap-5">
                {k > 0 && <span aria-hidden className="text-gold">·</span>}
                {w}
              </span>
            ))}
          </p>
          <p className="display mt-4 px-6 text-lg italic text-mist sm:text-xl">{landing.thought}</p>
        </div>

        {/* Duality captions: what each force stands for. */}
        <div
          ref={fireCap}
          className={flow ? "mt-10" : "absolute left-0 right-0 top-[35%] md:left-[7vw] md:right-auto md:top-[72%] md:text-left"}
          style={hidden}
        >
          <p className="mono text-[#ffa553]">{landing.fire.name}</p>
          <p className="display mt-1 text-xl italic text-ivory/80">{landing.fire.qualities.join(" · ")}</p>
        </div>
        <div
          ref={iceCap}
          className={flow ? "mt-6" : "absolute bottom-[35%] left-0 right-0 md:bottom-auto md:left-auto md:right-[9vw] md:top-[72%] md:text-right"}
          style={hidden}
        >
          <p className="mono text-[#7dbcff]">{landing.ice.name}</p>
          <p className="display mt-1 text-xl italic text-ivory/80">{landing.ice.qualities.join(" · ")}</p>
        </div>

        {/* Four quiet marks around the composition — each a door into a chapter. */}
        <div ref={marks} className={flow ? "mt-12 grid w-full max-w-3xl gap-6 text-left sm:grid-cols-2" : "pointer-events-none absolute inset-0 hidden md:block"} style={hidden}>
          {landing.marks.map((m, k) => {
            const corner = ["left-[5vw] top-[19%]", "right-[9vw] top-[19%] text-right", "left-[5vw] bottom-[17%]", "right-[9vw] bottom-[17%] text-right"][k];
            return (
              <button
                key={m.n}
                type="button"
                onClick={() => scrollToChapter(m.to)}
                className={`group pointer-events-auto ${flow ? "" : `absolute ${corner}`} max-w-[15rem]`}
                data-cursor="link"
              >
                <span className="mono text-faint">{m.n}</span>
                <span className="mono ml-3 tracking-[0.3em] text-ivory/85 transition-colors group-hover:text-gold">{m.title}</span>
                <span className="mt-1 block text-[13px] leading-snug text-mist">{m.note}</span>
                <span aria-hidden className={`mt-3 block h-px w-28 bg-gradient-to-r ${k % 2 ? "ml-auto from-transparent to-[#7dbcff]/70" : "from-[#ffa553]/70 to-transparent"} transition-all duration-700 group-hover:w-40`} />
              </button>
            );
          })}
        </div>

        <div ref={invite} className={flow ? "mt-12" : "absolute bottom-[5%] left-1/2 -translate-x-1/2"} style={hidden}>
          <button
            type="button"
            onClick={() => { skip(); sfx.swell(); scrollToChapter("start"); }}
            className="group flex flex-col items-center gap-3 text-ivory"
            data-cursor="link"
          >
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-ivory/30 transition-colors group-hover:border-gold" aria-hidden>
              <span className="absolute -top-8 h-7 w-px bg-gradient-to-b from-transparent to-ivory/40" />
              <span className="text-sm text-gold transition-transform duration-500 group-hover:translate-y-0.5">↓</span>
            </span>
            <span className="mono text-[0.65rem] tracking-[0.4em] text-ivory/70">{landing.enter}</span>
          </button>
        </div>
      </div>

      {!flow && !introDone && ready && (
        <button type="button" onClick={skip} className="mono absolute bottom-6 left-[var(--gutter)] z-10 text-faint hover:text-ivory" data-cursor="link">
          Skip intro
        </button>
      )}
      <p className="sr-only">
        {profile.name}: full-stack engineer and public speaker from {profile.location}. Fire stands for her voice, confidence and action; ice for her
        intellect, clarity and structure.
      </p>
    </Chapter>
  );
}
