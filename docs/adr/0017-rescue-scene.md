# ADR-0017: Rescue cut-scene at the maze goal, with modelled lost friends

- **Status:** Proposed
- **Date:** 2026-11-08
- **Deciders:** owner (agreed with Fabian after the animated avatars: "when a friend is found,
  a short scene where both animals are happy to have found each other"), proposal by Fabian

## Context
Reaching the goal opened the "Juhu!" dialog at once. The friend waiting at the goal was a
procedural animal (ADR-0006) bobbing in code, while all avatars are now rigged models with
`Idle`/`Walk` clips (ADR-0015/0016). ADR-0016 listed one-off clips ("cheer") and where to play
them as an owner follow-up. Constraints as before: 30 fps floor on mid-range phones,
≤ 100 draw calls, initial download < 5 MB, children first (short, no text, skippable,
calm with reduced motion).

## Options considered
1. **Scene with the procedural friends, code-animated** — no new assets, but the friend
   would not match the avatars and could not really cheer (no limbs).
2. **All ten lost friends modelled and rigged in Blender, plus a `Cheer` clip for every
   animal; a short in-engine scene** — chosen (Fabian: "gleich alle in Blender neu",
   "eigener Jubel-Clip").
3. **Pre-rendered video** — large, does not show the child's own colours and outfit, no.

## Decision
Option 2.

- **Lost friends as models** (`public/models/friends/<id>.glb`): chick, piglet, puppy, lamb,
  turtle, octopus, crab, pufferfish, whale baby, clownfish. Same contract as the avatars
  (y=0 ground, +z front, one skinned mesh per material, clips `Idle`/`Walk`/`Cheer`), except
  that their colours come from the file: materials are named `<friend>_<Slot>` and keep
  their colour (`friendMaterialSlot` only decides the outline; no outline for `Dark`, `Pink`,
  `White`, `…Dark`). Modelled at avatar size, shown at `FRIEND_SCALE` 0.55 (as before).
  Kitten and bunny baby stay the scaled cat and bunny models. Fish (pufferfish, clownfish,
  whale baby) float a little above the ground and swim (body wave) instead of walking.
  Loaded and swapped in like the avatars (`MODEL_FILES` now covers `ModelId = AvatarAnimal |
  LostAnimal`); the procedural friend stays the fallback.
- **`Cheer` clip for every animal** (avatars too, 1.5 s loop): happy jumps with paws, wings,
  fins or tentacles up and ears and tails wagging; fish do a bouncing, wiggling swim. `setAnimalCheering(root, on)` in
  `animation.ts` cross-fades to and from it; it returns false when there is no clip, and
  `setAnimalMoving` only records the state while cheering.
- **Scene** (`src/render/rescueScene.ts`, driven by `MazeView.playRescueScene()`), 4.2 s:
  1. 0–0.8 s: avatar and friend step side by side on the goal tile (x −0.30 / +0.32, a little
     back), turn towards each other and slightly to the camera; the pet (if any) steps in
     front between them, facing the camera. The camera moves in (1.1 s, eased).
  2. from 0.6 s: everyone cheers (clip, or a code hop for procedural fallbacks); hearts and
     stars (white-bordered, camera-facing, like the trails) rise between them.
  3. 4.2 s: back to idle, particles gone, the "Juhu!" dialog opens (`GameScreen` delays
     `setGoalStars` until the scene's promise resolves; fanfare, speech and saving the rescue
     still happen immediately, so nothing is lost if the child closes the app).
  - Runs on **wall-clock time** (`performance.now`), so it lasts 4.2 s even at 3 fps.
  - **Tap / Space / Enter / Escape skips** to the final poses and opens the dialog.
  - **`prefers-reduced-motion`:** 2.2 s, no camera move, fewer particles.
  - Input is paused and the reward picker is held back while it plays.
  - Test hook: `data-rescue-scene="playing" | "done"` on the game canvas container.
- **Skin weights packed** to normalized unsigned bytes (core glTF 2.0, no extension) by a
  small script after export; saves ~20 % per file, GLTFLoader reads it as is.
- **Contract tests** (`modelFiles.test.ts`) now also run every friend file (size, materials
  `<friend>_<Slot>`, bounding box, rig, clips incl. `Cheer`, builds in file colours, cheers);
  `rescueScene.test.ts` covers the timeline, poses, clip vs. code hop, particles, skip and
  equal duration at 3 and 60 fps; E2E `goal.spec.ts` waits for the scene and tests the skip.

## Consequences
| Friend | KB | | Friend | KB |
|---|---|---|---|---|
| chick | 153 | | turtle | 239 |
| piglet | 220 | | octopus | 223 |
| puppy | 200 | | crab | 177 |
| lamb | 270 | | pufferfish | 143 |
| | | | whale baby | 147 |
| | | | clownfish | 123 |

Avatars after weight packing: cat 247, bunny 223, bear 198, frog 160, penguin 161 KB.

- 15 models, 2.88 MB together; **precache 4.5 MB** in total (was 2.7 MB), still under the
  5 MB budget but close. Compression (open question #3) is now the next lever before any
  further models.
- The goal is ~4 s later; a tap skips it. The E2E goal test waits up to 15 s for it.
- Same scene can be reused for chests or the treehouse later (not in scope).
- Blender sources: the friends live in the same `animals-animated.blend` (text block
  `lost_animals.py`), still outside the repo (open question #5).
