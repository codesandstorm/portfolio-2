"use client";

import { ArrowUpRight, Briefcase, CalendarDays, Globe, Laptop, MapPin, Users, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { experiences } from "@/content/data";
import type { Experience } from "@/content/types";
import { useUI } from "@/lib/store";
import { Chapter, useChapterArrived } from "./Chapter";

/** Her work, newest first. Her degree is in About, not here. */
const shown = experiences.filter((e) => e.kind !== "education").sort((a, b) => b.start.localeCompare(a.start));

const KIND: Record<Experience["kind"], { label: string; icon: LucideIcon }> = {
  internship: { label: "Internship", icon: Laptop },
  leadership: { label: "Campus leadership", icon: Users },
  community: { label: "Community", icon: Globe },
  education: { label: "Education", icon: Briefcase },
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "Jul – Aug 2026" / "Sep 2025 – Sep 2026" / "Nov 2025 – present" → where it stands today. */
function statusOf(period: string, now = new Date()): "Upcoming" | "Ongoing" | "Completed" {
  const parts = period.toLowerCase().split("–").map((s) => s.trim());
  const when = (s: string, fallbackYear?: number) => {
    const m = MONTHS.indexOf(s.slice(0, 3));
    const y = Number(s.match(/\d{4}/)?.[0] ?? fallbackYear);
    return m < 0 || !y ? null : new Date(y, m, 1);
  };
  const endYear = Number(parts[1]?.match(/\d{4}/)?.[0]);
  const start = when(parts[0], endYear);
  if (start && start > now) return "Upcoming";
  if (!parts[1] || /present/.test(parts[1])) return "Ongoing";
  const end = when(parts[1]);
  // A period runs to the end of its last month.
  return end && new Date(end.getFullYear(), end.getMonth() + 1, 1) > now ? "Ongoing" : "Completed";
}

const BADGE = {
  Upcoming: "border-[#e58237]/70 bg-[#e58237]/15 text-[#ffb27a]",
  Ongoing: "border-[#e58237]/70 bg-[#e58237]/15 text-[#ffb27a]",
  Completed: "border-[#8fc3f5]/60 bg-[#8fc3f5]/12 text-[#bfe0ff]",
};

/** A small lit tile standing in for a photograph: the kind of work, and who it was with. */
function Emblem({ e, warm }: { e: Experience; warm: boolean }) {
  const Icon = KIND[e.kind].icon;
  const short = e.organization.split("·")[0].trim();
  return (
    <div
      aria-hidden
      className={`relative hidden w-36 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border sm:flex ${
        warm ? "border-[#e58237]/25 bg-[radial-gradient(circle_at_50%_35%,rgba(229,130,55,0.28),transparent_70%)]" : "border-[#8fc3f5]/25 bg-[radial-gradient(circle_at_50%_35%,rgba(110,170,240,0.28),transparent_70%)]"
      }`}
    >
      <span className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:14px_14px]" />
      <Icon strokeWidth={1.3} className={`relative h-12 w-12 ${warm ? "text-[#ffb27a] drop-shadow-[0_0_14px_rgba(229,130,55,0.7)]" : "text-[#bfe0ff] drop-shadow-[0_0_14px_rgba(110,170,240,0.7)]"}`} />
      <span className="title-face relative mt-3 px-2 text-center text-[0.68rem] uppercase tracking-[0.18em] text-ivory/80">{short}</span>
    </div>
  );
}

function Card({ e, i, on }: { e: Experience; i: number; on: boolean }) {
  const select = useUI((s) => s.select);
  const status = statusOf(e.period);
  const left = i % 2 === 0;
  const warm = left;
  const year = e.start.slice(0, 4);
  return (
    <li className={`relative md:grid md:grid-cols-[1fr_6rem_1fr] md:items-center`}>
      {/* The node on the line, and the year beside it */}
      <span
        aria-hidden
        className={`absolute left-[11px] top-8 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-[#ffb27a]/80 bg-[#140c06] shadow-[0_0_16px_rgba(255,150,60,0.8)] transition-[opacity,transform] duration-700 md:left-1/2 md:top-1/2 md:-translate-y-1/2 ${on ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
      >
        <span className="h-2 w-2 rounded-full bg-[#ffd4a8]" />
      </span>
      <div
        className={`ml-9 transition-[opacity,transform] duration-[900ms] ease-out md:ml-0 ${left ? "md:col-start-1" : "md:col-start-3"} md:row-start-1 ${
          on ? "translate-x-0 opacity-100" : `opacity-0 ${left ? "md:-translate-x-10" : "md:translate-x-10"} translate-y-4 md:translate-y-0`
        }`}
      >
        <article
          aria-labelledby={`${e.id}-h`}
          className={`group flex gap-5 rounded-2xl border bg-[#07080a]/80 p-5 backdrop-blur-[2px] transition-colors duration-500 sm:p-6 ${
            warm ? "border-[#e58237]/30 shadow-[0_0_40px_-12px_rgba(229,130,55,0.45)] hover:border-[#e58237]/60" : "border-[#8fc3f5]/30 shadow-[0_0_40px_-12px_rgba(110,170,240,0.45)] hover:border-[#8fc3f5]/60"
          } ${left ? "" : "md:flex-row-reverse"}`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className={`title-face text-[0.66rem] uppercase tracking-[0.24em] ${warm ? "text-[#ffb27a]" : "text-[#8fc3f5]"}`}>{KIND[e.kind].label}</p>
              <span className={`shrink-0 rounded-md border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] ${BADGE[status]}`}>{status}</span>
            </div>
            <h3 id={`${e.id}-h`} className="mt-2">
              <button type="button" onClick={() => select(e.id)} className="display inline-flex items-start gap-2 text-left text-[1.7rem] leading-[1.08] text-ivory transition-colors hover:text-[#ecd6b8]" data-cursor="link">
                {e.organization}
                <ArrowUpRight aria-label="Open connections" className="mt-1 h-4 w-4 shrink-0 text-mist" />
              </button>
            </h3>
            <p className="mt-1 text-sm text-gold/90">{e.role}</p>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-mist">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[#e58237]" aria-hidden />{e.period}</span>
              {e.place && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#e58237]" aria-hidden />{e.place}</span>}
            </p>
            <ul className="mt-4 space-y-1.5 text-[13.5px] leading-relaxed text-ivory/80">
              {e.work.slice(0, 4).map((w) => (
                <li key={w} className="flex gap-2.5">
                  <span aria-hidden className={`mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full ${warm ? "bg-[#e58237]" : "bg-[#8fc3f5]"}`} />
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <Emblem e={e} warm={warm} />
        </article>
      </div>
      {/* The year, on the far side of the line */}
      <p
        aria-hidden
        className={`hidden md:row-start-1 md:block ${left ? "md:col-start-3 md:pl-2 md:text-left" : "md:col-start-1 md:pr-2 md:text-right"} transition-opacity duration-700 ${on ? "opacity-100" : "opacity-0"}`}
      >
        <span className="display block text-3xl text-ivory/90">{year}</span>
        <span className="mono text-faint">{e.period.replace(/\s?\d{4}/g, "").replace(/\s–\s?$/, "")}</span>
      </p>
    </li>
  );
}

/** 02 — Experience. A lit timeline of where she has worked; each place arrives in turn. */
export function CollaborateChapter() {
  const arrived = useChapterArrived();
  const list = useRef<HTMLOListElement>(null);
  const [visible, setVisible] = useState(0);

  // One by one, as each card reaches the screen.
  useEffect(() => {
    if (!arrived) {
      const t = window.setTimeout(() => setVisible(0), 0);
      return () => window.clearTimeout(t);
    }
    const items = [...(list.current?.children ?? [])];
    const seen = new Set<number>();
    const timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          seen.add(items.indexOf(en.target));
        }
        // Reveal in order, never skipping one above.
        let k = 0;
        while (seen.has(k)) k++;
        timers.push(window.setTimeout(() => setVisible((v) => Math.max(v, k)), 0));
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [arrived]);

  // Cards that have been let in arrive with a beat between them.
  const [shownCount, setShownCount] = useState(0);
  useEffect(() => {
    if (shownCount >= visible) {
      if (shownCount > visible) {
        const t = window.setTimeout(() => setShownCount(visible), 0);
        return () => window.clearTimeout(t);
      }
      return;
    }
    const t = window.setTimeout(() => setShownCount((c) => c + 1), shownCount === 0 ? 150 : 420);
    return () => window.clearTimeout(t);
  }, [visible, shownCount]);

  return (
    <Chapter id="collaborate" free>
      <div className="mx-auto max-w-[78rem]">
        <header className="text-center">
          <p className="title-face text-[0.74rem] uppercase tracking-[0.42em] text-ivory/75">My journey</p>
          <h2
            id="collaborate-title"
            className="title-face mt-3 bg-[linear-gradient(180deg,#fff1d6_0%,#f7c983_40%,#ec9a4c_75%,#cf7433_100%)] bg-clip-text text-[clamp(2.6rem,7vw,5.6rem)] font-semibold uppercase leading-none tracking-[0.18em] text-transparent [margin-right:-0.18em] drop-shadow-[0_0_24px_rgba(255,150,60,0.35)]"
          >
            Experience
          </h2>
          <p className="title-face mt-4 text-[0.7rem] uppercase tracking-[0.38em] text-mist">Real projects · Real learning · Real impact</p>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-mist">
            Internships where she shipped, and the campus communities she helps lead.
          </p>
        </header>

        <div className="relative mt-14">
          {/* The line itself: lit, and filling as the cards arrive. */}
          <span aria-hidden className="absolute bottom-0 left-[11px] top-0 w-px bg-hair md:left-1/2" />
          <span
            aria-hidden
            className="absolute left-[11px] top-0 w-[2px] origin-top -translate-x-[0.5px] bg-gradient-to-b from-[#ffd4a8] via-[#e58237] to-[#8fc3f5] shadow-[0_0_14px_rgba(255,150,60,0.8)] transition-[height] duration-[1200ms] ease-out md:left-1/2"
            style={{ height: `${(shownCount / shown.length) * 100}%` }}
          />
          <ol ref={list} className="space-y-10 md:space-y-6">
            {shown.map((e, i) => (
              <Card key={e.id} e={e} i={i} on={i < shownCount} />
            ))}
          </ol>
        </div>

        <figure
          className={`mx-auto mt-14 max-w-md rounded-2xl border border-hair bg-[#07080a]/70 px-8 py-6 text-center transition-opacity duration-1000 ${shownCount >= shown.length ? "opacity-100" : "opacity-0"}`}
        >
          <blockquote className="display text-xl italic leading-snug text-ivory/90">“Trust my ideas. Take ownership. Ask better questions.”</blockquote>
          <figcaption className="mono mt-3 text-faint">What IIT Indore taught her · from her post</figcaption>
          <span aria-hidden className="mx-auto mt-4 block h-px w-10 bg-[#e58237]" />
        </figure>
      </div>
    </Chapter>
  );
}
