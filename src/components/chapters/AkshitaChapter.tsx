"use client";

import { Briefcase, Download, FileText, GraduationCap, Target, Users, type LucideIcon } from "lucide-react";
import { profile } from "@/content/data";
import { about } from "@/content/story";
import { Chapter, Kicker, useFlow } from "./Chapter";

const ICONS: LucideIcon[] = [GraduationCap, Briefcase, Users, Target];

/** 01 — About. Her portrait in light on the left; who she is, and the plain facts, on the right. */
export function AkshitaChapter() {
  const flow = useFlow();

  return (
    <Chapter id="akshita" scrim="right">
      {/* Top padding keeps the column clear of the navigation bar on every screen height. */}
      <div className={flow ? "mx-auto max-w-3xl" : "flex h-full items-end-safe pb-[4svh] pt-[max(13svh,5rem)] md:items-center-safe md:justify-end"}>
        <div className="w-full max-w-[38rem] md:mr-[3vw] md:w-[42vw]">
          <Kicker id="akshita" />
          <h2 id="akshita-title" className="display mt-4 text-[clamp(2.2rem,4.2vw,3.7rem)] leading-[0.95] text-ivory [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:text-[clamp(2rem,3.4vw,2.9rem)]">
            Akshita <span className="italic text-gold">Mahajan</span>
          </h2>
          <p className="title-face mt-3 text-[0.7rem] uppercase tracking-[0.28em] text-[#e58237]">{about.line}</p>

          <div className="mt-4 space-y-3 text-[13.5px] leading-[1.6] text-ivory/80 md:mt-5 md:text-[14.5px] md:leading-[1.7] [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:space-y-2 [@media(max-height:760px)]:text-[13px] [@media(max-height:760px)]:leading-[1.55]">
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>

          <ul className="mt-5 grid grid-cols-2 gap-2 md:mt-6 md:gap-3 [@media(max-height:760px)]:mt-4 [@media(max-height:760px)]:gap-2">
            {about.facts.map((f, i) => {
              const Icon = ICONS[i];
              return (
                <li key={f.label} className="flex gap-3 rounded-xl border border-hair bg-[#07080a]/75 p-2.5 backdrop-blur-[2px] md:p-3.5 [@media(max-height:760px)]:p-2.5">
                  <span aria-hidden className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e58237]/30 bg-[#e58237]/10 sm:flex">
                    <Icon strokeWidth={1.5} className="h-[18px] w-[18px] text-[#ffb27a]" />
                  </span>
                  <span className="min-w-0">
                    <span className="title-face block text-[0.6rem] uppercase tracking-[0.22em] text-[#e58237]">{f.label}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ivory md:text-[14px]">{f.title}</span>
                    <span className="mt-0.5 hidden text-[12px] leading-snug text-mist sm:block [@media(max-height:760px)]:hidden">{f.detail}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3 md:mt-6 [@media(max-height:760px)]:mt-4">
            <a href={profile.resume} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 rounded-full border border-[#e58237]/60 px-4 py-2 transition-[border-color,box-shadow] hover:border-[#ffb27a] hover:shadow-[0_0_22px_-6px_rgba(229,130,55,0.8)]" data-cursor="external">
              <FileText aria-hidden className="h-4 w-4 text-[#ffb27a]" />
              <span className="mono text-ivory">Resume</span>
            </a>
            <a href={profile.resume} download className="text-mist transition-colors hover:text-[#ffb27a]" aria-label="Download her resume (PDF)" data-cursor="link">
              <Download aria-hidden className="h-4 w-4" />
            </a>
            <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="thread-link mono text-mist" data-cursor="external">
              LinkedIn <span aria-hidden>↗</span>
            </a>
            <a href={profile.links.github} target="_blank" rel="noreferrer" className="thread-link mono text-mist" data-cursor="external">
              GitHub <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </div>
      {!profile.portrait && !flow && (
        <p className="mono absolute bottom-5 left-[var(--gutter)] hidden text-faint/70 md:block">Portrait · abstract placeholder until her photograph is supplied</p>
      )}
    </Chapter>
  );
}
