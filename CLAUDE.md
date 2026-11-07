# Guide for AI agents

The full, tool-agnostic guide is **[`AGENTS.md`](AGENTS.md)** — read it first, every session.
It is imported here so Claude Code always has it in context:

@AGENTS.md

## Claude Code specifics
- Project skills in `.claude/skills/` are loaded automatically (`contribute`,
  `add-challenge-type`, `add-activity`, `add-speech`); invoke the matching one before the task.
- Keep this file short: project rules and context belong in `AGENTS.md`, so every contributor's
  agent sees the same thing.
