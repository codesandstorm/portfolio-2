"use client";

import { useRef, useState } from "react";
import { profile } from "@/content/data";

/**
 * Plays a short clip Akshita recorded herself. Renders nothing until a real
 * recording is set in `profile.voice` — the site never synthesises her voice.
 */
export function HerVoice({ clip }: { clip: keyof typeof profile.voice }) {
  const src = profile.voice[clip];
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  if (!src) return null;
  const toggle = () => {
    if (!audio.current) {
      audio.current = new Audio(src);
      audio.current.onended = audio.current.onpause = () => setPlaying(false);
    }
    if (playing) audio.current.pause();
    else {
      void audio.current.play();
      setPlaying(true);
    }
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={playing} className="mono mt-3 inline-flex items-center gap-2 text-gold hover:text-ivory" data-cursor="link">
      <span aria-hidden>{playing ? "■" : "▸"}</span> {playing ? "Playing — her own voice" : "Hear it in her own voice"}
    </button>
  );
}
