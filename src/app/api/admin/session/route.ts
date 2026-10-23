import { cookies } from "next/headers";
import { adminConfigured, isAdmin, newSession, passwordMatches, SESSION_COOKIE } from "@/lib/posts/auth";
import { taggerConfigured } from "@/lib/posts/tagger";

/** Sign in to /admin with ADMIN_PASSWORD; sign out; or ask whether you are signed in. */
export const runtime = "nodejs";

const tries = new Map<string, { n: number; t: number }>();
const LIMIT = 8; // attempts per address per 10 minutes

function limited(ip: string) {
  const now = Date.now();
  const h = tries.get(ip);
  if (!h || now - h.t > 600_000) {
    tries.set(ip, { n: 1, t: now });
    return false;
  }
  h.n++;
  return h.n > LIMIT;
}

export async function GET() {
  return Response.json({ signedIn: await isAdmin(), configured: adminConfigured(), tagger: taggerConfigured() });
}

export async function POST(req: Request) {
  if (!adminConfigured()) return Response.json({ error: "ADMIN_PASSWORD is not set (8+ characters) in the environment." }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || !passwordMatches(password)) return Response.json({ error: "Wrong password." }, { status: 401 });
  const s = newSession();
  (await cookies()).set(SESSION_COOKIE, s.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: s.maxAge,
  });
  return Response.json({ signedIn: true });
}

export async function DELETE() {
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ signedIn: false });
}
