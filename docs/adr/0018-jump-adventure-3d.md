# ADR-0018: Hüpf-Abenteuer as a 3D side scroller

- **Status:** Proposed
- **Date:** 2026-11-08
- **Deciders:** owner (via Fabian: "the hop game looks a bit dull, just a picture that hops —
  something like Super Mario?"; Fabian: build it, Patrick can still reject the PR), proposal by Fabian

## Context
The Hüpf-Abenteuer (M14c, ADR-0010) was drawn with DOM elements: an emoji in a coloured circle
sliding over emoji logs, stones and mushrooms, gold chests on an emoji cloud. Everything else
in the game is 3D toon (Three.js) with hand-modelled, animated animals (ADR-0014…0017).
Fabian picked the elements: platforms and stairs, blocks bumped from below, friendly
"enemies"; and nothing can be failed (no pits, no lives). The game stays its own mini game
(one look, not per maze world). Constraints: 30 fps floor on mid-range phones, ≤ 100 draw
calls, precache already 4.5 MB of 5 MB (ADR-0017), no new spoken text (audio clips are
generated at build time).

## Options considered
1. **Keep DOM, nicer images** (sprites/SVG) — cheap, but still flat and without the animated
   avatar, outfit and pet.
2. **Three.js side view with the existing animated avatar and toon props built in code** —
   chosen. Same renderer, materials, outlines and animal models as the maze.
3. **Same, but props as Blender models** — nicer detail possible, but every file adds to the
   precache, which is nearly full; simple shapes read well at this size.

Also out: copying Super Mario's look (characters, "?" blocks, pipes). The game takes the
genre's feel with its own designs.

## Decision
Option 2.

- **Logic** stays pure in `core/activities/jump.ts`, extended:
  - **Steps** (staircases up 0.5 → 1.0 → down 0.5, chest on top) are ground solids; walking
    into any solid is a "Hoppla!" and after 0.9 s the avatar climbs **onto** it (before: past
    it). Walking off a step or platform falls down.
  - **Floating platforms** (one-way: land from above, hop through from below) follow about half
    of the logs/stones/mushrooms as an optional high road; the avatar fits underneath.
  - **Leaf blocks** replace the gold chest on a cloud: bump one from below (stand under it and
    hop, no timing) and its chest pops out on top and opens; afterwards it turns wooden.
  - **Crawlers** (snail, ladybird; about 2 in 5 obstacles) patrol their own stretch. Hop on one
    and it tumbles away with a bounce; walk into one and it hides in its shell (Hoppla!) and
    lets the avatar pass. Never a failure.
  - Walking right alone still reaches the flag on every course (unit-tested on many seeds) and
    opens every chest except those in leaf blocks (as before with the high chests).
  - Layout per stage unchanged (Kita 3 chests / 3 obstacles, Vorschule 4/5, school 5/7).
- **View** `render/JumpView.ts`: side view (perspective, 40°), 5.2 units across a portrait
  phone (at least 6 tall on wide screens), avatar at a third of the screen, camera follows and
  looks up on platforms; the child's animated avatar with outfit (walk/idle, squash and
  stretch on jumps and landings, wobble with dizzy stars on a stumble, `Cheer` at the flag),
  the pet follows; props in `render/jump/jumpProps.ts` (toon materials, outlines);
  backdrop of trees, bushes, two hill layers and clouds merged into 7 meshes, parallax from
  perspective; sun shadow follows the camera. Dust puffs on landing, stars on bumps and stomps.
- **Screen** `JumpScreen` keeps HUD, hold-to-walk buttons, keyboard, chest flow, end dialog;
  it no longer re-renders React every frame (the view reads the state directly). Test hooks:
  hidden chest markers `data-chest-index/-x/-high/-state`, `data-avatar-x` on the screen,
  `data-testid=jump-canvas`. A tap on a leaf block speaks the existing hint ("Die Kiste ist
  hoch oben. Stell dich darunter und hüpf!").
- No new speech, no new assets, no change to save data.

## Consequences
- Precache unchanged apart from the JS bundle (props are code, no model files).
- Draw calls: backdrop 7, ground 3, avatar/pet as in the maze, plus the props in view (frustum
  culling); a course segment is 2–25 meshes with outlines.
- Old CSS for the DOM scene removed; `.jump-canvas` added.
- Possible later: the same view for more courses (e.g. an underwater course), moving
  platforms, a Blender pass on the props if the precache allows (open question #3).
