"use client";

import {
  Award, BadgeCheck, BookOpen, Briefcase, Code2, FileBadge, Medal, Mic, Rocket, Sparkles, Trophy, Users, type LucideIcon,
} from "lucide-react";
import { achievements, credentials, participation, projects } from "@/content/data";
import { monthYear, useLive } from "@/content/live";
import { useUI } from "@/lib/store";
import { Chapter, useChapterArrived } from "./Chapter";

/** An icon for each win, chosen for what it was. Posts added later get a trophy. */
const WIN_ICON: Record<string, LucideIcon> = {
  "a-offers": Briefcase,
  "a-prakriti": Trophy,
  "a-techkutumb": Medal,
  "a-isro": Rocket,
  "a-devengers": Award,
};

/** What kind of event each was, read from its title. */
function eventIcon(title: string): LucideIcon {
  if (/hack/i.test(title)) return Code2;
  if (/congress|leadership/i.test(title)) return Users;
  if (/outreach|stem|school/i.test(title)) return BookOpen;
  return Mic;
}

type Win = { id: string; date: string; result: string; title: string; detail: string; post: boolean; icon: LucideIcon };

function WinCard({ w, i, on }: { w: Win; i: number; on: boolean }) {
  const read = useUI((s) => s.read);
  const select = useUI((s) => s.select);
  const hover = useUI((s) => s.hover);
  const warm = i % 2 === 0;
  const Icon = w.icon;
  return (
    <li
      className={`transition-[opacity,transform] duration-[900ms] ease-out ${on ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
      style={{ transitionDelay: on ? `${i * 140}ms` : "0ms" }}
    >
      <button
        type="button"
        onClick={() => (w.post ? read(w.id) : select(w.id))}
        onPointerEnter={() => !w.post && hover(w.id)}
        onPointerLeave={() => hover(null)}
        className={`group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-[#07080a]/80 px-5 pb-5 pt-6 text-left transition-[border-color,transform] duration-500 hover:-translate-y-1 ${
          warm ? "border-[#e58237]/30 shadow-[0_0_44px_-14px_rgba(229,130,55,0.55)] hover:border-[#e58237]/70" : "border-[#8fc3f5]/30 shadow-[0_0_44px_-14px_rgba(110,170,240,0.55)] hover:border-[#8fc3f5]/70"
        }`}
        data-cursor="link"
      >
        {/* The icon on its lit pedestal */}
        <span aria-hidden className="relative mx-auto flex h-28 w-full items-center justify-center">
          <span className={`absolute bottom-1 h-6 w-40 rounded-[50%] blur-md ${warm ? "bg-[#e58237]/45" : "bg-[#5aa0e6]/45"}`} />
          <span className={`absolute bottom-3 h-2 w-28 rounded-[50%] ${warm ? "bg-[#ffb27a]/60" : "bg-[#bfe0ff]/60"} blur-[2px]`} />
          <Icon
            strokeWidth={1.2}
            className={`relative mb-4 h-16 w-16 transition-transform duration-500 group-hover:-translate-y-1 ${
              warm ? "text-[#ffb27a] drop-shadow-[0_0_18px_rgba(229,130,55,0.9)]" : "text-[#bfe0ff] drop-shadow-[0_0_18px_rgba(110,170,240,0.9)]"
            }`}
          />
        </span>
        <span className={`display mt-3 block text-[1.9rem] leading-none ${warm ? "text-[#ffb27a]" : "text-[#bfe0ff]"}`}>{w.result}</span>
        <span className="display mt-2 block text-[1.2rem] leading-tight text-ivory">{w.title}</span>
        <span className="mt-2 block text-[13px] leading-relaxed text-mist">{w.detail}</span>
        <span className={`mono mt-auto self-start rounded-full border px-3 py-1 pt-1 ${warm ? "border-[#e58237]/40 text-[#ffcf9f]" : "border-[#8fc3f5]/40 text-[#cfe6ff]"} mt-5`}>{w.date}</span>
      </button>
    </li>
  );
}

/** The lit path under the wins: one node per win, in order. */
function Path({ count, on }: { count: number; on: boolean }) {
  const pts = Array.from({ length: count }, (_, i) => ({ x: (i + 0.5) / count, y: i % 2 ? 0.62 : 0.38 }));
  const d = pts.reduce((acc, p, i) => {
    if (i === 0) return `M 0 0.5 C ${p.x / 2} 0.5, ${p.x / 2} ${p.y}, ${p.x} ${p.y}`;
    const q = pts[i - 1];
    const mx = (q.x + p.x) / 2;
    return `${acc} C ${mx} ${q.y}, ${mx} ${p.y}, ${p.x} ${p.y}`;
  }, "");
  return (
    <div aria-hidden className="relative mt-6 hidden h-16 lg:block">
      <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="win-path" x1="0" x2="1">
            <stop offset="0" stopColor="#e58237" />
            <stop offset="0.5" stopColor="#ffd4a8" />
            <stop offset="1" stopColor="#8fc3f5" />
          </linearGradient>
        </defs>
        <path d={`${d} S 1 0.5, 1 0.5`} fill="none" stroke="url(#win-path)" strokeWidth="2" vectorEffect="non-scaling-stroke" pathLength={1}
          className="transition-[stroke-dashoffset] duration-[1800ms] ease-out [filter:drop-shadow(0_0_6px_rgba(255,160,70,0.9))]"
          style={{ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1 }}
        />
      </svg>
      {pts.map((p, i) => (
        <span
          key={i}
          className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[#140c06] transition-opacity duration-500 ${i % 2 ? "border-[#8fc3f5] shadow-[0_0_14px_#8fc3f5]" : "border-[#ffb27a] shadow-[0_0_14px_#e58237]"} ${on ? "opacity-100" : "opacity-0"}`}
          style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, transitionDelay: on ? `${600 + i * 200}ms` : "0ms" }}
        />
      ))}
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Icon strokeWidth={1.4} aria-hidden className="h-8 w-8 shrink-0 text-[#e58237] drop-shadow-[0_0_10px_rgba(229,130,55,0.7)]" />
      <div>
        <p className="display text-[2.2rem] leading-none text-ivory">{value}</p>
        <p className="mono mt-1 text-faint">{label}</p>
      </div>
    </div>
  );
}

/** 05 — Achievements & participation. Her wins as lit milestones, what she took part in, and her certifications. */
export function ConvergeChapter() {
  const read = useUI((s) => s.read);
  const live = useLive((s) => s.posts);
  const arrived = useChapterArrived();

  // Posts published from /admin join the lists they belong to, newest first.
  const wins: Win[] = [
    ...live.filter((p) => p.kind === "achievement" && p.achievement).map((p) => ({ id: p.id, date: monthYear(p.date), result: p.achievement!.result, title: p.achievement!.title, detail: p.achievement!.detail, post: true, icon: Trophy })),
    ...achievements.map((a) => ({ id: a.id, date: a.date, result: a.result, title: a.title, detail: a.detail, post: false, icon: WIN_ICON[a.id] ?? Trophy })),
  ];
  const events = [
    ...live.filter((p) => p.kind === "participation").map((p) => ({ id: p.id, title: p.title, role: p.role ?? p.summary, date: monthYear(p.date), signal: p.id })),
    ...participation,
  ];
  const certs = [
    ...live.filter((p) => p.kind === "certification" && p.certification).map((p) => ({ name: p.certification!.name, issuer: p.certification!.issuer, date: monthYear(p.date) })),
    ...credentials,
  ];

  return (
    <Chapter id="converge" free>
      <div className="mx-auto max-w-[80rem]">
        <header className="text-center">
          <p className="title-face text-[0.74rem] uppercase tracking-[0.42em] text-ivory/75">Milestones that shaped her journey</p>
          <h2
            id="converge-title"
            className="title-face mt-3 bg-[linear-gradient(180deg,#fff1d6_0%,#f7c983_40%,#ec9a4c_75%,#cf7433_100%)] bg-clip-text text-[clamp(2.4rem,6.4vw,5.2rem)] font-semibold uppercase leading-none tracking-[0.16em] text-transparent [margin-right:-0.16em] drop-shadow-[0_0_24px_rgba(255,150,60,0.35)]"
          >
            Achievements
          </h2>
          <p className="title-face mt-4 text-[0.7rem] uppercase tracking-[0.38em] text-mist">Recognition · Learning · Leadership · Growth</p>
          <span aria-hidden className="mx-auto mt-4 block h-[1.5px] w-16 bg-gradient-to-r from-transparent via-[#e58237] to-transparent shadow-[0_0_8px_rgba(229,130,55,0.7)]" />
        </header>

        <ul className={`mt-12 grid gap-4 sm:grid-cols-2 ${wins.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
          {wins.map((w, i) => (
            <WinCard key={w.id} w={w} i={i} on={arrived} />
          ))}
        </ul>
        <Path count={Math.min(wins.length, 5)} on={arrived} />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          <section aria-labelledby="took-part-h">
            <h3 id="took-part-h" className="title-face flex items-center gap-3 text-[0.78rem] uppercase tracking-[0.28em] text-[#bfe0ff]">
              <Sparkles aria-hidden className="h-4 w-4" /> Took part in
            </h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {events.map((e) => {
                const Icon = eventIcon(e.title);
                return (
                  <li key={e.id}>
                    <button type="button" onClick={() => read(e.signal)} className="group flex h-full w-full items-start gap-4 rounded-xl border border-hair bg-[#07080a]/70 p-4 text-left transition-colors hover:border-[#8fc3f5]/50" data-cursor="link">
                      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#8fc3f5]/30 bg-[#8fc3f5]/10">
                        <Icon strokeWidth={1.5} className="h-5 w-5 text-[#bfe0ff]" />
                      </span>
                      <span className="min-w-0">
                        <span className="mono text-faint">{e.date}</span>
                        <span className="mt-0.5 block text-[15px] leading-snug text-ivory/90 transition-colors group-hover:text-[#ecd6b8]">{e.title}</span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-mist">{e.role}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="certs-h">
            <h3 id="certs-h" className="title-face flex items-center gap-3 text-[0.78rem] uppercase tracking-[0.28em] text-[#ffcf9f]">
              <BadgeCheck aria-hidden className="h-4 w-4" /> Certifications
            </h3>
            <ul className="mt-5 space-y-3">
              {certs.map((c) => (
                <li key={c.name} className="flex items-center gap-4 rounded-xl border border-hair bg-[#07080a]/70 p-4">
                  <FileBadge aria-hidden strokeWidth={1.5} className="h-6 w-6 shrink-0 text-[#e58237]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] leading-snug text-ivory/90">{c.name}</span>
                    <span className="block text-[13px] text-mist">{c.issuer}</span>
                  </span>
                  <span className="mono shrink-0 text-faint">{c.date}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <dl className="mt-14 grid grid-cols-2 divide-hair rounded-2xl border border-[#e58237]/30 bg-[#07080a]/80 shadow-[0_0_44px_-16px_rgba(229,130,55,0.5)] lg:grid-cols-4 lg:divide-x">
          {[
            { icon: Trophy, value: wins.length, label: "Wins & milestones" },
            { icon: Mic, value: events.length, label: "Events she took part in" },
            { icon: FileBadge, value: certs.length, label: "Certifications" },
            { icon: Code2, value: projects.length, label: "Projects built" },
          ].map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd><Stat {...s} /></dd>
            </div>
          ))}
        </dl>
      </div>
    </Chapter>
  );
}
