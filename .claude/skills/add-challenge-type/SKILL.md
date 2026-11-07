---
name: add-challenge-type
description: Add a new challenge type (a kind of question a chest opens — math, German or Wissen) to the labyrinth game, or a new level of an existing one. Use when asked to add, design or review tasks/questions/exercises/content for a grade or topic. Covers curriculum fit, the logic module, levelInfo, the view, German texts and speech, registration, tests and docs.
---

# Add a challenge type

A **challenge type** is a plug-in that generates one question at a time from a seeded RNG.
Every activity (maze, memory, scroller, Rätselpfad) shows it the same way through the shared
chest flow. Read `docs/architecture.md` §3.1, ADR-0009 (stages and curriculum tags) and
`docs/game-design.md` §6 first. Look at a similar existing type and copy its shape:
- quiz cards with emoji/words → `src/modules/challenges/wissen4/` or `german4/` (`QuizData`,
  shown by the shared `KnowledgeView`, no new view needed);
- a custom picture → `math-rounding/` + `src/ui/challenges/RoundingView.tsx`.

## 1. Settle the content first
- **Is it in the design?** New topics need the owner's OK (`docs/game-design.md` §6.5 lists the
  packs). Otherwise propose it in the PR / `docs/open-questions.md`.
- **Curriculum:** which competency in `src/content/curriculum/de-ni.ts` does each level train?
  If none fits, add one with its source (`docs/curriculum/niedersachsen.md`, the PDF must be in
  `docs/curriculum/sources/sources.json`; a test checks it).
- **Stages per level:** `kita`, `preschool`, `grade1` … `grade4`. Level 1 decides when the type
  is first offered; a child starts at the highest level meant for its stage.
- **Children-first:** answerable by **tapping** 2–4 options (no typing, no dragging), readable
  without reading for Kita–grade 1 (pictures + speech), a hint for the 2nd wrong try and a kind
  explanation. Content must be factually correct and free of stereotypes; avoid scary or sad
  topics. Distractors must be clearly wrong, never "also right".
- **Audio budget:** every spoken sentence is a pre-generated clip. Keep the number of prompt
  variants finite (hundreds, not millions): don't speak big random numbers, say a generic
  sentence ("Runde auf Zehner!") and show the number on screen.

## 2. Build it (checklist)
1. **Logic** `src/modules/challenges/<id>/index.ts`: export a `ChallengeType<TData>`
   (`id` like `math.rounding`, `subject`, `skills`, `levels`, `levelInfo`, `generate`).
   - `levelInfo`: one `lv(minStage, maxStage, ...competencyIds)` per level.
   - `generate({ rng, level })`: only `rng` for randomness (never `Math.random()`), clamp the
     level (`clampLevel`), return `data` for the view, `choices` (unique ids), the
     `correctChoiceId`, and `prompt` / `explanation` as speech keys with params.
   - Word lists and question banks go into `src/content/de/<file>.ts` (German), not into the module.
2. **Register** it in `src/modules/challenges/index.ts` and in the world's chest list
   `src/modules/worlds/forest/index.ts` (underwater reuses it).
3. **View** in `src/ui/challenges/index.ts`: reuse `KnowledgeView` (`ownsChoices: true`) for
   `QuizData`, or write `<Name>View.tsx` (props: `data`, `hint`, `solved`, optional `answers`).
   Styles in `src/styles.css`; check 360 px width; answer buttons ≥ 64 px.
4. **Texts** in `src/content/de/strings.ts`: `de.challengeNames[<id>]` (parents area) and
   `de.practice.topics[<id>] = { icon, name }` (child-friendly, for the Rätselpfad). Tests
   enforce both.
5. **Speech** in `src/content/de/speech.ts`: templates `<id>.prompt` / `<id>.explain…` with
   `render` and `variants` covering every params combination `generate` can produce; names on
   answer cards with a 🔊 button go into `staticSpokenTexts`. Follow the `add-speech` skill, then
   `npm run audio:generate` and commit `public/audio/de/`.
6. **E2E:** add the id to `tests/e2e/challenge-types.spec.ts` when it has a new view (one quiz
   type per pack is enough).

## 3. Verify
- `npm run check` — the generic property test in `src/modules/challenges/challenges.test.ts`
  runs your generator over many seeds × every level (valid, solvable, speech keys exist,
  `levelInfo` complete). Add your own unit tests for tricky rules (e.g. rounding at 5).
- `CI=1 npm run e2e`.
- Look at it: `npm run dev`, open `?challenge=<id>` with a profile of the right stage, every
  level, phone width (390×844). Listen to the prompt.

## 4. Docs (same PR)
- `docs/game-design.md` §6.5 (pack table) + changelog entry.
- `docs/roadmap.md` if it belongs to a milestone; `docs/curriculum/niedersachsen.md` coverage.
- PR description: the levels with stages and competencies, a screenshot, and the review link
  `…/pr-preview/pr-<N>/?challenge=<id>`.
