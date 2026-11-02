# Game Design Document

**Status:** APPROVED v1.0 (owner, 2026-10-31). Changes require owner sign-off; record them
in the changelog at the end. Items marked **[Q]** are open (see `open-questions.md`).

## 1. Vision
Children (5–7, Vorschule to 2. Klasse) explore small, colourful 3D comic-style mazes with
their own avatar to **rescue lost animal friends**. Along the way they find treasure
chests with challenges. Solving them earns stars; stars fill a star jar that turns into
collectible rewards. The child should feel like an *explorer*, not a *test-taker*.

## 2. Target audience — and what that implies
Both pre-readers (5) and early readers (6–7) are supported. Baseline assumption for v1:
a 5-year-old recognises some digits and can do very easy addition.

| Fact about 5–7 year olds | Design consequence |
|---|---|
| Many cannot read yet or read slowly | Every instruction is **spoken** (German) **and** shown as text. "Vorlesen" is on by default. Answers are tapped (numbers, pictures), never typed. |
| Fine motor skills still developing | Big touch targets (≥ 64 px), no precision dragging, no double-tap. |
| Limited 3D spatial orientation; first-person can cause motion sickness | **Third-person camera from above at an angle** (diorama look). **Tap-to-walk** as main control. |
| Short attention span (~10–15 min) | Mazes take 1–3 min to cross; a session = a few mazes. |
| Frustration ends play | No lives, no timers, no game-over. Wrong answer → hint, try again. |
| Abstract points mean little | Stars are visualised as a **star jar with 10 slots** (counting to 10 is itself practice) that converts into concrete rewards. |
| Big spread in ability | **Adaptive difficulty per skill**, plus child-chosen chest tier. |

## 3. Story & world (v1)
- **Scenario v1: "Tierfreunde retten"** — animal friends got lost in the maze garden.
  Each maze has one lost animal at the goal. Reaching it rescues the animal.
- Guide characters speak all instructions and cheer. Approved names: **Olli** (Eule,
  guide of world 1), **Ida** (Igel) and **Rick** (Waschbär / raccoon) for later worlds.
  Do not use the name "Fini".
- v1 has **one world** (Zauberwald / garden hedge maze). Further worlds with their own
  scenarios (Unterwasser, Weltraum, …) come later via the world-module extension point.

## 4. Core loop
```
start maze → walk → find chest (optional) → solve or skip → stars into jar
     ↑                                                        ↓
 new maze  ←  rescue animal at goal  ←  jar full (10★) → pick 1 of 3 rewards
```
- Each maze has **3–5 chests** and a goal. **The goal is always reachable** — challenges
  never block the path.
- **Skipping:** a child may walk past a chest or close it. If a challenge is open, an
  "Überspringen" button asks for **confirmation** (big ✓ / ✗ icons, spoken question
  "Möchtest du diese Aufgabe wirklich überspringen?"). A skipped chest stays closed and can
  be retried while in the maze.

## 4a. Avatar & profiles
- The child plays a **comic animal**: Hase, Bär, Katze, Frosch, Pinguin (more later),
  in one of 6 colours. Rewards (hats, pets, trails) are added on top of the animal.
- **Local profiles from the start:** up to 6 children per device. Profile screen
  "Wer spielt?" shows each child's animal; the name is optional and typed by a parent.
  Deleting profiles will live in the parents area (behind the parent gate).
- **Kindergarten oder Schule?** After creating a profile (and once for profiles from before
  this feature) a grown-up picks Kindergarten / Vorschule / 1.–4. Klasse on big picture tiles
  (spoken question, "Später" skips). The stage moves up every 1 August (Kindergarten stays
  until a parent switches to Vorschule) and can be changed in the parents area. It decides
  which challenge types and levels a child meets (§6.1, ADR-0009).

## 5. Controls
- **Mobile:** tap on the floor → avatar walks towards it, but only a **short, direct way**
  (max. 6 tiles, never around a hedge). Tapping the chick far away must not solve the
  maze; the child finds the route by tapping step by step.
- **Desktop:** arrow keys / WASD + click-to-walk.
- Camera follows automatically; no manual camera control required.

## 6. Challenges
### 6.1 Concept
A *challenge type* is a self-contained module: subject, trained skills, how to
**generate** an instance for a difficulty level, how to **present** it, how to **check**
it. New types are added without touching maze code.

Difficulty: each type has levels 1..N. A per-child **skill model** recommends the level
(e.g. 2 correct in a row → up, 2 wrong → down).

Every level is tagged with the **stages it is meant for** and the **Niedersachsen curriculum
competencies** it trains (`docs/curriculum/niedersachsen.md`). A child only meets types whose
first level fits their stage (no reading tasks in Kindergarten) and that they have not
outgrown; they start at the level meant for their stage and can climb one stage higher.
Without a stage, all levels are open and play starts at level 1.

### 6.2 Chest tiers
Chests come in **bronze / silver / gold** (visible from afar). The child chooses which to
open. Tier = offset from the child's current recommended level (bronze −1, silver ±0,
gold +1) and stars awarded (1 / 2 / 3).

### 6.3 v1 catalogue: math only
German challenges (Anlaut, Silben, Reime, …) follow after v1; the architecture keeps
them in mind (word bank, see architecture.md).

| Type | Example | Levels |
|---|---|---|
| Mengen zählen | "Wie viele Äpfel siehst du?" → tap a number | 1–5 / 1–10 / 1–20 |
| Zahl hören & finden | "Tippe auf die Sieben" | 1–10 / 1–20 / 1–100 |
| Mengen vergleichen | "Wo sind mehr Sterne?" | range, closeness of numbers |
| Plus | "3 + 2 = ?" with pictures → without | ≤5, ≤10, ≤20 (no carry), ≤20 (carry) |
| Minus | "5 − 2 = ?" with pictures → without | same as Plus |
| Muster fortsetzen | 🔴🔵🔴🔵 ? | pattern length/complexity |

All fully auto-generated with a seeded RNG.

### 6.4 Wrong answers
1st wrong → gentle audio ("Versuch es nochmal!"), wrong option fades out.
2nd wrong → visual hint (e.g. counting animation).
3rd wrong → solution is shown and explained; **1 star** for effort regardless of tier.
All outcomes feed the skill model.

### 6.5 Curriculum packs (M13, ADR-0009)
Content is aligned with the Niedersachsen frameworks (`docs/curriculum/niedersachsen.md`).
Stages in brackets are where a type starts. Everything is spoken; preschool tasks need no
reading.

**Preschool pack (M13b)**

| Type | Example | Stages |
|---|---|---|
| Würfelbilder | dice face → "Wie viele Punkte?"; two dice; ten-frames to 20 | Kita → 2. Kl. |
| Nachbarzahlen | "Welche Zahl kommt nach 4?" / "vor …" (to 10, 20, 100) | Vorschule → 2. Kl. |
| Oben, unten, neben | "Tippe auf das Bild: Der Ball ist unter der Kiste." (auf/unter/neben/zwischen) | Kita → 1. Kl. |
| Groß und klein | "Tippe auf den größten Baum!" / "die kleinste Blume" (3, then 4 sizes) | Kita → 1. Kl. |
| Anfänge hören | "Was fängt genauso an wie Mond?" (pictures, no letters) | Vorschule → 1. Kl. |
| Silben zusammensetzen | "Hör gut zu: Ba, na, ne. Welches Bild ist das?" | Kita → 1. Kl. |
| Gegenteile | "Was ist das Gegenteil von heiß?" | Kita → 2. Kl. |
| Wo lebt das Tier? | fox → Wald / Meer / Bauernhof … | Kita → 2. Kl. |
| Körper und Sinne | "Tippe auf die Nase!" → "Womit hörst du?" | Kita → 2. Kl. |
| Was kommt zuerst? | Ei, Küken, Huhn: zuerst / zuletzt / in der Mitte | Kita → 2. Kl. |

**Grade 1–2 math pack (M13c)** (KC Mathematik, Ende Jg. 2)

| Type | Example | Stages |
|---|---|---|
| Plus / Minus (levels 6–8) | 34 + 5, 34 + 20, 37 + 5 · 37 − 5, 57 − 20, 42 − 5 (up to 100) | 2. Kl. |
| Zahlenhaus | roof 7, rooms 3 and ? · bonds of 10 · 100 = 30 + ? | Vorschule → 2. Kl. |
| Verdoppeln und Halbieren | "Was ist das Doppelte von 4?" with mirror dots → up to 100 | 1. → 2. Kl. |
| Zehner und Einer | tens sticks + cubes → "Welche Zahl ist das?" · "Wie viele Zehner hat 47?" | 1. → 2. Kl. |
| Gerade und ungerade | "Tippe auf die gerade Zahl!" (dot pairs first) | 1. → 2. Kl. |
| Einmaleins | Kernaufgaben ×1, ×2, ×5, ×10 and squares, "3 Fünfer" as pictures | 2. Kl. |
| Geld | coins and notes → "Wie viel Geld ist das?" (€, then ct) | 1. → 2. Kl. |
| Uhrzeit | analogue clock → "3 Uhr" / "halb 4" / "Viertel nach 3" (cards with 🔊) | 1. → 2. Kl. |
| Spiegelbild | which right half makes the picture symmetric? | 1. → 2. Kl. |
| Sicher, möglich, unmöglich | bag of balls → "dass sie grün ist?" | 1. → 2. Kl. |

**Grade 1–2 German pack (M13d)** (KC Deutsch, Ende Jg. 2). Reading is part of these tasks; every
instruction is spoken.

| Type | Example | Stages |
|---|---|---|
| Der, die, das | ☕ "Tasse" → der / die / das | 1. → 2. Kl. |
| Einzahl und Mehrzahl | 🌹🌹🌹 "die Rose – die …" → Rosen / Roses / Roser (typical child mistakes) | 1. → 2. Kl. |
| Wortarten | "Welches Wort ist ein Verb, ein Tunwort?" Nase / rufen / süß | 1. → 2. Kl. |
| Fehlende Buchstaben | 🐭 "M▢▢s" → au / ei / ie · sch / ch / ck / ng / nk / pf | 1. → 2. Kl. |
| Rätsel lesen | "Ich bin gelb und krumm. Affen essen mich gern." → 🍌 | 1. → 2. Kl. |
| Lückensätze | "Der Fisch ___ im Wasser." → schwimmt / läuft / singt | 1. → 2. Kl. |
| Satzzeichen | "Wir spielen im Garten ▢" → . ? ! | 1. → 2. Kl. |
| Das ABC | "Welcher Buchstabe kommt nach P?" · which word comes first? | 1. → 2. Kl. |
| Wörter zusammensetzen | 🔥 + 🛡️ "Feuer + Wehr" → 🚒 | 1. → 2. Kl. |

Plus/Minus above 20 is spoken generically ("Rechne aus! Wie viel ist das?" / "Das Ergebnis ist 39.")
with the equation on screen: one clip per sentence (ADR-0007) would need thousands of clips for every
pair up to 100. Reading two-digit numbers is itself a grade-2 goal.

Single-sound tasks (Lautsynthese "M-au-s", final sounds) wait for a voice that can speak
isolated sounds (M12).

## 7. Rewards & progression
- **Stars:** bronze 1 · silver 2 · gold 3 (solved with ≤ 1 wrong try), otherwise 1.
  Skipped = 0.
- **Star jar:** 10 stars → jar full → **reward moment**: the child **chooses 1 of 3**
  offered items. Leftover stars carry over. (Choice instead of random "loot box" → no
  gambling mechanics, more ownership.)
- **Reward categories** (variety keeps collecting interesting):
  1. Avatar items: hats, glasses, capes, shoes, colours.
  2. **Rescued animals** (from maze goals, not from the jar) — choose one as a pet that
     follows the avatar.
  3. Trails/effects (sparkles, footprints) — cheap to make, popular with kids.
  4. Later: home base decoration.
- **Collection album:** shows all collectibles, unfound ones as silhouettes → clear
  "what's next" goal, motivates completion.
- No streaks, no rankings, no time-limited offers.
- Later worlds unlock by number of rescued animals.

## 8. Parents area
- Parent gate (e.g. "Tippe die Zahl dreiundvierzig").
- Per child: Kindergarten / Klasse (stage), practised skills, success rates, enable/disable
  challenge types (each shows its suggested stages, e.g. "Vorschule – 1. Klasse"),
  "Vorlesen" on/off, optional session time limit.
- Manage child profiles (rename, delete).

## 9. Non-functional
- German only (UI and audio). Code in English.
- Mobile + desktop browsers; installable PWA; works offline.
- No accounts, no server, no tracking; progress stored persistently on the device
  (IndexedDB — note: browser *sessionStorage* would be lost when the tab closes, so it is
  not used for progress).
- Hosted on GitHub Pages, with a preview deployment per pull request (ADR-0005).
- Smooth on mid-range phones (2020-era Android, iPhone 11+).

## 10. Out of scope for v1
German challenges (planned next), more worlds/scenarios, multiplayer, teacher mode,
cloud sync, other languages, speech-recognition answers.

## Changelog
- v1.23 (2026-11-01): M13d — grade 1–2 German pack: 9 new types (§6.5); word bank gets genders and plurals.
- v1.22 (2026-11-01): M13c — grade 1–2 math pack: 9 new types and Plus/Minus up to 100 (§6.5).
- v1.21 (2026-11-01): M13b — preschool pack, 10 new challenge types (§6.5), picture- and sound-based, tagged for Kita/Vorschule (ADR-0009).
- v1.20 (2026-11-01): M13a (owner-approved ADR-0009) — learner stage per profile (Kindergarten, Vorschule, 1.–4. Klasse), asked once by a grown-up and editable in the parents area; challenge levels carry stage ranges and curriculum competencies; chests only offer types and levels that fit the stage.
- v1.19 (2026-11-01): M11c — the child chooses today's subjects on the hub ("Heute spiele ich: 🔢 Mathe · 🔤 Deutsch · 🐾 Wissen"), within what parents allow (subjects with all types switched off are not offered); at least one stays on; the choice lasts for the session and resets when switching profiles. Chests only contain the chosen subjects.
- v1.18 (2026-11-01): M11b new subject "Wissen" with 5 challenge types: Tiere benennen (picture → name, 2–4 names, each with 🔊), Tierbabys ("Wie heißt das Baby vom Schaf?"), Farben und Formen ("Tippe auf Rot!" → "Tippe auf den blauen Kreis!"), Jahreszeiten und Wetter ("Wann fällt Schnee?" → "Was brauchst du, wenn es regnet?"), Was gehört nicht dazu? (3–4 of a kind + 1; level 2 uses close categories like Obst/Gemüse). Parents can switch them per child like the other types.
- v1.17 (2026-11-01): M11a "Olli zeigt den Weg" — round guide button bottom right: the next 6 tiles of the shortest way glow orange one after another for ~4 s, the guide says "Schau mal, hier entlang!"; 15 s cool-down ("Gleich kann ich dir wieder helfen.").
- v1.16 (2026-11-01): M10 tree house "Mein Baumhaus": 10 decorations (Laterne, Pflanze, Bild, Teddy, Luftballons, Bücher, Fernrohr, Wimpel, Globus, Gitarre) come from the star jar like clothes; new ones are placed automatically; 6 spots on the platform (tap → choose / put away); rescued friends hop around, the avatar stands in the middle. After choosing a profile the child always lands on the hub (worlds incl. locked ones + tree house); the home button in a maze returns to the hub.
- v1.15 (2026-11-01): M9 underwater world "Unterwasserwelt" with guide Ida (🦔): unlocked after 3 forest mazes, coral maze in varied colours on sand, blue water haze, rising bubbles, swaying seaweed. Six sea friends (Schildkröte, Oktopus, Krabbe, Kugelfisch, Walbaby, Clownfisch) with correct German grammar. World picker after choosing a profile once a second world is open; levels count per world; skills carry over. Goal dialog announces a newly unlocked world.
- v1.14 (2026-11-01): M8 maze levels — level per child and world = finished mazes + 1. Level 1 is 4×4 cells, +1 row/column per level up to 9×9 (level 11); 3 chests, 4 from level 5, 5 from level 8. Level badge on the guide bubble and on the profile card; goal shows "Level N geschafft!" with a fanfare and "Weiter zu Level N+1".
- v1.13 (2026-11-01): voice switched to Piper "Thorsten high" (clearer German; the cheerful emotional voice mispronounced words). A paid TTS (child voice) stays an option (roadmap M12). Playtest successful; next: maze levels, underwater world, tree house.
- v1.12 (2026-11-01, owner feedback): correct answers play a random cheerful jingle + confetti and show a random praise word (Toll!, Spitze!, …) instead of the spoken "Super gemacht!"; soft bloop on wrong answers, fanfare for a full star jar, pling for chests; parents can switch sounds off. Heart/sparkle trails larger, camera-facing, with white border. Number hint: one row of ten dots (5+5) per ten, ones in the last row.
- v1.11 (2026-11-01): M7 — installable PWA, offline after the first visit (voice clips cached when played or via "Stimme für offline speichern"); optional play-time limit (15/20/30/45 min) set by parents: a friendly break screen appears after the current challenge, parents can end the break in the parents area.
- v1.10 (2026-11-01): M6 — German challenges from a word bank of ~95 words with emoji pictures: Anlaute hören (picture + spoken word → tap the first letter; level 1 contrasts consonant/vowel, levels 2–3 add similar sounds like M/N, B/P), Silben klatschen (1–2 → 1–4 syllables; hint splits with claps), Reime finden (tap the rhyming picture, each picture has a 🔊; hint shows the words), Wörter lesen (word in capitals → tap the picture; level 3 normal spelling). Parents can switch individual challenge types off per child (e.g. reading for pre-readers).
- v1.9 (2026-11-01): M5 — full v1 math catalogue: Zahl hören & finden (1–10 / 1–20 / 10–100 with digit-twin distractors, e.g. 47 vs 74; the shown text never reveals the number), Mengen vergleichen (tap the bigger group; level 3 digits only), Minus (pictures crossed out → ≤ 20 with borrowing), Muster fortsetzen (AB → ABC/AAB → AABB/ABCD). Chests draw from all six types.
- v1.8 (2026-11-01): M4 — adaptive difficulty per challenge type: 2 clean solves in a row (≤ 1 wrong try) at/above the child's level → level up; 2 struggles (hint or solution needed) at/below → level down; skips only count in statistics. Each maze has one bronze (level −1, 1★), one silver (level, 2★) and one gold chest (level +1, 3★); the child chooses which to open. Start levels: Zählen 2 (1–10), Plus 1 (≤ 5). Parents area shows the level per type.
- v1.7 (2026-11-01): M3c — parents area behind a gate (type a number given as a word, e.g. "dreiundvierzig"): rename/delete profiles, stats per child, "Aufgaben vorlesen" on/off, save export/import (JSON file). Parents area is not spoken (adults read). Session time limit postponed.
- v1.6 (2026-11-01): M3b — six lost friends rescued in order (Küken, Ferkel, Welpe, Lamm, Häschen, Kätzchen; afterwards random). Rescued friends appear in "Meine Tierfreunde" (wardrobe) and one can follow the avatar as a pet; a new friend becomes the pet automatically if none is chosen.
- v1.5 (2026-11-01): M3a implemented — star jar in the HUD (10 slots, tap = "Noch N Sterne"), pick 1 of 3 items from different slots, 18 items (6 hats, 4 glasses, 4 neck items, 4 trails), wardrobe (🎒) with silhouettes for unfound items. Existing stars from older saves are converted into jar + rewards.
- v1.4 (2026-10-31): guide voice = cheerful "Thorsten emotional (amused)", lively speaking rate (owner choice after voice samples).
- v1.3 (2026-10-31): M2 chests use one tier (2 stars) and fixed levels (Zählen 1–10, Plus ≤ 10 mit Bildern) until adaptive difficulty (M4); answer buttons are sorted ascending.
- v1.2 (2026-10-31): tap-to-walk limited to short, direct walks (owner feedback after M1).
- v1.1 (2026-10-31): Rick is a raccoon (Waschbär).
- v1.0 (2026-10-31): approved. Guide names Olli/Ida/Rick, animal avatars, local profiles
  from the start, pick-1-of-3 rewards confirmed.
