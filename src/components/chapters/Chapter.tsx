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
    "bg-[linear-gradient(to_top,rgba(4,4,10,0.94)_0%,rgba(4,4,10,0.75)_45%,transparent_72%)] md:bg-[linear-gradient(to_left,rgba(4,4,10,0.9)_0%,rgba(4,4,10,0.72)_38%,transparent_62%)]",
  left:
    "bg-[linear-gradient(to_bottom,rgba(4,4,10,0.9)_0%,rgba(4,4,10,0.6)_30%,transparent_48%)] md:bg-[linear-gradient(to_right,rgba(4,4,10,0.85)_0%,rgba(4,4,10,0.55)_28%,transparent_45%)]",
};

export function Chapter({
  id,
  children,
  className = "",
  scrim,
}: {
  id: ChapterId;
  children: ReactNode;
  className?: string;
  scrim?: keyof typeof SCRIM;
}) {
  const flow = useUI((s) => s.tier === "static");
  const c = chapters[chapterIndex[id]];
  const style = { "--h-d": `${c.vh[0]}vh`, "--h-m": `${c.vh[1]}vh` } as CSSProperties;
  return (
    <section
      id={id}
      data-chapter={id}
      aria-labelledby={`${id}-title`}
      style={flow ? undefined : style}
      className={flow ? "relative z-10 py-[18vh]" : "relative z-10 h-[var(--h-m)] md:h-[var(--h-d)]"}
    >
      <div className={flow ? `px-[var(--gutter)] ${className}` : `sticky top-0 h-svh overflow-hidden px-[var(--gutter)] ${className}`}>
        {scrim && !flow && <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 ${SCRIM[scrim]}`} />}
        {children}
      </div>
    </section>
  );
}

export function Kicker({ id, className = "" }: { id: ChapterId; className?: string }) {
  const c = chapters[chapterIndex[id]];
  return (
    <p className={`mono flex items-center gap-3 text-faint ${className}`}>
      <span className="text-gold">{c.n}</span>
      <span className="h-px w-8 bg-gold/50" aria-hidden />
      <span>{c.title}</span>
      <span className="sr-only">— {c.plain}</span>
    </p>
  );
}

export function useFlow() {
  return useUI((s) => s.tier === "static");
}
