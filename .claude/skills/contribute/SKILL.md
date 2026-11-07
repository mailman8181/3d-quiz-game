---
name: contribute
description: Workflow for any change to the labyrinth learning game — before starting, while coding, and when opening a pull request. Use at the start of every task in this repository (feature, fix, content, docs), and before pushing or writing a PR description.
---

# Contribute a change

Read `AGENTS.md` first. This skill is the checklist around it.

## Before coding
1. Is it in `docs/game-design.md` or `docs/roadmap.md`? If not, it is a **design change**:
   describe it in an issue / PR description and wait for the owner. Unclear details →
   `docs/open-questions.md`.
2. Does it change architecture (new layer, dependency, save format, runtime behaviour across
   modules)? → write an ADR from `docs/adr/0000-template.md` first. Never edit an accepted
   ADR's decision; supersede it.
3. Pick the recipe: `add-challenge-type`, `add-activity`, `add-speech`, or a world
   (`src/modules/worlds/`). Read the ADRs it names.
4. Branch from the latest `main`; one topic per branch.

## While coding
- Core stays pure (`src/core/`: no React/Three.js/DOM), randomness only via `core/rng.ts`.
- German only in `src/content/de/`; everything spoken has a clip (`add-speech`).
- Children-first: no time pressure, no losing, no network at runtime, tap targets ≥ 64 px,
  works at 360 px portrait.
- Save format changed → bump `SAVE_VERSION` + migration + test (`core/save/save.ts`).
- New dependency? Only if small, well maintained, licence-compatible, and with no runtime
  network access. Say why in the PR.

## Before pushing
```bash
npm run check
CI=1 npm run e2e
```
Both must be green. For visible changes, look at the app at 390×844 and at desktop size
(`npm run dev`; `?seed=N`, `?challenge=<id>`, `?activity=<id>` help to get there fast).

## Docs in the same PR
- `docs/architecture.md` §8 "As built" when structure changed;
- `docs/game-design.md` + changelog entry (with the owner's sign-off) when behaviour changed;
- `docs/roadmap.md` milestone status; ADR implementation notes; the skills' "Learnings" when
  you learned something the next contributor needs.

## Pull request
Use `.github/pull_request_template.md`. Include: what and why, the design section / ADR, small
choices you made (agents: list them), how you tested, a phone-width screenshot, and the review
link (`https://patst.github.io/3d-quiz-game/pr-preview/pr-<N>/?…`, not available for forks).
Commit messages and PR text in English. The owner reviews and merges with a merge commit.
