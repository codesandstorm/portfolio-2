"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { sfx } from "@/audio/useSound";
import { useTicker } from "@/lib/hooks";
import { world } from "@/lib/world";

export const THREAD_KEY = "sutra-last-thread";
const SNAP = 90;

/**
 * The finale's one interaction: the visitor is a point of light and draws the
 * last thread to her name themself. Drag on pointer devices; Enter on the
 * keyboard. The thread is remembered on this device.
 */
export function LastThread({ connected, onConnect, visible }: { connected: boolean; onConnect: () => void; visible: boolean }) {
  const live = useRef<SVGPathElement>(null);
  const done = useRef<SVGPathElement>(null);
  const hint = useRef<SVGPathElement>(null);
  const target = useRef<SVGCircleElement>(null);
  const handle = useRef<HTMLButtonElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [near, setNear] = useState(false);

  const origin = () => {
    const r = (dot.current ?? handle.current)?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 0, y: 0 };
  };
  // A thread, not a ruler: it sags a little between the two points.
  const curve = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mx = (a.x + b.x) / 2, my = Math.max(a.y, b.y) + Math.min(90, Math.hypot(b.x - a.x, b.y - a.y) * 0.2);
    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  };

  useTicker(() => {
    if (!visible) return;
    const o = origin();
    const t = world.finaleScreen;
    target.current?.setAttribute("cx", t.x.toFixed(1));
    target.current?.setAttribute("cy", t.y.toFixed(1));
    if (connected) done.current?.setAttribute("d", curve(o, t));
    else hint.current?.setAttribute("d", curve(o, t));
    if (drag.current) live.current?.setAttribute("d", curve(o, drag.current));
  });

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      drag.current = { x: e.clientX, y: e.clientY };
      const t = world.finaleScreen;
      setNear(Math.hypot(e.clientX - t.x, e.clientY - t.y) < SNAP);
    };
    const up = (e: PointerEvent) => {
      const t = world.finaleScreen;
      const hit = Math.hypot(e.clientX - t.x, e.clientY - t.y) < SNAP;
      drag.current = null;
      live.current?.setAttribute("d", "");
      setDragging(false);
      setNear(false);
      if (hit) onConnect();
      else sfx.tick();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, onConnect]);

  return (
    <div className={`pointer-events-none absolute inset-0 transition-[opacity,visibility] duration-700 ${visible ? "visible opacity-100" : "invisible opacity-0"}`}>
      <svg aria-hidden className="absolute inset-0 h-full w-full overflow-visible">
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
        {!connected && !dragging && (
          <path ref={hint} fill="none" stroke="rgba(243,234,216,0.28)" strokeWidth="1" strokeDasharray="2 7" className="[animation:thread-hint_2.4s_linear_infinite]" />
        )}
        <path ref={live} fill="none" stroke="url(#thread)" strokeWidth={near ? 2 : 1.4} filter="url(#glow)" />
        {connected && (
          <motion.path
            ref={done}
            fill="none"
            stroke="#ffb347"
            strokeWidth="1.6"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
        <circle ref={target} r={near || connected ? 22 : 14} fill="none" stroke="#ffb347" strokeOpacity={near ? 0.9 : connected ? 0.5 : 0} strokeWidth="1" className="transition-all duration-300" />
      </svg>

      <button
        ref={handle}
        type="button"
        disabled={connected}
        onPointerDown={(e) => {
          if (connected) return;
          e.preventDefault();
          drag.current = { x: e.clientX, y: e.clientY };
          setDragging(true);
          sfx.tick();
        }}
        onClick={(e) => {
          // Keyboard (and a plain tap) completes the thread for you.
          if (!connected && e.detail === 0) onConnect();
        }}
        className="pointer-events-auto absolute left-[8vw] top-[52%] flex touch-none items-center gap-3 md:left-[12vw] md:top-[50%]"
        aria-label={connected ? "Your thread reaches her" : "Draw the last thread to Akshita. Drag to her name, or press Enter."}
        data-cursor="drag"
      >
        <span ref={dot} className="relative flex h-5 w-5 items-center justify-center" aria-hidden>
          {!connected && <span className="absolute inset-0 animate-ping rounded-full bg-ivory/25 [animation-duration:2s]" />}
          <span className="h-2.5 w-2.5 rounded-full bg-ivory shadow-[0_0_14px_#f3ead8]" />
        </span>
        <span className="text-left">
          <span className="mono block text-ivory">You</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={connected ? "c" : "d"}
              className="mono block text-[10px] text-gold/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {connected ? "connected" : "drag to her name"}
            </motion.span>
          </AnimatePresence>
        </span>
      </button>
    </div>
  );
}
