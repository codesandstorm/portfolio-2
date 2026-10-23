"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { chapters } from "@/lib/chapters";
import { useUI } from "@/lib/store";

const HOLD_MS = 1500;

/**
 * The title card between sections: as you arrive in one, its number and name
 * pass through the middle of the frame under a thin sweep of light — the same
 * light that strikes her name on the landing — so you always know where you are.
 */
export function SectionBeat() {
  const chapter = useUI((s) => s.chapter);
  const flow = useUI((s) => s.tier === "static");
  const indexOpen = useUI((s) => s.indexOpen);
  const [beat, setBeat] = useState<number | null>(null);

  useEffect(() => {
    const quiet = flow || indexOpen || chapter === 0;
    // Wait a moment so scrolling straight through several sections doesn't flash each one.
    const show = window.setTimeout(() => setBeat(quiet ? null : chapter), quiet ? 0 : 140);
    const hide = window.setTimeout(() => setBeat(null), 140 + HOLD_MS);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [chapter, flow, indexOpen]);

  const c = beat === null ? null : chapters[beat];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[35] flex items-center justify-center">
      <AnimatePresence>
        {c && (
          <motion.div
            key={c.id}
            className="relative flex flex-col items-center px-10 py-8 text-center"
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="absolute inset-[-40%] -z-10 bg-[radial-gradient(closest-side,rgba(5,6,8,0.78),transparent)]" />
            <motion.span
              className="absolute inset-y-0 -left-1/4 w-1/2 -z-10 skew-x-[-18deg] bg-[linear-gradient(95deg,transparent,rgba(130,195,255,0.06)_32%,rgba(255,245,210,0.2)_50%,rgba(255,180,70,0.08)_68%,transparent)] mix-blend-screen"
              initial={{ x: "-60%", opacity: 0 }}
              animate={{ x: "220%", opacity: [0, 0.9, 0] }}
              transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
            />
            <span className="title-face text-[0.8rem] tracking-[0.4em] text-[#d48b3b]">{c.n}</span>
            <span className="title-face mt-3 block text-[clamp(2rem,5vw,4.2rem)] uppercase leading-none tracking-[0.32em] text-[#f4ecdf] [margin-right:-0.32em] [text-shadow:0_0_24px_rgba(245,205,140,0.25)]">
              {c.title}
            </span>
            <span className="mt-4 h-[1.5px] w-16 bg-gradient-to-r from-[#d48b3b] to-[#f5be74] shadow-[0_0_8px_rgba(212,139,59,0.6)]" />
            <span className="mono mt-4 text-mist">{c.plain}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
