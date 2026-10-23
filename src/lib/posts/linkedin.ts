/**
 * Reads what a public LinkedIn post shows to anyone who opens its link — the
 * same preview LinkedIn gives chat apps (title, text, date). One request per
 * post she pastes in; nothing is crawled. Server only.
 */

export type PostPreview = { url: string; title: string; text: string; date: string | null };

const HOSTS = new Set(["linkedin.com", "www.linkedin.com"]);

/** Only her posts on linkedin.com — the server never fetches anywhere else. */
export function checkUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("That doesn't look like a link.");
  }
  if (u.protocol !== "https:" || !HOSTS.has(u.hostname)) throw new Error("Paste a link to a post on linkedin.com.");
  u.hash = "";
  return u;
}

/** LinkedIn activity ids carry their own timestamp: the high bits are milliseconds since 1970. */
export function dateFromId(url: string): string | null {
  const m = url.match(/(?:activity|share|ugcPost)[-:](\d{18,20})/);
  if (!m) return null;
  const ms = Number(BigInt(m[1]) >> BigInt(22));
  const d = new Date(ms);
  return d.getUTCFullYear() > 2015 && ms < Date.now() + 864e5 ? d.toISOString().slice(0, 10) : null;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", nbsp: " " };
const decode = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z0-9#]+);/gi, (m, e) => ENTITIES[e.toLowerCase()] ?? m);

function meta(html: string, name: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decode(content).trim() : "";
}

export async function fetchPreview(raw: string): Promise<PostPreview> {
  const u = checkUrl(raw);
  const res = await fetch(u, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; portfolio-link-preview)", accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  // A redirect must not take the request off LinkedIn.
  if (!HOSTS.has(new URL(res.url).hostname) || !res.ok) {
    return { url: u.href, title: "", text: "", date: dateFromId(u.href) };
  }
  const html = (await res.text()).slice(0, 2_000_000);
  const published = html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] ?? meta(html, "article:published_time");
  return {
    url: u.href,
    title: meta(html, "og:title"),
    text: meta(html, "og:description") || meta(html, "description"),
    date: (published && published.slice(0, 10)) || dateFromId(u.href),
  };
}
