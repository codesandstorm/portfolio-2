"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { getEntity, getNode, latestSignals, signalUrl, formatDate, summarizePeople } from "@/content/graph";
import { asSignal, getLive, isLive } from "@/content/live";
import type { LinkedInSignal } from "@/content/types";
import { useUI } from "@/lib/store";

/** An elegant reading view for one LinkedIn post, then the way back to the original. */
export function SignalReader() {
  const reading = useUI((s) => s.reading);
  const read = useUI((s) => s.read);
  const select = useUI((s) => s.select);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const live = reading && isLive(reading) ? getLive(reading) : null;
  const s = reading ? (live ? asSignal(live) : getEntity<LinkedInSignal>(reading)) : null;

  useEffect(() => {
    if (!reading) {
      returnTo.current?.focus({ preventScroll: true });
      return;
    }
    returnTo.current = document.activeElement as HTMLElement;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && read(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reading, read]);

  const url = s ? signalUrl(s) : null;
  const related = s ? [...(s.experiences ?? []), ...(s.projects ?? []), ...(s.achievements ?? [])] : [];

  return (
    <AnimatePresence>
      {s && url && (
        <motion.div
          key="reader"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signal-title"
          className="fixed inset-0 z-[55] flex items-end justify-center bg-void/85 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => read(null)}
          data-lenis-prevent
        >
          <motion.article
            className="relative max-h-[88svh] w-full max-w-2xl overflow-y-auto px-[var(--gutter)] pb-12 pt-10 sm:px-12"
            initial={{ y: 30, opacity: 0, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute left-0 top-10 hidden h-[calc(100%-5rem)] w-px bg-gradient-to-b from-gold via-gold/30 to-transparent sm:block" aria-hidden />
            <p className="mono text-gold">
              {live ? "New post" : `Signal ${String(s.post).padStart(2, "0")}`} · {formatDate(s.date)}
              {latestSignals.has(s.id) && <span className="ml-3 rounded-full border border-gold/50 px-2 py-0.5 text-[9px]">Latest</span>}
            </p>
            <h2 id="signal-title" className="display mt-4 text-4xl leading-[1.05] text-ivory sm:text-5xl">
              {s.title}
            </h2>
            {s.quote && <p className="display mt-6 text-2xl italic text-gold/90">{s.quote}</p>}
            <p className="mt-6 text-lg leading-relaxed text-ivory/85">{s.summary}</p>

            {!!s.people?.length && (
              <div className="mt-8">
                <h3 className="mono text-faint">She credited by name</h3>
                <p className="mt-2 leading-relaxed text-mist">{summarizePeople(s.people)} — named in the original post.</p>
              </div>
            )}
            {!!related.length && (
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {related.map((id) => (
                  <button key={id} type="button" className="thread-link text-sm" onClick={() => { read(null); select(id); }} data-cursor="link">
                    {getNode(id)?.label}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
              <a href={url.href} target="_blank" rel="noreferrer" className="thread-link mono text-gold" data-cursor="external">
                {url.exact ? "View original on LinkedIn" : "Find it in her LinkedIn activity"} <span aria-hidden>↗</span>
              </a>
              <button ref={closeRef} type="button" onClick={() => read(null)} className="mono text-mist hover:text-ivory" data-cursor="link">
                Close
              </button>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
