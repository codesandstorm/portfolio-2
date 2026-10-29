"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { audio } from "@/lib/audio/engine";

const KEY = "sutra-sound-off";
const GESTURES = ["pointerdown", "keydown", "touchend"] as const;

function savedOff() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Sound is on unless the visitor turns it off; that choice is remembered on their device. */
export const useSound = create<{ on: boolean; toggle: () => void }>((set, get) => ({
  on: true,
  toggle: () => {
    const on = !get().on;
    set({ on });
    void audio.setEnabled(on);
    try {
      if (on) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, "1");
    } catch {
      /* not remembered: the choice holds for this visit */
    }
  },
}));

/**
 * The site's music plays under everything. Browsers only allow audio after
 * the visitor's first click, tap or key, so it begins then — unless they
 * turned it off last time. It rests while the tab is hidden.
 */
export function useAmbientSound() {
  useEffect(() => {
    if (savedOff()) useSound.setState({ on: false });
    const start = () => {
      if (useSound.getState().on) void audio.setEnabled(true);
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
