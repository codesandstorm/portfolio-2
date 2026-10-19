/**
 * Generate the guided-tour narration with ElevenLabs (run once, ship the files).
 *
 *   node scripts/narrate.mjs            generate missing / changed stops
 *   node scripts/narrate.mjs --force    regenerate every stop
 *   node scripts/narrate.mjs --voices   list voices available to your key
 *
 * Reads ELEVENLABS_API_KEY (and optional ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL_ID)
 * from .env.local or .env. The key is only ever sent to api.elevenlabs.io and is
 * never printed. Output: public/tour/<stop>.mp3 + <stop>.json (word timings).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tour } from "../src/content/tour.ts";

const API = "https://api.elevenlabs.io/v1";
const OUT = "public/tour";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    // Notepad / PowerShell may prepend a byte-order mark; it would hide the first key.
    for (const line of readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("ELEVENLABS_API_KEY is not set. Add it to .env.local (that file is git-ignored).");
  process.exit(1);
}
// Default: "George", a warm, neutral premade narrator voice. Override with ELEVENLABS_VOICE_ID.
const voice = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
const model = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const headers = { "xi-api-key": key, "Content-Type": "application/json" };

if (process.argv.includes("--voices")) {
  const res = await fetch(`${API}/voices`, { headers });
  if (!res.ok) throw new Error(`voices: HTTP ${res.status}`);
  const { voices } = await res.json();
  for (const v of voices) console.log(`${v.voice_id}  ${v.name}  (${v.category ?? ""}) ${v.labels?.accent ?? ""} ${v.labels?.description ?? ""}`);
  process.exit(0);
}

/** Words of the spoken text with start/end seconds, from per-character alignment. */
function words(alignment) {
  const out = [];
  let cur = null;
  alignment.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = null;
      return;
    }
    const s = alignment.character_start_times_seconds[i];
    const e = alignment.character_end_times_seconds[i];
    if (!cur) cur = { w: ch, start: s, end: e };
    else {
      cur.w += ch;
      cur.end = e;
    }
  });
  if (cur) out.push(cur);
  return out;
}

mkdirSync(OUT, { recursive: true });
const force = process.argv.includes("--force");
const manifest = { voice, model, stops: {} };
for (let i = 0; i < tour.length; i++) {
  const stop = tour[i];
  const spoken = stop.say ?? stop.text;
  const hash = createHash("sha1").update(`${voice}|${model}|${spoken}`).digest("hex").slice(0, 12);
  const jsonPath = `${OUT}/${stop.id}.json`;
  if (!force && existsSync(jsonPath) && existsSync(`${OUT}/${stop.id}.mp3`)) {
    const prev = JSON.parse(readFileSync(jsonPath, "utf8"));
    if (prev.hash === hash) {
      manifest.stops[stop.id] = { duration: prev.duration };
      console.log(`skip  ${stop.id} (unchanged)`);
      continue;
    }
  }
  const body = {
    text: spoken,
    model_id: model,
    // Steady and unhurried: a narrator, not a performance.
    voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true, speed: 0.95 },
    previous_text: tour[i - 1] ? (tour[i - 1].say ?? tour[i - 1].text) : undefined,
    next_text: tour[i + 1] ? (tour[i + 1].say ?? tour[i + 1].text) : undefined,
  };
  const res = await fetch(`${API}/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error(`fail  ${stop.id}: HTTP ${res.status} ${detail}`);
    process.exit(1);
  }
  const data = await res.json();
  writeFileSync(`${OUT}/${stop.id}.mp3`, Buffer.from(data.audio_base64, "base64"));
  const align = data.alignment ?? data.normalized_alignment;
  const w = words(align);
  const duration = w.length ? w[w.length - 1].end : 0;
  writeFileSync(jsonPath, JSON.stringify({ hash, duration, words: w }));
  manifest.stops[stop.id] = { duration };
  console.log(`made  ${stop.id}  ${duration.toFixed(1)}s`);
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`\n${Object.keys(manifest.stops).length} stops ready in ${OUT}/ (voice ${voice}, model ${model}).`);
