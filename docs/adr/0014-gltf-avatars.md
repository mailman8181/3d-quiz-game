# ADR-0014: Hand-modelled glTF avatars, starting with the cat

- **Status:** Proposed
- **Date:** 2026-11-07
- **Deciders:** owner (proposal by Fabian)

## Context
ADR-0006 chose procedural animals from primitives and named the way out: "switch to glTF
behind the same `buildAnimal(avatar)` function" if the avatars are not appealing enough.
Playtest feedback (a 9-year-old picked the cat first) asks for nicer, more detailed animals.

## Options considered
1. Keep primitives, add more of them — still reads as "spheres", hard to make faces cute.
2. CC0 packs (Kenney, Quaternius) — mixed styles, licence tracking, no control over the look.
3. **Own models built in Blender, exported as glTF**, coloured at runtime with the existing
   toon material and outline — consistent comic style, we own them (CC0), one file per animal.

## Decision
Option 3, one animal at a time, procedural animals stay as fallback.

- `src/render/avatars/models.ts` loads `public/models/<animal>.glb` in the background; the
  first screen never waits. `buildAnimal` stays synchronous: it uses the model when loaded,
  otherwise returns the procedural animal, which swaps its contents to the model in place
  once loading finishes (same group, outfit from `setOutfit` kept). Load errors keep the
  procedural animal. After the first visit the model comes from the service-worker cache.
- Model contract: stands on y=0, faces +z; the body is ~1 unit tall like the procedural
  animals, ears may reach ~1.2 (cat: head top 1.08, ear tips 1.20). One mesh per material
  named `Body` (avatar colour), `Light` (lighter shade), `Dark`, `Pink`, `White`; Blender
  suffixes like `Body.001` are accepted, unknown names fall back to `Body` (with a dev
  warning). All colours come from `toonMaterial` and the shared `ANIMAL_PALETTE`, so the
  avatar colour choice and the cel look keep working. `Dark`/`Pink`/`White` get no outline.
- Accessory anchors are per model (`anchors()` in `accessories.ts`), including a
  `headScale` for hats (cat: 1.22, its head is wider than the procedural one).
- Meshes cloned from the cache share its geometry (`userData.sharedGeometry`);
  `disposeObject` frees their materials but not that geometry.
- `.glb` is precached by the service worker (offline PWA, ADR-0008).
- Amends ADR-0006: the procedural animals stay as the fallback and for animals without a model.

## Consequences
- Cat: 5 meshes, 18.8k triangles, 350 KB uncompressed. Only `Body` and `Light` are
  outlined (inverted hull draws them twice), so per cat: 7 draw calls, ~32k triangles drawn.
  Within the budget, but each further model adds ~350 KB to the precache: keep an eye on it
  and on compression (Draco/meshopt, see `docs/open-questions.md`).
- Still static: no rig or animations yet (open question).
- Blender source files are kept outside the repo for now (open question).
