"use client";

import { create } from "zustand";
import { tours, type TourVariant } from "@/content/tour";

export type TourStatus = "idle" | "disclosure" | "playing" | "paused" | "done";

type TourState = {
  status: TourStatus;
  index: number;
  variant: TourVariant;
  /** Why playback paused, shown to the visitor. */
  reason: string | null;
  open: () => void;
  begin: (variant: TourVariant) => void;
  pause: (reason?: string) => void;
  resume: () => void;
  go: (index: number) => void;
  finish: () => void;
  exit: () => void;
};

/** The guided tour's state. Playback itself lives in GuidedTour.tsx. */
export const useTour = create<TourState>((set, get) => ({
  status: "idle",
  index: 0,
  variant: "full",
  reason: null,
  open: () => set({ status: "disclosure", index: 0, reason: null }),
  begin: (variant) => set({ status: "playing", variant, index: 0, reason: null }),
  pause: (reason) => get().status === "playing" && set({ status: "paused", reason: reason ?? null }),
  resume: () => set({ status: "playing", reason: null }),
  go: (index) => set((s) => ({ index: Math.max(0, Math.min(tours[s.variant].length - 1, index)), status: "playing", reason: null })),
  finish: () => set({ status: "done" }),
  exit: () => set({ status: "idle", reason: null }),
}));
