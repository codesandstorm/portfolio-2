"use client";

import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, FileBadge, Mic, Sparkles, Trophy, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { profile, projects, signals } from "@/content/data";
import { signalUrl } from "@/content/graph";
import { asSignal, useLive, type LiveKind } from "@/content/live";
import type { LinkedInSignal } from "@/content/types";
import { sfx } from "@/audio/useSound";
import { useTicker } from "@/lib/hooks";
import { HerVoice } from "../ui/HerVoice";
import { Chapter, useChapterArrived } from "./Chapter";
import { ProjectArt } from "./ProjectArt";

/** LinkedIn's "in" mark, drawn small, for the links that go there. */
function InMark({ size = 22 }: { size?: number }) {
  return (
    <span aria-hidden className="flex shrink-0 items-center justify-center rounded-[5px] bg-[#0a66c2] font-bold leading-none text-white" style={{ width: size, height: size, fontSize: size * 0.58 }}>
      in
    </span>
  );
}

/** "2d ago", "3w ago", "4mo ago" — from a post's date. */
function ago(date: string, now = Date.now()) {
  const days = Math.max(0, Math.floor((now - new Date(`${date}T00:00:00Z`).getTime()) / 864e5));
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

type Card = LinkedInSignal & { kind: LiveKind };

/** What a curated post is, read from what it links to. */
function kindOf(s: LinkedInSignal): LiveKind {
  if (s.achievements?.length) return "achievement";
  if (/certif/i.test(s.summary)) return "certification";
  if (s.experiences?.length && !s.projects?.length) return "participation";
  return "update";
}

const KIND: Record<LiveKind, { label: string; icon: LucideIcon; warm: boolean }> = {
  achievement: { label: "Achievement", icon: Trophy, warm: true },
  participation: { label: "Community", icon: Mic, warm: false },
  certification: { label: "Certification", icon: FileBadge, warm: true },
  update: { label: "Update", icon: Sparkles, warm: false },
};

/** The picture for a post: the project it is about, or a lit emblem of what kind of post it is. */
function PostArt({ s }: { s: Card }) {
  const project = projects.find((p) => s.projects?.includes(p.id));
  if (project) return <ProjectArt p={project} />;
  const k = KIND[s.kind];
  const Icon = k.icon;
  return (
    <div
      aria-hidden
      className={`relative -mx-5 mb-4 flex h-[9.4rem] items-center justify-center overflow-hidden border-y border-hair ${k.warm ? "bg-[radial-gradient(ellipse_at_50%_55%,rgba(229,130,55,0.28),transparent_70%)]" : "bg-[radial-gradient(ellipse_at_50%_55%,rgba(110,170,240,0.28),transparent_70%)]"}`}
    >
      <span className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:16px_16px]" />
      <svg viewBox="0 0 320 150" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-70">
        <path d="M -10 110 C 60 40, 120 140, 180 80 S 290 30, 330 70" fill="none" stroke={k.warm ? "#ffb27a" : "#9fd0ff"} strokeWidth="1.2" strokeOpacity="0.6" />
        <path d="M -10 125 C 70 70, 130 150, 200 95 S 300 60, 330 95" fill="none" stroke={k.warm ? "#e58237" : "#5aa0e6"} strokeWidth="1" strokeOpacity="0.45" />
      </svg>
      <Icon strokeWidth={1.2} className={`relative h-14 w-14 ${k.warm ? "text-[#ffb27a] drop-shadow-[0_0_16px_rgba(229,130,55,0.8)]" : "text-[#bfe0ff] drop-shadow-[0_0_16px_rgba(110,170,240,0.8)]"}`} />
    </div>
  );
}

function PostCard({ s, i, on }: { s: Card; i: number; on: boolean }) {
  const url = signalUrl(s);
  const k = KIND[s.kind];
  return (
    <a
      href={url.href}
      target="_blank"
      rel="noreferrer"
      onClick={() => sfx.shimmer()}
      className={`group flex h-full flex-col rounded-2xl border bg-[#07080a]/85 px-5 pb-5 pt-5 backdrop-blur-[2px] transition-[transform,border-color,box-shadow,opacity] duration-500 hover:-translate-y-1.5 ${
        k.warm ? "border-[#e58237]/30 hover:border-[#e58237]/70 hover:shadow-[0_18px_50px_-18px_rgba(229,130,55,0.7)]" : "border-[#8fc3f5]/30 hover:border-[#8fc3f5]/70 hover:shadow-[0_18px_50px_-18px_rgba(110,170,240,0.7)]"
      } ${on ? "opacity-100" : "opacity-0"}`}
      style={{ transitionDelay: on ? `${i * 120}ms` : "0ms" }}
      data-cursor="external"
      aria-label={`${s.title} — open the post on LinkedIn`}
    >
      <span className="flex items-center gap-3">
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e58237]/60 bg-[#140c06] text-[13px] font-semibold text-ivory shadow-[0_0_12px_rgba(229,130,55,0.35)]">AM</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-ivory">{profile.name}</span>
          <span className="block text-[12px] text-faint">{ago(s.date)}</span>
        </span>
        <ExternalLink aria-hidden className="h-4 w-4 shrink-0 text-[#8fc3f5] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
      <span className="mt-4 block text-[15px] font-medium leading-snug text-ivory">{s.title}</span>
      <span className="mb-4 mt-1.5 line-clamp-3 text-[13.5px] leading-relaxed text-mist">{s.summary}</span>
      <span className="mt-auto block overflow-hidden rounded-xl transition-[transform,filter] duration-700 group-hover:scale-[1.02] group-hover:brightness-125 [&>div]:mx-0 [&>div]:mb-0 [&>div]:mt-0 [&>div]:border-0">
        <PostArt s={s} />
      </span>
      <span className="mt-4 flex items-center justify-between text-[12px]">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${k.warm ? "border-[#e58237]/40 text-[#ffcf9f]" : "border-[#8fc3f5]/40 text-[#cfe6ff]"}`}>
          <k.icon aria-hidden className="h-3.5 w-3.5" /> {k.label}
        </span>
        <span className="text-mist transition-colors group-hover:text-ivory">View on LinkedIn ↗</span>
      </span>
    </a>
  );
}

/** How many cards fit side by side at this width. */
function usePerView() {
  const [n, setN] = useState(3);
  useEffect(() => {
    const fit = () => setN(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return n;
}

/**
 * 06 — Latest. Her newest LinkedIn posts as a carousel, newest first; posts she
 * adds from /admin join at the front as soon as they are published. Layers of
 * the section drift at slightly different rates as you scroll past.
 */
export function LeadChapter() {
  const live = useLive((s) => s.posts);
  const arrived = useChapterArrived();
  const perView = usePerView();
  const [page, setPage] = useState(0);
  const section = useRef<HTMLDivElement>(null);
  const far = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);

  const posts: Card[] = [
    ...live.map((p) => ({ ...asSignal(p), kind: p.kind })),
    ...signals.map((s) => ({ ...s, kind: kindOf(s) })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const pages = Math.max(1, Math.ceil(posts.length / perView));
  const at = Math.min(page, pages - 1);
  const go = (p: number) => {
    sfx.shimmer();
    setPage((p + pages) % pages);
  };

  // Depth: far particles barely move, the light field a little more, the heading least of all — under 20px each.
  useTicker(() => {
    const el = section.current;
    if (!el || !arrived) return;
    const r = el.getBoundingClientRect();
    const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight));
    if (far.current) far.current.style.transform = `translate3d(0, ${(p * 8).toFixed(1)}px, 0)`;
    if (glow.current) glow.current.style.transform = `translate3d(0, ${(p * -18).toFixed(1)}px, 0)`;
    if (head.current) head.current.style.transform = `translate3d(0, ${(p * 5).toFixed(1)}px, 0)`;
  });

  return (
    <Chapter id="lead" free>
      <div ref={section} className="relative mx-auto max-w-[80rem]">
        {/* Background layers: slow particles and an ambient light field, paused when you leave. */}
        <div aria-hidden className="pointer-events-none absolute -inset-x-[10vw] -inset-y-24 -z-10 overflow-hidden">
          <div
            ref={far}
            className={`absolute inset-0 bg-[radial-gradient(circle,rgba(255,215,170,0.5)_1px,transparent_1.5px)] bg-[size:46px_46px] opacity-25 [animation:latest-drift_60s_linear_infinite] ${arrived ? "" : "[animation-play-state:paused]"}`}
          />
          <div ref={glow} className="absolute inset-0">
            <span className="absolute left-[2%] top-[20%] h-[28rem] w-[28rem] rounded-full bg-[#2f6fb3]/20 blur-[90px]" />
            <span className="absolute right-[0%] top-[35%] h-[30rem] w-[30rem] rounded-full bg-[#e58237]/18 blur-[100px]" />
          </div>
        </div>

        <div ref={head} className={`flex flex-col gap-8 transition-[opacity,transform] duration-700 lg:flex-row lg:items-end lg:justify-between ${arrived ? "opacity-100" : "opacity-0"}`}>
          <div>
            <p className="inline-flex items-center">
              <span className="inline-flex items-center gap-3 rounded-full border border-[#e58237]/50 bg-[#07080a]/80 py-2 pl-2.5 pr-5 shadow-[0_0_24px_-6px_rgba(229,130,55,0.6)]">
                <InMark />
                <span className="title-face text-[0.74rem] uppercase tracking-[0.3em] text-ivory">
                  Latest from <span className="text-[#ffb27a]">LinkedIn</span>
                </span>
              </span>
              <span aria-hidden className="h-px w-16 bg-gradient-to-r from-[#e58237]/70 to-[#e58237]/30" />
              <span aria-hidden className="h-2 w-2 rounded-full bg-[#ffb27a] shadow-[0_0_10px_#e58237]" />
            </p>
            <h2 id="lead-title" className="display mt-6 text-[clamp(2.4rem,5.4vw,4.6rem)] leading-[1.02] text-ivory">
              Thoughts.{" "}
              <span className="bg-[linear-gradient(180deg,#ffd59e,#ff9445)] bg-clip-text text-transparent">Progress.</span> Updates.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mist">
              A glimpse into what she is learning, building and sharing on LinkedIn — from projects and internships to hackathons and the communities she serves.
            </p>
            <HerVoice clip="signoff" />
          </div>
          <a
            href={profile.links.linkedin}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex shrink-0 items-center gap-3 self-start rounded-full border border-[#e58237]/50 bg-[#07080a]/80 py-3 pl-3 pr-5 text-[15px] text-ivory transition-[border-color,box-shadow] duration-300 hover:border-[#ffb27a] hover:shadow-[0_0_28px_-4px_rgba(229,130,55,0.75)] lg:self-auto"
            data-cursor="external"
          >
            <InMark size={26} />
            View her LinkedIn profile
            <ArrowRight aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </a>
        </div>

        <div className="relative mt-12" role="region" aria-roledescription="carousel" aria-label="Her LinkedIn posts">
          <button
            type="button"
            onClick={() => go(at - 1)}
            aria-label="Newer posts"
            className="absolute -left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-hair bg-[#07080a]/90 text-ivory transition-colors hover:border-[#ffb27a] hover:text-[#ffb27a] md:-left-6"
            data-cursor="link"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(at + 1)}
            aria-label="Older posts"
            className="absolute -right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-hair bg-[#07080a]/90 text-ivory transition-colors hover:border-[#ffb27a] hover:text-[#ffb27a] md:-right-6"
            data-cursor="link"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="overflow-hidden px-1 py-3">
            <ul className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ transform: `translateX(-${at * 100}%)` }}>
              {posts.map((s, i) => {
                const visible = Math.floor(i / perView) === at;
                return (
                  <li key={s.id} className="shrink-0 px-2" style={{ width: `${100 / perView}%` }} aria-hidden={!visible} inert={!visible}>
                    <PostCard s={s} i={i % perView} on={arrived} />
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label="Pages">
            {Array.from({ length: pages }, (_, p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={p === at}
                aria-label={`Page ${p + 1} of ${pages}`}
                onClick={() => go(p)}
                className={`h-1.5 rounded-full transition-all duration-500 ${p === at ? "w-8 bg-[#ffb27a] shadow-[0_0_8px_#e58237]" : "w-5 bg-ivory/20 hover:bg-ivory/40"}`}
                data-cursor="link"
              />
            ))}
          </div>
        </div>
      </div>
    </Chapter>
  );
}
