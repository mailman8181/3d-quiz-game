# ADR-0010: Activities — more ways to find chests, one shared chest pipeline

- **Status:** Accepted (owner, 2026-11-07); Hüpf-Abenteuer drawn in 3D with new elements by ADR-0018
- **Date:** 2026-11-07
- **Deciders:** owner / agent

## Context
So far the maze is the only way to play. The owner wants more variety to keep children
interested: a memory game, a side scroller and further mini games. The learning part
should stay the same everywhere: chests open challenges.

What exists and must keep working:
- the chest pipeline: `selectChallengeTypes` (ADR-0009) → `planChests` (tiers, levels) →
  `ChallengeDialog` → stars → star jar and rewards → skill model;
- parents' switches, session subjects, the learner stage and the play-time limit;
- the children-first rules (game-design §2, ADR-0004): no time pressure, nothing to fail,
  everything spoken, no network.

## Options considered
1. **Each mini game as its own screen with its own question logic.** Fast for one game, but it
   duplicates the reward and skill code, and the copies drift apart.
2. **Make the maze configurable** (a scroller as a "maze" with one row). Works for the
   scroller, not for memory; it bends the maze code.
3. **Activities as plug-in modules around a shared chest pipeline.** An activity only decides
   *how chests are found*. Everything after "a chest was found" is shared.

## Decision
Option 3.

### 1. Contract
- **Logic** lives in `src/core/activities/<id>.ts`: pure TypeScript, seeded RNG, unit-tested.
  It holds the round state (cards, positions, …) and says when a chest is found and when the
  round is over.
- **Module** lives in `src/modules/activities/<id>/`:
  ```ts
  export interface ActivityDef {
    id: string;                 // "memory"
    /** Chests per round for a stage (3–5, like a maze). */
    chests(stage: StageId | null): number;
    /** Lowest stage that can play it (e.g. a scroller may need some motor skills). */
    minStage?: StageId;
  }
  ```
- **Screen** lives in `src/ui/activities/<Id>Screen.tsx`. It renders the activity and uses
  the shared hook `useChestFlow()` (`src/ui/activities/chestFlow.ts`), which:
  - plans the chests (`selectChallengeTypes` + `planChests`) for the round;
  - opens the `ChallengeDialog` for a found chest;
  - reports stars, skill outcomes and skips;
  - shows the reward picker for a full star jar, and the break screen when play time is over.
- **Registration** in `src/modules/activities/index.ts`, with names and spoken intros in
  `content/de` (`de.activities`).
- **The maze is activity "maze"**, always unlocked. Its screen stays `GameScreen`. It moves
  onto `useChestFlow` when it is next touched; until then it keeps its own copy of the flow.

### 2. Unlocking (owner decision)
- Other activities unlock **after 3 finished mazes** (any world). After that, one more unlocks
  per **3 finished rounds** (mazes or other activities).
- The **order is random per child**, but fixed: a shuffle seeded with the profile id. So it
  never changes between sessions and needs no stored order.
- The hub shows unlocked activities as cards, plus one **mystery card** ("?") saying how many
  rounds are missing for the next one. It doesn't reveal which activity comes next.
- A newly unlocked activity is celebrated on the round's end dialog, the same way as a new
  world.

### 3. Save
Save v10 adds `activityRounds: Record<string, number>` (finished rounds per activity id,
maze excluded because `mazesCompleted` exists). The migration sets `{}`.

### 4. Rules every activity must follow
- **No time pressure, no losing.** Mistakes have a funny reaction, no penalty, no lives.
  Anything moving waits for the child or comes back.
- **Round length:** 2–4 minutes, 3–5 chests (2–3 for Kita when the activity itself is small,
  e.g. memory 2×4), then an end dialog: stars, the
  rescued friend or the activity's reward moment, "nochmal" or 🏠.
- **Everything spoken:** the rules (guide intro), names of things the child taps, feedback.
  Sentences go into `speech.ts`, and clips are committed (ADR-0007).
- **Phone first:** tap targets ≥ 64 px, works in portrait at 360 px wide, 30+ fps.
- **Stage-aware difficulty** for the activity itself (e.g. memory grid size), separate from
  the challenge level.
- **Test hooks** (`data-*`) so E2E tests can reach a chest without luck or timing.

## Implementation notes (M14b)
- `ChallengeDialog` takes a `ChestContent` (`challenge`, `tier`, `stars`), which any activity
  can produce. The maze's `Chest` extends it with a tile and a state.
- `useChestFlow()` is a React hook in `src/ui/activities/chestFlow.tsx`. It plans the round's
  chests once (lazy state). Activities remount it with a `key` per round.
- Reward and skill updates are shared helpers in `App.tsx` (`chooseReward`, `recordChallenge`).
  The maze uses them too.
- The maze still has its own copy of the dialog, picker and break code. It moves onto
  `useChestFlow` when it is next changed (see the add-activity skill).
  **Done (2026-11-07):** the maze uses `useChestFlow` (options `worldId`, `holdPicker`,
  `onChestSolved`, `onChestSkipped`); `MazeSession` receives `ChestContent[]`.

## Consequences
- **Easier:** new games are small modules; every challenge type, reward and parents' setting
  works in them at once. The skill `.claude/skills/add-activity/` guides agents through the
  steps and the design questions.
- **Harder:** the chest flow becomes a shared hook that every activity depends on. Changes to
  it need tests in more than one activity.
- **Order:** memory first (M14b), then the side scroller "Hüpf-Abenteuer" (M14c); further
  ideas (Wimmelbild, river ride, bridge building, bubbles) after playtests.
