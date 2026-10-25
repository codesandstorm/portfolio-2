"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { sfx } from "@/audio/useSound";
import { useUI } from "./store";
import { STICKY, world } from "./world";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

type Section = { top: number; h: number };
let sections: Section[] = [];

function measure() {
  sections = [...document.querySelectorAll<HTMLElement>("[data-chapter]")].map((el) => ({
    top: el.getBoundingClientRect().top + window.scrollY,
    h: el.offsetHeight,
  }));
}

/** Map the scroll position onto continuous story time. */
function storyTime(y: number) {
  const vh = window.innerHeight;
  for (let i = sections.length - 1; i >= 0; i--) {
    const s = sections[i];
    if (y < s.top && i > 0) continue;
    const sticky = Math.max(1, s.h - vh);
    const into = y - s.top;
    if (into <= sticky) return i + STICKY * Math.max(0, into / sticky);
    return Math.min(i + 1, i + STICKY + (1 - STICKY) * ((into - sticky) / vh));
  }
  return 0;
}

export function scrollToChapter(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  if (lenis) {
    lenis.scrollTo(top, {
      duration: 1.6,
      // If anything above moved while we were flying (fonts, a slow device), land exactly on the section anyway.
      onComplete: (l) => {
        const off = el.getBoundingClientRect().top;
        if (Math.abs(off) > 2) l.scrollTo(window.scrollY + off, { immediate: true, force: true });
      },
    });
  } else window.scrollTo({ top, behavior: "auto" });
  history.replaceState(null, "", `#${id}`);
}

/** Owns smooth scrolling and turns scroll into story time for the world. */
export function ScrollDirector({ smoothScroll }: { smoothScroll: boolean }) {
  useEffect(() => {
    measure();
    if (smoothScroll) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: false });
      lenis.on("scroll", ScrollTrigger.update);
      // Visual QA hook: lets automated checks jump without fighting the smoothing.
      if (process.env.NODE_ENV !== "production") (window as unknown as { __lenis: Lenis }).__lenis = lenis;
    }
    const raf = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    let last = -1;
    const tick = () => {
      world.t = storyTime(window.scrollY);
      const c = Math.min(sections.length - 1, Math.floor(world.t + 0.04));
      if (c !== last) {
        if (last !== -1) sfx.swell();
        last = c;
        useUI.getState().setChapter(c);
      }
    };
    gsap.ticker.add(tick);

    const onResize = () => {
      measure();
      ScrollTrigger.refresh();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    window.addEventListener("resize", onResize);

    // Honour a deep link once layout settles.
    if (location.hash) requestAnimationFrame(() => scrollToChapter(location.hash.slice(1)));

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.remove(tick);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      lenis?.destroy();
      lenis = null;
    };
  }, [smoothScroll]);

  return null;
}
