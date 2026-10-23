"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { profile, projects } from "@/content/data";
import { getEdgeConfidence, getNode, getSkillsForProject } from "@/content/graph";
import type { Project } from "@/content/types";
import { sfx } from "@/audio/useSound";
import { useUI } from "@/lib/store";
import { ProjectDemo } from "../demos/ProjectDemo";
import { BrandLogo, SkillLogo, stackBrands } from "../ui/TechLogo";
import { ProjectArt } from "./ProjectArt";
import { Chapter, Kicker } from "./Chapter";

const STATUS: Record<Project["status"], string> = {
  live: "Live",
  internship: "Internship",
  built: "Built",
  hackathon: "Hackathon",
};

/** Fire for what is running in the world, ice for what was made under a clock — the landing's two lights. */
const TONE: Record<Project["status"], string> = {
  live: "text-[#e58237]",
  internship: "text-[#dfbe88]",
  built: "text-ivory/70",
  hackathon: "text-[#8fc3f5]",
};

type Filter = "all" | Project["status"];
const FILTERS: Filter[] = ["all", ...(["live", "internship", "hackathon", "built"] as const).filter((s) => projects.some((p) => p.status === s))];

function Label({ children }: { children: ReactNode }) {
  return <h4 className="mono mb-2 text-gold/90">{children}</h4>;
}

function Block({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <Label>{title}</Label>
      {children}
    </div>
  );
}

/** Everything about one project: why, what she did, the hard part, a demo you can touch, and the evidence. */
function Detail({ p }: { p: Project }) {
  const select = useUI((s) => s.select);
  const read = useUI((s) => s.read);
  const skills = getSkillsForProject(p.id);
  const inferred = p.experience && getEdgeConfidence(p.id, p.experience) === "inferred";
  const n = projects.indexOf(p) + 1;

  return (
    <article aria-labelledby={`${p.id}-h`}>
      <p className="mono text-faint">
        Project {String(n).padStart(2, "0")} / {String(projects.length).padStart(2, "0")} · <span className={TONE[p.status]}>{STATUS[p.status]}</span> · {p.period}
      </p>
      <h3 id={`${p.id}-h`} className="display mt-3 text-[clamp(2.2rem,4vw,3.2rem)] leading-[0.95] text-ivory">
        {p.name}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-ivory/80">{p.tagline}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-x-8">
        {p.problem && (
          <Block title="Why it existed" wide>
            <p className="text-sm leading-relaxed text-mist">{p.problem}</p>
          </Block>
        )}
        <Block title="What she did" wide={!p.difficult}>
          <p className="mb-1 text-sm text-ivory/85">{p.role}</p>
          <ul className="space-y-0.5 text-sm leading-snug text-mist">{p.built.map((b) => <li key={b}>{b}</li>)}</ul>
        </Block>
        {p.difficult && (
          <Block title="The hard part">
            <p className="text-sm leading-relaxed text-mist">{p.difficult}</p>
          </Block>
        )}
        <div className="sm:col-span-2">
          <ProjectDemo id={p.id} />
        </div>
        <Block title="Technologies" wide>
          {stackBrands(p.stack).length > 0 && (
            <p className="mb-3 flex flex-wrap gap-3">
              {stackBrands(p.stack).map((b) => (
                <span key={b.slug} className="inline-flex items-center gap-2 rounded-full border border-hair bg-[#07080a] py-1.5 pl-2.5 pr-3 text-[13px] text-ivory/85">
                  <BrandLogo icon={b} size={15} />
                  {b.title}
                </span>
              ))}
            </p>
          )}
          <p className="mono leading-relaxed text-ivory/70">{p.stack.join(" · ")}</p>
        </Block>
        <Block title="Skills it strengthened">
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            {skills.map((s) => (
              <button key={s.id} type="button" onClick={() => select(s.id)} className="mono inline-flex items-center gap-1.5 text-mist hover:text-gold" data-cursor="link">
                <SkillLogo id={s.id} size={13} />
                {s.name}
              </button>
            ))}
          </p>
        </Block>
        {(p.experience || p.learned) && (
          <Block title={p.experience ? "Born in" : "Learned"}>
            {p.experience && (
              <>
                <button type="button" onClick={() => select(p.experience!)} className="text-sm text-ivory/85 underline decoration-gold/40 underline-offset-4 hover:text-gold" data-cursor="link">
                  {getNode(p.experience)?.label}
                </button>
                {inferred && <span className="mono ml-2 text-faint">inferred from dates</span>}
              </>
            )}
            {p.learned && <p className={`text-sm leading-relaxed text-mist ${p.experience ? "mt-3" : ""}`}>{p.learned.join(" · ")}</p>}
          </Block>
        )}
        {p.after && (
          <Block title="What came after" wide>
            <p className="text-sm leading-relaxed text-ivory/85">{p.after}</p>
          </Block>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
          {p.github && (
            <a href={p.github} target="_blank" rel="noreferrer" className="thread-link mono text-gold" data-cursor="external">
              Source on GitHub <span aria-hidden>↗</span>
            </a>
          )}
          {p.signals?.map((s) => (
            <button key={s} type="button" onClick={() => read(s)} className="thread-link text-sm" data-cursor="link">
              <span className="mono text-gold">LI</span> {getNode(s)?.label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function Card({ p, onOpen }: { p: Project; onOpen: () => void }) {
  const hover = useUI((s) => s.hover);
  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerEnter={() => hover(p.id)}
      onPointerLeave={() => hover(null)}
      onFocus={() => hover(p.id)}
      onBlur={() => hover(null)}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-hair bg-[#050608]/70 p-6 text-left backdrop-blur-[2px] transition-[border-color,background-color] duration-500 hover:border-[#dfbe88]/45 hover:bg-[#0b0c10]/80"
      data-cursor="link"
    >
      {/* The landing's light sweep, passing once over the card you point at. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -translate-x-full skew-x-[-18deg] bg-[linear-gradient(95deg,transparent,rgba(130,195,255,0.05)_32%,rgba(255,245,210,0.14)_50%,rgba(255,180,70,0.06)_68%,transparent)] transition-transform duration-[900ms] ease-out group-hover:translate-x-[420%]"
      />
      <ProjectArt p={p} />
      <span className="mono flex items-center justify-between text-faint">
        <span className={TONE[p.status]}>{STATUS[p.status]}</span>
        <span>{p.period}</span>
      </span>
      <span className="display mt-5 block text-[1.85rem] leading-[1.02] text-ivory transition-colors duration-300 group-hover:text-[#ecd6b8]">{p.name}</span>
      <span className="mt-3 block text-sm leading-relaxed text-mist">{p.tagline}</span>
      <span className="mono mt-auto block pt-6 leading-relaxed text-ivory/50">{p.stack.slice(0, 4).join(" · ")}</span>
      <span className="mono mt-4 inline-flex items-center gap-2 text-[#dfbe88]">
        View project <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
      </span>
    </button>
  );
}

/** 03 — Projects. Everything she has built in one place: scan the grid, open one for the whole story and a demo. */
export function BuildChapter() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  /** Stays set while the drawer slides out, so the exit can play inside the portal. */
  const [portal, setPortal] = useState(false);
  const setScrollFocus = useUI((s) => s.setScrollFocus);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const shown = projects.filter((p) => filter === "all" || p.status === filter);
  const current = projects.find((p) => p.id === open) ?? null;

  useEffect(() => {
    // The open project's form grows in the world behind the drawer.
    setScrollFocus(open);
    if (!open) return;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !useUI.getState().selected && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setScrollFocus]);

  return (
    <Chapter id="build" free>
      <div className="mx-auto max-w-[78rem]">
        <Kicker id="build" />
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="build-title" className="display text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.98] text-ivory">
            What she has <span className="italic text-gold">built.</span>
          </h2>
          <div role="group" aria-label="Filter projects" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const count = f === "all" ? projects.length : projects.filter((p) => p.status === f).length;
              const on = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={on}
                  onClick={() => { sfx.shimmer(); setFilter(f); }}
                  className={`mono rounded-full border px-4 py-2 transition-colors ${on ? "border-[#dfbe88]/70 text-[#ecd6b8]" : "border-hair text-mist hover:border-[#dfbe88]/40 hover:text-ivory"}`}
                  data-cursor="link"
                >
                  {f === "all" ? "All" : STATUS[f]} <span className="text-faint">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.ul layout className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {shown.map((p) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card p={p} onOpen={() => { sfx.shimmer(); setPortal(true); setOpen(p.id); }} />
              </motion.li>
            ))}
            {filter === "all" && (
              <motion.li key="more" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <a
                  href={profile.links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full min-h-[14rem] flex-col items-start justify-end rounded-2xl border border-dashed border-hair p-6 text-mist transition-colors hover:border-[#dfbe88]/45 hover:text-ivory"
                  data-cursor="external"
                >
                  <span className="display text-[1.6rem] leading-tight">Everything else she has written</span>
                  <span className="mono mt-4 text-[#dfbe88]">GitHub <span aria-hidden>↗</span></span>
                </a>
              </motion.li>
            )}
          </AnimatePresence>
        </motion.ul>
      </div>

      {/* Portalled: the section is its own stacking context, and the drawer must sit above the whole page. */}
      {portal && createPortal(<Drawer p={current} closeBtn={closeBtn} onClose={() => setOpen(null)} onExited={() => setPortal(false)} />, document.body)}
    </Chapter>
  );
}

function Drawer({
  p,
  closeBtn,
  onClose,
  onExited,
}: {
  p: Project | null;
  closeBtn: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onExited: () => void;
}) {
  return (
    <AnimatePresence onExitComplete={onExited}>
      {p && (
        <>
          <motion.div
            key="scrim"
            aria-hidden
            className="fixed inset-0 z-[37] bg-[#050608]/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={p.name}
            className="fixed inset-y-0 right-0 z-[38] w-full overflow-y-auto overscroll-contain border-l border-hair bg-[#07080a]/95 px-6 pb-16 pt-24 sm:w-[min(44rem,92vw)] sm:px-10"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent
          >
            <button
              ref={closeBtn}
              type="button"
              onClick={onClose}
              className="mono absolute right-6 top-24 text-mist hover:text-gold sm:right-10"
              data-cursor="link"
            >
              Close ✕
            </button>
            <Detail p={p} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
