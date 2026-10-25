"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { chapters } from "@/lib/chapters";
import { scrollToChapter } from "@/lib/scroll";
import { useUI } from "@/lib/store";
import { useTour } from "@/lib/tour";

/** Every section, in the order they come; on tablets and phones they live in the Menu (M). */
const NAV = [
  { id: "akshita", label: "About" },
  { id: "collaborate", label: "Experience" },
  { id: "build", label: "Projects" },
  { id: "learn", label: "Skills" },
  { id: "converge", label: "Achievements" },
  { id: "lead", label: "Latest" },
  { id: "continue", label: "Connect" },
] as const;

/** Gold hairline under the section you are in — the landing's HOME mark, carried through the site. */
function Indicator({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute -bottom-[7px] left-1/2 h-[1.5px] w-7 -translate-x-1/2 bg-gradient-to-r from-[#d48b3b] to-[#f5be74] shadow-[0_0_8px_rgba(212,139,59,0.6)] transition-[opacity,transform] duration-500 ${on ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`}
    />
  );
}

export function TopBar() {
  const indexOpen = useUI((s) => s.indexOpen);
  const ready = useUI((s) => s.ready);
  const setIndexOpen = useUI((s) => s.setIndexOpen);
  const chapter = useUI((s) => s.chapter);
  const here = chapters[chapter]?.id;

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

  const item = "title-face relative text-[0.64rem] font-medium uppercase tracking-[0.14em] xl:text-[0.7rem] xl:tracking-[0.22em] transition-[color,text-shadow] duration-300 hover:text-white hover:[text-shadow:0_0_12px_rgba(255,255,255,0.4)]";

  return (
    <>
      <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[70] bg-void px-3 py-2 text-ivory">
        Skip to content
      </a>
      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-40 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
      >
        {/* Past the landing the bar gets a soft floor of night so it reads over any section. */}
        <div
          aria-hidden
          className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#050608]/90 via-[#050608]/55 to-transparent transition-opacity duration-700 ${chapter > 0 ? "opacity-100" : "opacity-0"}`}
        />
        <div className="relative flex items-center justify-between px-[4.8vw] pt-[2.6vh] sm:pt-[4.2vh]">
          <a
            href="#signal"
            onClick={(e) => { e.preventDefault(); scrollToChapter("signal"); }}
            className={`pointer-events-auto ${item} ${here === "signal" ? "text-[#ecd6b8]" : "text-[#948b80]"}`}
            aria-label="Home — Akshita Mahajan"
            aria-current={here === "signal" ? "location" : undefined}
            data-cursor="link"
          >
            Home
            <Indicator on={here === "signal"} />
          </a>
          <nav aria-label="Primary" className="pointer-events-auto flex items-center gap-5 sm:gap-7">
            <ul className="hidden items-center gap-[1.1rem] lg:flex xl:gap-[2rem]">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    onClick={(e) => { e.preventDefault(); scrollToChapter(n.id); }}
                    aria-current={here === n.id ? "location" : undefined}
                    className={`${item} ${here === n.id ? "text-[#ecd6b8]" : "text-[#948b80]"}`}
                    data-cursor="link"
                  >
                    {n.label}
                    <Indicator on={here === n.id} />
                  </a>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => useTour.getState().open()}
              className={`${item} text-[#dfbe88]`}
              aria-label="Start the narrated guided tour"
              data-cursor="link"
            >
              Tour ▸
            </button>
            <span aria-hidden className="hidden h-3 w-px bg-[#948b80]/30 sm:block" />
            <button
              type="button"
              onClick={() => useUI.getState().setAskOpen(!useUI.getState().askOpen)}
              className="mono hidden items-center gap-1.5 text-mist transition-colors hover:text-gold sm:flex"
              aria-label="Ask the constellation a question"
              data-cursor="link"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_#ffb347]" aria-hidden />
              Ask
            </button>
            <button
              type="button"
              onClick={() => setIndexOpen(!indexOpen)}
              aria-expanded={indexOpen}
              aria-controls="chapter-index"
              className="mono flex h-9 items-center gap-2 text-mist transition-colors hover:text-ivory lg:hidden"
              data-cursor="link"
            >
              <span aria-hidden className="text-gold">{chapters[chapter]?.n}</span>
              Menu
            </button>
          </nav>
        </div>
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
