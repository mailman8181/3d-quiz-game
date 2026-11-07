# ADR-0011: Practice activity "Rätselpfad" — always open, topic choice, longer rounds

- **Status:** Accepted (owner, 2026-11-07)
- **Date:** 2026-11-07
- **Deciders:** owner / agent
- **Amends:** ADR-0010 (adds exceptions; ADR-0010 itself stays valid)

## Context
The owner wants a "learning activity": questions one after another without a game around them,
with the subjects (and topics) chosen before starting. The plan was drafted separately and the
owner accepted its recommendations, except a parents' switch to hide it, which is not built.

ADR-0010 makes every activity a way to find chests, unlocked by playing, with 3–5 chests per
round. A practice activity fits the chest pipeline but not the unlock rule or the round size.

## Decision
1. **It is an activity** (`practice`, shown as **"Rätselpfad"**) and uses `useChestFlow`
   unchanged: the dialog, stars, skill model, star jar, rewards and the break screen.
2. **Always open:** `ActivityDef.alwaysOpen` keeps it out of the random unlock order
   (`progressFor` lists it separately). Its finished rounds still count towards unlocking the
   other games.
3. **Longer rounds:** Kita 5, Vorschule 6, school 8 questions. The questions *are* the activity.
4. **Topic choice:**
   - `SelectionInput.topics?: string[]` (challenge type ids) narrows the selection after the
     parents' and subject filters. The usual fallbacks still apply, so a round is never empty.
   - `ChestFlowOptions.topics` passes it through.
   - The child chooses a subject (or "Alles gemischt"), then optionally one topic. Topics are
     the challenge types that parents allow and that fit the stage.
5. **Child-facing topic names** (`de.practice.topics`: emoji + short name per type) are
   separate from the parents' `challengeNames`. A unit test checks that every type has one.
6. **No parents' switch** to hide it (owner).

## Consequences
- Practice rounds feed the same skill model. With one topic, eight questions in a row move
  that type's level quickly, which is wanted for practice.
- New challenge types need a topic name and icon. The add-activity skill and `CLAUDE.md`
  mention it, and the unit test enforces it.
- No save change: rounds go into `activityRounds.practice` (save v10).
