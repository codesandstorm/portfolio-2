import type { Metadata } from "next";
import Link from "next/link";
import { achievements, credentials, experiences, profile, projects, skills, voiceMoments } from "@/content/data";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: "Akshita Mahajan — One page",
  description: "A one-page summary of Akshita Mahajan's work for recruiters, built from her verified LinkedIn and GitHub.",
};

const order = ["x-iit", "x-isoftzone", "x-acm", "x-ieee"];

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mono mb-3 mt-9 border-b border-hair pb-2 text-gold print:mt-6 print:border-neutral-300 print:text-neutral-700">{children}</h2>;
}

/** The recruiter one-pager: the same verified graph, set as a page you can print. */
export default function OnePage() {
  const edu = experiences.find((e) => e.id === "x-suas")!;
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-ivory print:max-w-none print:bg-white print:px-0 print:py-0 print:text-neutral-900">
      <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
        <Link href="/" className="mono text-mist hover:text-gold">← Back to the constellation</Link>
        <PrintButton />
      </div>

      <header>
        <h1 className="display text-5xl leading-none print:text-4xl">{profile.name}</h1>
        <p className="mt-3 text-[15px] text-mist print:text-neutral-700">
          Full-stack engineer · Public speaker · {profile.location}
        </p>
        <p className="mt-1 text-[15px] text-mist print:text-neutral-700">Open to {profile.openTo}; interested in {profile.interest.toLowerCase()}.</p>
        <p className="mono mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[11px]">
          <a href={profile.links.linkedin} className="text-gold underline-offset-4 hover:underline print:text-neutral-900">LinkedIn ↗</a>
          <a href={profile.links.github} className="text-gold underline-offset-4 hover:underline print:text-neutral-900">GitHub ↗</a>
        </p>
      </header>

      <H>Experience</H>
      <div className="space-y-5">
        {order.map((id) => {
          const e = experiences.find((x) => x.id === id)!;
          return (
            <section key={id} className="break-inside-avoid">
              <p className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="text-[16px] font-medium">{e.role} — {e.organization}</span>
                <span className="mono text-[11px] text-faint print:text-neutral-500">{e.period}</span>
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[14px] text-ivory/85 print:text-neutral-800">
                {e.work.slice(0, 3).map((w) => <li key={w}>{w}</li>)}
              </ul>
            </section>
          );
        })}
      </div>

      <H>Projects</H>
      <div className="space-y-4">
        {projects.map((p) => (
          <section key={p.id} className="break-inside-avoid">
            <p className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="text-[16px] font-medium">{p.name}</span>
              <span className="mono text-[11px] text-faint print:text-neutral-500">{p.period}</span>
            </p>
            <p className="text-[14px] text-ivory/85 print:text-neutral-800">{p.tagline} {p.after ?? ""}</p>
            <p className="mono mt-1 text-[10.5px] text-mist print:text-neutral-600">
              {p.stack.slice(0, 8).join(" · ")}
              {p.github && (
                <>
                  {" · "}
                  <a href={p.github} className="text-gold print:text-neutral-900">{p.github.replace("https://", "")}</a>
                </>
              )}
            </p>
          </section>
        ))}
      </div>

      <H>Results</H>
      <ul className="space-y-1.5 text-[14px] print:text-neutral-800">
        {achievements.map((a) => (
          <li key={a.id}>
            <span className="font-medium">{a.result} · {a.title}</span> <span className="text-mist print:text-neutral-600">({a.date}). {a.detail}</span>
          </li>
        ))}
      </ul>

      <H>Leadership &amp; voice</H>
      <ul className="space-y-1 text-[14px] print:text-neutral-800">
        {voiceMoments.map((m) => (
          <li key={m.id}>
            <span className="font-medium">{m.label}</span> — {m.title} <span className="text-mist print:text-neutral-600">({m.date})</span>
          </li>
        ))}
      </ul>

      <H>Skills</H>
      <p className="text-[14px] print:text-neutral-800">
        <span className="font-medium">Built: </span>
        {skills.filter((s) => s.family === "built").map((s) => s.name).join(", ")}
      </p>
      <p className="mt-1 text-[14px] print:text-neutral-800">
        <span className="font-medium">Human: </span>
        {skills.filter((s) => s.family === "human").map((s) => s.name).join(", ")}
      </p>

      <H>Education &amp; certifications</H>
      <ul className="space-y-1 text-[14px] print:text-neutral-800">
        <li>
          <span className="font-medium">{edu.role}</span> — {edu.organization} ({edu.period})
        </li>
        <li>
          {profile.school.detail} — {profile.school.name} ({profile.school.date})
        </li>
        {credentials.map((c) => (
          <li key={c.name}>
            {c.name} — {c.issuer} ({c.date})
          </li>
        ))}
      </ul>

      <p className="mono mt-10 text-[10px] text-faint print:text-neutral-500">Every line is taken from her LinkedIn and GitHub, verified 19 Oct 2026.</p>
    </main>
  );
}
