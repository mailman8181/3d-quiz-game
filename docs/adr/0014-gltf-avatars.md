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
- Model contract: stands on y=0, faces +z, ~1 unit tall; one mesh per material named
  `Body` (avatar colour), `Light` (lighter shade), `Dark`, `Pink`, `White`. All colours come
  from `toonMaterial`, so the avatar colour choice and the cel look keep working.
- Accessory anchors are per model (`anchors()` in `accessories.ts`).
- `.glb` is precached by the service worker (offline PWA, ADR-0008).

## Consequences
- Cat: 5 meshes / 5 draw calls (+5 outlines), ~19k triangles, 350 KB uncompressed.
  Within the budget, but later models should get fewer triangles or Draco/meshopt.
- Still static: no rig or animations yet (follow-up: idle bob, jump, cheer).
- Blender source file is kept outside the repo for now; decide whether to add `assets-src/`.
