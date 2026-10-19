"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { tour, TOUR_DISCLOSURE, type TourStop } from "@/content/tour";
import { useTicker } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { useTour } from "@/lib/tour";

type Timed = { w: string; start: number; end: number };
type Loaded = { words: Timed[] | null; duration: number; audio: string | null };

const GAP = 0.7;
const TRAVEL = 1.3;

/** Where a [chapter, fraction] point sits on the page. */
function yFor([id, f]: TourStop["from"]) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return el.getBoundingClientRect().top + window.scrollY + Math.max(0, el.offsetHeight - window.innerHeight) * f;
}

function scrollTo(y: number, smooth: boolean) {
  const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(y, smooth ? { duration: TRAVEL } : { immediate: true });
  else window.scrollTo({ top: y, behavior: "auto" });
}

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/** A stop's narration and timings; falls back to captions-only pacing if no audio was generated. */
async function load(stop: TourStop, manifest: Record<string, { duration: number }> | null): Promise<Loaded> {
  if (manifest?.[stop.id]) {
    try {
      const res = await fetch(`/tour/${stop.id}.json`);
      if (res.ok) {
        const j = await res.json();
        return { words: j.words, duration: j.duration, audio: `/tour/${stop.id}.mp3` };
      }
    } catch {
      /* fall through to captions only */
    }
  }
  const n = (stop.say ?? stop.text).split(/\s+/).length;
  return { words: null, duration: n / 2.6, audio: null };
}

/**
 * The guided tour: a narrator (the first spark of the opening) speaks each
 * stop while the page travels through the story. Captions are always on;
 * scrolling, swiping or pressing a key hands control back to the visitor.
 */
export function GuidedTour() {
  const status = useTour((s) => s.status);
  const index = useTour((s) => s.index);
  const reason = useTour((s) => s.reason);
  const { begin, pause, resume, go, finish, exit } = useTour.getState();
  const tier = useUI((s) => s.tier);
  const stop = tour[index];

  const audio = useRef<HTMLAudioElement | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const level = useRef(new Uint8Array(256));
  const manifest = useRef<Record<string, { duration: number }> | null | undefined>(undefined);
  const clock = useRef({ phase: "travel" as "travel" | "speak" | "gap", t0: 0, elapsed: 0, fromY: 0, toY: 0, data: null as Loaded | null, loadedFor: -1 });
  const orb = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [spoken, setSpoken] = useState(0);
  const [captionsOnly, setCaptionsOnly] = useState(false);

  const captionWords = useMemo(() => stop.text.split(" "), [stop]);

  // One audio element for the whole tour, routed through an analyser so the spark can follow the voice.
  const ensureAudio = () => {
    if (audio.current) return;
    const el = new Audio();
    el.preload = "auto";
    audio.current = el;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const src = ctx.createMediaElementSource(el);
      const a = ctx.createAnalyser();
      a.fftSize = 256;
      src.connect(a).connect(ctx.destination);
      analyser.current = a;
      void ctx.resume();
    } catch {
      /* no analyser: the spark breathes on its own */
    }
  };

  // Start (or restart) a stop: travel to its start, then speak.
  useEffect(() => {
    if (status !== "playing") return;
    const c = clock.current;
    let cancelled = false;
    const speakAfter = (ms: number, data: Loaded) =>
      setTimeout(() => {
        if (cancelled || useTour.getState().status !== "playing" || useTour.getState().index !== index) return;
        c.phase = "speak";
        c.t0 = performance.now() / 1000;
        if (data.audio) void audio.current?.play().catch(() => setCaptionsOnly(true));
      }, ms);
    if (c.loadedFor === index && c.data) {
      // Resuming the same stop: carry on speaking, or finish the journey to its start.
      if (c.phase === "speak") {
        c.t0 = performance.now() / 1000 - c.elapsed;
        if (c.data.audio) void audio.current?.play();
      } else if (c.phase === "travel") {
        scrollTo(c.fromY, tier !== "static");
        speakAfter(tier === "static" ? 300 : TRAVEL * 1000, c.data);
      }
      return () => {
        cancelled = true;
      };
    }
    c.loadedFor = index;
    c.data = null;
    c.phase = "travel";
    c.elapsed = 0;
    setSpoken(0);
    if (bar.current) bar.current.style.transform = "scaleX(0)";
    (async () => {
      if (manifest.current === undefined) {
        try {
          const res = await fetch("/tour/manifest.json");
          manifest.current = res.ok ? (await res.json()).stops : null;
        } catch {
          manifest.current = null;
        }
        setCaptionsOnly(!manifest.current || Object.keys(manifest.current).length === 0);
      }
      const data = await load(stop, manifest.current ?? null);
      if (cancelled) return;
      c.data = data;
      c.fromY = yFor(stop.from);
      c.toY = yFor(stop.to);
      scrollTo(c.fromY, tier !== "static");
      if (data.audio && audio.current) {
        audio.current.src = data.audio;
        audio.current.load();
      }
      speakAfter(tier === "static" ? 300 : TRAVEL * 1000, data);
    })();
    return () => {
      cancelled = true;
    };
  }, [status, index, stop, tier]);

  // Pausing stops the voice; leaving stops everything.
  useEffect(() => {
    if (status === "paused") {
      clock.current.elapsed = performance.now() / 1000 - clock.current.t0;
      audio.current?.pause();
    }
    if (status === "idle" || status === "done") {
      audio.current?.pause();
      clock.current.loadedFor = -1;
    }
  }, [status]);

  // The visitor taking the wheel pauses the tour.
  useEffect(() => {
    if (status !== "playing") return;
    const take = () => pause("You took the wheel — resume whenever you like.");
    const key = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key) && !(e.target as HTMLElement).closest("button")) take();
    };
    window.addEventListener("wheel", take, { passive: true });
    window.addEventListener("touchmove", take, { passive: true });
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("wheel", take);
      window.removeEventListener("touchmove", take);
      window.removeEventListener("keydown", key);
    };
  }, [status, pause]);

  useTicker(() => {
    const c = clock.current;
    // The spark follows the narrator's voice (or breathes gently without audio).
    let amp = 0.15 + 0.1 * Math.sin(performance.now() / 400);
    if (analyser.current && status === "playing" && c.phase === "speak" && c.data?.audio) {
      analyser.current.getByteTimeDomainData(level.current);
      let sum = 0;
      for (const v of level.current) sum += ((v - 128) / 128) ** 2;
      amp = Math.min(1, Math.sqrt(sum / level.current.length) * 6);
    }
    if (orb.current) orb.current.style.transform = `scale(${(1 + amp * 0.9).toFixed(3)})`;

    if (status !== "playing" || c.phase !== "speak" || !c.data) return;
    const now = performance.now() / 1000;
    const elapsed = c.data.audio && audio.current ? audio.current.currentTime : now - c.t0;
    const p = Math.min(1, elapsed / Math.max(0.1, c.data.duration));
    if (tier !== "static") scrollTo(c.fromY + (c.toY - c.fromY) * ease(p), false);
    if (bar.current) bar.current.style.transform = `scaleX(${p})`;

    // Caption progress: map spoken-text progress onto the caption's words.
    let ratio = p;
    if (c.data.words?.length) {
      const total = c.data.words.reduce((n, w) => n + w.w.length, 0);
      let done = 0;
      for (const w of c.data.words) {
        if (w.start > elapsed) break;
        done += w.w.length;
      }
      ratio = done / total;
    }
    const captionTotal = captionWords.reduce((n, w) => n + w.length, 0);
    let acc = 0;
    let shown = 0;
    for (const w of captionWords) {
      acc += w.length;
      if (acc / captionTotal <= ratio + 1e-6) shown++;
      else break;
    }
    if (shown !== spoken) setSpoken(shown);

    const ended = c.data.audio && audio.current ? audio.current.ended : p >= 1;
    if (ended) {
      c.phase = "gap";
      setSpoken(captionWords.length);
      setTimeout(() => {
        const s = useTour.getState();
        if (s.status !== "playing" || s.index !== index) return;
        if (index >= tour.length - 1) finish();
        else go(index + 1);
      }, GAP * 1000);
    }
  });

  if (status === "idle") return null;

  return (
    <AnimatePresence>
      <motion.div
        key="tour"
        role="region"
        aria-label="Guided tour"
        className="fixed inset-x-3 bottom-3 z-[56] border border-hair bg-void/85 px-4 py-3 backdrop-blur-md md:inset-x-auto md:bottom-5 md:left-1/2 md:w-[min(46rem,92vw)] md:-translate-x-1/2 md:px-5"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        data-lenis-prevent
      >
        {status === "disclosure" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <span className="h-3 w-3 shrink-0 rounded-full bg-gold shadow-[0_0_14px_#ffb347]" aria-hidden />
            <div className="flex-1">
              <p className="display text-xl text-ivory">A guided tour · about 2½ minutes</p>
              <p className="mt-1 text-[13px] text-mist">{TOUR_DISCLOSURE} Captions are always on; scroll or press a key at any time to take over.</p>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  ensureAudio();
                  begin();
                }}
                className="mono rounded-full border border-gold/60 px-4 py-2 text-ivory hover:border-gold hover:text-gold"
                data-cursor="link"
              >
                Begin ▸
              </button>
              <button type="button" onClick={exit} className="mono text-faint hover:text-ivory" data-cursor="link">
                Not now
              </button>
            </div>
          </div>
        ) : status === "done" ? (
          <div className="flex flex-wrap items-center gap-4">
            <span className="h-3 w-3 rounded-full bg-gold shadow-[0_0_14px_#ffb347]" aria-hidden />
            <p className="display flex-1 text-lg text-ivory">That&rsquo;s her story. Explore freely — or draw the last thread.</p>
            <button type="button" onClick={() => go(0)} className="mono text-mist hover:text-gold" data-cursor="link">↺ Again</button>
            <button type="button" onClick={exit} className="mono text-mist hover:text-ivory" data-cursor="link">Close</button>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <span className="relative mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
              <span ref={orb} className="absolute inset-0 rounded-full bg-gold/30 blur-[3px] transition-transform duration-75" />
              <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_12px_#ffb347]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="display text-[17px] leading-snug sm:text-[19px]" aria-live="polite" aria-atomic="true">
                <span className="sr-only">{stop.text}</span>
                <span aria-hidden>
                  {captionWords.map((w, k) => (
                    <span key={k} className={`transition-colors duration-300 ${k < spoken ? "text-ivory" : "text-ivory/35"}`}>
                      {w}{" "}
                    </span>
                  ))}
                </span>
              </p>
              {status === "paused" && reason && <p className="mono mt-2 text-[10px] text-gold/80">{reason}</p>}
              <div className="mt-3 flex items-center gap-4">
                <span className="mono text-[10px] text-faint">
                  {String(index + 1).padStart(2, "0")} / {String(tour.length).padStart(2, "0")}
                  {captionsOnly && " · captions only"}
                </span>
                <span className="relative h-px flex-1 bg-hair">
                  <span ref={bar} className="absolute inset-0 origin-left bg-gold" style={{ transform: "scaleX(0)" }} />
                </span>
                <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className="mono text-mist hover:text-ivory disabled:opacity-30" aria-label="Previous stop" data-cursor="link">◂</button>
                {status === "paused" ? (
                  <button type="button" onClick={resume} className="mono text-gold hover:text-ivory" aria-label="Resume tour" data-cursor="link">▸ Resume</button>
                ) : (
                  <button type="button" onClick={() => pause()} className="mono text-mist hover:text-ivory" aria-label="Pause tour" data-cursor="link">❚❚</button>
                )}
                <button type="button" onClick={() => (index >= tour.length - 1 ? finish() : go(index + 1))} className="mono text-mist hover:text-ivory" aria-label="Next stop" data-cursor="link">▸▸</button>
                <button type="button" onClick={exit} className="mono text-faint hover:text-ivory" aria-label="End tour" data-cursor="link">✕</button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
