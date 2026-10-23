"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { profile } from "@/content/data";
import { facets } from "@/content/story";
import { chapterIndex } from "@/lib/chapters";
import { useTicker } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { chapterProgress, smooth, world } from "@/lib/world";
import { Chapter, Kicker, useFlow } from "./Chapter";

const facts = [
  ["Studies", "B.Tech Computer Science (CSIT), Symbiosis University of Applied Sciences · 2025 – 29"],
  ["Was", "Full Stack Engineer intern, IIT Indore · i-SOFTZONE"],
  ["Belongs to", "IEEE · IEEE Women in Engineering · SUAS ACM-W"],
  ["Based in", profile.location],
  ["Open to", profile.openTo],
] as const;

/** 02 — Akshita. A point-cloud portrait in the dark, and the facets she has evidence for. */
export function AkshitaChapter() {
  const flow = useFlow();
  const select = useUI((s) => s.select);
  const [active, setActive] = useState(0);
  const intro = useRef<HTMLDivElement>(null);
  const handoff = useRef<HTMLParagraphElement>(null);

  useTicker(() => {
    if (flow) return;
    const p = chapterProgress(chapterIndex.akshita);
    const i = Math.min(facets.length - 1, Math.floor(Math.min(0.999, Math.max(0, (p - 0.24) / 0.52)) * facets.length));
    if (i !== active) setActive(i);
    if (handoff.current) {
      const h = smooth(0.84, 0.92, p) * (1 - smooth(chapterIndex.akshita + 1, chapterIndex.akshita + 1.12, world.t));
      handoff.current.style.opacity = h.toFixed(3);
      handoff.current.style.transform = `translateY(${((1 - h) * 16).toFixed(1)}px)`;
    }
    if (intro.current) {
      // The words step aside just before her portrait breaks into the network.
      const r = smooth(0.04, 0.18, p) * (1 - smooth(0.8, 0.88, p));
      intro.current.style.opacity = r.toFixed(3);
      intro.current.style.transform = `translateY(${((1 - r) * 24).toFixed(1)}px)`;
    }
  });

  return (
    <Chapter id="akshita" scrim="right">
      <div className={flow ? "mx-auto grid max-w-5xl gap-12 md:grid-cols-2" : "flex h-full items-end pb-[10svh] md:items-center md:justify-end md:pb-0"}>
        <div ref={intro} className="w-full max-w-[30rem] md:mr-[4vw]" style={flow ? undefined : { opacity: 0 }}>
          <Kicker id="akshita" />
          <h2 id="akshita-title" className="display mt-5 text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] text-ivory">
            Akshita
            <br />
            <span className="italic text-gold">Mahajan</span>
          </h2>
          <dl className="mt-6 hidden space-y-2 sm:block">
            {facts.map(([k, v]) => (
              <div key={k} className="flex gap-4 border-t border-hair pt-2">
                <dt className="mono w-24 shrink-0 text-faint">{k}</dt>
                <dd className="text-sm text-ivory/85">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8" aria-live="polite">
            {flow ? (
              <ul className="space-y-5">
                {facets.map((f) => (
                  <li key={f.word}>
                    <button type="button" onClick={() => select(f.focus)} className="text-left" data-cursor="link">
                      <span className="display block text-3xl text-gold">{f.word}</span>
                      <span className="mt-1 block text-mist">{f.proof}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <div className="flex flex-wrap gap-x-4 gap-y-1" aria-hidden>
                  {facets.map((f, i) => (
                    <span key={f.word} className={`mono transition-colors duration-500 ${i === active ? "text-gold" : i < active ? "text-mist" : "text-faint/60"}`}>
                      {f.word}
                    </span>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.button
                    key={facets[active].word}
                    type="button"
                    onClick={() => select(facets[active].focus)}
                    className="mt-4 block text-left"
                    initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    data-cursor="link"
                  >
                    <span className="display block text-[clamp(2.2rem,4.4vw,3.6rem)] leading-none text-ivory">{facets[active].word}</span>
                    <span className="mt-3 block max-w-md text-[15px] leading-relaxed text-mist">{facets[active].proof}</span>
                    <span className="mono mt-3 inline-block text-gold/80">See the evidence →</span>
                  </motion.button>
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </div>
      {!flow && (
        <p ref={handoff} className="pointer-events-none absolute inset-x-0 bottom-[12svh] px-6 text-center" style={{ opacity: 0 }} aria-hidden>
          <span className="display block text-[clamp(1.6rem,3.2vw,2.6rem)] italic text-ivory">Then every point of her becomes a connection.</span>
          <span className="mono mt-3 block text-gold/80">She is the centre of everything that follows</span>
        </p>
      )}
      {!profile.portrait && !flow && (
        <p className="mono absolute bottom-5 left-[var(--gutter)] hidden text-faint/70 md:block">Portrait · abstract placeholder until her photograph is supplied</p>
      )}
    </Chapter>
  );
}
