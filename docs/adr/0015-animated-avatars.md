# ADR-0015: Rigged glTF avatars with idle and walk loops, starting with the cat

- **Status:** Proposed; extended to all avatar animals by ADR-0016, `Cheer` clip and rescue scene by ADR-0017
- **Date:** 2026-11-07
- **Deciders:** owner (agreed with Fabian: "a test of the animated cat"), proposal by Fabian

## Context
ADR-0014 brought the first hand-made model (the cat), static. Open question #4 asked
whether models should get a skeleton with clips or whether celebrations should first be
done in code. The owner chose to try an animated cat first, without animated scenes
(no cheer at the goal, no cut-scenes yet). Constraints: ≤ 100 draw calls per scene,
30 fps floor on mid-range phones, small precache, comic outline look, works offline.

## Options considered
1. **Code-driven motion on the whole group** (hop, squash, spin) — works for every animal,
   but cannot move ears, tail, eyes or paws.
2. **Rigid sub-meshes per body part, animated as nodes** — no skinning, but each part needs
   its own mesh per colour: ~13 meshes + outlines ≈ 20 draw calls per cat.
3. **One skeleton, skinned meshes (one per colour), glTF clips played by `AnimationMixer`** —
   same 5 meshes as the static cat, bones move ears/tail/eyes/paws, clips come from Blender.

## Decision
Option 3.

- **Rig (Blender, `cat-animated.blend` outside the repo):** 12 bones — `Root`, `Body`, `Head`,
  `Ear.L/R`, `Eye.L/R` (scaled for blinking), `Tail1–3`, `Paw.L/R`. Parts are weighted
  rigidly to one bone; the tail blends across `Tail1–3`. Meshes are decimated to 50 %
  (9.1k triangles, no visible difference); `public/models/cat.glb` shrinks from 350 KB to
  292 KB including skin and clips.
- **Clips:** `Idle` (3 s loop: breathing, looking around, tail sway, one blink, ear twitch)
  and `Walk` (0.5 s loop: body roll, paws lift in turn, faster tail). Model contract
  (ADR-0014) gains: optional skeleton and clips named `Idle` / `Walk`.
- **Runtime (`src/render/avatars/animation.ts`):** `buildAnimal` creates an `AnimalAnimator`
  (mixer + idle/walk actions) for models with these clips and stores it in
  `userData.animator`. Views call `tickAnimals(scene, dt)` once per frame (`MazeView`,
  `AvatarPreview`, `TreehouseView`); `MazeView` calls `setAnimalMoving` for the avatar and
  the pet (0.2 s cross-fade). Procedural animals and static models have no animator; both
  calls are no-ops for them. Each instance starts idle at a different deterministic offset.
- **Cloning:** `SkeletonUtils.clone` so every avatar has its own bones; geometry stays shared.
- **Outlines:** a scaled hull can't follow bones, so skinned meshes get a skinned hull bound to
  the same skeleton whose vertices are pushed out along the skinned normal in the vertex
  shader (`skinnedOutlineMaterial(thickness)` in `toon.ts`, shared per thickness).
- **Outfit:** items carry `userData.slot`; on animated models hats and glasses move onto the
  `Head` bone and neck items onto `Body` (`attachOutfitToBones`), inside a holder that undoes
  the bone's rest pose, so they sit where they did and follow the motion.
- Not in scope: one-off clips and scene animations (cheer, head shake, rescue).

## Consequences
- Same draw calls as the static cat (5 meshes + 2 skinned outlines = 7), 9.1k triangles
  (~15.7k drawn with outlines); skinning adds vertex work for 12 bones, negligible here.
- Every view that shows animals must call `tickAnimals`, or the animals stand still in their
  rest pose (still correct, just not animated).
- The skinned outline patches three.js shader chunks (`<common>`, `<skinning_vertex>`) by
  name. `patchSkinnedOutlineShader` warns and leaves the shader alone if a three.js upgrade
  renames them, and a unit test runs it against the installed three.js shader.
- `disposeObject` stops an animal's mixer and frees its cached bindings.
- Further animals need a rig with the same bone names for the outfit (`Head`, `Body`), or
  their outfit simply stays on the root.
- Follow-ups (need the owner): cheer / head-shake clips and where to play them; rigs for the
  other animals.
