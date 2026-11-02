# Curriculum research: Niedersachsen (Lower Saxony)

**Status:** research notes. Versions 2–3 (2026-11-01) were **verified against the primary ministry
PDFs** downloaded from `www.mk.niedersachsen.de` and `cuvo.nibis.de` (Sachunterricht added in version 3). This document feeds ADR-0009 and the content
roadmap (M13).

## 0. Primary sources (all read in full or in the relevant chapters)

Local copies are kept, together with their original URLs, in [`sources/`](sources/README.md):
the PDFs plus extracted text for diffing. Refresh them with
`npm run curriculum:sources -- --fetch`.

| Short name | Document | Status of the document |
|---|---|---|
| **Einschulung** | [Informationsblatt zur Flexibilisierung des Einschulungstermins](https://www.mk.niedersachsen.de/download/128260/Informationsblatt_zum_Einschulungstermin.pdf) | in force |
| **OP** | [Orientierungsplan für Bildung und Erziehung im Elementarbereich, Gesamtausgabe 2023](https://www.mk.niedersachsen.de/download/4491/Orientierungsplan_fuer_Bildung_und_Erziehung_-_Gesamtausgabe_aktualisiert_2023.pdf) | in force (Kita) |
| **KC Ma 2017** | [Kerncurriculum Grundschule Mathematik (2017)](https://www.mk.niedersachsen.de/download/120954/Kerncurriculum_Mathematik.pdf) | in force |
| **KC Ma 2024** | [KC Mathematik für die Grundschule, *Anhörfassung* 24.10.2024](https://www.mk.niedersachsen.de/download/211766/KC_Mathematik_fuer_die_Grundschule.pdf) | draft; shows where things are heading |
| **KC De 2017** | [Kerncurriculum Grundschule Deutsch (2017)](https://www.mk.niedersachsen.de/download/120953/Kerncurriculum_Deutsch.pdf) | in force |
| **KC De 2024** | [KC Deutsch für die Grundschule, *Arbeitsfassung* 21.05.2024](https://www.mk.niedersachsen.de/download/207512/Kerncurriculum_Deutsch_fuer_die_Grundschule.pdf) | draft |
| **KC SU 2017** | [Kerncurriculum Grundschule Sachunterricht (2017)](https://cuvo.nibis.de/index.php?p=download&upload=105), from the ministry's database [cuvo.nibis.de](https://cuvo.nibis.de/) | in force since 01.08.2017 (listed in [SVBl. 10/2023](https://www.mk.niedersachsen.de/download/199813/Schulverwaltungsblatt_10_2023_-_Amtlicher_Teil.pdf)) |


**Design rule derived from this:** we align with the KC versions **in force (2017)**. Where the
2024 drafts are more concrete, for example the "Kernaufgaben" lists, we use them for
sequencing. Both drafts agree with the 2017 goals on everything we build.

## 1. Stages and the school-entry rule (Einschulung, verified)

- Compulsory schooling starts in the school year in which a child turns **6 by
  30 September**.
- Children who turn 6 between **1 July and 30 September** may have school entry **deferred by
  one year**. The parents decide and do not have to give a reason.
- **"Kann-Kinder"** (turning 6 after 30 September) may start early.
- The school year starts on 1 August. The KC states its goals **per double year: end of Jg. 2
  and end of Jg. 4** (KC Ma and KC De, all tables). There are no separate goals for Jg. 1 or
  Jg. 3.

→ **Age does not determine the school year.** For a child born in August, the parents choose.
Early starters and repeaters make the mapping fuzzier still.

| Stage id | German label | Typical age | Framework |
|---|---|---|---|
| `kita` | Kindergarten | 3–5 | OP |
| `preschool` | Vorschulkind (last year before school) | 5–6 | OP + KC De 2024 annex A2 ("Vorschulischer Bereich und Anfangsunterricht") |
| `grade1`, `grade2` | 1. / 2. Klasse | 6–8 | KC goals for the "end of Jg. 2" |
| `grade3`, `grade4` | 3. / 4. Klasse | 8–10 | KC goals for the "end of Jg. 4" (out of scope for v1) |

## 2. Preschool

### 2.1 Mathematisches Grundverständnis (OP, chapter 6, verified)
The OP explicitly says it does **not** matter that children learn to count quickly. What
matters is that they:
- **capture and compare quantities** ("Mengen zu erfassen und zu vergleichen")
- recognise and name **spatial relations** ("Raum-Lage-Beziehungen")
- learn the words for them: *mehr – weniger, oben – unten, groß – klein, hoch, höchster
  Punkt, Ecke – Mitte*
- have fundamental hands-on experiences: **adding, taking away, sharing out and distributing**
  ("Hinzufügen oder Hinwegnehmen, das Aufteilen oder Verteilen")
- **sort, classify, quantify, order, compare and measure**
- explore **solids** (Würfel, Quader, Kugel) and **flat shapes** (Quadrat, Rechteck, Dreieck)
- meet **time** through their own life: "wie alt bin ich, was mache ich heute, was habe ich
  gestern erlebt". Days of the week and months are introduced gradually.
- **build up counting** through games and counting rhymes, and tell number symbols apart from
  letters

### 2.2 Phonologische Bewusstheit (KC De 2024, annex A2, verified)
Annex A2 lists the competences of the *"Vorschulischer Bereich und Anfangsunterricht"*:

| Competence (KC wording) | Suggested exercises in the KC | Game task |
|---|---|---|
| hear and compare **initial and final sounds** (An- und Endlaute), analyse inner sounds (→ Lautanalyse) | Anlautbilder ordnen, Wörter zu Anlauten finden | **"Welches Bild beginnt mit /m/?"** (by sound, no letters); final sound |
| recognise and tell apart sounds and sound combinations (→ Lautdifferenzierung) | Geräuschspiele | "Hörst du /sch/ in Schuh?" |
| recognise and say the complete sound sequence in a phonetically regular word (→ Wortdurchgliederung) | Lautbilder | count the sounds; where is the /a/ (beginning, middle or end)? |
| **recognise and master rhymes** (→ Reimschema) | Reim-Memory, Reimwörter finden | exists: `german.rhyme` |
| **split words into syllables** (→ Silbengliederung) | Silben klatschen, Silbenbögen | exists: `german.syllables` |
| **build words from syllables** (→ Synthese) | Wörter mit Bildern verknüpfen | "Ba – na – ne": which picture? |
| **blend sounds into a word** (→ Lautsynthese) | Lautieren | "M – au – s": which picture? |
| match a sound to a letter (→ Laut-Buchstaben-Zuordnung) | Anlauttabelle | exists: `german.initial-sound` (letters, late preschool → grade 1) |
| visual skills: Figur-Grund, Raumlage (b/d, u/n), Formkonstanz, visual differentiation, **Serialität: continue patterns** | Muster fortsetzen, Fehlerbilder | find the differences; mirrored or not; patterns (exists) |
| auditory memory | Reime auswendig | "Was hast du gehört?" sequence |

The OP (chapter 4, Sprache und Sprechen) adds **Literacy**: rhymes, songs, picture books, and
understanding that letters and signs "mean" something. Vocabulary is also part of it, both
active and passive.

## 3. Grundschule Mathematik: end of Jg. 2 (KC Ma 2017, verified; 2024 draft additions marked ⁺)

| Area | Competences (condensed KC wording) | Game tasks |
|---|---|---|
| **Zahlen und Operationen** | say, read and write numbers up to **100**; number aspects; place value ("Bündeln", tens and ones; ⁺"Stufenschrift 46 → 4Z 6E"); structured representations (⁺quick grasp of structured quantities up to 100, "quasi-simultan"); flexible counting (forwards, backwards, from any start, in steps); ordering and comparing (**smaller or greater, predecessor and successor, neighbouring tens**); **decomposing numbers** (⁺part–whole); **half and double**; number sequences; ⁺**even and odd** | find a number up to 100, neighbouring numbers and tens, Zahlenhaus, tens and ones, doubling and halving, sequences, even or odd, dot fields |
| Operationen | match situations to + and − (adding, combining, taking away, making up to a total) and to × and ÷ (repeated adding, sharing out, distributing); commutative law ("Tauschaufgabe") | picture stories → which sum? Groups of equal size ("3 Vierer") |
| **Rechnen** | **number bonds up to 10 by heart**; ⁺**Kernaufgaben 1+1**: adding 0, 1, 5 or 10, doubles, bonds of 10; all 1+1 facts up to 20; **Kernaufgaben 1×1** (⁺factors 1, 2, 5, 10 and squares); + and − up to 100 mentally or with written steps; inverse operation; spotting arithmetic mistakes | Kernaufgaben drills (± up to 20, × with 2, 5, 10), ± up to 100, "Rechenfehler finden" (find the wrong one) |
| Sachrechnen | number stories, word problems with pictures ("Bildsachaufgaben"); simple combinatorics | picture stories |
| **Raum und Form** | position: *links/rechts von mir, vor, hinter, neben, über, unter, zwischen*; solids: **cube, cuboid, sphere, cylinder** (sorted by properties: rolls, tips over); flat shapes: **rectangle, square, triangle, circle**; continue geometric patterns; **line symmetry** (mirror; recognising symmetrical figures); simple strip patterns | position, shapes and solids, "is it symmetrical?", complete the mirror image |
| **Größen und Messen** | compare and order lengths and time spans; **money: count, show, exchange and compare amounts (€, ct)**; **clock: read and set times digitally and analogue (full hour, half past, quarter past, quarter to)**; units € ct, cm m, minute … year; 1 h = 60 min, 1 € = 100 ct, 1 m = 100 cm; "je mehr, desto mehr" (more items, higher price) | how much money?, read the clock (sequence: full hour → half past → quarter hours), longer or shorter |
| **Daten und Zufall** | tally charts, timetables; first conclusions; probability: **certain, possible, impossible** | read a tally chart; "sicher, möglich, unmöglich?" |

End of Jg. 4 (later): numbers up to 1,000,000; written addition, subtraction and
multiplication; written division with a one-digit divisor (KC Ma 2017, still listed); the
full 1×1; units mm…km, g…t, ml…l; plans and grids; area and perimeter.

## 4. Grundschule Deutsch: end of Jg. 2 (KC De 2017, verified)

The KC De 2017 has four Kompetenzbereiche. The 2024 draft has **five**: Sprechen und Zuhören;
Schreiben; Lesen; Sich mit Texten und anderen Medien auseinandersetzen; Sprache und
Sprachgebrauch untersuchen.

| Area | Competences (condensed KC wording) | Game tasks |
|---|---|---|
| **Lesen – Lesefertigkeiten** | names **all letter–sound correspondences**; grasps **syllables, frequent morphemes and familiar words at a glance** ("Sichtwortschatz"); applies **blending** ("Syntheseprinzip"), starting with simple syllables (mo, ma); reads words, sentences and short texts increasingly fluently; links information **at sentence level** | letter ↔ sound, syllable reading, "Blitzlesen" of frequent words, read a word → picture (exists), **read a sentence → picture**, true or false |
| Lesen – Texte | fairy tales and poems; reads simple task instructions; takes information from simple tables (day plan, calendar) | "Was passt?" short text; reading a calendar |
| **Richtig schreiben** | spells sounds and sound sequences in phonetically regular words correctly; special letters and letter groups **<-en, -er, -el>, <ch, sch, -ng, -nk, au, ei, eu, qu, sp, st, z>**; first syllable splitting; common words with **double consonants** in the middle; **final-consonant devoicing (Auslautverhärtung) d/t, g/k, b/p** by lengthening the word (Hund – Hunde); a/ä, au/äu; word families; compound nouns; the prefixes **vor-, ver-**; endings **-ig, -lich**; a limited set of practised words ("Merkwörter"); **capital letters for concrete nouns and at the start of a sentence**; full stop, question mark and exclamation mark; using the **alphabet** in word lists | missing letter (sch, ei, au …), d or t?, which spelling is right?, capital or small?, which sentence mark?, ABC order |
| **Sprache untersuchen** | splits words into syllables, builds words from syllables; **names the vowel in a syllable**; tells sound and letter apart; tells similar sounds apart; word stem in a word family; frequent building blocks (ver-, vor-, -en, -er, -el); strategies to recognise **nouns, verbs and adjectives** (plural test: "ein Hund – viele Hunde"); compound nouns; verbs in the right personal form; adjectives for precise description; **collecting and ordering words (ABC, Oberbegriffe, Wortfelder)**; sentence as a unit of meaning; sentence structure (subject, predicate) in play | which word is a noun, verb or adjective?, **singular → plural**, **der, die or das** (via nouns and articles), compound nouns (Haus + Tür), Oberbegriffe, opposites, **"Welches Wort passt in den Satz?"** |

End of Jg. 4 (later): tenses (Präsens, Präteritum, Perfekt, Futur I); sentence types;
Satzglieder; ck and tz; long-vowel spellings with "h"; s, ss and ß; direct speech; working
with a dictionary.

## 5. Sachunterricht, end of Jg. 2 (KC SU 2017, verified) → the "Wissen" subject

The KC has **five perspectives**: Technik; Natur; Raum; Gesellschaft, Politik und Wirtschaft;
Zeit und Wandel. Its goals are set for the end of Jg. 2 and Jg. 4. Examples in brackets are
suggestions from the KC.

| Perspective | End of Jg. 2 (condensed KC wording) | Fits a tap-to-answer game? |
|---|---|---|
| **Natur – Mensch** | names and describes **main body parts**; tries out the **senses** and describes what they do and how they protect us; **healthy living** (healthy breakfast) | ✅ body parts ("Tippe auf das Knie"), "Mit welchem Sinn …?" (Auge → sehen), healthy or not so healthy food |
| **Natur – Pflanzen und Tiere** | compares **parts of plants** and the body parts of animals; describes the **development** of plants and animals (bean, butterfly); explores **habitats (meadow, forest, pond)** and identifies typical plants and animals; care for animals (farm, zoo) | ✅ parts of a plant, life cycle in the right order (egg → caterpillar → pupa → butterfly), "Wo lebt das Tier?" (forest, pond, meadow, farm) — our animal types already fit here |
| **Natur – unbelebte Natur** | phenomena such as **light and shadow, wind**; **properties of materials** (feeling box, smell memory) | ✅ partly: "Was schwimmt, was sinkt?", hard or soft, which material is it? |
| **Technik** | building stable towers; naming **common tools (hammer, saw, file)** and their use; simple mechanical things (seesaw, scales); **sorting recyclables** and recycling | ✅ "Welches Werkzeug brauchst du?", **Müll trennen** (which bin?), the heavier side of a balance |
| **Raum** | **names spatial relations** ("Lagebeziehungen"); explores and describes **routes** (way to school, mobility); draws and reads **simple plans** | ✅ position words (shared with math), simple map → picture; road-safety basics (traffic lights, zebra crossing) **(our idea, linked to "Mobilität (Schulweg)")** |
| **Gesellschaft** | class rules; **naming and describing feelings**, saying "No"; conflicts; family types; diversity and respect; wishes vs. needs; fair swapping; **typical workplaces (carpenter, police, farm)** | ✅ feelings from faces ("Wie fühlt sich das Kind?"), **jobs and their tools**; ⚠️ feelings, saying "No" and family types need careful, neutral wording — owner review |
| **Zeit und Wandel** | names **ways of dividing and measuring time** (day, week …); documents a stretch of everyday life; **cyclic processes (a tree through the seasons)**; linear processes (childhood); **past, present, future**; own family timeline | ✅ seasons (exists), **days of the week** in order, daily routine (morning, noon, evening), "Was war vorher?", baby → child → adult |

**Preschool (OP chapter 8, "Natur und Lebenswelt"):** nature as a habitat for plants and
animals; water, air, earth and fire; light and shadow; weight, quantity and material properties;
children's questions ("Warum fliegen Vögel?"). Together with the time topics from OP chapter 6,
this matches the Jg. 1–2 topics at a simpler level.

## 6. Gap analysis

| Existing type | Stages it fits | Notes |
|---|---|---|
| math.count | kita → grade1 | OP Mengen erfassen |
| math.find-number | preschool (1–10) → grade2 (100) | KC Zahlen bis 100 |
| math.compare | kita (quantities) → grade1 | OP mehr/weniger, KC größer/kleiner |
| math.addition / subtraction | preschool L1–2 (pictures, ≤ 5/10); grade1 L3–5 (≤ 20) | missing: Kernaufgaben, up to 100 |
| math.pattern | kita → grade1 | OP Muster, A2 Serialität |
| german.syllables, german.rhyme | kita → grade1 | A2 |
| german.initial-sound | late preschool → grade1 | uses letters; A2 also needs a sound-only variant |
| german.read-word | grade1 → grade2 | KC Lesen |
| knowledge.animal-name, animal-baby | kita → grade1 | OP ch. 8; KC SU Natur (Tiere) |
| knowledge.colors (+ shapes) | kita → preschool | OP ch. 6 (shapes) |
| knowledge.seasons (+ weather) | kita → grade2 | KC SU Zeit und Wandel (zyklische Prozesse), Natur (Wind) |
| knowledge.odd-one-out | kita → grade1 | OP ch. 6 Sortieren/Klassifizieren |

**Missing for preschool (highest priority)** (OP ch. 6, KC De A2):
- Anlaut and Endlaut by **picture and sound**
- **Lautsynthese** and **Silbensynthese** → picture
- hearing a sound in a word
- **Raumlage words** (oben, unten, vor, hinter, neben, zwischen)
- **groß/klein**, ordering by size
- dot and finger patterns at a glance
- quantity ↔ numeral
- **predecessor and successor**
- sharing out and distributing (fair share)
- shapes and solids
- daily routine and before/after (time)
- spotting differences (visual differentiation)
- opposites
- Oberbegriffe

**Missing for grade 1–2** (KC Ma, KC De):
- **Math:**
  - Zahlenhaus (decomposing numbers)
  - Kernaufgaben 1+1
  - doubling and halving
  - tens and ones
  - even or odd
  - ± up to 100
  - Kernaufgaben 1×1
  - money
  - the clock
  - symmetry
  - certain, possible, impossible
- **German:**
  - der, die or das
  - singular and plural
  - word types
  - missing letter group
  - d or t
  - capital or small letter
  - sentence → picture
  - word that fits the sentence
  - ABC order
  - compound nouns

**Missing for "Wissen"** (KC SU 2017, OP ch. 8). Ordered roughly from youngest to oldest:
- Körperteile
- Sinne
- Wo lebt das Tier?
- Tagesablauf
- Wochentage
- gesund oder nicht so gesund
- Müll trennen
- Berufe und Werkzeuge
- schwimmt oder sinkt
- Gefühle (owner review)
- Lebenszyklus (Schmetterling, Bohne)
- Pflanzenteile
- Verkehrssicherheit


## 7. Coverage after M13 (2026-11-01)

What the game covers after the content packs. Every level is tagged in code (`levelInfo`), and
the competency ids live in `src/content/curriculum/de-ni.ts`.

| Area | Covered by | Still open |
|---|---|---|
| OP Mengen, Zählen, Muster, Formen, Größen, Raumlage | math.count, compare, dice, neighbors, pattern, sizes, position, colors (shapes) | Verteilen (fair share) |
| A2 phonologische Bewusstheit | german.rhyme, syllables, syllable-blend, same-start, initial-sound | single sounds: Lautsynthese, Endlaut (needs the M12 voice) |
| OP Wortschatz | german.opposites, knowledge.odd-one-out | Oberbegriffe as their own type |
| KC Ma Zahlen bis 100, Stellenwert, Zerlegen, Doppelt/Hälfte, gerade/ungerade | find-number, neighbors, place-value, number-bonds, double-half, even-odd | |
| KC Ma Rechnen | addition/subtraction (to 20, then to 100), times (Kernaufgaben) | Division as sharing out ("Aufteilen und Verteilen") |
| KC Ma Größen | money, clock, sizes | lengths (cm, m) |
| KC Ma Raum und Form, Daten und Zufall | position, symmetry, chance | Körper (cube, cuboid, sphere, cylinder), tally charts |
| KC De Lesen | read-word, riddle, fill-word | |
| KC De Rechtschreiben, Sprache untersuchen | missing-letters, article, plural, word-type, sentence-end, abc, compound | d/t (Auslautverhärtung), capital or small letter |
| KC SU | animal-name, animal-baby, seasons, habitat, body, sequence | Müll trennen, Berufe, Schwimmen/Sinken, Gefühle (owner review), Verkehr |
