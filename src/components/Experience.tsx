"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { detectTier } from "@/lib/capability";
import { chapterIndex } from "@/lib/chapters";
import { ScrollDirector } from "@/lib/scroll";
import { useUI } from "@/lib/store";
import { world } from "@/lib/world";
import { AkshitaChapter } from "./chapters/AkshitaChapter";
import { BuildChapter } from "./chapters/BuildChapter";
import { CollaborateChapter } from "./chapters/CollaborateChapter";
import { ConnectChapter } from "./chapters/ConnectChapter";
import { ContinueChapter } from "./chapters/ContinueChapter";
import { ConvergeChapter } from "./chapters/ConvergeChapter";
import { LeadChapter } from "./chapters/LeadChapter";
import { LearnChapter } from "./chapters/LearnChapter";
import { SignalChapter } from "./chapters/SignalChapter";
import { StartChapter } from "./chapters/StartChapter";
import { ChapterNav } from "./ui/ChapterNav";
import { Cursor } from "./ui/Cursor";
import { Loader } from "./ui/Loader";
import { NodeLabels } from "./ui/NodeLabels";
import { RelationPanel } from "./ui/RelationPanel";
import { SignalReader } from "./ui/SignalReader";
import { TopBar } from "./ui/TopBar";

const WorldCanvas = dynamic(() => import("./webgl/WorldCanvas"), { ssr: false });

const STEPPED = new Set([chapterIndex.collaborate, chapterIndex.build, chapterIndex.lead, chapterIndex.converge]);
const ORBIT = new Set([chapterIndex.connect, chapterIndex.learn]);

/** Pointer → world: parallax everywhere, drag-to-turn in the open network chapters. */
function usePointer() {
  useEffect(() => {
    let dragging = false;
    let lx = 0, ly = 0;
    const move = (e: PointerEvent) => {
      world.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      world.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      if (dragging) {
        world.drag.x -= ((e.clientX - lx) / window.innerWidth) * 2.4;
        world.drag.y = Math.max(-0.6, Math.min(0.6, world.drag.y - ((e.clientY - ly) / window.innerHeight) * 1.2));
        lx = e.clientX;
        ly = e.clientY;
      }
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if ((e.target as HTMLElement).closest("a, button, [role=dialog], aside")) return;
      if (!ORBIT.has(useUI.getState().chapter)) return;
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      document.body.dataset.dragging = "true";
    };
    const up = () => {
      dragging = false;
      delete document.body.dataset.dragging;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);
}

export function Experience() {
  const tier = useUI((s) => s.tier);
  const chapter = useUI((s) => s.chapter);
  const setTier = useUI((s) => s.setTier);
  const setReady = useUI((s) => s.setReady);
  const setScrollFocus = useUI((s) => s.setScrollFocus);

  useEffect(() => {
    const t = detectTier();
    setTier(t);
    document.documentElement.dataset.tier = t;
    // Without WebGL there is nothing to prepare beyond the type.
    if (t === "static") void document.fonts.ready.then(setReady);
  }, [setTier, setReady]);

  useEffect(() => {
    if (!STEPPED.has(chapter)) setScrollFocus(null);
  }, [chapter, setScrollFocus]);

  usePointer();

  const cinematic = tier !== null && tier !== "static";

  return (
    <>
      <Loader />
      {tier && <ScrollDirector smoothScroll={cinematic} />}
      {cinematic ? <WorldCanvas tier={tier} /> : <div className="static-sky" aria-hidden />}
      <TopBar />
      <ChapterNav />
      {cinematic && <NodeLabels />}
      <Cursor />
      <main id="main">
        <SignalChapter />
        <StartChapter />
        <AkshitaChapter />
        <ConnectChapter />
        <CollaborateChapter />
        <BuildChapter />
        <LearnChapter />
        <LeadChapter />
        <ConvergeChapter />
        <ContinueChapter />
      </main>
      <RelationPanel />
      <SignalReader />
    </>
  );
}
