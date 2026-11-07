# Contributing

Thanks for helping! This is a learning game for children from Kindergarten to 4. Klasse, so a
few rules matter more than usual. Most work here is done with coding agents; the same guide
applies to people and agents.

- **Read [`AGENTS.md`](AGENTS.md)** — project context, rules, commands, code map, recipes.
  If you use a coding agent, point it there (Claude Code reads it via `CLAUDE.md`).
- **Recipes** for common changes are in [`.claude/skills/`](.claude/skills/) (plain Markdown):
  `contribute`, `add-challenge-type`, `add-activity`, `add-speech`.

## Ways to help
- **Playtests** with real children — the most valuable feedback. Use
  [`docs/playtests/TEMPLATE.md`](docs/playtests/TEMPLATE.md) and open an issue or PR.
- **Content:** wrong, unclear or badly spoken questions; new questions for an existing type.
- **Bugs:** include device/browser and the `?seed=N` from the URL if it happened in a maze.
- **New challenge types, activities or worlds:** open an issue with the idea first. The owner
  decides on game design (`docs/game-design.md`) before code is written.

## The non-negotiables
No ads, no tracking, no network calls at runtime, no time pressure, no losing or punishment,
every instruction spoken in German, child-facing text only in `src/content/de/`. Code, docs and
commits are in English.

## Workflow
```bash
npm ci
npm run dev             # http://localhost:5173
npm run check           # lint + typecheck + unit tests + audio check
CI=1 npm run e2e        # Playwright, desktop + phone (first run: npx playwright install chromium)
```
New spoken sentences need audio clips generated with Piper (see [`docs/audio.md`](docs/audio.md)).
If you can't run it, say so in the PR and a maintainer will add the clips.

Open a pull request against `main` and fill in the template. Visible changes need a phone-width
screenshot; PRs from this repository's branches also get a preview deployment.
