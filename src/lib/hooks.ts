"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useUI } from "./store";
import { chapterProgress } from "./world";

/** Run `cb` on GSAP's ticker (shared with Lenis and ScrollTrigger). */
export function useTicker(cb: () => void) {
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  });
  useEffect(() => {
    const fn = () => ref.current();
    gsap.ticker.add(fn);
    return () => gsap.ticker.remove(fn);
  }, []);
}

/** Which of `count` items a pinned chapter is showing, from scroll. */
export function useStep(chapter: number, count: number) {
  const [step, setStep] = useState({ index: 0, local: 0 });
  const last = useRef(-1);
  useTicker(() => {
    const p = chapterProgress(chapter);
    const scaled = Math.min(count - 0.0001, p * count);
    const index = Math.floor(scaled);
    if (index !== last.current) {
      last.current = index;
      setStep({ index, local: scaled - index });
    }
  });
  return step;
}

/** True while this chapter is the one on screen. */
export function useIsChapter(chapter: number) {
  return useUI((s) => s.chapter === chapter);
}

export function useIsCinematic() {
  return useUI((s) => s.tier !== null && s.tier !== "static");
}
