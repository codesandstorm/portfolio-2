"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { chapterIndex, type ChapterId } from "@/lib/chapters";
import { useCompact, useIsChapter, useTicker } from "@/lib/hooks";
import { useUI } from "@/lib/store";
import { chapterProgress } from "@/lib/world";
import { useFlow } from "./Chapter";

/**
 * Steps through `items` as the chapter is scrolled. Each item becomes the
 * world's focus (its node lights and its threads carry energy). `render`
 * receives `reveal` — how far into its own scroll segment the item is — so
 * its parts can arrive in order. In the static tier every item is shown.
 */
export function Stepped<T extends { id: string }>({
  chapter,
  items,
  render,
  onStep,
}: {
  chapter: ChapterId;
  items: T[];
  render: (item: T, index: number, reveal: number) => ReactNode;
  onStep?: (index: number, local: number) => void;
}) {
  const flow = useFlow();
  const ci = chapterIndex[chapter];
  const isActive = useIsChapter(ci);
  const setScrollFocus = useUI((s) => s.setScrollFocus);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState(0);
  const onStepRef = useRef(onStep);
  useEffect(() => {
    onStepRef.current = onStep;
  });

  useTicker(() => {
    if (flow) return;
    const p = chapterProgress(ci);
    const scaled = Math.min(items.length - 0.0001, p * items.length);
    const i = Math.floor(scaled);
    const local = scaled - i;
    // Quantise so React only re-renders when a part should appear.
    const q = Math.round(local * 20) / 20;
    if (i !== index) setIndex(i);
    if (q !== reveal) setReveal(q);
    onStepRef.current?.(i, local);
  });

  useEffect(() => {
    if (isActive && !flow) setScrollFocus(items[index].id);
  }, [isActive, index, items, flow, setScrollFocus]);

  if (flow) return <div className="space-y-[16vh]">{items.map((it, i) => <div key={it.id}>{render(it, i, 1)}</div>)}</div>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={items[index].id}
        initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {render(items[index], index, reveal)}
      </motion.div>
    </AnimatePresence>
  );
}

/** A block that arrives once `reveal` passes `at`. */
export function Arrive({ at, reveal, children, className = "" }: { at: number; reveal: number; children: ReactNode; className?: string }) {
  const shown = reveal >= at;
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 12 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden={!shown}
    >
      {children}
    </motion.div>
  );
}

export type Section = { at: number; key: string; node: ReactNode; className?: string };

/**
 * The parts of a stepped item. On wide screens they accumulate in a grid; on
 * phones only the newest part is shown, with ticks for where you are.
 */
export function Sections({ reveal, items }: { reveal: number; items: Section[] }) {
  const compact = useCompact();
  const flow = useFlow();
  if (flow || !compact) {
    return (
      <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-x-8">
        {items.map((s) => (
          <Arrive key={s.key} at={flow ? 0 : s.at} reveal={reveal} className={s.className}>
            {s.node}
          </Arrive>
        ))}
      </div>
    );
  }
  const shown = items.filter((s) => reveal >= s.at);
  const current = shown[shown.length - 1] ?? items[0];
  return (
    <div className="mt-4">
      <div className="mb-3 flex gap-1.5" aria-hidden>
        {items.map((s) => (
          <span key={s.key} className={`h-px flex-1 transition-colors duration-500 ${reveal >= s.at ? "bg-gold" : "bg-hair"}`} />
        ))}
      </div>
      <div className="min-h-[10rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {current.node}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <h4 className="mono mb-2 text-gold/90">{children}</h4>;
}
