# Roadmap

**Status:** living document. Principle: ship a playable vertical slice early and test it
with a real child before building breadth.

| Milestone | Goal | Done when |
|---|---|---|
| **M0 Design & architecture** ✅ | Owner approves game-design + architecture + ADRs | done 2026-10-31 |
| **M1 Tech spike** ✅ | Project skeleton, CI + deploy + PR-preview workflows (ADR-0005). Procedural maze rendered in toon style, avatar walks by tap/keys on phone + desktop. Local profiles with animal avatar |  Playable URL on a phone at 30+ fps |
| **M2 Vertical slice** 🧪 ready for playtest | 1 world, 1 maze with 3 stations, 2 math challenge types (Mengen zählen, Plus ≤10), audio, stars, skip with confirmation, rescue animal at goal | **Playtest with a 5–7 year old**; findings written to `docs/playtests/` (see `docs/playtests/README.md`) |
| **M3 Rewards & profile** (PRs: M3a jar+rewards, M3b animals+pets, M3c parents area) | Star jar → choose-1-of-3 rewards, collection album, pets, parent gate + profile management | Progress survives reload |
| **M4 Adaptive difficulty** | Skill model, levels per challenge, bronze/silver/gold chests | Unit-tested skill model; second playtest |
| **M5 Math breadth** | Full v1 math catalogue | — |
| **M6 German challenges** | Word bank (~95 words with pictures; grow towards 150), Anlaut/Silben/Reime/Lesen | — |
| **M7 Polish & PWA** (PR stack 1–7, 2026-11-01: M3a–M7 implemented, awaiting review) | Offline install, parents area stats, performance pass | Lighthouse PWA pass, works offline |

## Next (owner priorities, 2026-11-01)
First playtest: **successful** (owner). Feedback round 1 done (jingles, trails, number hint,
voice → Thorsten high).

| Milestone | Goal | Status |
|---|---|---|
| **M8 Maze levels** | Visible level counter per child; mazes grow with the level | ✅ PR |
| **M9 Underwater world** | Second world with guide Ida, coral maze, sea friends; world selection | ✅ PR |
| **M10 Tree house** | Home base: decorations as rewards, place them, rescued friends live there | ✅ PR |
| **M11 New categories** | a) Olli zeigt den Weg · b) Wissen: Tiernamen, Tierbabys, Farben & Formen, Jahreszeiten & Wetter, Was gehört nicht dazu? · c) child chooses subjects per session within parents' selection | ✅ PRs |
| **M13 Curriculum stages** | Learner stage on the profile, stage + competency tags on challenge levels (ADR-0009); content packs: a) stage model + migration, b) preschool pack, c) grade 1–2 math (KC), d) grade 1–2 German (KC). Research: `docs/curriculum/niedersachsen.md` | a) ✅ · b–d) 🔨 stacked PRs; scope kita – grade 2 |
| **M12 Voice upgrade** | Paid/licensed TTS at build time (e.g. Azure; child voice "Gisela"), letter sounds | parked — owner keeps it in mind |

Further ideas: M13e "Wissen" pack following the KC Sachunterricht (body parts, senses, where animals live, days of the week, sorting rubbish, jobs and tools, …; see `docs/curriculum/niedersachsen.md` §5), "Olli zeigt den Weg" (hint arrow towards the goal in big mazes), word bank → 150 words, parents' progress over time, world map / journey.
