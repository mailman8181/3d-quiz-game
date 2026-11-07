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
6. **Review link:** `?activity=<id>` already opens any registered activity right after choosing or
   creating a profile, without unlocking it. Put the link to the PR preview in the PR description.
7. **Test hooks:** `data-*` attributes so E2E can find a chest deterministically (e.g. card
   ids, chest positions), plus `?seed=N` support.
8. **Styles** in `src/styles.css` under a comment `/* Activity: <id> */`.

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
From memory (M14b), the first activity. Read these before building the next one.

**Wiring (copy from memory)**
- The screen is a wrapper that holds the round counter and renders the round component with
  `key={round}`. "Nochmal" increments it, so `useChestFlow` plans fresh chests and the
  activity state resets cleanly. Don't reset state by hand.
- The seed comes from `?seed=N` (+ round) or `randomSeed()`, taken once in a lazy `useState`.
  Lint forbids `Math.random`/`Date` during render: use lazy initializers or event handlers.
- `useChestFlow({ count, seed, … })` gives you `chests[i]` (tier for drawing), `states[i]`,
  `open(i)`, `overlays` (render them last), `busy` (ignore input while true) and `starsEarned`.
- Register it in `App.tsx` under `screen.name === 'activity'`; the `shared` callbacks
  (stars, skill, reward, `onRoundCompleted`) already exist, so only the `if (screen.id === …)`
  line is new.
- Count the round (`onRoundCompleted`) in the **event handler** that completes it, not in an
  effect (react-hooks lint). Compute "unlocks a new game" there too, by calling `progressFor`
  with the round added.
- The end dialog shows only when nothing is open: `done && !flow.busy && no chest 'closed'`.
  Chests found just before the end open after a short delay, and the dialog waits for them.

**Child-friendliness that mattered**
- Two different cards turn back after a short look (~1.3 s) **or** on the next tap. A
  child is never blocked waiting for an animation.
- Speak what is turned (picture name, "Eine Schatzkiste!"); pairs get a jingle plus "Ein Paar!".
- Chest looks need two cues (tier colour **and** an emblem): two silver chest pairs must still
  be told apart.
- A skipped chest pair stays visible (dashed); tapping it opens the question again.
- Layout: phones are portrait, so use upright grids (cols < rows) and size the grid with
  `min(96vw, …, (100dvh − header) × cols/rows)` so every row fits without scrolling.
- Hub cards need an explicit background colour (`.activity-card`); white text on the default
  card is unreadable.

**Testing**
- Give every interactive element a `data-*` hook (`data-card-id`, `data-pair`, `data-kind`),
  so E2E can solve a round deterministically without depending on the seed.
- `seedSave()` navigates to `./` and reloads, which drops URL parameters such as
  `?challenge=`. Write the test so it works with any chest content, using the generic
  `ANSWERS` locator that taps until "Weiter".
- Unlock rules are pure (`core/progress/activities.ts`): test thresholds and the stable
  per-child order in unit tests, and only the visible result (mystery card, activity card) in E2E.

From the side scroller (M14c), the first moving activity:

**Real-time activities**
- Keep the physics **pure and frame-based** in core: `step(course, state, input, dt) →
  { state, events }`. Unit tests drive it at 60 Hz and check the children-first rules
  directly: "nothing moves without input", "walking only right still reaches the goal",
  "a gold chest is reachable without timing".
- Apply **vertical movement before the horizontal collision check**. Otherwise a jump started
  this frame is still at ground height and counts as bumping into the obstacle.
- The game loop is one `requestAnimationFrame` effect. It reads the latest flow, profile and
  callbacks through **refs** updated in an effect without deps, skips stepping while
  `flow.busy` (dialog open), and clamps `dt` (≤ 50 ms) so a background tab doesn't teleport the avatar.
  React re-renders once per frame; that is fine for ~50 DOM elements.
- Input: hold buttons use pointer events with `setPointerCapture` and `touch-action: none`.
  A hop is a one-shot flag the loop consumes. Clear held input when a chest opens,
  otherwise the avatar keeps walking after the dialog.
- Scale world units with `min(100vw / visibleUnits, N dvh)` so portrait phones get big
  sprites without jumps leaving the sky. Background decoration (trees, clouds) makes the
  scene feel alive at almost no cost.

**Unlocking and tests**
- Once there are two or more activities, **which one opens after 3 mazes is random per
  child**. E2E tests that open a specific activity must seed `mazesCompleted: 6` or more
  (enough for all of them), not 3.
- A walking E2E holds `ArrowRight`, answers any chest dialog that appears (release the key
  first), and stops at the end dialog. Floating chests may be passed, so assert
  "≥ ground chests answered".

**Still to do**
- The maze still has its own copy of the chest dialog, reward picker and break code. Move it
  onto `useChestFlow` when the maze is next changed.
