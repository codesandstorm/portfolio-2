"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { profile } from "@/content/data";
import { useSound } from "@/audio/useSound";
import { chapters } from "@/lib/chapters";
import { scrollToChapter } from "@/lib/scroll";
import { useUI } from "@/lib/store";

function SoundToggle() {
  const enabled = useSound((s) => s.enabled);
  const toggle = useSound((s) => s.toggle);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Turn sound off" : "Turn sound on"}
      className="group flex h-9 items-center gap-2.5 px-1 text-mist transition-colors hover:text-ivory"
      data-cursor="link"
    >
      <span className="flex h-3 items-end gap-[2px]" aria-hidden>
        {[0.45, 1, 0.7, 0.85].map((h, i) => (
          <motion.span
            key={i}
            className="w-px bg-gold"
            animate={enabled ? { scaleY: [h * 0.4, h, h * 0.55] } : { scaleY: 0.18 }}
            transition={enabled ? { duration: 1.1 + i * 0.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" } : { duration: 0.4 }}
            style={{ height: 12, originY: 1 }}
          />
        ))}
      </span>
      <span className="mono hidden sm:inline">{enabled ? "Sound on" : "Sound off"}</span>
    </button>
  );
}

export function TopBar() {
  const indexOpen = useUI((s) => s.indexOpen);
  const setIndexOpen = useUI((s) => s.setIndexOpen);
  const chapter = useUI((s) => s.chapter);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea")) return;
      if (e.key === "m" || e.key === "M") setIndexOpen(!useUI.getState().indexOpen);
      if (e.key === "Escape") setIndexOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setIndexOpen]);

  return (
    <>
      <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[70] bg-void px-3 py-2 text-ivory">
        Skip to content
      </a>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-[var(--gutter)] pt-4 sm:pt-6">
        <a
          href="#signal"
          onClick={(e) => { e.preventDefault(); scrollToChapter("signal"); }}
          className="pointer-events-auto flex items-center gap-3 text-ivory"
          aria-label="Akshita Mahajan — back to the beginning"
          data-cursor="link"
        >
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inset-0 rounded-full bg-gold shadow-[0_0_12px_#ffb347]" />
          </span>
          <span className="mono text-ivory/80">Akshita Mahajan</span>
        </a>
        <nav aria-label="Elsewhere" className="pointer-events-auto flex items-center gap-4 sm:gap-6">
          <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="mono text-mist transition-colors hover:text-gold" data-cursor="external">
            LinkedIn<span aria-hidden> ↗</span>
          </a>
          <a href={profile.links.github} target="_blank" rel="noreferrer" className="mono hidden text-mist transition-colors hover:text-gold sm:inline" data-cursor="external">
            GitHub<span aria-hidden> ↗</span>
          </a>
          <SoundToggle />
          <button
            type="button"
            onClick={() => setIndexOpen(!indexOpen)}
            aria-expanded={indexOpen}
            aria-controls="chapter-index"
            className="mono flex h-9 items-center gap-2 text-mist transition-colors hover:text-ivory"
            data-cursor="link"
          >
            <span aria-hidden className="text-gold">{chapters[chapter]?.n}</span>
            Index
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {indexOpen && (
          <motion.div
            id="chapter-index"
            role="dialog"
            aria-modal="true"
            aria-label="Chapter index"
            className="fixed inset-0 z-50 flex items-center bg-void/92 px-[var(--gutter)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setIndexOpen(false)}
          >
            <ol className="mx-auto w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              {chapters.map((c, i) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-hair"
                >
                  <a
                    href={`#${c.id}`}
                    autoFocus={i === chapter}
                    onClick={(e) => {
                      e.preventDefault();
                      setIndexOpen(false);
                      scrollToChapter(c.id);
                    }}
                    className="group flex items-baseline gap-5 py-3 sm:py-4"
                    data-cursor="link"
                  >
                    <span className={`mono w-8 ${i === chapter ? "text-gold" : "text-faint"}`}>{c.n}</span>
                    <span className="display text-3xl text-ivory transition-colors group-hover:text-gold sm:text-5xl">{c.title}</span>
                    <span className="mono ml-auto hidden text-faint sm:inline">{c.plain}</span>
                  </a>
                </motion.li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
