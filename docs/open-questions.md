# Open questions for the owner

Answer inline (or in chat); agents move answers into `game-design.md` / ADRs and delete
the question here. Rounds 1–2 answered on 2026-10-31.

1. **M1 review:** after the first deploy, please try the game on your phone and report
   anything about controls, camera and look before M2 (challenges) starts.

2. **Voice upgrade (M12):** paid TTS service at build time — owner keeps it in mind.

3. **Model compression (ADR-0014):** the cat is 350 KB uncompressed and every model is
   precached. For more animals: model with fewer triangles, or compress (Draco needs a
   decoder in the app, meshopt is lighter)? Which do you prefer?

4. **Rig and animations (ADR-0014):** the cat is static. Should models get a skeleton with
   clips (idle, hop, cheer, head shake) played by an `AnimationMixer`, or should celebrations
   first be done in code for all animals (jump, spin, squash) and rigs come later?

5. **Blender sources (ADR-0014):** should the `.blend` files live in the repo (e.g.
   `assets-src/`, ~2.7 MB for the cat) or stay outside with only the `.glb` committed?

