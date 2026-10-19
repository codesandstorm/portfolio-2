"use client";

import { useRef } from "react";
import { chapters } from "@/lib/chapters";
import { useTicker } from "@/lib/hooks";
import { scrollToChapter } from "@/lib/scroll";
import { useUI } from "@/lib/store";
import { world } from "@/lib/world";

/** A thread down the right edge that fills with gold as the story travels. */
export function ChapterNav() {
  const fill = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const chapter = useUI((s) => s.chapter);
  const introDone = useUI((s) => s.introDone);

  useTicker(() => {
    const p = Math.min(1, world.t / (chapters.length - 1));
    if (fill.current) fill.current.style.transform = `scaleY(${p})`;
    if (bar.current) bar.current.style.transform = `scaleX(${p})`;
  });

  return (
    <>
      <nav
        aria-label="Chapters"
        className={`fixed right-[calc(var(--gutter)*0.6)] top-1/2 z-30 hidden -translate-y-1/2 transition-opacity duration-700 md:block ${introDone ? "opacity-100" : "opacity-0"}`}
      >
        <div className="relative flex flex-col gap-[3.2vh] py-1">
          <span className="absolute left-[3.5px] top-0 h-full w-px bg-hair" aria-hidden />
          <span ref={fill} className="absolute left-[3.5px] top-0 h-full w-px origin-top bg-gold" aria-hidden />
          {chapters.map((c, i) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              onClick={(e) => { e.preventDefault(); scrollToChapter(c.id); }}
              aria-current={i === chapter ? "step" : undefined}
              className="group relative flex items-center"
              data-cursor="link"
            >
              <span
                className={`relative z-10 h-2 w-2 rounded-full border transition-all duration-500 ${
                  i === chapter ? "scale-125 border-gold bg-gold shadow-[0_0_10px_#ffb347]" : i < chapter ? "border-gold bg-void" : "border-faint bg-void"
                }`}
              />
              <span
                className={`mono pointer-events-none absolute right-6 whitespace-nowrap transition-all duration-500 ${
                  i === chapter ? "translate-x-0 text-ivory opacity-100" : "translate-x-2 text-mist opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                }`}
              >
                <span className="text-gold">{c.n}</span> {c.title}
              </span>
            </a>
          ))}
        </div>
      </nav>
      <div className="fixed inset-x-0 bottom-0 z-30 h-px bg-hair md:hidden" aria-hidden>
        <span ref={bar} className="block h-full origin-left bg-gold" />
      </div>
    </>
  );
}
