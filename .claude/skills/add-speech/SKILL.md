---
name: add-speech
description: Add or change anything the child hears in the labyrinth game — spoken prompts, explanations, names on cards, guide sentences — and regenerate the committed audio clips. Use whenever German text that is spoken changes, or when `npm run check` reports "sentences have no audio clip".
---

# Add speech

Every instruction must be available as audio (AGENTS.md rule 5). The game never calls a TTS
service at runtime: all sentences are **pre-generated MP3 clips** committed in
`public/audio/de/` (ADR-0003, ADR-0007). Background: `docs/audio.md`.

## 1. Write the sentence
All spoken German lives in `src/content/de/speech.ts`:
- **Templates** (`speechTemplates`): a key (e.g. `math.rounding.prompt`) with
  `render(params) → string` **and** `variants() → params[]` listing every combination the game
  can produce. A combination missing from `variants` has no clip (the browser voice is only a
  fallback).
- **Fixed sentences** on screens and names spoken by 🔊 buttons: add them to
  `staticSpokenTexts` (usually by spreading a content list, e.g. `...JOBS.map((j) => j.name)`).
- UI text that is *shown* lives in `src/content/de/strings.ts`; if it is also spoken, reference
  it from `staticSpokenTexts` so both stay identical.

Style: short sentences, friendly, simple words, the child is addressed with "du". Write numbers
as digits only where the voice reads them correctly; check odd words by listening (spoken
syllables can differ from written hyphenation — see `SPOKEN_SYLLABLES`). Keep the number of
variants finite: no big random numbers in spoken sentences.

## 2. Generate the clips
One-time setup (Python venv with `piper-tts`, the Thorsten high voice, `ffmpeg`): see
`docs/audio.md`. Then:
```bash
PIPER_PYTHON=~/piper-venv/bin/python PIPER_MODEL=~/piper-voices/de_DE-thorsten-high.onnx npm run audio:generate
```
Only missing clips are synthesised and unused ones deleted. Never change the voice,
speaker or `LENGTH_SCALE` without the owner — that regenerates every clip.

## 3. Verify and commit
- `npm run check` ends with `Audio OK: N clips`. Commit `public/audio/de/` (clips + manifest)
  in the same commit as the text change.
- Listen to a few new clips (pronunciation of names, numbers, umlauts).
- **Cannot run Piper** (e.g. no Python, no network to Hugging Face)? Commit the text change
  anyway, say so in the PR description, and a maintainer adds the clips. CI's audio check will
  be red until then.
