import { revalidatePath } from "next/cache";
import { projects, skills } from "@/content/data";
import { LIVE_PREFIX, type LiveKind, type LivePost } from "@/content/live";
import { isAdmin } from "@/lib/posts/auth";
import { checkUrl } from "@/lib/posts/linkedin";
import { readPosts, StoreNotConfigured, writePosts } from "@/lib/posts/store";

/** List, publish (add or replace) and remove live posts. Every change refreshes the home page. */
export const runtime = "nodejs";

const KINDS: LiveKind[] = ["update", "achievement", "participation", "certification"];
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown, allowed?: Set<string>) =>
  (Array.isArray(v) ? v : []).map((x) => str(x, 60)).filter((x) => x && (!allowed || allowed.has(x)));

/** Rebuild the post from known fields only, so nothing unexpected reaches the page. */
function clean(input: Record<string, unknown>): LivePost | string {
  const url = str(input.url, 600);
  try {
    checkUrl(url);
  } catch (e) {
    return (e as Error).message;
  }
  const date = str(input.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Give the post's date.";
  const title = str(input.title, 120);
  const summary = str(input.summary, 600);
  if (!title || !summary) return "A title and a summary are needed.";
  const kind = KINDS.includes(input.kind as LiveKind) ? (input.kind as LiveKind) : "update";
  const a = (input.achievement ?? {}) as Record<string, unknown>;
  const c = (input.certification ?? {}) as Record<string, unknown>;
  if (kind === "achievement" && !str(a.result, 40)) return "An achievement needs its result (e.g. “3rd place”).";
  if (kind === "certification" && !str(c.name, 120)) return "A certification needs its name.";
  const id = str(input.id, 60);
  return {
    id: id.startsWith(LIVE_PREFIX) ? id : `${LIVE_PREFIX}${Date.now().toString(36)}`,
    url,
    date,
    title,
    summary,
    quote: str(input.quote, 240) || undefined,
    kind,
    achievement: kind === "achievement" ? { result: str(a.result, 40), title: str(a.title, 120) || title, detail: str(a.detail, 300) || summary } : undefined,
    role: kind === "participation" ? str(input.role, 140) || undefined : undefined,
    certification: kind === "certification" ? { name: str(c.name, 120), issuer: str(c.issuer, 80) } : undefined,
    skills: list(input.skills, new Set(skills.map((s) => s.id))),
    newSkills: list(input.newSkills).slice(0, 5),
    projects: list(input.projects, new Set(projects.map((p) => p.id))),
    createdAt: str(input.createdAt, 40) || new Date().toISOString(),
  };
}

async function save(posts: LivePost[]) {
  try {
    await writePosts(posts);
  } catch (e) {
    if (e instanceof StoreNotConfigured) return Response.json({ error: e.message }, { status: 503 });
    throw e;
  }
  revalidatePath("/");
  return null;
}

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Sign in first." }, { status: 401 });
  return Response.json({ posts: await readPosts() });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Sign in first." }, { status: 401 });
  const post = clean((await req.json().catch(() => ({}))) as Record<string, unknown>);
  if (typeof post === "string") return Response.json({ error: post }, { status: 400 });
  const posts = (await readPosts()).filter((p) => p.id !== post.id && p.url !== post.url);
  const failed = await save([post, ...posts]);
  return failed ?? Response.json({ post });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Sign in first." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const posts = await readPosts();
  if (!id || !posts.some((p) => p.id === id)) return Response.json({ error: "No such post." }, { status: 404 });
  const failed = await save(posts.filter((p) => p.id !== id));
  return failed ?? Response.json({ ok: true });
}
