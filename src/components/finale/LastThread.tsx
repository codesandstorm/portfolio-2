"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sfx } from "@/audio/useSound";
import { useTicker } from "@/lib/hooks";
import { world } from "@/lib/world";

/** How close (px) the thread's end must come to her name to take hold. */
const SNAP = 90;

type Pt = { x: number; y: number };

/**
 * The finale's one interaction. You are a point of light; pull a thread out of
 * it and carry it anywhere. Let go and it stays where you left it — pick up its
 * end again to move it, or cut it. Bring it to her name and it takes hold, and
 * her LinkedIn opens. Nothing is remembered between visits.
 */
export function LastThread({ onConnect, visible }: { onConnect: () => void; visible: boolean }) {
  const path = useRef<SVGPathElement>(null);
  const hint = useRef<SVGPathElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const knob = useRef<HTMLButtonElement>(null);
  const cut = useRef<HTMLButtonElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  /** The loose end, when there is one; null when there is no thread or it has taken hold. */
  const end = useRef<Pt | null>(null);
  const [state, setState] = useState<"none" | "loose" | "held">("none");
  const [dragging, setDragging] = useState(false);
  const [near, setNear] = useState(false);

  const origin = (): Pt => {
    const r = dot.current?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 0, y: 0 };
  };
  // A thread, not a ruler: it sags a little between its two ends.
  const curve = (a: Pt, b: Pt) => {
    const mx = (a.x + b.x) / 2, my = Math.max(a.y, b.y) + Math.min(90, Math.hypot(b.x - a.x, b.y - a.y) * 0.2);
    return { d: `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`, mid: { x: (a.x + 2 * mx + b.x) / 4, y: (a.y + 2 * my + b.y) / 4 } };
  };
  const place = (el: HTMLElement | null, p: Pt) => el && (el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`);

  useTicker(() => {
    if (!visible) return;
    const o = origin();
    const t = world.finaleScreen;
    ring.current?.setAttribute("cx", t.x.toFixed(1));
    ring.current?.setAttribute("cy", t.y.toFixed(1));
    const tip = state === "held" ? t : end.current;
    if (!tip) {
      path.current?.setAttribute("d", "");
      hint.current?.setAttribute("d", curve(o, t).d);
      return;
    }
    hint.current?.setAttribute("d", "");
    const c = curve(o, tip);
    path.current?.setAttribute("d", c.d);
    place(knob.current, tip);
    place(cut.current, c.mid);
  });

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      end.current = { x: e.clientX, y: e.clientY };
      const t = world.finaleScreen;
      setNear(Math.hypot(e.clientX - t.x, e.clientY - t.y) < SNAP);
    };
    const up = (e: PointerEvent) => {
      const t = world.finaleScreen;
      setDragging(false);
      setNear(false);
      if (Math.hypot(e.clientX - t.x, e.clientY - t.y) < SNAP) {
        end.current = null;
        setState("held");
        onConnect();
      } else {
        end.current = { x: e.clientX, y: e.clientY };
        setState("loose");
        sfx.tick();
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, onConnect]);

  const grab = (e: React.PointerEvent) => {
    e.preventDefault();
    // Picking up a held thread pulls it off her name again.
    end.current = state === "held" ? { ...world.finaleScreen } : end.current ?? { x: e.clientX, y: e.clientY };
    setState("loose");
    setDragging(true);
    sfx.tick();
  };

  const remove = () => {
    end.current = null;
    setState("none");
    sfx.tick();
  };

  return (
    <div className={`pointer-events-none absolute inset-0 z-20 transition-[opacity,visibility] duration-700 ${visible ? "visible opacity-100" : "invisible opacity-0"}`}>
      <svg aria-hidden className="fixed inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="thread" x1="0" x2="1">
            <stop offset="0" stopColor="#f3ead8" />
            <stop offset="1" stopColor="#ffb347" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path ref={hint} fill="none" stroke="rgba(243,234,216,0.22)" strokeWidth="1" strokeDasharray="2 7" className="[animation:thread-hint_2.4s_linear_infinite]" />
        <path ref={path} fill="none" stroke="url(#thread)" strokeWidth={near || state === "held" ? 2 : 1.4} filter="url(#glow)" />
        <circle ref={ring} r={near || state === "held" ? 24 : 14} fill="none" stroke="#ffb347" strokeOpacity={near ? 0.9 : state === "held" ? 0.55 : 0.25} strokeWidth="1" className="transition-all duration-300" />
      </svg>

      {/* You: pull a thread out of your point. Enter does it for you. */}
      <span
        ref={dot}
        role="button"
        tabIndex={0}
        aria-label="Your point of light. Drag a thread from it to her name to connect on LinkedIn, or press Enter."
        onPointerDown={state === "none" ? grab : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setState("held");
            onConnect();
          }
        }}
        className="pointer-events-auto absolute left-[8vw] top-[52%] flex h-10 w-10 touch-none items-center justify-center md:left-[12vw] md:top-[50%]"
        data-cursor="drag"
      >
        {state === "none" && <span className="absolute inset-2 animate-ping rounded-full bg-ivory/25 [animation-duration:2s]" />}
        <span className="h-3 w-3 rounded-full bg-ivory shadow-[0_0_16px_#f3ead8]" />
      </span>

      {/* The thread's end: pick it up and move it anywhere. */}
      {state !== "none" && (
        <button
          ref={knob}
          type="button"
          onPointerDown={grab}
          aria-label="Move the thread"
          className={`pointer-events-auto fixed left-0 top-0 -ml-3 -mt-3 h-6 w-6 touch-none rounded-full border border-[#ffb347]/80 bg-[#140c06]/80 shadow-[0_0_12px_#ffb347] ${state === "held" && !dragging ? "opacity-0" : "opacity-100"}`}
          data-cursor="drag"
        />
      )}
      {/* And cut it, to start again. */}
      {state !== "none" && !dragging && (
        <button
          ref={cut}
          type="button"
          onClick={remove}
          aria-label="Remove the thread"
          className="pointer-events-auto fixed left-0 top-0 -ml-3 -mt-3 flex h-6 w-6 items-center justify-center rounded-full border border-hair bg-[#07080a]/90 text-mist transition-colors hover:border-[#ffb27a] hover:text-[#ffb27a]"
          data-cursor="link"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
