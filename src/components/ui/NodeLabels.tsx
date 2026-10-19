"use client";

import { useMemo } from "react";
import { getNeighbors, getNode, nodes, CORE_ID } from "@/content/graph";
import type { NodeKind } from "@/content/types";
import { sfx } from "@/audio/useSound";
import { chapterIndex } from "@/lib/chapters";
import { useUI } from "@/lib/store";
import { labelElements } from "@/world/labels";

const DOT: Record<NodeKind, string> = {
  core: "bg-gold",
  experience: "bg-molten",
  project: "bg-electric",
  skill: "bg-electric/80",
  person: "bg-violet",
  signal: "bg-ivory",
  achievement: "bg-molten",
};
const KIND_NAME: Record<NodeKind, string> = {
  core: "Akshita",
  experience: "Experience",
  project: "Project",
  skill: "Skill",
  person: "Person",
  signal: "LinkedIn signal",
  achievement: "Achievement",
};

const byKind = (k: NodeKind) => nodes.filter((n) => n.kind === k).map((n) => n.id);

/**
 * Every node with a visible name is a real button laid over the 3D world.
 * The constellation's projector moves them each frame.
 */
export function NodeLabels() {
  const chapter = useUI((s) => s.chapter);
  const hovered = useUI((s) => s.hovered);
  const selected = useUI((s) => s.selected);
  const scrollFocus = useUI((s) => s.scrollFocus);
  const hover = useUI((s) => s.hover);
  const select = useUI((s) => s.select);
  const read = useUI((s) => s.read);

  const ids = useMemo(() => {
    const set = new Set<string>();
    if (chapter === chapterIndex.connect) [...byKind("person"), ...byKind("experience")].forEach((id) => set.add(id));
    if (chapter === chapterIndex.learn) byKind("skill").forEach((id) => set.add(id));
    const around = (id: string | null, limit: number) => {
      if (!id) return;
      set.add(id);
      getNeighbors(id).slice(0, limit).forEach((n) => set.add(n));
    };
    const stepped = [chapterIndex.collaborate, chapterIndex.build, chapterIndex.lead, chapterIndex.converge];
    if (stepped.includes(chapter)) around(scrollFocus, 14);
    around(selected, 18);
    around(hovered, 18);
    set.delete(CORE_ID);
    return [...set];
  }, [chapter, hovered, selected, scrollFocus]);

  if (chapter < chapterIndex.connect || chapter === chapterIndex.continue) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" role="group" aria-label="Nodes in view">
      {ids.map((id) => {
        const n = getNode(id)!;
        const prominent = n.kind === "experience" || n.kind === "project" || n.kind === "achievement";
        const isFocus = id === (hovered ?? selected ?? scrollFocus);
        return (
          <button
            key={id}
            type="button"
            ref={(el) => {
              if (el) labelElements.set(id, el);
              else labelElements.delete(id);
            }}
            style={{ opacity: 0, visibility: "hidden" }}
            className="pointer-events-auto absolute left-0 top-0 -ml-3 -mt-3 flex items-center gap-2 p-2 text-left will-change-transform"
            aria-label={`${n.label} — ${KIND_NAME[n.kind]}. Show connections.`}
            data-cursor="node"
            onPointerEnter={() => { hover(id); sfx.tick(); }}
            onPointerLeave={() => hover(null)}
            onFocus={() => hover(id)}
            onBlur={() => hover(null)}
            onClick={() => {
              sfx.shimmer();
              if (n.kind === "signal") read(id);
              else select(selected === id ? null : id);
            }}
          >
            <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[n.kind]} ${isFocus ? "scale-150 shadow-[0_0_10px_currentColor]" : ""}`} />
            <span
              className={`whitespace-nowrap transition-colors ${
                prominent ? "display text-[15px] text-ivory sm:text-lg" : "mono text-[10px] text-mist"
              } ${isFocus ? "!text-gold" : ""}`}
            >
              {n.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
