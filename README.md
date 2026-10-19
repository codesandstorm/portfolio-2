# Sutra — the living constellation of Akshita Mahajan

A cinematic portfolio. Fire (her voice, confidence, action) and ice (her intellect, clarity, structure) collide to form her name; the energy left over draws the network of people, places, projects, skills, LinkedIn posts and results that the rest of the site lets you explore.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Append `?tier=static` (no WebGL, reduced motion), `?tier=mobile` or `?tier=high` to force a capability tier.

## Check

```bash
npm run typecheck && npm run lint && npm test && npm run build
node scripts/qa.mjs http://localhost:3000 qa-out --widths=1440,390 --tiers=auto --shots
node scripts/intro.mjs http://localhost:3000 qa-out
node scripts/behaviour.mjs http://localhost:3000
```

The QA scripts drive the locally installed Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`).

## Where things live

| Path | What |
|---|---|
| `src/content/` | Research-derived data, relationship graph + tests, narrative copy |
| `src/lib/intro.ts` | Opening state machine (phases and amounts) |
| `src/components/landing/` | Fire × Ice landing DOM (real `<h1>`, captions, marks, skip) |
| `src/components/webgl/` | One persistent R3F world: particles, ice shards, atmosphere, collision, arcs, constellation, camera |
| `src/shaders/` | GLSL kept out of components |
| `src/components/chapters/` | Chapters 01–09 (each also renders as plain flowing content in the static tier) |
| `src/lib/audio/` | Synthesised Web Audio — off by default |
| `docs/` | Audit, experience architecture, landing plan, refinement audit, provenance, research |

## Updating content

Edit `src/content/data.ts`; every claim carries a source id. Add `sourceUrl` to a signal to link its exact LinkedIn post, and set `profile.portrait` to an approved photograph to replace the placeholder silhouette.

## Guided tour narration (ElevenLabs)

The tour (`src/content/tour.ts`) plays in captions-only mode until narration is generated. To add the voice:

1. Put your key in `.env.local` (git-ignored): `ELEVENLABS_API_KEY=...`
   Optional: `ELEVENLABS_VOICE_ID=...` (default: Matilda, a warm female premade narrator — never a clone of Akshita) and `ELEVENLABS_MODEL_ID=...`.
2. `npm run narrate` — writes `public/tour/<stop>.mp3` + word timings and `manifest.json`. Unchanged stops are skipped; `--force` regenerates all; `node scripts/narrate.mjs --voices` lists voices on your account.
3. Commit the generated files in `public/tour/`. The site never calls ElevenLabs at runtime and never sees the key.

The tour always discloses that the narrator is an AI voice and not Akshita's.
