# Rebuild Audit

Date: 19 Oct 2026
Scope: everything handed over for the cinematic rebuild of Akshita Mahajan's portfolio.

## 0. What was actually found

| Item | State |
|---|---|
| `C:\Users\ASUS\Desktop\Akshita-portfolio` | **Empty.** No HTML, CSS, JS, assets or `.git`. The earlier HTML implementation is not present in the project folder. |
| `requirements portfolio/AKSHITA_RESEARCH.md` | Present. Phase-1 research dossier: LinkedIn profile, 21 activity items, GitHub repos, recurring themes, open questions. |
| `requirements portfolio/CREATIVE_DIRECTION.md` | Present. Three directions (Loom / On Air / Field of Light); Loom was selected for the previous build. |
| `EXPERIENCE_BLUEPRINT.md`, `CONTENT_PROVENANCE.md`, `README.md` | Not present anywhere supplied. |
| LinkedIn per-post URLs | The dossier says activity IDs were "stored in the site's data file". That data file went with the old build, so **individual post URLs are currently lost**. The new site links to the profile's activity feed and flags every post as `sourceUrl: pending`. |
| Photographs of Akshita | None supplied. |

Because the old code is gone, the audit below is of the *previous concept and its documented design decisions*, which is what would have shaped any HTML build. Nothing is reused from code; everything is reused from research.

## 1. What works (keep untouched)

- **The research dossier is excellent and is the content foundation.** Every claim names a source. It is the reason the new site can be specific rather than generic.
- **The key insight about her**: *she names people.* Almost every post ends by crediting mentors and teammates. Four of her five chosen top skills are people skills. This is the single most important fact for the concept and survives intact.
- **The arc "from the quiet seat to the mic"** (LI-P13 quiet student → LI-P16 anchor → LI-P4 representing SUAS at SLC).
- **Second attempts** (PrakritiOS lost at Green Tech, came back, placed 3rd).
- **"Just over a year → 4 internships in 15 days → Just start."** as an opening/closing bookend.
- **Attribution discipline**: HR-Enterprise- (all commits by Sandarbh Bhasin) excluded; breastcare-ai credited only for the portals Akshita built; private email from git metadata not used.
- **Open questions** list (photos, résumé, contact email, name of the hackathon where PrakritiOS placed).

## 2. What felt generic / template-like in the previous direction

- **Section-per-page structure.** Seven sections, even renamed in weaving terms ("Swatches", "Care label"), are still Home / Experience / Projects / Contact with new labels. Renaming a section is not a scene.
- **SVG loom grid of rows × columns.** A grid of moments × threads is a data table drawn with lines. It explains relationships but does not make you *feel* inside anything.
- **Soft, crafty register.** The dossier itself named the risk: "could feel crafty/soft rather than confident." Plum-black + madder rose + Gloock serif reads as a boutique wedding stationer, not as a builder who ships PERN systems and wins hackathons.
- **2D canvas + spring strings** carry the whole experience. No depth, no camera, no light that matters. The brief explicitly asks for real depth.
- **Projects as "swatches"** — a fabric sample per project is clever but small; projects become thumbnails again.
- **Contact as "Care label"** — a cute pun, and therefore an afterthought.

## 3. What can be reused

| Reuse | How |
|---|---|
| All verified facts, dates, names, roles, stacks | → `src/content/*.ts` typed graph |
| Theme analysis (§6 of dossier) | → narrative copy and scene ordering |
| The "threads crossing" observation | → **evolves** into energy paths between nodes; one gold path (Akshita) travels through everything |
| Saffron-gold as *her* colour | → kept as the core energy colour (molten gold), now set against indigo/midnight, not plum |
| "Just start." bookend | → last words of the finale |
| Mobile principle "loom rotates" | → mobile scenes re-composed, not shrunk |

## 4. What is deleted

- Weaving vocabulary as navigation labels (warp/weft/selvedge/care label/cast on).
- The 2D SVG loom grid as the primary interaction.
- Plum/rose palette and the Gloock-led stationery feel.
- Card-per-project / card-per-post layouts.

## 5. What is redesigned

| Area | From | To |
|---|---|---|
| World | A loom | **A living constellation of energy** — Akshita is the source; people, places, skills, projects, signals are nodes in 3D space joined by light |
| Opening | Thread draws across screen | One breathing point of warm light → more points → threads → the network writes her name |
| Navigation | Edge thread with seven markers | A chapter arc / constellation map, always available, keyboard reachable |
| Experiences | Rows in a loom | Memory spaces: a node is isolated, camera approaches, the memory unfolds, energy flows forward to what came next |
| Projects | Swatches | Procedural artifacts with their own geometry grammar (stack, team, status) |
| Skills | Thread columns | Evidence graph: hover a skill → energy travels to every experience/project/post that proves it, and back |
| LinkedIn | Loom rows | **Signals** — floating professional memories with date, verified summary, people credited, related skills, link to the original |
| Achievements | Knots | Convergence events: experience + skill + project paths meet → light event → the actual result |
| Contact | Care label | Finale: the whole constellation zooms out; "the next connection hasn't been made yet" → LinkedIn as continuation |

## 6. What is rewritten

- The full frontend: Next.js + React + TypeScript, R3F for the world, GSAP ScrollTrigger for narrative scroll, Motion for UI state.
- All copy, written from the dossier with each line traceable to a source id.
- Relationship data: no relationships in JSX; everything derives from the typed graph and is unit-tested against the research.

## 7. Content that must stay untouched

Names, dates, ranks, roles and stacks exactly as in `AKSHITA_RESEARCH.md`. In particular:
- Tech Kutumb 5.0 is **3rd prize**, PrakritiOS is **3rd place** (hackathon name unknown — do not invent it), Hack Devengers 2.0 was **not top 3** (appreciation certificate).
- IIT Indore internship is **Jul – Aug 2026**, i-SOFTZONE **Jun – Jul 2026**.
- breastcare-ai: Akshita built landing, patient, radiologist and nurse dashboards — not the whole platform.
- HR-Enterprise- is excluded pending the attribution decision.
- Follower counts are a dated snapshot (19 Oct 2026) and should be labelled as such or omitted.

## 8. Honest risks for the rebuild

- **Tech-demo risk.** A particle constellation is the most common "creative dev" trope. It only works if every node is a real, labelled, clickable piece of her story. Rule: no anonymous decorative nodes in the interactive layer; ambient dust is clearly background.
- **Yashord proximity.** Yashord is space/planets/console. We avoid planets, orbit-a-sun layouts, terminals and sound-as-navigation. Our nodes are *named people and places*, our light travels along paths, our hero is a network, not a solar system.
- **Missing photos.** The identity scene is designed to work with a particle/typographic silhouette now and accept a real photo later without code changes.
- **Missing post URLs.** Signals link to the activity feed until IDs are re-added.
