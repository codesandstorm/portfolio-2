# Content Provenance

All site content lives in `src/content/data.ts` and is derived from `docs/research/AKSHITA_RESEARCH.md`. Relationships are derived in `src/content/graph.ts`; `src/content/graph.test.ts` fails if any reference is broken, any node is disconnected, or key verified facts change.

## Source ids

| Id | Meaning |
|---|---|
| `li-profile` | LinkedIn headline / top skills |
| `li-about` | LinkedIn About section |
| `li-experience` | LinkedIn Experience entries |
| `li-education` | LinkedIn Education entries |
| `li-certifications` | LinkedIn Certifications |
| `li-skills` | LinkedIn Skills (with the org they are attached to) |
| `li-p1` … `li-p21` | LinkedIn activity items, numbered as in the dossier §4 |
| `gh-<repo>` | GitHub repository README / package.json / git log |

## Inferred (not directly stated) links — shown as dashed/dimmer threads

| Link | Why inferred |
|---|---|
| Enterprise HRMS ↔ i-SOFTZONE | Experience says she "built and deployed an HRMS on PERN" there; her HRMS repo's commit dates (11 Jun – 6 Jul 2026) fall inside the internship. Not explicitly stated to be the same system. |
| AI Fitness App ↔ SUAS | "SIH Internal Hackathon" is assumed to be her university's internal round. |

## Deliberately excluded

- `HR-Enterprise-` repo — all 26 commits are by Sandarbh Bhasin. Awaiting attribution decision.
- Email address found in git metadata — not public.
- Follower count — kept only as a dated snapshot in data, not displayed as a claim.
- Name of the hackathon where PrakritiOS placed 3rd — unknown, not invented.
- Files found elsewhere on this machine (`Downloads/Akshita_Mahajan.pdf`, internship reports, offer letters) were **not read** — they were not supplied as research. If approved, the résumé PDF could fill gaps.

## Missing

- Exact LinkedIn post URLs (activity ids were in the previous build's data file, which is gone). Signals link to her activity feed and say so. Add `sourceUrl` per signal to restore exact links.
- Any photograph. `profile.portrait` is `null`; the identity scene uses an abstract placeholder silhouette until a real photo is set.
