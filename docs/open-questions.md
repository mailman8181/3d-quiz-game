# Open questions for the owner

Answer inline (or in chat); agents move answers into `game-design.md` / ADRs and delete
the question here. Rounds 1–2 answered on 2026-10-31.

1. **M1 review:** after the first deploy, please try the game on your phone and report
   anything about controls, camera and look before M2 (challenges) starts.

2. **Voice upgrade (M12):** paid TTS service at build time — owner keeps it in mind.

3. **Model compression (ADR-0014):** every model is precached. All five animated animals
   together are ~1.15 MB uncompressed (190–290 KB each, ADR-0016), precache 2.7 MB in total.
   Keep modelling lean like this, or also compress (Draco needs a decoder in the app,
   meshopt is lighter)? Which do you prefer?

5. **Blender sources (ADR-0014):** should the `.blend` files live in the repo (e.g.
   `assets-src/`; ~2.7 MB for the static and ~3.6 MB for the animated cat, the other four
   animals share one file with their build script, see ADR-0016) or stay outside with only
   the `.glb` committed? A middle way: commit only the Blender build scripts (~20 KB Python).

(#4 rig and animations: answered 2026-11-07, owner wants to try an animated cat first, no
animated scenes yet → ADR-0015.)

