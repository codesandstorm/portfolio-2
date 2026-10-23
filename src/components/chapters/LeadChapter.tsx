"use client";

import { profile, signals } from "@/content/data";
import { formatDate } from "@/content/graph";
import { asSignal, isLive, useLive } from "@/content/live";
import type { LinkedInSignal } from "@/content/types";
import { sfx } from "@/audio/useSound";
import { useUI } from "@/lib/store";
import { HerVoice } from "../ui/HerVoice";
import { Chapter, Kicker } from "./Chapter";

const SHOWN = 6;
/** Posts from the last six weeks carry a "New" mark. */
const NEW_DAYS = 42;

function isNew(date: string) {
  return Date.now() - new Date(`${date}T00:00:00Z`).getTime() < NEW_DAYS * 864e5;
}

function Post({ s }: { s: LinkedInSignal }) {
  const read = useUI((x) => x.read);
  const hover = useUI((x) => x.hover);
  return (
    <button
      type="button"
      onClick={() => { sfx.shimmer(); read(s.id); }}
      // New posts are not stars in the world yet; only curated ones light up.
      onPointerEnter={() => !isLive(s.id) && hover(s.id)}
      onPointerLeave={() => hover(null)}
      className="group flex h-full w-full flex-col border border-hair bg-[#050608]/70 p-6 text-left transition-colors duration-500 hover:border-[#dfbe88]/45"
      data-cursor="link"
    >
      <span className="mono flex items-center gap-3 text-faint">
        {formatDate(s.date)}
        {isNew(s.date) && <span className="rounded-full border border-[#e58237]/60 px-2 py-0.5 text-[9px] text-[#e58237]">New</span>}
      </span>
      <span className="display mt-4 block text-[1.6rem] leading-[1.08] text-ivory transition-colors group-hover:text-[#ecd6b8]">{s.title}</span>
      <span className="mt-3 line-clamp-3 text-sm leading-relaxed text-mist">{s.summary}</span>
      {s.quote && <span className="display mt-4 block text-lg italic leading-snug text-gold/85">{s.quote}</span>}
      <span className="mono mt-auto pt-5 text-[#dfbe88] opacity-70 transition-opacity group-hover:opacity-100">
        Read <span aria-hidden>→</span>
      </span>
    </button>
  );
}

/** 06 — Latest. Her newest LinkedIn posts; ones she adds from /admin appear here as soon as they are published. */
export function LeadChapter() {
  const live = useLive((s) => s.posts);
  const latest = [...live.map(asSignal), ...signals].sort((a, b) => b.date.localeCompare(a.date)).slice(0, SHOWN);

  return (
    <Chapter id="lead" free>
      <div className="mx-auto max-w-[78rem]">
        <Kicker id="lead" />
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="lead-title" className="display text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.98] text-ivory">
              Latest from <span className="italic text-gold">LinkedIn.</span>
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mist">What she is building, winning and learning — her newest posts, as she shares them.</p>
            <HerVoice clip="signoff" />
          </div>
          <a href={profile.links.linkedinActivity} target="_blank" rel="noreferrer" className="thread-link mono shrink-0 text-gold" data-cursor="external">
            All her posts on LinkedIn <span aria-hidden>↗</span>
          </a>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((s) => (
            <li key={s.id}>
              <Post s={s} />
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  );
}
