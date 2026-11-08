# AGENTS.md — guide for coding agents

This file gives any coding agent (Claude Code, Codex, Cursor, Copilot, Gemini, …) the same
context the project's own agents work with. **Read it first, every session.** Humans: see
[`CONTRIBUTING.md`](CONTRIBUTING.md), which points back here for the details.

The repository is developed **agentically**: the owner (@patst) steers game design and
architecture, agents implement. External contributions follow the same rules.

## 1. The project in one paragraph
A browser-based 3D maze game (phone + desktop, offline PWA) for German-speaking children from
**Kindergarten to 4. Klasse** (age ~4–10; originally 5–7). Children walk through comic mazes
and other small activities (memory, side scroller, a question path); **chests** open short
learning challenges (math, German, general knowledge "Wissen") that fit the child's school
stage and the Lower Saxony curriculum. Solving earns stars → star jar → rewards (avatar items,
animal friends). Play it: https://patst.github.io/3d-quiz-game/

## 2. Where the truth lives
| Topic | File | Status |
|---|---|---|
| Game design (what we build) | `docs/game-design.md` | APPROVED, changes need owner sign-off (changelog at the end) |
| Architecture (how we build it) | `docs/architecture.md` | APPROVED; §8 "As built" is the current state |
| Decisions and their reasons | `docs/adr/` (0001–0017) | status in each ADR |
| Roadmap / milestones | `docs/roadmap.md` | living |
| Open questions for the owner | `docs/open-questions.md` | living |
| Speech audio how-to | `docs/audio.md` | |
| Curriculum research + sources | `docs/curriculum/niedersachsen.md`, `docs/curriculum/sources/` | |
| Asset licences | `ASSETS.md` | |
| Step-by-step recipes (skills) | `.claude/skills/*/SKILL.md` | see §7 |

The ADRs you will need most: ADR-0003/0007 (audio), ADR-0004 (local only, no tracking),
ADR-0009 (learner stage and curriculum tags), ADR-0010 (activities), ADR-0011 (Rätselpfad).

## 3. Rules (non-negotiable)
1. **Build only what `game-design.md` / `roadmap.md` describe.** New ideas, new mechanics,
   new content areas → propose them (issue or PR description) and wait for the owner. Design
   changes are recorded in the design changelog with the owner's sign-off.
2. **Every architectural decision gets an ADR** (`docs/adr/NNNN-title.md`, from
   `docs/adr/0000-template.md`). Never silently change an accepted ADR — write a new one
   that supersedes it.
3. **Unclear requirement → `docs/open-questions.md`**, not a guess. Small, reversible choices
   are fine; list them in the PR description.
4. **Language:** code, comments, identifiers, docs, commits, PRs → **English**. Everything the
   child sees or hears → **German**, and only via `src/content/de/` (never hard-coded strings
   in components).
5. **Children-first** (game-design §2, ADR-0004):
   - no ads, no tracking, no analytics, **no network calls at runtime** (no CDNs, fonts, APIs);
   - **no time pressure**, no lives, no losing, no punishment for wrong answers (hint → try
     again → show the answer kindly);
   - **every instruction is available as audio** (pre-generated clips, see §6);
   - answers are tapped, never typed; tap targets ≥ 64 px; works in portrait at 360 px;
   - content must be correct, age-appropriate, friendly and free of stereotypes.
6. **Keep `docs/` in sync with the code in the same PR** (architecture "As built", design
   changelog, roadmap, ADR notes, skills).
7. **Run `npm run check` before every push**, and `CI=1 npm run e2e` for anything a child can
   see or touch.

## 4. Commands
```bash
npm ci                  # install (Node ≥ 22)
npm run dev             # dev server, http://localhost:5173
npm run check           # lint + typecheck + unit tests + audio check — before every push
CI=1 npm run e2e        # Playwright (desktop + phone viewport) like CI; CI=1 builds a fresh server
npm run build           # production build; BASE_PATH sets the deploy sub-path
npm run audio:generate  # (re)generate speech clips — needs Piper, see docs/audio.md
npm run curriculum:sources -- --fetch   # re-download curriculum PDFs; then git diff docs/curriculum/sources/text
```
First e2e run on a new machine: `npx playwright install chromium`.

**URL parameters for testing and review:**
- `?seed=N` — fixed maze seed (reproducible bug reports);
- `?challenge=<typeId>` — only that challenge type in the chests (e.g. `math.rounding`);
- `?activity=<id>` — open that activity right after choosing a profile, without unlocking it
  (`memory`, `jump`, `practice`).

## 5. Code map and conventions
```
src/core/        pure TypeScript game rules: maze, session, challenges (types, attempt,
                 selection), skill model, learner stage, rewards, save format, rng
src/modules/     plug-ins: challenges/<id>/, worlds/<id>/, activities/<id>/ (+ index.ts registries)
src/content/de/  every German text: strings.ts (UI), speech.ts (spoken templates), word banks
src/content/curriculum/de-ni.ts   competency catalogue (ids like ni.ma2.*, ni.de4.*)
src/ui/          React overlay: screens, challenge views (ui/challenges/), activities (ui/activities/)
src/render/      Three.js scene, avatars, worlds      src/audio/  speech queue, sfx
tests/e2e/       Playwright specs                      scripts/    audio + curriculum tooling
public/audio/de/ committed MP3 speech clips (generated)
```
- `src/core/` must not import Three.js, React, DOM or presentation code (ESLint enforces it).
- **All randomness via `core/rng.ts`** (seeded); never `Math.random()` in core. React render
  code must be pure too (no `Math.random`/`Date.now` in render, no sync `setState` in effects —
  the react-hooks lint rules check this).
- TypeScript strict; no `any` unless unavoidable. Keep modules small and well-named.
- **Save format change** → bump `SAVE_VERSION` and add a migration in `core/save/save.ts`
  (+ a test). Saves are local only (IndexedDB), per child profile.
- **Tests:** unit tests next to the code (`*.test.ts`, Vitest). `src/modules/challenges/
  challenges.test.ts` property-tests every registered challenge type (many seeds × every level:
  valid, solvable, speech keys exist, `levelInfo` complete). E2E tests use `data-*` hooks
  (e.g. `data-test-route-chest`) so they never depend on luck or timing. E2E tests run
  **fully parallel** (`fullyParallel` in `playwright.config.ts`): every test must stand alone
  (own page, own `?seed=`, no shared state, no order within a file). The timing reporter
  (`tests/e2e/timing-reporter.ts`) prints the slowest tests, time per file and worker load;
  in CI it is in the job summary and the `e2e-timings` artifact.
- Styling lives in `src/styles.css`; check new views at 360 px width.

## 6. Recipes
Use the skills for the full checklists (§7). Short version:

**New challenge type** — `.claude/skills/add-challenge-type/`. Logic in
`src/modules/challenges/<id>/` with `levelInfo` per level (stage range + competency ids from
`de-ni.ts`, ADR-0009); register in `modules/challenges/index.ts` and in the world's chest list
(`modules/worlds/forest/index.ts`); view in `ui/challenges/` (often the shared `KnowledgeView`);
German name in `de.challengeNames`, topic name + icon in `de.practice.topics`; speech templates;
audio clips; e2e entry.

**New activity (mini game)** — `.claude/skills/add-activity/` (ADR-0010). Settle the design with
the owner first; logic in `core/activities/`, module in `modules/activities/<id>/`, screen in
`ui/activities/` on the shared `useChestFlow` hook.

**New world** — `src/modules/worlds/<id>/` + register in `modules/worlds/index.ts`; rendering in
`src/render/`; needs owner approval (game design) first.

**Anything spoken** — `.claude/skills/add-speech/`. Sentences go into
`src/content/de/speech.ts` (templates with `render` + `variants`, or `staticSpokenTexts`), then
`npm run audio:generate` and **commit the clips** in `public/audio/de/`. `npm run check` fails
when a sentence has no clip. If you cannot run Piper, say so in the PR — a maintainer generates
the clips (CI cannot).

## 7. Skills
Agent skills live in `.claude/skills/<name>/SKILL.md`. Claude Code loads them automatically;
other agents should open the matching file before starting the task — they are plain Markdown.
| Skill | Use it when |
|---|---|
| `contribute` | starting any change: workflow, checks, PR description, review on a phone |
| `add-challenge-type` | adding a new kind of question/task to the chests |
| `add-activity` | adding a mini game / new way to find chests |
| `add-speech` | adding or changing anything the child hears |

## 8. Pull requests
- Branch from `main`; one topic per PR; small PRs. The owner merges with a merge commit.
- PR description: what and why, the design/ADR it implements, small choices you made, how you
  tested, a screenshot (phone width) for visible changes, and the review link
  (`?challenge=…` / `?activity=…`). Use the PR template.
- CI runs lint, typecheck, unit tests, audio check and Playwright. PRs from branches of this
  repository get a preview at `https://patst.github.io/3d-quiz-game/pr-preview/pr-<N>/`
  (ADR-0005). PRs from forks get one too, after a maintainer reviewed the diff and approved
  the deployment (ADR-0013); until then, attach screenshots.
- Never commit secrets, tracking code, third-party runtime URLs or assets without a compatible
  licence (record licences in `ASSETS.md`; CC0 preferred).
