"use client";

import { create } from "zustand";
import { tour } from "@/content/tour";

export type TourStatus = "idle" | "disclosure" | "playing" | "paused" | "done";

type TourState = {
  status: TourStatus;
  index: number;
  /** Why playback paused, shown to the visitor. */
  reason: string | null;
  open: () => void;
  begin: () => void;
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
  reason: null,
  open: () => set({ status: "disclosure", index: 0, reason: null }),
  begin: () => set({ status: "playing", reason: null }),
  pause: (reason) => get().status === "playing" && set({ status: "paused", reason: reason ?? null }),
  resume: () => set({ status: "playing", reason: null }),
  go: (index) => set({ index: Math.max(0, Math.min(tour.length - 1, index)), status: "playing", reason: null }),
  finish: () => set({ status: "done" }),
  exit: () => set({ status: "idle", reason: null }),
}));
