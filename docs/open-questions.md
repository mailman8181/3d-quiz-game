# Open questions for the owner

Answer inline (or in chat); agents move answers into `game-design.md` / ADRs and delete
the question here. Rounds 1–2 answered on 2026-10-31.

1. **M1 review:** after the first deploy, please try the game on your phone and report
   anything about controls, camera and look before M2 (challenges) starts.

2. **Voice upgrade (M12):** paid TTS service at build time — owner keeps it in mind.

3. **Model compression (ADR-0014):** every model is precached. With the ten lost friends
   (ADR-0017) there are 15 animated models, ~2.9 MB together (120–270 KB each, skin weights
   already packed as bytes), precache 4.5 MB of the 5 MB budget. Before adding more models:
   compress (Draco needs a decoder in the app, meshopt is lighter), or load the sea friends
   only when the underwater world opens? Which do you prefer?

5. **Blender sources (ADR-0014):** should the `.blend` files live in the repo (e.g.
   `assets-src/`; ~2.7 MB for the static and ~3.6 MB for the animated cat, the other four
   animals and the ten lost friends share one file with their build scripts, see ADR-0016/0017) or stay outside with only
   the `.glb` committed? A middle way: commit only the Blender build scripts (~20 KB Python).

(#4 rig and animations: answered 2026-11-07, owner wants to try an animated cat first, no
animated scenes yet → ADR-0015.)

