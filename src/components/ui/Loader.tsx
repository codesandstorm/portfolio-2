"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useUI } from "@/lib/store";

/** The first point of light charges while the world is prepared. */
export function Loader() {
  const ready = useUI((s) => s.ready);
  const tier = useUI((s) => s.tier);
  const [fonts, setFonts] = useState(false);
  useEffect(() => {
    void document.fonts.ready.then(() => setFonts(true));
  }, []);
  const progress = ready ? 1 : tier && fonts ? 0.72 : fonts || tier ? 0.4 : 0.12;
  const label = ready ? "signal found" : tier && fonts ? "drawing the first threads" : "charging the first signal";
  const C = 2 * Math.PI * 22;

  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          key="loader"
          className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-void"
          exit={{ opacity: 0, transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } }}
          role="status"
          aria-live="polite"
        >
          <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
            <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(243,234,216,0.08)" strokeWidth="1" />
            <motion.circle
              cx="32"
              cy="32"
              r="22"
              fill="none"
              stroke="#ffb347"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray={C}
              animate={{ strokeDashoffset: C * (1 - progress) }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              transform="rotate(-90 32 32)"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="2.5"
              fill="#ffb347"
              animate={{ r: [2.2, 3.4, 2.2], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: "drop-shadow(0 0 6px #ffb347)" }}
            />
          </svg>
          <p className="mono text-faint">{label}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
