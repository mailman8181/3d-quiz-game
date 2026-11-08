# ADR-0016: All avatar animals as rigged glTF models

- **Status:** Proposed; `Cheer` clips and the lost friends added by ADR-0017
- **Date:** 2026-11-08
- **Deciders:** owner (agreed with Fabian after the animated cat: "the other animals too"), proposal by Fabian

## Context
ADR-0015 animated the cat as a test; it was well received. The other four avatar animals
(bunny, bear, frog, penguin) were still procedural (ADR-0006). Same constraints as before:
≤ 100 draw calls per scene, 30 fps floor on mid-range phones, small precache, comic outline
look, offline, no animated scenes yet.

## Options considered
1. **Hand-build each animal separately in Blender** — most freedom, but no shared style, and
   every fix (like the decimation issue below) has to be redone by hand per animal.
2. **One parametric Blender build script for all animals** — shared body family (the cat's
   body, head, big glossy eyes), per-animal features and clips in small functions, one export
   routine. Chosen.
3. **Keep the others procedural and only animate them in code** — ruled out by ADR-0015
   (no ears, tails, eyes or wings moving).

## Decision
Option 2, same runtime as ADR-0015 (no new animation code).

- **Models** (`public/models/{bunny,bear,frog,penguin}.glb`): same contract as the cat
  (ADR-0014/0015): y=0 ground, +z front, one skinned mesh per material, clips `Idle` (3.0 s)
  and `Walk` (0.5 s), bones `Root`, `Body`, `Head`, `Eye.L/R`, `Paw.L/R` plus per animal:
  bunny `Ear.L/R` (long), `Tail1` (pom-pom); bear `Ear.L/R`, `Tail1`; frog none (eyes on top
  of the head); penguin `Wing.L/R`, `Tail1`.
- **Character in the clips:** bunny and frog *hop* (whole body lifts, squash and stretch; the
  bunny's ears fold back), bear and penguin *waddle* (body roll; the penguin holds its wings
  out). Idle: breathing, looking around, one blink, plus an ear flick and ear flop (bunny),
  an ear wiggle and body sway (bear), a croak (frog), a double wing flap (penguin).
- **New material slot `Orange`** (penguin beak and feet) with `ANIMAL_PALETTE.orange`,
  outlined like the procedural beak.
- **Accessory anchors per model** (`MODEL_ANCHORS` in `accessories.ts`): cat, bunny, bear and
  penguin share the cat's head; the frog's hats sit on its eye bulbs (`headTop` 1.05,
  `headScale` 1.3), its glasses on the bulbs' front.
- **Avatar preview framing:** the camera is raised by `previewLift(top)` when an avatar is
  taller than ~1.39 (the bunny with a hat on its ears reaches ~1.55); smaller avatars keep
  the old framing exactly. Re-framed when a still-loading model swaps in.
- **Model contract tests** (`modelFiles.test.ts`) load the shipped `.glb` files through
  `GLTFLoader` and `buildAnimal`: size budget, no textures/URIs/required extensions, known
  materials, ground/front/height, skinned meshes, clips and their bone targets, outfit on the
  bones. They import the files via `import.meta.glob(..., { query: '?inline' })`, so
  `vite.config.ts` gets `assetsInclude: ['**/*.glb']` (no effect on the app bundle; the app
  still fetches `public/models/*.glb` at runtime).
- **Blender sources** stay outside the repo (open question #5): `animals-animated.blend` with
  the build script as text blocks `animal_lib.py` (shared parts, rig, skin, clip, export) and
  `animal_rigs.py` (per-animal rig and clips).
- Export detail: parts are decimated per part by size before joining (large 0.5, small
  0.4/0.3); mouth lines and surface patches are not decimated (a decimated smile became
  jagged). Clip keys start at frame 0, so clip time starts at 0 (the cat's file starts at
  1/24 s; harmless, kept).

## Consequences
| Model | KB | Triangles | Bones | Draw calls (meshes + outlines) |
|---|---|---|---|---|
| cat | 292 | 9.1k | 12 | 5 + 2 |
| bunny | 265 | 8.4k | 10 | 5 + 2 |
| bear | 233 | 7.2k | 10 | 5 + 2 |
| frog | 191 | 6.1k | 7 | 5 + 2 |
| penguin | 186 | 5.6k | 10 | 6 + 3 (beak/feet outlined) |

- Precache grows by ~0.9 MB to 2.7 MB in total (budget: initial download < 5 MB). Compression
  is still open (question #3).
- Every avatar is now animated; the procedural animals (ADR-0006) are only the fallback while
  a model loads on the very first visit or if a model fails to load.
- Lost animals built from avatar animals (kitten, bunny baby) are the models too, scaled down.
- Follow-ups (need the owner): one-off clips (cheer, head shake) and where to play them;
  whether the Blender scripts should live in the repo.
