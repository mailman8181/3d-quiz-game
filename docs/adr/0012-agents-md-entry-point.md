# ADR-0012: `AGENTS.md` as the entry point for every contributor's agent

- **Status:** Accepted (owner request, 2026-11-07). Supersedes the "`CLAUDE.md` is the entry
  point" bullet of ADR-0001; the rest of ADR-0001 stays.
- **Date:** 2026-11-07
- **Deciders:** owner / agent

## Context
External contributors are expected. They use different coding agents (Claude Code, Codex,
Cursor, Copilot, Gemini, …). Until now the agent guide lived in `CLAUDE.md`, which only Claude
Code reads automatically, and the step-by-step recipes existed only for activities.

## Options considered
1. **Keep `CLAUDE.md`, tell others to read it.** No change, but other agents don't load it, and
   it reads as tool-specific.
2. **Copy the guide into several tool files** (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules`, …).
   Everyone gets it, but the copies drift apart.
3. **One tool-agnostic `AGENTS.md`** (the convention most agents read) with the full guide;
   `CLAUDE.md` imports it (`@AGENTS.md`) and only adds Claude Code specifics.

## Decision
Option 3.
- `AGENTS.md` holds the project context, rules, commands, code map, recipes and PR process.
- `CLAUDE.md` imports it and stays short.
- Recipes are skills in `.claude/skills/<name>/SKILL.md` (plain Markdown, so any agent can
  follow them): `contribute`, `add-challenge-type`, `add-activity`, `add-speech`.
- Humans start at `CONTRIBUTING.md`, which points to `AGENTS.md`. PRs use
  `.github/pull_request_template.md`.

## Consequences
- Rule or command changes go into `AGENTS.md` (and the matching skill) in the same PR.
- Contributors without Piper cannot add audio clips; the guide tells them to say so in the PR,
  and a maintainer generates the clips.
- PRs from forks get no preview deployment (ADR-0005); the guide asks for screenshots instead.
