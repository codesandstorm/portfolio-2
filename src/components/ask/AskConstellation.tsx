"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { answer, ASK_DISCLOSURE, SUGGESTIONS, type Answer } from "@/content/ask";
import { sfx } from "@/audio/useSound";
import { useCompact } from "@/lib/hooks";
import { scrollToChapter } from "@/lib/scroll";
import { useUI } from "@/lib/store";
import { useTour } from "@/lib/tour";
import { setVoiceLevel } from "@/lib/world";

type Turn = { q: string; a: Answer };

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function recognizerClass() {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

function recognizer(): Recognition | null {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const R = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return R ? new R() : null;
}

/**
 * Ask the constellation: type or speak a question; the answer comes only from
 * her verified data, is spoken by the tour's narrator, and the world travels
 * to the evidence and lights it.
 */
export function AskConstellation() {
  const open = useUI((s) => s.askOpen);
  const setOpen = useUI((s) => s.setAskOpen);
  const compact = useCompact();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  // The panel only renders after a click, so this is always evaluated in the browser.
  const canListen = open && typeof window !== "undefined" && !!recognizerClass();
  const audio = useRef<HTMLAudioElement | null>(null);
  const rec = useRef<Recognition | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // A conversation and a narrated tour shouldn't talk over each other.
    useTour.getState().pause("Paused while you ask a question.");
    input.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  useEffect(() => () => audio.current?.pause(), []);

  const speak = async (q: string) => {
    audio.current?.pause();
    try {
      const res = await fetch("/api/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) });
      if (!res.ok) return;
      const url = URL.createObjectURL(await res.blob());
      const el = new Audio(url);
      audio.current = el;
      el.onplay = () => setSpeaking(true);
      el.onended = el.onpause = () => {
        setSpeaking(false);
        setVoiceLevel(null);
        URL.revokeObjectURL(url);
      };
      await el.play();
    } catch {
      /* answers stay readable without voice */
    }
  };

  const ask = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const a = answer(q);
    setTurns((t) => [...t.slice(-4), { q, a }]);
    setDraft("");
    sfx.shimmer();
    void speak(q);
    // Then the world answers too: travel to the chapter and light the evidence.
    if (a.chapter) scrollToChapter(a.chapter);
    if (a.focus) setTimeout(() => useUI.getState().select(a.focus!), a.chapter ? 1900 : 0);
    if (compact && a.chapter) setTimeout(() => setOpen(false), 400);
  };

  const listen = () => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const r = recognizer();
    if (!r) return;
    rec.current = r;
    r.lang = "en-IN";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => ask(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    setListening(true);
    r.start();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          key="ask"
          role="dialog"
          aria-label="Ask the constellation"
          className="fixed inset-x-3 bottom-3 z-[57] flex max-h-[70svh] flex-col border border-hair bg-void/90 backdrop-blur-md md:inset-x-auto md:bottom-6 md:left-6 md:w-[26rem]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          data-lenis-prevent
        >
          <header className="flex items-start justify-between gap-4 border-b border-hair px-4 py-3">
            <div>
              <p className="display flex items-center gap-2 text-lg text-ivory">
                <span className={`h-2 w-2 rounded-full bg-gold shadow-[0_0_10px_#ffb347] ${speaking ? "animate-pulse" : ""}`} aria-hidden />
                Ask the constellation
              </p>
              <p className="mt-1 text-[11px] leading-snug text-faint">{ASK_DISCLOSURE}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="mono text-faint hover:text-ivory" aria-label="Close" data-cursor="link">✕</button>
          </header>

          <div ref={log} className="flex-1 space-y-4 overflow-y-auto px-4 py-3" aria-live="polite">
            {turns.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)} className="rounded-full border border-hair px-3 py-1 text-[12px] text-mist transition-colors hover:border-gold/60 hover:text-ivory" data-cursor="link">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {turns.map((t, k) => (
              <div key={k}>
                <p className="mono text-[10px] text-gold/80">You · {t.q}</p>
                <p className={`mt-1 text-[14px] leading-relaxed ${t.a.unknown ? "text-mist" : "text-ivory/90"}`}>{t.a.text}</p>
              </div>
            ))}
          </div>

          <form
            className="flex items-center gap-2 border-t border-hair px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
          >
            <input
              ref={input}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={listening ? "Listening…" : "Ask about her work…"}
              aria-label="Your question"
              className="min-w-0 flex-1 bg-transparent py-2 text-[14px] text-ivory placeholder:text-faint focus:outline-none"
            />
            {canListen && (
              <button
                type="button"
                onClick={listen}
                aria-pressed={listening}
                aria-label={listening ? "Stop listening" : "Ask with your voice"}
                className={`mono flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${listening ? "border-crimson text-crimson" : "border-hair text-mist hover:text-ivory"}`}
                data-cursor="link"
              >
                {listening ? "■" : "🎙"}
              </button>
            )}
            <button type="submit" className="mono text-gold hover:text-ivory" data-cursor="link">Ask ▸</button>
          </form>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
