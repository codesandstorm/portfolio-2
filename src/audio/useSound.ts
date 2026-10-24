"use client";

import { useEffect } from "react";
import { audio } from "@/lib/audio/engine";

const GESTURES = ["pointerdown", "keydown", "touchend"] as const;

/**
 * Sound is always on: a quiet bed of space ambience under the whole site.
 * Browsers only allow audio after the visitor's first click, tap or key, so it
 * begins then; it rests while the tab is hidden.
 */
export function useAmbientSound() {
  useEffect(() => {
    const start = () => {
      void audio.setEnabled(true);
      GESTURES.forEach((g) => window.removeEventListener(g, start));
    };
    GESTURES.forEach((g) => window.addEventListener(g, start, { passive: true }));
    const onVisibility = () => void audio.setSuspended(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      GESTURES.forEach((g) => window.removeEventListener(g, start));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}

export const sfx = {
  shimmer: (step?: number) => audio.shimmer(step),
  tick: () => audio.tick(),
  swell: (bright?: boolean) => audio.swell(bright),
  fireWake: () => audio.fireWake(),
  iceWake: () => audio.iceWake(),
  riser: (seconds: number) => audio.riser(seconds),
  impact: () => audio.impact(),
  resolve: () => audio.resolve(),
};
