# Landing Refinement Plan — Fire × Ice

The reference image is a mood target for the *resting* frame of the opening, not an asset. Nothing from it is embedded; the generated woman in it is **not** used — Akshita is represented by her name, light and her network until a real, approved photograph exists (`profile.portrait`).

## Thesis

| Fire (left / top on phones) | Ice (right / bottom on phones) |
|---|---|
| Voice, confidence, ambition, action | Intellect, clarity, structure, precision |
| Evidence: "Public Speaker" closes her headline; anchor for a 36-hour hackathon; represented SUAS at SLC; ISRO exhibition coordinator | Evidence: PERN/MERN full-stack engineer; a 33-model HRMS; role portals for a clinical platform |
| Organic, curved, turbulent embers | Angular shards, straight geometric tracers |

Their collision *creates* her name; the leftover energy runs outward along the real relationship graph. Fire + Ice → Akshita → connections → the rest of the site.

Under the name: her own sign-off from SLC 2026, **Connect · Collaborate · Learn · Lead** (LI-P4) — chosen over a generic "Ideas · People · Impact" because it is hers and maps 1:1 onto the chapters that follow.

## What remains (reused as-is)

- Content graph, research, tests, all chapters 01–09, relationship panel, LinkedIn reader.
- The persistent R3F world: constellation (nodes + threads + label projector), camera rig, scroll director, Lenis/GSAP integration, capability tiers, Chrome QA script.
- The single particle body (`Particles.tsx`) — extended, not replaced.

## What changes

| Area | From | To |
|---|---|---|
| Intro timeline | 8 s, one gold point + threads + name | ~9.5 s state machine: `void → awakening → duality → attraction → collision → nameReveal → settled`, then `transitioning → complete` driven by scroll |
| Particles | modes seed/name/tunnel/portrait/web/finale | adds procedural **fire** and **ice** behaviour, a collision impulse and a fire/ice-split **glyph** target; per-particle alpha + live colour |
| Name | particle-only, grainy | particles form it from both sides (fire takes the left, ice the right, jagged seam), then a crisp editorial `<h1>` (Instrument Serif, warm→cool gradient) resolves exactly on top; particles thin to an aura |
| Environment | flat black + dust | screen-space **atmosphere** shader: warm and cold light fields that track the two systems, combine at collision, settle neutral-gold/cool |
| Collision | — | rings (gold + cyan), bloom spike, brief chromatic split, 0.35 s camera micro-shake, shard burst, sound hit |
| Network reveal | threads from core to five experiences | after the name forms, energy travels outward along **every** thread from Akshita, staggered by distance — the collision draws the graph |
| Nav | full top bar from frame one | only Sound + Skip during the intro; AM monogram + Experience / Projects / Constellation / Voice / Connect ↗ appear when it settles |
| Brand | gold dot | typographic **AM** monogram — minimal, never fire/ice styled |

## What gets added

- `src/lib/intro.ts` — phase boundaries, `introPhase()`, per-phase amounts (fire, ice, attraction, network). Single source of truth for DOM, WebGL and sound.
- `IceShards.tsx` — instanced crystalline shards (Fresnel-edged), shatter outward on collision, a few remain at the right edge.
- `EnergyArcs.tsx` — two sweeping arcs (warm left, cold right) drawn after the collision; quiet echoes of the reference swooshes.
- `Atmosphere.tsx` + `shaders/atmosphere.ts` — reactive environment light.
- `PostFX` controller — bloom / chromatic aberration react to `world.heroFlash`.
- Sound: fire rumble/crackle, ice glass resonance, rising tension, impact, resolving chord, soft pulses as threads activate. Still off by default.
- `introSeen` in localStorage → repeat visits play ~2.2× faster. *Skip intro* always visible.

## What gets removed

- "Every connection begins with a signal." caption and the old five-experience awakening.
- The always-visible top bar during the opening.

## Transition into the portfolio

Scrolling from the settled hero already flies the camera from z = 46 toward the centre (chapter 01). The particle name now **loosens** as the camera approaches (glyph targets drift outward with scroll — reversible), the crisp name fades, particles stretch into the depth corridor, and the threads lit by the collision are the same threads the Connect chapter later explores. No visual section cut; scrolling back re-forms the name.

## Rest of the site (Fire × Ice DNA, used sparingly)

- Threads: lit threads mix warm gold with a minority of cold blue (more in the hero, ~15 % elsewhere) — warm connection energy vs precise structural light.
- Atmosphere: very low in chapters 01–08; the finale brings fire and ice back at opposite edges, now joined by the network.
- No flames or crystals elsewhere.

## Tiers & performance

| Tier | Particles | Shards | Post | Collision |
|---|---|---|---|---|
| high | 7 000 | 48 | bloom + CA + noise + vignette | full |
| standard | 4 500 | 32 | bloom + CA | full |
| mobile | 2 400 | 16 | none | rings + flash, no CA, vertical composition (fire above, ice below), 0.75× duration |
| static / reduced motion | — | — | — | CSS dual-light reveal; name present immediately |

CPU cost: procedural fire/ice targets are evaluated per particle per frame only while `t < 1` (≈ 7 000 × a dozen trig ops ≈ 1 ms). Measured with `scripts/qa.mjs` in Chrome on the GPU.
