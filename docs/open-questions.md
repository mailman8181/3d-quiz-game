# Open questions for the owner

Answer inline (or in chat); agents move answers into `game-design.md` / ADRs and delete
the question here. Rounds 1–2 answered on 2026-10-31.

1. **M1 review:** after the first deploy, please try the game on your phone and report
   anything about controls, camera and look before M2 (challenges) starts.

2. **Voice upgrade (M12):** paid TTS service at build time — owner keeps it in mind.

3. **Model compression (ADR-0014):** every model is precached. The animated cat is 292 KB
   uncompressed after halving its triangles (ADR-0015). For more animals: keep modelling
   lean like this, or also compress (Draco needs a decoder in the app, meshopt is lighter)?
   Which do you prefer?

5. **Blender sources (ADR-0014):** should the `.blend` files live in the repo (e.g.
   `assets-src/`, ~2.7 MB for the static and ~3.6 MB for the animated cat) or stay outside with
   only the `.glb` committed?

(#4 rig and animations: answered 2026-11-07, owner wants to try an animated cat first, no
animated scenes yet → ADR-0015.)

