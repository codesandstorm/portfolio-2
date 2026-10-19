"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { signals, voiceMoments } from "@/content/data";
import { formatDate, getNode } from "@/content/graph";
import { statements } from "@/content/story";
import { sfx } from "@/audio/useSound";
import { chapterIndex } from "@/lib/chapters";
import { useIsChapter, useTicker } from "@/lib/hooks";
import { focusOf, useUI } from "@/lib/store";
import { chapterProgress, smooth } from "@/lib/world";
import { screenPos } from "@/world/labels";
import { Chapter, Kicker, useFlow } from "./Chapter";

/** Where each statement's words fly when the sentence completes. */
const TARGETS: string[][] = [
  ["s-networking", "s-teamwork", "s-research", "s-leadership"],
  ["s-teaching", "x-ieee", "s-communication"],
  ["x-iit", "p-breastcare", "s-teamwork"],
];
const STATEMENT_SHARE = 0.42;
const chronological = [...signals].sort((a, b) => a.date.localeCompare(b.date));

function SignalRail() {
  const read = useUI((s) => s.read);
  const hover = useUI((s) => s.hover);
  const focus = useUI(focusOf);
  return (
    <div className="w-full">
      <p className="mono mb-3 flex justify-between text-faint">
        <span>Her signals on LinkedIn · {signals.length} posts</span>
        <span className="hidden sm:inline">Aug 2025 → Oct 2026</span>
      </p>
      <ol className="flex h-12 items-end justify-between gap-[2px] border-b border-hair" aria-label="LinkedIn posts in date order">
        {chronological.map((s) => {
          const on = focus === s.id;
          return (
            <li key={s.id} className="group relative flex h-full flex-1 items-end justify-center">
              <button
                type="button"
                onClick={() => { sfx.shimmer(); read(s.id); }}
                onPointerEnter={() => hover(s.id)}
                onPointerLeave={() => hover(null)}
                onFocus={() => hover(s.id)}
                onBlur={() => hover(null)}
                className="flex h-full w-full items-end justify-center"
                aria-label={`${s.title}, ${formatDate(s.date)}`}
                data-cursor="link"
              >
                <span
                  className={`w-px transition-all duration-500 ${on ? "bg-gold shadow-[0_0_8px_#ffb347]" : s.featured ? "bg-ivory/70 group-hover:bg-gold" : "bg-ivory/30 group-hover:bg-gold"}`}
                  style={{ height: on ? "100%" : s.featured ? "62%" : "30%" }}
                />
              </button>
              <span className="mono pointer-events-none absolute bottom-full mb-2 hidden whitespace-nowrap text-ivory opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:block">
                {s.title}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** 07 — Lead. Her voice: statements that become light, stage moments, LinkedIn signals. */
export function LeadChapter() {
  const flow = useFlow();
  const ci = chapterIndex.lead;
  const isActive = useIsChapter(ci);
  const setScrollFocus = useUI((s) => s.setScrollFocus);
  const read = useUI((s) => s.read);
  const [stmt, setStmt] = useState(0);
  const [moment, setMoment] = useState(-1);
  const words = useRef<(HTMLSpanElement | null)[]>([]);
  const flown = useRef(false);

  useTicker(() => {
    if (flow) return;
    const p = chapterProgress(ci);
    if (p < STATEMENT_SHARE) {
      const scaled = (p / STATEMENT_SHARE) * statements.length;
      const si = Math.min(statements.length - 1, Math.floor(scaled));
      const local = scaled - si;
      if (si !== stmt) { setStmt(si); flown.current = false; }
      if (moment !== -1) setMoment(-1);
      const n = statements[si].words.length;
      words.current.forEach((el, w) => {
        if (!el || w >= n || flown.current) return;
        const r = smooth(0.05 + (w / n) * 0.45, 0.12 + (w / n) * 0.45, local);
        el.style.opacity = r.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - r) * 0.5).toFixed(3)}em, 0)`;
        el.style.filter = `blur(${((1 - r) * 8).toFixed(1)}px)`;
      });
      const shouldFly = local > 0.72;
      if (shouldFly !== flown.current) {
        flown.current = shouldFly;
        const targets = TARGETS[si];
        if (shouldFly) {
          sfx.shimmer(si * 2);
          if (isActive) setScrollFocus(targets[0]);
          words.current.slice(0, n).forEach((el, w) => {
            if (!el) return;
            const t = screenPos.get(targets[w % targets.length]);
            const r = el.getBoundingClientRect();
            const dx = t?.visible ? t.x - (r.left + r.width / 2) : -200;
            const dy = t?.visible ? t.y - (r.top + r.height / 2) : 0;
            gsap.to(el, { x: dx, y: dy, scale: 0.15, opacity: 0, filter: "blur(2px)", duration: 1.1, delay: w * 0.06, ease: "power3.in", overwrite: true });
          });
        } else {
          words.current.slice(0, n).forEach((el) => el && gsap.to(el, { x: 0, y: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.6, overwrite: true }));
        }
      }
    } else {
      const scaled = ((p - STATEMENT_SHARE) / (1 - STATEMENT_SHARE)) * voiceMoments.length;
      const mi = Math.min(voiceMoments.length - 1, Math.floor(scaled));
      if (mi !== moment) setMoment(mi);
    }
  });

  useEffect(() => {
    if (!isActive || flow) return;
    if (moment >= 0) setScrollFocus(voiceMoments[moment].signal);
    else if (!flown.current) setScrollFocus("x-ieee");
  }, [isActive, moment, flow, setScrollFocus]);

  const s = statements[stmt];

  return (
    <Chapter id="lead" scrim="right">
      <div className={flow ? "mx-auto max-w-4xl" : "flex h-full flex-col justify-between pb-[6svh] pt-[16svh]"}>
        <div className="md:ml-auto md:mr-[7.5rem] md:w-[min(36rem,44vw)]">
          <Kicker id="lead" />
          <h2 id="lead-title" className="sr-only">Lead — her voice, leadership and LinkedIn</h2>

          {flow ? (
            <div className="mt-8 space-y-10">
              {statements.map((st) => (
                <blockquote key={st.source}>
                  <p className="display text-4xl text-ivory">{st.words.join(" ")}</p>
                  {"tail" in st && <p className="display mt-2 text-2xl italic text-gold">{st.tail}</p>}
                  <footer className="mono mt-2 text-faint">{st.source}</footer>
                </blockquote>
              ))}
              <ul className="space-y-6">
                {voiceMoments.map((m) => (
                  <li key={m.id}>
                    <p className="mono text-gold">{m.label} · {m.date}</p>
                    <button type="button" onClick={() => read(m.signal)} className="display mt-1 text-left text-3xl text-ivory hover:text-gold" data-cursor="link">{m.title}</button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="relative mt-8 min-h-[16rem] sm:min-h-[18rem]">
              <AnimatePresence mode="wait">
                {moment < 0 ? (
                  <motion.blockquote key={`s${stmt}`} initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    <p className="display text-[clamp(2.4rem,5.4vw,4.6rem)] leading-[1.02] text-ivory">
                      {s.words.map((w, i) => (
                        <span key={`${stmt}-${i}`} ref={(el) => { words.current[i] = el; }} className="mr-[0.25em] inline-block" style={{ opacity: 0 }}>
                          {w}
                        </span>
                      ))}
                    </p>
                    {"tail" in s && <p className="display mt-3 text-2xl italic text-gold/90">{s.tail}</p>}
                    <footer className="mono mt-4 text-faint">{s.source}</footer>
                  </motion.blockquote>
                ) : (
                  <motion.div
                    key={voiceMoments[moment].id}
                    initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p className="mono text-gold">
                      {String(moment + 1).padStart(2, "0")} / {String(voiceMoments.length).padStart(2, "0")} · {voiceMoments[moment].label} · {voiceMoments[moment].date}
                    </p>
                    <h3 className="display mt-3 text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.02] text-ivory">{voiceMoments[moment].title}</h3>
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-mist">{(getNode(voiceMoments[moment].signal) && signals.find((x) => x.id === voiceMoments[moment].signal)?.summary) ?? ""}</p>
                    <button type="button" onClick={() => read(voiceMoments[moment].signal)} className="thread-link mono mt-5 text-gold" data-cursor="link">
                      Read the signal
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        <div className={flow ? "mt-16" : ""}>
          <SignalRail />
        </div>
      </div>
    </Chapter>
  );
}
