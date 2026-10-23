"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useUI } from "./store";

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

/** True while this chapter is the one on screen. */
export function useIsChapter(chapter: number) {
  return useUI((s) => s.chapter === chapter);
}

/** Phone-width layout: one idea on screen at a time. */
export function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setCompact(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return compact;
}

export function useIsCinematic() {
  return useUI((s) => s.tier !== null && s.tier !== "static");
}
