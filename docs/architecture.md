# Architecture

**Status:** APPROVED (owner, 2026-10-31). Rationale for key choices is in `docs/adr/`.

## 1. Tech stack (see ADR-0002)
| Concern | Choice |
|---|---|
| Language | TypeScript (strict) |
| Build / dev server | Vite |
| 3D rendering | Three.js (vanilla, wrapped in our own thin layer) |
| 2D UI (menus, challenge screens, parents area) | React DOM overlay on top of the canvas |
| State | React state + `useSave` hook; add a store (Zustand) only when screens need shared state |
| Persistence | IndexedDB (via `idb-keyval`), versioned save format with migrations |
| Audio | `SpeechProvider` interface; pre-generated clips (M2) + Web Speech fallback (ADR-0003) |
| Offline / install | PWA via `vite-plugin-pwa` (ADR-0008) |
| Tests | Vitest (unit, core logic), Playwright (E2E smoke on mobile + desktop viewports) |
| Lint | ESLint (flat config) incl. an import guard that keeps `core/` free of Three.js/React |
| CI/CD | GitHub Actions → GitHub Pages, preview per PR (ADR-0005) |

## 2. Layering
```
┌──────────────────────────────────────────────────────────┐
│ app/          bootstrapping, routing between screens     │
├──────────────┬──────────────────────┬────────────────────┤
│ ui/ (React)  │ render/ (Three.js)   │ audio/             │
│ menus, HUD,  │ maze scene, avatar,  │ speech queue,      │
│ challenge    │ camera, input,       │ music, sfx         │
│ views        │ toon materials       │                    │
├──────────────┴──────────────────────┴────────────────────┤
│ core/  (pure TypeScript, NO DOM / Three.js imports)      │
│  maze generation · game session · skill model ·          │
│  rewards/inventory · save format · RNG                   │
├──────────────────────────────────────────────────────────┤
│ modules/  plug-ins: challenges/*, worlds/*               │
│ content/  data: word bank, locale (de), audio manifest   │
└──────────────────────────────────────────────────────────┘
```
Rules:
- `core/` must not import from `ui/`, `render/` or `audio/` → fully unit-testable, and
  agents can reason about game rules without a browser.
- Communication core → presentation via typed events (`GameEvent` union) and read-only
  state snapshots.
- All randomness goes through a seeded RNG (`core/rng.ts`) → reproducible mazes and
  challenges in tests and bug reports.

## 3. Extension points
### 3.1 Challenge types (`src/modules/challenges/<id>/`)
Split into a **logic part** (pure TS, `core/challenges/types.ts`) and a **view** (React,
registered in `src/ui/challenges/`, added in M2 PR B), so `core/` stays React-free.
```ts
export interface ChallengeType<TData> {
  id: string;                      // "math.count"
  subject: SubjectId;              // "math" | "german"
  skills: readonly string[];       // for the skill model (M4)
  levels: number;                  // 1..levels
  levelInfo: LevelInfo[];          // per level: stage range + curriculum competencies (ADR-0009)
  generate(ctx: { rng: Rng; level: number }): ChallengeInstance<TData>;
}
interface ChallengeInstance<TData> {
  typeId; level; data: TData;      // what the view draws
  choices: Choice[]; correctChoiceId: string;   // tappable answers
  prompt: SpeechLine; explanation: SpeechLine;  // template key + slots (ADR-0003)
}
```
- Generic answer flow (`core/challenges/attempt.ts`): correct / tryAgain / hint / reveal
  and stars, shared by all types (game-design §6.4).
- Distractor helper: `core/challenges/choices.ts`.
- German speech templates: `src/content/de/speech.ts` (`speechText(line)`).
- Registry: `src/modules/challenges/index.ts`. Adding a challenge = one folder + one
  registry line + view + speech templates. `challenges.test.ts` runs a generic property
  test over every registered type (1000 seeds × every level: valid, solvable, all speech
  keys have templates) and checks `levelInfo` (one entry per level, known competency ids).
- **Stage → levels (ADR-0009):** `core/challenges/selection.ts` turns the world's type list,
  the parents' switches, the session subjects and the child's stage into
  `{type, startLevel, maxLevel}` for `planChests`. A type is offered when level 1 fits the stage
  and the child has not outgrown every level; a new child starts at the highest level meant for
  its stage; the skill model may go one stage further ("stretch").

### 3.2 Worlds / themes (`src/modules/worlds/<id>/`)
A world declares: tile set (meshes/materials), palette, music, station prop, maze size
range, unlock condition. The maze generator is theme-agnostic.

### 3.3 Later: game modes
The session layer (`core/session`) is written against a `GameMode` interface so that
non-maze modes (e.g. a short mini-game) can be added later without rewriting
challenges or rewards.

## 4. Content pipeline
- `content/de/strings.ts` — every UI/speech text, keyed.
- `content/words/*.json` — word bank: `{ word, syllables, initialSound, rhymeGroup, image, audio }`.
- Speech audio is **generated at build time** by an offline neural TTS (Piper, German
  voice) into `public/audio/`, listed in a manifest. Generated prompts are composed from
  fixed sentence templates + number/word clips so every possible sentence has audio.
  Fallback: browser `speechSynthesis` with a local German voice. All behind one
  `SpeechProvider` interface so in-browser neural TTS can be added later. (ADR-0003)
- Art: CC0 asset packs (e.g. Kenney, Quaternius) + procedural geometry with a shared
  toon material and outline pass. Licenses tracked in `ASSETS.md`.

## 5. Persistence
Local only (ADR-0004). Save keys namespaced per deployment (main vs. PR preview, ADR-0005). One save document per child profile:
`{ version, profile, inventory, skillModel, progress, settings }`. Migrations in
`core/save/migrations.ts`. Export/import as file for backup.

## 6. Performance budget
- Initial download < 5 MB (before world assets), each world < 5 MB.
- 60 fps target, 30 fps floor on mid-range phones; instanced meshes for maze tiles,
  ≤ 100 draw calls, device-pixel-ratio capped at 2.

## 7. Proposed directory layout
```
src/
  app/ core/ render/ ui/ audio/
  modules/challenges/<id>/ modules/worlds/<id>/
content/
public/audio/ public/models/
tests/e2e/
docs/ (game-design, architecture, adr/, roadmap, open-questions)
.github/workflows/ ci.yml deploy.yml pr-preview.yml
```

## 8. As built (M1)
| Area | File(s) | Notes |
|---|---|---|
| Seeded RNG | `src/core/rng.ts` | mulberry32 |
| Maze generation | `src/core/maze/generate.ts` | DFS perfect maze + braiding (loops); goal = farthest cell; `stationCandidates` prepared for M2 chests |
| Pathfinding | `src/core/maze/pathfinding.ts` | BFS on tile grid |
| Maze rules | `src/core/session/mazeSession.ts` | renderer asks for paths, reports arrivals → events |
| Profiles & save | `src/core/profile`, `src/core/save` | versioned `SaveDoc` + `migrateSave`; IndexedDB store in `src/app/storage.ts`, key namespaced by `BASE_URL` |
| 3D view | `src/render/MazeView.ts` | instanced hedges, inverted-hull outlines, toon gradient, tap-to-walk + keys, camera follow |
| Avatars | `src/render/avatars/animals.ts` | procedural animals (ADR-0006) |
| Speech | `src/audio/speech.ts`, `src/audio/clipId.ts`, `public/audio/de/` | pre-generated whole-sentence clips (ADR-0007) → local Web Speech fallback |
| Audio pipeline | `scripts/generate-audio.ts`, `scripts/check-audio.ts`, `docs/audio.md` | Piper, run locally; CI checks completeness |
| World | `src/modules/worlds/forest` | theme colours + maze size |
| Challenges | `src/core/challenges`, `src/modules/challenges/{math-count,math-addition}` | logic + generic answer flow |
| Chests | `MazeSession` (`chests`, `solveChest`, `skipChest`), `src/render/props.ts`, world `chests` config | placed in dead ends; fixed levels until M4 |
| Challenge UI | `src/ui/challenges/` (`ChallengeDialog`, view registry, `CountView`, `AdditionView`) | answer buttons sorted ascending (number line) |
| Test hooks | `data-test-route-chest`, `data-test-route-goal` (only with `?seed=`) | arrow-key routes for E2E |
| Rewards | `src/core/rewards/rewards.ts` (jar, offer, equip), `src/modules/rewards/catalog.ts`, `src/render/avatars/accessories.ts`, `src/render/trails.ts`, `src/ui/rewards/` | save v2 adds jar, pendingRewards, inventory, equipped |
| Animal friends | `src/core/profile/lostAnimals.ts`, `src/render/avatars/lostAnimals.ts`, pet following in `MazeView.updatePet` | save v3 adds rescued, pet |
| Parents area | `src/ui/parents/` (`ParentGate`, `ParentsArea`), `content/de/numbers.ts` | save v4 adds `settings` (speech); `setSpeechEnabled` in audio |
| Adaptive difficulty | `src/core/skills/skillModel.ts` (`recordOutcome`, `planChests`, tiers) | save v5 adds `skills` per challenge type; start levels come from the stage (ADR-0009) |
| Views with own answers | `ChallengeViewEntry.ownsChoices` in `src/ui/challenges/index.ts` (compare, pattern); `ChallengeInstance.promptDisplay` hides spoken answers | `?challenge=<typeId>` limits chests to one type (review/E2E) |
| German word bank | `src/content/de/words.ts` (word, emoji, syllables, initial, rhyme) used by `src/modules/challenges/german-*` | modules may read content data; consistency tests in `words.test.ts`; save v6 adds `disabledChallenges` |
| PWA / offline | `vite.config.ts` (`vite-plugin-pwa`), `public/icons/`, clip fetch in `src/audio/speech.ts` | ADR-0008; no service worker on PR previews |
| Sound effects | `src/audio/sfx.ts` (Web Audio synth: jingles, fanfare, bloop, pling) | no audio files; `settings.sfx` toggle |
| Maze levels | `src/core/progress/levels.ts` (`levelSpec`, `currentLevel`) | save v7 adds `levels` per world; world config only sets `braid` |
| Worlds | `src/modules/worlds/{forest,underwater}`, `WorldTheme` (guide, lostAnimals, unlock, style hedge/coral, colours), `src/core/progress/worlds.ts`, `src/ui/worlds/WorldSelectScreen.tsx` | new world = module + register + content texts + lost-animal models |
| Tree house | `src/core/rewards/treehouse.ts`, `src/render/treehouse/{TreehouseView,decor}.ts`, `src/ui/treehouse/TreehouseScreen.tsx` | reward slot `decor`; save v8 adds `treehouse`; test hook `data-spots` |
| Wissen challenges | `src/content/de/knowledge.ts` (animals, babies, colours/shapes with declension helpers, season/weather questions, odd-one-out categories), `src/modules/challenges/knowledge/`, `src/ui/challenges/KnowledgeView.tsx` | one shared `QuizData` shape + view for all five types |
| Session subjects | `src/core/challenges/subjects.ts` (`allowedSubjects`, `sessionSubjects`, `toggleSubject`), chips in `WorldSelectScreen`, filter in `GameScreen` | App state only (not saved); challenge dialog exposes `data-type` for tests |
| Learner stage & curriculum | `src/core/learner/stage.ts` (`STAGES`, `currentStage`: +1 per 1 August, Kita stays), `src/core/challenges/selection.ts` (`levelWindow`, `selectChallengeTypes`), `LevelInfo`/`lv()` in `core/challenges/types.ts`, catalogue `src/content/curriculum/de-ni.ts`, `src/ui/screens/StageScreen.tsx` | ADR-0009; save v9 adds `learner` + `stageAsked`; world config lists type ids only; research and source PDFs in `docs/curriculum/` |
| Curriculum content packs (M13b–d) | `src/content/de/{preschool,clock,grammar}.ts`, modules `preschool/`, `german2/`, `math-*`; new views in `src/ui/challenges/` (Dice, Neighbors, Position, NumberBonds, DoubleHalf, PlaceValue, Times, Money, Clock, Symmetry, Chance) | most types reuse `KnowledgeView` (`QuizData`: picture, text line, emoji/word cards, sizes, dot pairs); coverage table in `docs/curriculum/niedersachsen.md` §7 |
| Camera | `MazeView.updateCamera` | follows the avatar, clamped to the maze so no empty grass is shown |
| Test hooks | `data-avatar-tile`, `data-goal-tile` on the canvas container; `?seed=N` URL param | used by E2E tests and bug reports |
