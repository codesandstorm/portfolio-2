"use client";

import type { CSSProperties, ReactNode } from "react";
import { chapters, type ChapterId, chapterIndex } from "@/lib/chapters";
import { useUI } from "@/lib/store";

/**
 * A chapter is a tall section with a pinned stage. In the static tier (no
 * WebGL / reduced motion) it becomes ordinary flowing content.
 */
/** Atmosphere behind a text column so light passing behind it never costs legibility. */
const SCRIM = {
  right:
    "bg-[linear-gradient(to_top,rgba(5,6,8,0.94)_0%,rgba(5,6,8,0.75)_45%,transparent_72%)] md:bg-[linear-gradient(to_left,rgba(5,6,8,0.9)_0%,rgba(5,6,8,0.72)_38%,transparent_62%)]",
  left:
    "bg-[linear-gradient(to_bottom,rgba(5,6,8,0.9)_0%,rgba(5,6,8,0.6)_30%,transparent_48%)] md:bg-[linear-gradient(to_right,rgba(5,6,8,0.85)_0%,rgba(5,6,8,0.55)_28%,transparent_45%)]",
};

export function Chapter({
  id,
  children,
  className = "",
  scrim,
  free = false,
}: {
  id: ChapterId;
  children: ReactNode;
  className?: string;
  scrim?: keyof typeof SCRIM;
  /** Content that should be read all at once (a grid, a list) rather than pinned and stepped through. */
  free?: boolean;
}) {
  const flow = useUI((s) => s.tier === "static");
  const c = chapters[chapterIndex[id]];
  const style = { "--h-d": `${c.vh[0]}vh`, "--h-m": `${c.vh[1]}vh` } as CSSProperties;
  if (free && !flow) {
    return (
      <section id={id} data-chapter={id} aria-labelledby={`${id}-title`} className="relative z-10 min-h-svh">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent,rgba(5,6,8,0.72)_14%,rgba(5,6,8,0.72)_86%,transparent)]" />
        <div className={`px-[var(--gutter)] pb-[14svh] pt-[16svh] ${className}`}>{children}</div>
      </section>
    );
  }
  return (
    <section
      id={id}
      data-chapter={id}
      aria-labelledby={`${id}-title`}
      style={flow ? undefined : style}
      className={flow ? "relative z-10 py-[18vh]" : "relative z-10 h-[var(--h-m)] md:h-[var(--h-d)]"}
    >
      <div className={flow ? `px-[var(--gutter)] ${className}` : `sticky top-0 h-svh overflow-hidden px-[var(--gutter)] ${className}`}>
        {scrim && !flow && <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent,black_14%)] ${SCRIM[scrim]}`} />}
        {children}
      </div>
    </section>
  );
}

export function Kicker({ id, className = "" }: { id: ChapterId; className?: string }) {
  const c = chapters[chapterIndex[id]];
  return (
    <p className={`title-face flex items-center gap-4 text-[0.78rem] uppercase tracking-[0.3em] text-[#ecd6b8] ${className}`}>
      <span className="text-[#d48b3b]">{c.n}</span>
      <span className="h-[1.5px] w-12 bg-gradient-to-r from-[#d48b3b] to-transparent shadow-[0_0_8px_rgba(212,139,59,0.45)]" aria-hidden />
      <span>{c.title}</span>
      <span className="sr-only">— {c.plain}</span>
    </p>
  );
}

export function useFlow() {
  return useUI((s) => s.tier === "static");
}
