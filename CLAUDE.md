# Guide for AI agents

This repository is developed **agentically**. The human owner steers game design and
architecture; agents do the implementation. Read this file first, every session.

## Project in one sentence
A browser-based 3D maze game (mobile + desktop) for German-speaking children aged 5–7,
where solving small learning challenges (math, German, …) inside the maze earns rewards.

## Where the truth lives
| Topic | File | Status |
|---|---|---|
| Game design (what we build) | `docs/game-design.md` | APPROVED v1.0 |
| Architecture (how we build it) | `docs/architecture.md` | APPROVED |
| Decisions and their reasons | `docs/adr/` | see status in each ADR |
| Open questions for the owner | `docs/open-questions.md` | living list |
| Roadmap / milestones | `docs/roadmap.md` | living |

## Rules for agents
1. Implement only what `game-design.md` / `roadmap.md` describe. Design changes need
   owner sign-off (note them in the design changelog).
2. **Every architectural decision gets an ADR** (`docs/adr/NNNN-title.md`, use
   `docs/adr/0000-template.md`). Never silently change an accepted ADR — write a new one that
   supersedes it.
3. If a requirement is unclear, add it to `docs/open-questions.md` instead of guessing.
   Small, reversible choices may be made by agents; record them in the PR description.
4. **Language:** code, comments, identifiers, docs, commits → English.
   Everything the child sees or hears → German, and only via the content/locale files
   (never hard-coded strings in components).
5. **Children-first constraints are non-negotiable** (see `game-design.md` §2 and ADR-0004): no ads, no tracking, no external network calls at runtime, no time
   pressure, no punishment for wrong answers, every instruction must be available as audio.
6. Keep `docs/` in sync with the code in the same PR that changes behaviour.

## Commands
```bash
npm ci              # install
npm run dev         # dev server (http://localhost:5173)
npm run check       # lint + typecheck + unit tests — run before every push
CI=1 npm run e2e    # Playwright tests (desktop + mobile viewport) like CI — CI=1 builds and
                    # starts a fresh server instead of reusing a possibly stale one on :4173
npm run build       # production build; BASE_PATH env sets the deploy sub-path
npm run audio:generate  # (re)generate speech clips — see docs/audio.md
npm run curriculum:sources -- --fetch  # re-download curriculum PDFs; git diff docs/curriculum/sources/text
```
`?seed=N` in the URL forces a maze seed (reproducible bug reports); `?challenge=<typeId>` puts
only that challenge type into the chests (review a new challenge quickly); `?activity=<id>`
(e.g. `jump`, `memory`) opens that activity right after choosing/creating a profile, without
unlocking it first (review a new activity in a PR preview).

## Conventions
- `src/core/` is pure TypeScript (ESLint enforces: no Three.js/React/presentation imports).
- All randomness via `core/rng.ts`; never `Math.random()` in core.
- New challenge type → `src/modules/challenges/<id>/` (see architecture §3.1), with
  `levelInfo` per level: stage range + competency ids from `src/content/curriculum/de-ni.ts`
  (ADR-0009, research in `docs/curriculum/`).
  New world → `src/modules/worlds/<id>/` + register in `modules/worlds/index.ts`.
  New activity (mini game) → follow the skill `.claude/skills/add-activity/` (ADR-0010).
- Anything the child hears must be in `src/content/de/speech.ts` (templates with `variants`
  or `staticSpokenTexts`); then run `npm run audio:generate` and commit the clips.
- Save format changes → bump `SAVE_VERSION` and add a migration in `core/save/save.ts`.
- Every PR gets a preview URL (ADR-0005); check it on a phone-sized viewport.
