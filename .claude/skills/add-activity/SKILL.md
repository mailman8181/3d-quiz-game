---
name: add-activity
description: Add a new activity (mini game such as memory, side scroller, Wimmelbild) to the labyrinth game — another way to find chests that open learning challenges. Use when asked to build, design or review a new activity / mini game / game mode. Covers the design questions to settle with the owner first, the files to create, the shared chest flow, unlocking, audio, tests and docs.
---

# Add an activity

An **activity** is a way to *find chests*. Everything after "a chest was found" is shared:
challenge selection by stage/subject/parents, chest tiers, `ChallengeDialog`, stars, star
jar, rewards, skill model, play-time limit. Read **ADR-0010** (`docs/adr/0010-activities.md`)
and `docs/game-design.md` §4b before starting.

## 1. Settle the design first (ask the owner what you can't decide)
Write the answers into the PR description; put real open points into
`docs/open-questions.md`. Do not start coding a big activity before the owner approved the idea.

**Children-first (non-negotiable, CLAUDE.md rule 5)**
- Can the child *lose* or *fail* anything? It must not. What happens on a "mistake" (a
  funny reaction, never a penalty, no lives, no restart)?
- Is there **time pressure** anywhere (moving targets, timers, things that disappear)? Make the
  child set the pace, or let things come back.
- Is **every rule spoken** (guide intro, a hint on the 🔊 button), and is every thing the child
  taps named aloud?

**Fit for age 5–7 and the stages**
- What changes with the stage (`kita` … `grade2`)? E.g. grid size, speed, number of
  obstacles. Keep this separate from the challenge level (the skill model handles those).
- Can a 5-year-old play it **without reading**? Without precise timing or fine motor skills?
  If not, set `minStage`.
- Round length 2–4 minutes, **3–5 chests** (3 for Kita)? What ends a round, and what is the
  reward moment (a rescued friend, a built bridge, …)?

**Controls and devices**
- Phone in portrait at 360 px wide and desktop: tap targets ≥ 64 px, keyboard alternative.
- Does it need 3D (Three.js, reuse `render/` avatars and worlds) or is DOM/CSS enough? Prefer
  DOM when it is enough: cheaper, faster on old phones, easier to test.
- 30+ fps on a mid-range phone; pause rendering while a dialog is open.

**Chests**
- Where do chests appear, and can the child **always** reach all of them?
- Do chest tiers (bronze/silver/gold) look distinct, and is gold a little harder to reach
  (e.g. a higher platform)?
- Can a chest be skipped and found again in the same round?

**Worlds and story**
- Does it play in each world's look (forest, underwater)? Which guide speaks?

## 2. Build it (checklist)
1. **Pure logic** in `src/core/activities/<id>.ts`, plus `<id>.test.ts`: round state, seeded
   via `core/rng.ts` (never `Math.random()`), "chest found" and "round over" events. No React
   or Three.js imports (ESLint enforces it).
2. **Module** in `src/modules/activities/<id>/index.ts` (`ActivityDef`: id, chests per stage,
   optional `minStage`). Register it in `src/modules/activities/index.ts`.
3. **Screen** in `src/ui/activities/<Id>Screen.tsx`, using `useChestFlow()` from
   `src/ui/activities/chestFlow.ts` for planning chests, the dialog, stars, skill outcomes,
   rewards and breaks. Never copy that logic.
4. **Texts:** names, guide intro and end dialog go into `src/content/de/strings.ts`
   (`de.activities.<id>`). Every spoken sentence goes into `src/content/de/speech.ts`
   (`staticSpokenTexts` or templates with `variants`). Then run `npm run audio:generate`
   (docs/audio.md) and commit the clips.
5. **Unlocking** is automatic. It uses the activity list and `core/progress/activities.ts`;
   no per-activity code.
6. **Test hooks:** `data-*` attributes so E2E can find a chest deterministically (e.g. card
   ids, chest positions), plus `?seed=N` support.
7. **Styles** in `src/styles.css` under a comment `/* Activity: <id> */`.

## 3. Verify
- `npm run check`, then `CI=1 npm run e2e`. Add an E2E test that unlocks the activity via a seeded save
  (`tests/e2e/helpers.ts` → `profileFixture({ mazesCompleted: 3 })`), opens it, finds a chest,
  answers, and finishes a round.
- Screenshot it at 390×844 (phone) and check tap sizes, overflow and readability.
- Play one round as a 5-year-old would: only tapping, no reading.

## 4. Docs (same PR)
- `docs/game-design.md` §4b table (status, idea) and the changelog.
- `docs/architecture.md` "As built" row.
- `docs/roadmap.md`.
- If you made a design decision the ADR doesn't cover, write a new ADR (or a note in the PR
  when it is small and reversible).

## Learnings
<!-- Updated after each activity. M14b (memory) will add concrete notes here. -->
- (to be filled after the memory game, M14b)
