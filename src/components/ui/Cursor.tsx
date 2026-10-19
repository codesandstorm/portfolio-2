"use client";

import { useEffect, useRef } from "react";
import { isCoarsePointer } from "@/lib/capability";
import { useTicker } from "@/lib/hooks";
import { useUI } from "@/lib/store";

type CursorState = "default" | "link" | "node" | "external" | "drag";

/** A small energy point that becomes a ring over nodes and an arrow over outbound links. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const target = useRef({ x: -100, y: -100 });
  const cur = useRef({ x: -100, y: -100 });
  const state = useRef<CursorState>("default");
  const enabled = useRef(false);

  useEffect(() => {
    if (isCoarsePointer()) return;
    enabled.current = true;
    document.documentElement.dataset.cursor = "on";
    const move = (e: PointerEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor], a, button");
      let s: CursorState = "default";
      if (el) s = (el.dataset.cursor as CursorState) ?? (el.tagName === "A" && (el as HTMLAnchorElement).target === "_blank" ? "external" : "link");
      if (document.body.dataset.dragging === "true") s = "drag";
      if (s !== state.current) {
        state.current = s;
        ring.current?.setAttribute("data-state", s);
        if (label.current) label.current.textContent = s === "external" ? "↗" : s === "drag" ? "↔" : "";
      }
    };
    const leave = () => (target.current = { x: -100, y: -100 });
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      delete document.documentElement.dataset.cursor;
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  useTicker(() => {
    if (!enabled.current) return;
    const c = cur.current, t = target.current;
    c.x += (t.x - c.x) * 0.22;
    c.y += (t.y - c.y) * 0.22;
    if (dot.current) dot.current.style.transform = `translate3d(${t.x}px, ${t.y}px, 0)`;
    if (ring.current) ring.current.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
    // Nodes in the 3D world report hover through the store.
    const overNode = useUI.getState().hovered !== null && state.current !== "external";
    ring.current?.toggleAttribute("data-node", overNode);
  });

  return (
    <div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[80] hidden [@media(pointer:fine)]:block">
      <div ref={dot} className="absolute -left-[2.5px] -top-[2.5px] h-[5px] w-[5px] rounded-full bg-gold shadow-[0_0_10px_#ffb347]" />
      <div
        ref={ring}
        data-state="default"
        className="cursor-ring absolute -left-4 -top-4 flex h-8 w-8 items-center justify-center rounded-full border border-gold/0 transition-[width,height,left,top,border-color,opacity] duration-300 ease-out data-[node]:-left-6 data-[node]:-top-6 data-[node]:h-12 data-[node]:w-12 data-[node]:border-gold/80 data-[state=external]:border-gold/60 data-[state=link]:-left-5 data-[state=link]:-top-5 data-[state=link]:h-10 data-[state=link]:w-10 data-[state=link]:border-ivory/40 data-[state=drag]:border-ivory/50"
      >
        <span ref={label} className="mono text-[10px] text-gold" />
      </div>
    </div>
  );
}
