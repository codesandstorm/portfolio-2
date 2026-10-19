# Cinematic Experience Architecture

## The world: SUTRA — the living constellation of Akshita Mahajan

*Sūtra* is Sanskrit for **thread** — and for a short line that holds a larger idea together. Both meanings are Akshita.

The research found one habit that no other developer's portfolio would share: **every post she writes ends in a list of names.** Mentors, co-interns, teammates, organisers. Her five self-chosen top skills are Public Relations, Communication, Java, Event Management, Networking — four of five are about people. Her own sign-off at SLC 2026 is *Connect. Collaborate. Learn. Lead.*

So the world is a **network of light in darkness**. Akshita is the source: one warm gold point. Everything she has done is a node — a person she credited, a place she worked, a thing she built, a skill it required, a post where she told the story, a result that came out of it. **Energy travels along threads (sūtras) between them.** The site is the act of watching that network form, from a single point to a structure you can't take in at once.

The chapter names are her own sign-off, framed by her own first and last words of advice.

Why it is not Yashord: no planets, no sun-and-orbit layout, no console, no terminal. Yashord's world is *cosmic objects*; Sutra's world is *relationships*. Nodes are named humans and institutions; light moves *between* them.

Why it is not Brahmāstra: no astra symbols, weapons, characters or typography. What we take is the feeling — darkness where controlled light means something, energy that flows, collides, gathers and is released, scale that grows from intimate to vast.

## Palette (meaning-bearing)

| Token | Hex | Meaning |
|---|---|---|
| `--void` | `#04040a` | the dark before connection |
| `--midnight` | `#0a0d24` | depth / background haze |
| `--indigo` | `#1b1f4d` | atmosphere |
| `--gold` | `#ffb347` | **Akshita** — her energy, her thread |
| `--molten` | `#ff8a1f` | events, convergence |
| `--electric` | `#6fb6ff` | technology / built things |
| `--violet` | `#9b8cff` | people / community (used sparingly) |
| `--crimson` | `#ff4d6d` | rare: second attempts, turning points |
| `--ivory` | `#f3ead8` | readable text |

Typography: **Instrument Serif** (display — high contrast, elegant, not ornamental), **Geist** (body, readable), **Geist Mono** (labels, dates, evidence — like annotations on a star chart).

## Motion hierarchy

| Level | What | Engine |
|---|---|---|
| 1 Ambient | dust drift, node breathing, energy flowing along threads | R3F `useFrame` (shaders) |
| 2 Reactive | pointer parallax, node hover, cursor states, thread illumination | R3F + Motion (UI) |
| 3 Narrative | camera flights, scene transformations, text reveals, particle morphs | GSAP ScrollTrigger → shared store → R3F |
| 4 Event | name formation, identity reveal, achievement convergence, finale pull-back | GSAP timelines, used 4 times only |

**Rule:** GSAP owns scroll-linked and DOM narrative properties. Motion owns UI component state (panels, modals, nav, buttons). R3F owns everything in the canvas, reading progress values from the store. No property is animated by two engines.

## Chapters

```
00 SIGNAL       awakening — one point of light; her name is built by the network
01 JUST START   the quiet seat — flight through depth to the centre
02 AKSHITA      identity — a point-cloud portrait; facets she has evidence for
03 CONNECT      the people she names — a living graph
04 COLLABORATE  memory spaces — IIT Indore, i-SOFTZONE, SUAS ACM-W, IEEE
05 BUILD        idea → form — projects as procedural artifacts
06 LEARN        the evidence constellation of skills (bidirectional)
07 LEAD         the voice — stage, teaching, LinkedIn signals
08 CONVERGE     achievements as convergence events
09 CONTINUE     finale — the whole structure; "the next connection"
```

---

### 00 SIGNAL — Awakening

- **Purpose** First reaction: "wait — this is a portfolio?" Establish the world's rules in 8 seconds.
- **Content** "Every connection begins with a signal." → AKSHITA MAHAJAN → "Enter the constellation".
- **Visual** Near-black. One gold point breathes. A second, third appear; fine threads join them. Particles drift in from the dark and *assemble the letters of her name* (sampled from the display font), held by threads.
- **Motion** Level 4 timeline (~7s), then Level 1 ambient. Name letters jitter subtly toward the pointer.
- **Scroll** Locked to the intro only visually; scroll is never blocked — scrolling or *Skip intro* jumps the timeline to its end.
- **Interaction** Enter (button), Skip intro, Sound on/off — all keyboard-focusable.
- **Audio** (if enabled) low drone fades in; a soft shimmer for each thread that connects.
- **3D** Main particle system (morph target: `name`), core node at origin, dust.
- **Mobile** Name sampled at mobile width (two lines), 2.5k particles.
- **Reduced motion** Name appears fully formed with a 600ms opacity fade; no particle flight.
- **In / Out** In from loader (the loader *is* the first point charging). Out: name particles scatter into depth as the camera begins to move.

### 01 JUST START — the flight

- **Purpose** Tell her origin story while physically moving the visitor into the world.
- **Content** LI-P13: about a year ago, the quiet student in class still learning JavaScript; built projects, applied daily, faced rejection; first offer; then **4 offers in 15 days**, including IIT Indore.
- **Visual** Camera flies along −Z through layered fragments: IDEAS · PEOPLE · TECHNOLOGY · COMMUNICATION · CURIOSITY · LEADERSHIP, drawn at different depths with depth fog. Dust passes at different speeds (true parallax).
- **Scroll** Pinned ~300vh, scrubbed. Story lines reveal in sequence; fragments converge to the centre where the gold core waits.
- **Interaction** Pointer offsets camera slightly (Level 2).
- **Audio** transition swell as the fragments converge.
- **Mobile** shorter pin (200vh), fewer fragments.
- **Reduced motion** camera cross-fades between 3 still compositions; text is static.
- **Out** fragments collapse into the core; the core opens into the portrait.

### 02 AKSHITA — identity

- **Purpose** Who she is, without photo-left/text-right.
- **Content** CSIT undergraduate, SUAS (2025–29) · Indore · Full Stack Engineer · Public Speaker · IEEE / IEEE WIE · Ex-Intern IIT Indore. Facets **only where evidenced**: *builder* (HRMS, BreastCare AI, FoodHub), *communicator* (anchor, PR top skill), *connector* (names people; networking), *leader* (ACM-W Vice Chair; represented SUAS at SLC), *teacher* (rural outreach, STEM, ISRO exhibition), *learner* (second attempts, "ask better questions").
- **Visual** The particle system morphs into a **point-cloud portrait** sampled from a portrait image. Behind it a holographic plane (custom shader: scan light, Fresnel-like edge glow, slight RGB separation at the edges, noise displacement). Until a real photograph is supplied the source is an abstract silhouette, labelled as a placeholder.
- **Scroll** pinned; facets orbit in and settle one per scroll step.
- **Interaction** pointer changes perspective of the portrait (parallax tilt).
- **Reduced motion** portrait static, facets listed.

### 03 CONNECT — the people she names

- **Purpose** Her signature: she credits people. Make that visible.
- **Content** Every person named in her posts (mentors, clinical validator, co-interns, teammates, organisers) + organisations. Counted live from the graph: *"N people named across M posts."*
- **Visual** Graph in 3D around the gold core. People = violet points, organisations = larger rings. Threads connect a person to the moments (posts) and places where she named them; people who appear in more than one story (e.g. Sandarbh Bhasin: IIT Indore + PRAHARI) visibly bridge clusters.
- **Interaction** Hover → node grows, its threads light, label shows how she knows them. Click → camera eases closer, panel lists the shared stories with links. Drag → gentle rotation. Keyboard: an accessible list mirrors every node.
- **Mobile** tap = select; graph auto-rotates slowly; list below.
- **Reduced motion** no auto rotation; static graph + list.

### 04 COLLABORATE — memory spaces

- **Purpose** Experiences as places you enter, not résumé rows.
- **Content** For each experience: role · org · period → THE OPPORTUNITY → THE WORK → THE PEOPLE → THE LEARNING → WHAT IT ENABLED → EVIDENCE (LinkedIn signal). IIT Indore is the longest memory (Featured post, 475 reactions).
- **Visual** Camera isolates the experience node; everything else dims; its related nodes light around it; at the end energy flows forward to the next memory.
- **Scroll** one pinned sub-scene per experience (≈150vh each); horizontal text track inside.
- **Reduced motion** sequential readable blocks; static highlight.

### 05 BUILD — idea → form

- **Purpose** What she builds and why.
- **Content** HRMS & telemetry platform (flagship), BreastCare AI portals, FoodHub, PRAHARI, PrakritiOS, Banquet module (EventHub), SIH fitness app. Each: why · problem · what she did · difficult · tech · learned · skills · which experience · what came after (**only evidence-backed fields are shown; others omitted, never invented**).
- **Visual** Each project is a **seed** that grows into a procedural artifact whose form comes from its real data: HRMS — a lattice of 33 cells (33 Prisma models); BreastCare — 7 concentric rings (7 role portals); FoodHub — a cart-loop torus of order states; PRAHARI — a sentinel pulse (early warning, 24h); PrakritiOS — a branching seed (second attempt: grows twice); Banquet — a venue grid; fitness — a posture arc.
- **Interaction** select → technologies orbit the artifact, panel opens; GitHub link where public.
- **Reduced motion** artifacts static, panels open in place.

### 06 LEARN — the evidence constellation

- **Purpose** Skills as relationships, not bars.
- **Content** Every skill with ≥1 evidence edge. Two families: *built* (React, TypeScript, Node, PostgreSQL …) and *human* (Communication, Public speaking, Event management, Networking, Leadership, Teaching …).
- **Visual** Skills in a ring; experiences, projects and signals in an outer ring. Hover dims everything else; energy flows out from the skill to every place it was used.
- **Interaction** bidirectional: select a skill → where used / what she built / related skills; select a project or experience → its skills. Credentials listed with dates.
- **Reduced motion** same data, no flow animation.

### 07 LEAD — the voice

- **Purpose** Communication is central, not a footer.
- **Content** Anchor of the Symbiosis Skill Hackathon (36h); represented SUAS at IEEE SLC 2026; coordinator of the first ISRO exhibition in MP; rural outreach; STEM awareness; ACM-W Vice Chair. **LinkedIn signals**: all 21 posts as signals (date, title, verified summary, people credited, related skills, link).
- **Visual** Kinetic statements built from her words ("Connect. Collaborate. Learn. Lead.", "Just start."). When a sentence completes, its words detach and fly as light to the nodes where the quality was demonstrated. Signals float as a stream; opening one gives an elegant reading panel → *View on LinkedIn ↗*.
- **Reduced motion** statements static; signals as a list.

### 08 CONVERGE — impact

- **Purpose** Achievements emerge from accumulated paths.
- **Content** Tech Kutumb 5.0 3rd prize (PRAHARI, advanced to next SIH round) · PrakritiOS 3rd place (after not winning the first time) · 4 internship offers in 15 days · Devengers top 2,000 / Gemini Quiz War top 1,000 of 10,000 · Coordinator, first ISRO exhibition in MP.
- **Visual** for each: the paths from its source experience, skills and project run inward and meet → molten energy event → the result typesets.
- **Scroll** pinned, one convergence per step.

### 09 CONTINUE — finale

- **Purpose** Resolve the opening. One point → a structure.
- **Visual** Camera pulls far back: every node visited is lit at once. Her name re-forms at the centre. *"The next connection hasn't been made yet."* then *"Just start."*
- **CTA** Connect on LinkedIn (primary, the continuation of the metaphor) · Explore GitHub. No email (not public).

## Navigation

A thin **progress arc** on the right edge: ten nodes joined by a thread that fills in gold as you travel. Each node is a link with its chapter name; keyboard accessible; `M` opens a full chapter index. LinkedIn and GitHub always reachable from the top bar. Skip intro always available.

## Capability tiers

| Tier | Trigger | Experience |
|---|---|---|
| high | desktop, ≥8 threads, fine pointer | 7k particles, bloom + vignette, DPR ≤ 2 |
| standard | laptops/unknown | 4.5k particles, bloom, DPR ≤ 1.5 |
| mobile | coarse pointer or < 768px | 2.4k particles, no post-processing, DPR ≤ 1.5, shorter pins |
| static | no WebGL, `prefers-reduced-motion`, or `?tier=static` | full DOM story with a 2D constellation backdrop; no canvas |

Drei `PerformanceMonitor` lowers DPR when FPS drops. Rendering pauses when the tab is hidden.

## Audio

Synthesised in the browser with Web Audio (no files, no licensing): ambient drone, shimmer on connection, tick on interaction, swell on chapter change. **Off by default**, persisted in `localStorage`. No voice narration: narration is text-only captions until authentic audio is supplied.
