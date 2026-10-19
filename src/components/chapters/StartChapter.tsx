"use client";

import { useRef } from "react";
import { origin } from "@/content/story";
import { chapterIndex } from "@/lib/chapters";
import { useTicker } from "@/lib/hooks";
import { chapterProgress, smooth } from "@/lib/world";
import { Chapter, Kicker, useFlow } from "./Chapter";

/** 01 — Just start. Her origin story, told while the camera flies into the network. */
export function StartChapter() {
  const flow = useFlow();
  const lines = useRef<(HTMLElement | null)[]>([]);
  const closing = useRef<HTMLParagraphElement>(null);

  useTicker(() => {
    if (flow) return;
    const p = chapterProgress(chapterIndex.start);
    lines.current.forEach((el, i) => {
      if (!el) return;
      const at = 0.06 + i * 0.13;
      const r = smooth(at, at + 0.08, p);
      // Earlier lines step back as new ones arrive.
      const recede = 1 - smooth(at + 0.2, at + 0.5, p) * 0.6;
      el.style.setProperty("--r", r.toFixed(3));
      el.style.opacity = recede.toFixed(3);
    });
    if (closing.current) {
      const r = smooth(0.78, 0.9, p);
      closing.current.style.setProperty("--r", r.toFixed(3));
    }
  });

  return (
    <Chapter id="start">
      <div className={flow ? "mx-auto max-w-3xl" : "flex h-full flex-col justify-end pb-[14svh] sm:pb-[12svh]"}>
        <Kicker id="start" />
        <h2 id="start-title" className="sr-only">Just start — her origin story</h2>
        <div className="mt-6 max-w-[34rem] space-y-3">
          {origin.map((l, i) => (
            <p key={i} ref={(el) => { lines.current[i] = el; }} className="reveal-line">
              <span>
                {l.kicker && <span className="mono mb-1 block text-gold/80">{l.kicker}</span>}
                <span className="display block text-[clamp(1.6rem,3.6vw,2.6rem)] leading-[1.08] text-ivory">{l.text}</span>
              </span>
            </p>
          ))}
        </div>
        <p ref={closing} className="reveal-line mt-10">
          <span className="mono text-mist">
            Source · her post “4 internships in 15 days”, 11 Jul 2026 — <span className="text-gold">and at the centre of all of it:</span>
          </span>
        </p>
      </div>
    </Chapter>
  );
}
