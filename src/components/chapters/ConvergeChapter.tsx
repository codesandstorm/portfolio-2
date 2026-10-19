"use client";

import { useRef } from "react";
import { achievements } from "@/content/data";
import { getNode } from "@/content/graph";
import type { Achievement } from "@/content/types";
import { sfx } from "@/audio/useSound";
import { useUI } from "@/lib/store";
import { world } from "@/lib/world";
import { Chapter, Kicker, useFlow } from "./Chapter";
import { Arrive, Label, Stepped } from "./Stepped";

const IGNITE = 0.42;

function Moment({ a, i, reveal, flow }: { a: Achievement; i: number; reveal: number; flow: boolean }) {
  const select = useUI((s) => s.select);
  const read = useUI((s) => s.read);
  const paths = [...(a.experiences ?? []), ...(a.projects ?? []), ...(a.skills ?? [])];
  const lit = flow || reveal >= IGNITE;

  return (
    <article className="max-w-[34rem]" aria-labelledby={`${a.id}-h`}>
      <p className="mono text-faint">
        Convergence {String(i + 1).padStart(2, "0")} / {String(achievements.length).padStart(2, "0")} · {a.date}
      </p>
      <div className="mt-4">
        <Label>Paths</Label>
        <ul className="space-y-1">
          {(paths.length ? paths : a.signals).map((id, k) => (
            <li key={id} className="flex items-center gap-3 text-sm text-mist">
              <span
                className="h-px bg-gradient-to-r from-transparent to-molten transition-all duration-700"
                style={{ width: lit ? 8 : 48, transitionDelay: `${k * 60}ms` }}
                aria-hidden
              />
              <button type="button" onClick={() => select(id)} className="hover:text-gold" data-cursor="link">
                {getNode(id)?.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <Arrive at={IGNITE} reveal={flow ? 1 : reveal} className="mt-6">
        <h3 id={`${a.id}-h`}>
          <span className="display block text-[clamp(3rem,7vw,6rem)] leading-[0.9] text-molten [text-shadow:0_0_40px_rgba(255,138,31,0.35)]">{a.result}</span>
          <span className="display mt-2 block text-[clamp(1.6rem,3vw,2.4rem)] leading-tight text-ivory">{a.title}</span>
        </h3>
        <p className="mt-4 text-[15px] leading-relaxed text-mist">{a.detail}</p>
        <div className="mt-4 flex flex-wrap gap-x-6">
          {a.signals.map((s) => (
            <button key={s} type="button" onClick={() => read(s)} className="thread-link text-sm" data-cursor="link">
              <span className="mono text-gold">LI</span> {getNode(s)?.label}
            </button>
          ))}
        </div>
      </Arrive>
    </article>
  );
}

/** 08 — Converge. Achievements are where paths meet; the meeting is a light event. */
export function ConvergeChapter() {
  const flow = useFlow();
  const ignited = useRef(new Set<number>());

  return (
    <Chapter id="converge" scrim="right">
      <div className={flow ? "mx-auto max-w-3xl" : "flex h-full flex-col justify-end pb-[7svh] pt-[38svh] md:items-end md:justify-center md:pb-0 md:pt-20"}>
        <div className="w-full md:w-[min(36rem,44vw)] md:mr-[7.5rem]">
          <Kicker id="converge" className="mb-6" />
          <h2 id="converge-title" className="sr-only">Converge — her achievements</h2>
          <Stepped
            chapter="converge"
            items={achievements}
            render={(a, i, r) => <Moment a={a} i={i} reveal={r} flow={flow} />}
            onStep={(i, local) => {
              // Fire once per pass forward; re-arm when scrolled back above it.
              if (local >= IGNITE && !ignited.current.has(i)) {
                ignited.current.add(i);
                world.flash = 1;
                sfx.swell(true);
              } else if (local < IGNITE - 0.1) ignited.current.delete(i);
            }}
          />
        </div>
      </div>
    </Chapter>
  );
}
