import Anthropic from "@anthropic-ai/sdk";
import { isAdmin } from "@/lib/posts/auth";
import { checkUrl, dateFromId, fetchPreview } from "@/lib/posts/linkedin";
import { suggest, taggerConfigured } from "@/lib/posts/tagger";

/**
 * Turns a pasted LinkedIn link (and, optionally, the post's text pasted by
 * hand) into a draft for the admin form: the post's public preview, plus
 * Claude's suggested kind, summary and tags. Nothing is saved here.
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { url, text } = (await req.json().catch(() => ({}))) as { url?: string; text?: string };
  if (!url) return Response.json({ error: "Paste the post's link." }, { status: 400 });

  let preview;
  try {
    checkUrl(url);
    preview = await fetchPreview(url);
  } catch (e) {
    if (e instanceof Error && /link|linkedin/i.test(e.message)) return Response.json({ error: e.message }, { status: 400 });
    // LinkedIn unreachable or slow: carry on with whatever she pasted.
    preview = { url, title: "", text: "", date: dateFromId(url) };
  }
  // Her own pasted text wins over the preview, which LinkedIn sometimes cuts short.
  const body = text?.trim() || preview.text;
  const notes: string[] = [];
  if (!body) notes.push("LinkedIn didn't share this post's text — paste it into the text box and try again, or fill the fields by hand.");

  let suggestion = null;
  if (body && taggerConfigured()) {
    try {
      suggestion = await suggest({ url: preview.url, title: preview.title, text: body });
      if (!suggestion) notes.push("No suggestion came back for this post — fill the fields by hand.");
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) notes.push("ANTHROPIC_API_KEY was rejected — check it in the environment.");
      else if (e instanceof Anthropic.RateLimitError) notes.push("Claude is rate-limited right now — try again in a minute, or fill the fields by hand.");
      else if (e instanceof Anthropic.APIError) notes.push(`Claude returned an error (${e.status}) — fill the fields by hand.`);
      else throw e;
    }
  } else if (body) {
    notes.push("ANTHROPIC_API_KEY isn't set, so there are no suggestions — fill the fields by hand.");
  }

  return Response.json({ preview: { ...preview, text: body }, suggestion, notes });
}
