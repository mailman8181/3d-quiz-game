# ADR-0006: Procedural comic avatars from primitives

- **Status:** Accepted (agent decision, reversible); amended by ADR-0014 (glTF models per
  animal, these procedural animals stay as fallback)
- **Date:** 2026-10-31
- **Deciders:** agent

## Context
Owner wants comic animal avatars. Agents cannot draw or model; downloadable CC0 models
rarely match a consistent style and need licence tracking and loading code.

## Options considered
1. CC0 glTF packs (Kenney, Quaternius) — good quality, mixed styles, larger download.
2. **Procedural animals built from spheres/cones/tori** with the shared toon material and
   inverted-hull outline — tiny, consistent style, colour is a parameter, accessories
   can be attached at known anchor points.

## Decision
Option 2 for M1–M3 (`src/render/avatars/animals.ts`). Revisit if playtests show the
avatars are not appealing enough; then switch to glTF behind the same `buildAnimal(avatar)`
function.

## Consequences
- Zero asset download for avatars; every new animal is ~20 lines of code.
- 2D lists use emoji stand-ins for now (`src/ui/animalIcons.ts`).
