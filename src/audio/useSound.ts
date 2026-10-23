"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { audio } from "@/lib/audio/engine";

type SoundState = {
  enabled: boolean;
  ambientVolume: number;
  effectsVolume: number;
  /** Narration is text-only captions until authentic audio is supplied. */
  narrationEnabled: boolean;
  toggle: () => void;
  setEnabled: (v: boolean) => void;
};

export const useSound = create<SoundState>()(
  persist(
    (set, get) => ({
      enabled: false,
      ambientVolume: 0.5,
      effectsVolume: 0.5,
      narrationEnabled: false,
      toggle: () => get().setEnabled(!get().enabled),
      setEnabled: (enabled) => {
        set({ enabled });
        void audio.setEnabled(enabled);
        audio.setVolumes(get().ambientVolume, get().effectsVolume);
      },
    }),
    {
      name: "sutra-sound",
      // Sound always starts off; only the mix is remembered.
      partialize: (s) => ({ ambientVolume: s.ambientVolume, effectsVolume: s.effectsVolume }),
    },
  ),
);

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
