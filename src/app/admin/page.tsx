"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { projects, skills } from "@/content/data";
import { monthYear, type LiveKind, type LivePost } from "@/content/live";

type Status = { signedIn: boolean; configured: boolean; tagger: boolean };
type Draft = Omit<LivePost, "id" | "createdAt"> & { id?: string; createdAt?: string };

const KINDS: { kind: LiveKind; label: string; note: string }[] = [
  { kind: "update", label: "Update", note: "Shows under Latest only" },
  { kind: "achievement", label: "Achievement", note: "Also joins Wins & milestones" },
  { kind: "participation", label: "Participation", note: "Also joins Took part in" },
  { kind: "certification", label: "Certification", note: "Also joins Certifications" },
];

const empty = (url = ""): Draft => ({ url, date: "", title: "", summary: "", kind: "update", skills: [], newSkills: [], projects: [] });

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

const input = "w-full border border-hair bg-[#0b0c10] px-3 py-2 text-[15px] text-ivory outline-none placeholder:text-faint focus:border-[#dfbe88]/60";

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mono text-gold/90">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

function Toggles({ items, on, flip }: { items: { id: string; name: string }[]; on: string[]; flip: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = on.includes(it.id);
        return (
          <button
            key={it.id}
            type="button"
            aria-pressed={active}
            onClick={() => flip(it.id)}
            className={`rounded-full border px-3 py-1 text-[13px] transition-colors ${active ? "border-[#dfbe88]/80 bg-[#dfbe88]/10 text-[#ecd6b8]" : "border-hair text-mist hover:text-ivory"}`}
          >
            {it.name}
          </button>
        );
      })}
    </div>
  );
}

function SignIn({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api("/api/admin/session", { method: "POST", body: JSON.stringify({ password }) });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  return (
    <form onSubmit={submit} className="mt-10 max-w-sm space-y-4">
      <Field label="Password">
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} autoFocus />
      </Field>
      {error && <p className="text-sm text-[#ff8f8f]">{error}</p>}
      <button type="submit" className="mono border border-[#dfbe88]/60 px-5 py-2.5 text-[#ecd6b8] hover:bg-[#dfbe88]/10">Sign in</button>
    </form>
  );
}

function Editor({ status, initial, onSaved, onCancel }: { status: Status; initial: Draft; onSaved: () => void; onCancel?: () => void }) {
  const [d, setD] = useState<Draft>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"" | "draft" | "save">("");
  const [notes, setNotes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const flip = (k: "skills" | "projects") => (id: string) => setD((x) => ({ ...x, [k]: x[k].includes(id) ? x[k].filter((i) => i !== id) : [...x[k], id] }));

  const fetchDraft = async () => {
    setBusy("draft");
    setError("");
    setNotes([]);
    try {
      const r = await api<{
        preview: { url: string; title: string; text: string; date: string | null };
        suggestion: (Omit<Draft, "url" | "date" | "quote"> & { quote: string | null; role: string | null; achievement: Draft["achievement"] | null; certification: Draft["certification"] | null }) | null;
        notes: string[];
      }>("/api/admin/draft", { method: "POST", body: JSON.stringify({ url: d.url, text }) });
      setNotes(r.notes);
      if (!text && r.preview.text) setText(r.preview.text);
      const s = r.suggestion;
      setD((x) => ({
        ...x,
        url: r.preview.url,
        date: r.preview.date ?? x.date,
        title: s?.title ?? (x.title || r.preview.title),
        summary: s?.summary ?? x.summary,
        quote: s?.quote ?? x.quote,
        kind: s?.kind ?? x.kind,
        achievement: s?.achievement ?? x.achievement,
        role: s?.role ?? x.role,
        certification: s?.certification ?? x.certification,
        skills: s?.skills ?? x.skills,
        newSkills: s?.newSkills ?? x.newSkills,
        projects: s?.projects ?? x.projects,
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy("");
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("save");
    setError("");
    try {
      await api("/api/admin/posts", { method: "POST", body: JSON.stringify(d) });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy("");
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <Field label="LinkedIn post link" hint="Open the post on LinkedIn, then … → Copy link to post.">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={d.url} onChange={(e) => set("url", e.target.value)} placeholder="https://www.linkedin.com/posts/…" className={input} required />
          <button type="button" onClick={fetchDraft} disabled={!d.url || busy !== ""} className="mono shrink-0 border border-[#dfbe88]/60 px-5 py-2 text-[#ecd6b8] hover:bg-[#dfbe88]/10 disabled:opacity-40">
            {busy === "draft" ? "Reading…" : status.tagger ? "Read & suggest" : "Read post"}
          </button>
        </div>
      </Field>
      <Field label="Post text (optional)" hint="Paste the post's text if LinkedIn doesn't share it, then Read again.">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className={input} />
      </Field>
      {notes.map((n) => <p key={n} className="border-l border-[#dfbe88]/50 pl-3 text-sm text-mist">{n}</p>)}

      <div className="grid gap-6 sm:grid-cols-[10rem_1fr]">
        <Field label="Date">
          <input type="date" value={d.date} onChange={(e) => set("date", e.target.value)} className={input} required />
        </Field>
        <Field label="Title">
          <input value={d.title} onChange={(e) => set("title", e.target.value)} className={input} required maxLength={120} />
        </Field>
      </div>
      <Field label="Summary" hint="One or two sentences, in the third person.">
        <textarea value={d.summary} onChange={(e) => set("summary", e.target.value)} rows={3} className={input} required maxLength={600} />
      </Field>
      <Field label="Quote (optional)" hint="A short line in her words, shown in the reader.">
        <input value={d.quote ?? ""} onChange={(e) => set("quote", e.target.value)} className={input} maxLength={240} />
      </Field>

      <div>
        <span className="mono text-gold/90">What kind of post</span>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              aria-pressed={d.kind === k.kind}
              onClick={() => set("kind", k.kind)}
              className={`border px-3 py-2 text-left ${d.kind === k.kind ? "border-[#dfbe88]/80 bg-[#dfbe88]/10" : "border-hair hover:border-[#dfbe88]/40"}`}
            >
              <span className="block text-sm text-ivory">{k.label}</span>
              <span className="block text-xs text-faint">{k.note}</span>
            </button>
          ))}
        </div>
      </div>

      {d.kind === "achievement" && (
        <div className="grid gap-6 sm:grid-cols-[10rem_1fr]">
          <Field label="Result" hint="e.g. 3rd place">
            <input value={d.achievement?.result ?? ""} onChange={(e) => set("achievement", { result: e.target.value, title: d.achievement?.title ?? "", detail: d.achievement?.detail ?? "" })} className={input} required />
          </Field>
          <Field label="What it was">
            <input value={d.achievement?.title ?? ""} onChange={(e) => set("achievement", { result: d.achievement?.result ?? "", title: e.target.value, detail: d.achievement?.detail ?? "" })} className={input} />
          </Field>
        </div>
      )}
      {d.kind === "participation" && (
        <Field label="What she did there">
          <input value={d.role ?? ""} onChange={(e) => set("role", e.target.value)} className={input} />
        </Field>
      )}
      {d.kind === "certification" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Certificate">
            <input value={d.certification?.name ?? ""} onChange={(e) => set("certification", { name: e.target.value, issuer: d.certification?.issuer ?? "" })} className={input} required />
          </Field>
          <Field label="Issuer">
            <input value={d.certification?.issuer ?? ""} onChange={(e) => set("certification", { name: d.certification?.name ?? "", issuer: e.target.value })} className={input} />
          </Field>
        </div>
      )}

      <div>
        <span className="mono text-gold/90">Skills it shows</span>
        <div className="mt-2"><Toggles items={skills} on={d.skills} flip={flip("skills")} /></div>
      </div>
      <Field label="New skills (optional)" hint="Comma-separated. Added to the Skills section as new.">
        <input value={d.newSkills.join(", ")} onChange={(e) => set("newSkills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className={input} />
      </Field>
      <div>
        <span className="mono text-gold/90">Projects it is about</span>
        <div className="mt-2"><Toggles items={projects} on={d.projects} flip={flip("projects")} /></div>
      </div>

      {error && <p className="text-sm text-[#ff8f8f]">{error}</p>}
      <div className="flex gap-4">
        <button type="submit" disabled={busy !== ""} className="mono bg-[#dfbe88] px-6 py-3 text-[#050608] hover:bg-[#ecd6b8] disabled:opacity-50">
          {busy === "save" ? "Publishing…" : d.id ? "Save changes" : "Publish"}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="mono px-4 text-mist hover:text-ivory">Cancel</button>}
      </div>
    </form>
  );
}

/** Her desk: paste a LinkedIn post, check the suggested details, publish. */
export default function AdminPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [posts, setPosts] = useState<LivePost[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [flash, setFlash] = useState("");

  const refresh = useCallback(async () => {
    const s = await api<Status>("/api/admin/session");
    setStatus(s);
    if (s.signedIn) setPosts((await api<{ posts: LivePost[] }>("/api/admin/posts")).posts);
  }, []);

  useEffect(() => {
    // First load; afterwards `refresh` runs from the handlers that change something.
    api<Status>("/api/admin/session").then(async (s) => {
      setStatus(s);
      if (s.signedIn) setPosts((await api<{ posts: LivePost[] }>("/api/admin/posts")).posts);
    });
  }, []);

  const remove = async (p: LivePost) => {
    if (!window.confirm(`Remove “${p.title}” from the site?`)) return;
    await api(`/api/admin/posts?id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
    await refresh();
  };

  const saved = async (what: string) => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFlash(what);
    await refresh();
  };

  return (
    <main className="min-h-svh bg-[#050608] px-[var(--gutter)] py-16 text-ivory">
      <div className="mx-auto max-w-3xl">
        <p className="title-face text-[0.78rem] uppercase tracking-[0.3em] text-[#d48b3b]">Akshita Mahajan</p>
        <h1 className="display mt-3 text-5xl">Posts from <span className="italic text-gold">LinkedIn.</span></h1>
        <p className="mt-4 text-mist">Paste a post you published; it appears on the site under Latest, and joins Achievements, Participation, Certifications or Skills when it belongs there.</p>

        {status === null && <p className="mono mt-10 text-faint">Loading…</p>}
        {status && !status.configured && (
          <p className="mt-10 border-l border-[#dfbe88]/50 pl-4 text-mist">
            This page is locked until <code className="text-ivory">ADMIN_PASSWORD</code> (8+ characters) is set in the site&apos;s environment.
          </p>
        )}
        {status?.configured && !status.signedIn && <SignIn onDone={refresh} />}

        {status?.signedIn && (
          <>
            <section className="mt-12 border border-hair p-6 sm:p-8">
              <h2 className="mono text-[#ecd6b8]">{editing?.id ? "Edit post" : "Add a post"}</h2>
              <div className="mt-6">
                <Editor
                  key={editing?.id ?? `new-${formKey}`}
                  status={status}
                  initial={editing ?? empty()}
                  onSaved={() => saved(editing?.id ? "Saved." : "Published — it is on the site now.")}
                  onCancel={editing ? () => setEditing(null) : undefined}
                />
              </div>
              {flash && <p className="mono mt-4 text-[#9fd8a8]">{flash}</p>}
            </section>

            <section className="mt-12">
              <h2 className="mono text-[#ecd6b8]">On the site · {posts.length}</h2>
              {!posts.length && <p className="mt-4 text-mist">Nothing added yet — the site shows her curated posts until you add one.</p>}
              <ul className="mt-4 divide-y divide-[rgba(244,236,223,0.12)] border-y border-hair">
                {posts.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
                    <span className="mono w-20 text-faint">{monthYear(p.date)}</span>
                    <span className="flex-1 text-ivory">{p.title}</span>
                    <span className="mono text-faint">{p.kind}</span>
                    <button type="button" onClick={() => { setFlash(""); setEditing(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="mono text-mist hover:text-gold">Edit</button>
                    <button type="button" onClick={() => remove(p)} className="mono text-mist hover:text-[#ff8f8f]">Remove</button>
                  </li>
                ))}
              </ul>
            </section>

            <button type="button" onClick={async () => { await api("/api/admin/session", { method: "DELETE" }); await refresh(); }} className="mono mt-10 text-faint hover:text-ivory">
              Sign out
            </button>
          </>
        )}
      </div>
    </main>
  );
}
