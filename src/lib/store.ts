"use client";

import { create } from "zustand";
import type { Tier } from "./capability";
import type { IntroPhase } from "./intro";

type UIState = {
  tier: Tier | null;
  /** Loader finished: fonts ready and first frame drawn. */
  ready: boolean;
  introDone: boolean;
  chapter: number;
  /** Node under the pointer / keyboard focus. */
  hovered: string | null;
  /** Node the visitor has opened. */
  selected: string | null;
  /** Node a chapter puts in focus as you scroll (experience, project, achievement…). */
  scrollFocus: string | null;
  /** LinkedIn signal opened in the reader. */
  reading: string | null;
  indexOpen: boolean;
  introPhase: IntroPhase;
  setIntroPhase: (p: IntroPhase) => void;
  setTier: (t: Tier) => void;
  setReady: () => void;
  finishIntro: () => void;
  setChapter: (c: number) => void;
  hover: (id: string | null) => void;
  select: (id: string | null) => void;
  setScrollFocus: (id: string | null) => void;
  read: (id: string | null) => void;
  setIndexOpen: (v: boolean) => void;
};

export const useUI = create<UIState>((set) => ({
  tier: null,
  ready: false,
  introDone: false,
  chapter: 0,
  hovered: null,
  selected: null,
  scrollFocus: null,
  reading: null,
  indexOpen: false,
  introPhase: "void",
  setIntroPhase: (introPhase) => set((s) => (s.introPhase === introPhase ? s : { introPhase })),
  setTier: (tier) => set({ tier }),
  setReady: () => set({ ready: true }),
  finishIntro: () => set({ introDone: true }),
  setChapter: (chapter) => set((s) => (s.chapter === chapter ? s : { chapter, selected: null, hovered: null })),
  hover: (hovered) => set({ hovered }),
  select: (selected) => set({ selected }),
  setScrollFocus: (scrollFocus) => set((s) => (s.scrollFocus === scrollFocus ? s : { scrollFocus })),
  read: (reading) => set({ reading }),
  setIndexOpen: (indexOpen) => set({ indexOpen }),
}));

/** The node whose relationships are lit right now. */
export function focusOf(s: Pick<UIState, "hovered" | "selected" | "scrollFocus">) {
  return s.hovered ?? s.selected ?? s.scrollFocus;
}
