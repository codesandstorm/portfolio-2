import { createHash } from "node:crypto";
import { answer } from "@/content/ask";

/**
 * Voices "Ask the constellation" answers with the tour's narrator.
 *
 * The browser sends the visitor's *question*; the answer is recomputed here
 * from the grounded answerer, so the ElevenLabs key can only ever speak
 * answers drawn from her verified data — never arbitrary text. Answers are
 * cached in memory and requests are rate-limited per address.
 */
export const runtime = "nodejs";

const VOICE = process.env.ELEVENLABS_VOICE_ID || "XrExE9yKIg1WjnnlVkGX";
const MODEL = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const cache = new Map<string, ArrayBuffer>();
const hits = new Map<string, { n: number; t: number }>();
const LIMIT = 20; // requests per address per minute

function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n++;
  return h.n > LIMIT;
}

export async function POST(request: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return new Response("Voice is not configured.", { status: 503 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return new Response("Too many questions — try again in a minute.", { status: 429 });

  let question = "";
  try {
    question = String((await request.json())?.question ?? "").slice(0, 300);
  } catch {
    return new Response("Bad request.", { status: 400 });
  }
  const spoken = (() => {
    const a = answer(question);
    return a.say ?? a.text;
  })();
  const id = createHash("sha1").update(`${VOICE}|${MODEL}|${spoken}`).digest("hex");

  let audio = cache.get(id);
  if (!audio) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: spoken,
        model_id: MODEL,
        voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true, speed: 1 },
      }),
    });
    if (!res.ok) return new Response("Voice is unavailable right now.", { status: 502 });
    audio = await res.arrayBuffer();
    if (cache.size > 200) cache.delete(cache.keys().next().value!);
    cache.set(id, audio);
  }
  return new Response(audio, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" } });
}
