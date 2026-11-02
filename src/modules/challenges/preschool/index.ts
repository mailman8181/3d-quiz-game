import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
import {
  BASIC_HABITATS,
  BODY_PARTS,
  HABITAT_ANIMALS,
  HABITATS,
  OPPOSITE_WORDS,
  SENSES,
  SEQUENCES,
  SIZE_ITEMS,
} from '../../../content/de/preschool';
import { WORDS } from '../../../content/de/words';
import { arrange, clampLevel, quizChoices, type QuizData } from '../knowledge/common';

/**
 * Preschool pack (roadmap M13b): picture-and-sound tasks, no reading needed.
 * All use the shared quiz view (KnowledgeView). Curriculum: docs/curriculum/niedersachsen.md §2/§5.
 */

const quiz = (
  typeId: string,
  level: number,
  data: QuizData,
  correctIndex: number,
  prompt: ChallengeInstance['prompt'],
  explanation: ChallengeInstance['explanation'],
): ChallengeInstance<QuizData> => ({
  typeId,
  level,
  data,
  choices: quizChoices(data.options),
  correctChoiceId: `c${correctIndex}`,
  prompt,
  explanation,
});

/** Words whose first sound is one clear letter (no Sch, St, Ei, …), see words.ts. */
const SOUND_WORDS = WORDS.filter((w) => w.initial);

/** "Was fängt genauso an wie Mond?" — initial sound by ear, picture answers (KC De A2). */
export const germanSameStart: ChallengeType<QuizData> = {
  id: 'german.same-start',
  subject: 'german',
  skills: ['german.phonological-awareness'],
  levels: 3,
  levelInfo: [
    lv('preschool', 'grade1', 'ni.a2.anlaut'),
    lv('preschool', 'grade1', 'ni.a2.anlaut'),
    lv('preschool', 'grade1', 'ni.a2.anlaut'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    // Only targets that have at least one partner with the same first sound.
    const target = rng.pick(SOUND_WORDS.filter((w) => SOUND_WORDS.some((o) => o.id !== w.id && o.initial === w.initial)));
    const match = rng.pick(SOUND_WORDS.filter((o) => o.id !== target.id && o.initial === target.initial));
    const others = SOUND_WORDS.filter((o) => o.initial !== target.initial);
    // Distractors with different first sounds from each other, too (only one right answer).
    const distractors: typeof others = [];
    for (const o of rng.shuffle(others)) {
      if (distractors.length >= (l === 3 ? 3 : 2)) break;
      if (!distractors.some((d) => d.initial === o.initial)) distractors.push(o);
    }
    const { options, correctIndex } = arrange(rng, match, distractors);
    return quiz(
      'german.same-start',
      level,
      {
        picture: target.emoji,
        options: options.map((w) => ({ label: w.word, emoji: w.emoji })),
        labels: l === 1 ? 'hint' : 'never',
        speakOptions: true,
      },
      correctIndex,
      { key: 'german.same-start.prompt', params: { word: target.word } },
      { key: 'german.same-start.explain', params: { word: target.word, match: match.word } },
    );
  },
};

const MULTI_SYLLABLE = WORDS.filter((w) => w.syllables.length >= 2);

/** "Hör gut zu: Ba – na – ne. Welches Bild ist das?" — Silbensynthese (KC De A2). */
export const germanSyllableBlend: ChallengeType<QuizData> = {
  id: 'german.syllable-blend',
  subject: 'german',
  skills: ['german.phonological-awareness'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.a2.silben'),
    lv('preschool', 'grade1', 'ni.a2.silben'),
    lv('preschool', 'grade1', 'ni.a2.silben', 'ni.de2.silben'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const word = rng.pick(l === 1 ? MULTI_SYLLABLE.filter((w) => w.syllables.length === 2) : MULTI_SYLLABLE);
    // Level 1: distractors look and sound different; later the same number of syllables.
    const pool = WORDS.filter(
      (o) => o.id !== word.id && o.syllables[0] !== word.syllables[0] && (l === 1 || o.syllables.length === word.syllables.length),
    );
    const distractors = rng.shuffle(pool).slice(0, l === 3 ? 3 : 2);
    const { options, correctIndex } = arrange(rng, word, distractors);
    return quiz(
      'german.syllable-blend',
      level,
      { options: options.map((w) => ({ label: w.word, emoji: w.emoji })), labels: 'hint', speakOptions: l === 1 },
      correctIndex,
      { key: 'german.syllable-blend.prompt', params: { word: word.word } },
      { key: 'german.syllable-blend.explain', params: { word: word.word } },
    );
  },
};

/** "Was ist das Gegenteil von heiß?" — vocabulary (OP Sprache, KC De Wortschatz). */
export const germanOpposites: ChallengeType<QuizData> = {
  id: 'german.opposites',
  subject: 'german',
  skills: ['german.vocabulary'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.op.wortschatz'),
    lv('preschool', 'grade1', 'ni.op.wortschatz'),
    lv('preschool', 'grade2', 'ni.op.wortschatz', 'ni.de2.wortschatz'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const word = rng.pick(OPPOSITE_WORDS);
    const distractors = rng
      .shuffle(OPPOSITE_WORDS.filter((o) => o.pairId !== word.pairId))
      .slice(0, l === 3 ? 3 : 2)
      .map(({ word: w, emoji }) => ({ word: w, emoji }));
    const { options, correctIndex } = arrange(rng, word.partner, distractors);
    return quiz(
      'german.opposites',
      level,
      {
        picture: word.emoji,
        options: options.map((o) => ({ label: o.word, emoji: o.emoji })),
        labels: l === 1 ? 'always' : 'hint',
        speakOptions: true,
      },
      correctIndex,
      { key: 'german.opposites.prompt', params: { word: word.word } },
      { key: 'german.opposites.explain', params: { word: word.word, opposite: word.partner.word } },
    );
  },
};

/** "Tippe auf den größten Baum!" — Größen vergleichen (OP groß – klein, KC Größen). */
export const mathSizes: ChallengeType<QuizData> = {
  id: 'math.sizes',
  subject: 'math',
  skills: ['math.measures'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.op.groessen'),
    lv('kita', 'grade1', 'ni.op.groessen'),
    lv('preschool', 'grade1', 'ni.op.groessen', 'ni.ma2.groessen'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const item = rng.pick(SIZE_ITEMS);
    const ask: 'big' | 'small' = l === 1 ? 'big' : rng.pick(['big', 'small'] as const);
    // Level 3: four sizes, closer together.
    const sizes = l === 3 ? [0.4, 0.6, 0.8, 1] : [0.35, 0.65, 1];
    const order = rng.shuffle(sizes.map((_, i) => i));
    const target = ask === 'big' ? sizes.length - 1 : 0;
    return quiz(
      'math.sizes',
      level,
      { options: order.map((i) => ({ label: item.word, emoji: item.emoji, size: sizes[i]! })), labels: 'never', speakOptions: false },
      order.indexOf(target),
      { key: 'math.sizes.prompt', params: { item: item.id, ask } },
      { key: 'math.sizes.explain', params: { item: item.id, ask } },
    );
  },
};

/** "Wo lebt das Tier?" — Lebensräume (OP Natur, KC SU Pflanzen und Tiere). */
export const knowledgeHabitat: ChallengeType<QuizData> = {
  id: 'knowledge.habitat',
  subject: 'knowledge',
  skills: ['knowledge.nature'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.op.natur'),
    lv('preschool', 'grade1', 'ni.op.natur', 'ni.su2.lebensraeume'),
    lv('preschool', 'grade2', 'ni.su2.lebensraeume'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const basic = (BASIC_HABITATS as readonly string[]).includes.bind(BASIC_HABITATS);
    const animal = rng.pick(l === 1 ? HABITAT_ANIMALS.filter((a) => basic(a.habitat)) : HABITAT_ANIMALS);
    const home = HABITATS.find((h) => h.id === animal.habitat)!;
    const pool = HABITATS.filter((h) => h.id !== home.id && (l > 1 || basic(h.id)));
    const { options, correctIndex } = arrange(rng, home, rng.shuffle(pool).slice(0, l === 3 ? 3 : 2));
    return quiz(
      'knowledge.habitat',
      level,
      { picture: animal.emoji, options: options.map((h) => ({ label: h.name, emoji: h.emoji })), labels: 'always', speakOptions: true },
      correctIndex,
      { key: 'knowledge.habitat.prompt' },
      { key: 'knowledge.habitat.explain', params: { animal: animal.id } },
    );
  },
};

/** "Tippe auf die Nase!" → level 3: "Womit hörst du?" (KC SU Natur – Mensch). */
export const knowledgeBody: ChallengeType<QuizData> = {
  id: 'knowledge.body',
  subject: 'knowledge',
  skills: ['knowledge.body'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.su2.mensch'),
    lv('kita', 'grade1', 'ni.su2.mensch'),
    lv('preschool', 'grade2', 'ni.su2.mensch'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    if (l === 3) {
      const sense = rng.pick(SENSES);
      const part = BODY_PARTS.find((p) => p.id === sense.part)!;
      const others = BODY_PARTS.filter((p) => p.id !== part.id);
      const { options, correctIndex } = arrange(rng, part, rng.shuffle(others).slice(0, 3));
      return quiz(
        'knowledge.body',
        level,
        { options: options.map((p) => ({ label: p.word, emoji: p.emoji })), labels: 'hint', speakOptions: true },
        correctIndex,
        { key: 'knowledge.sense.prompt', params: { sense: sense.id } },
        { key: 'knowledge.sense.explain', params: { sense: sense.id } },
      );
    }
    const part = rng.pick(BODY_PARTS);
    const { options, correctIndex } = arrange(
      rng,
      part,
      rng.shuffle(BODY_PARTS.filter((p) => p.id !== part.id)).slice(0, l === 1 ? 2 : 3),
    );
    return quiz(
      'knowledge.body',
      level,
      { options: options.map((p) => ({ label: p.word, emoji: p.emoji })), labels: 'hint', speakOptions: false },
      correctIndex,
      { key: 'knowledge.body.prompt', params: { part: part.id } },
      { key: 'knowledge.body.explain', params: { part: part.id } },
    );
  },
};

/** "Was kommt zuerst?" — Ei, Küken, Huhn (OP Zeit, KC SU Zeit und Wandel). */
export const knowledgeSequence: ChallengeType<QuizData> = {
  id: 'knowledge.sequence',
  subject: 'knowledge',
  skills: ['knowledge.time'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.op.zeit'),
    lv('preschool', 'grade1', 'ni.op.zeit', 'ni.su2.lineare-zeit'),
    lv('preschool', 'grade2', 'ni.su2.lineare-zeit'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const sequence = rng.pick(SEQUENCES);
    const ask = l === 1 ? 'first' : l === 2 ? rng.pick(['first', 'last'] as const) : rng.pick(['first', 'last', 'middle'] as const);
    const targetIndex = ask === 'first' ? 0 : ask === 'last' ? 2 : 1;
    const order = rng.shuffle([0, 1, 2]);
    return quiz(
      'knowledge.sequence',
      level,
      {
        options: order.map((i) => ({ label: sequence.steps[i]!.name, emoji: sequence.steps[i]!.emoji })),
        labels: 'hint',
        speakOptions: true,
      },
      order.indexOf(targetIndex),
      { key: 'knowledge.sequence.prompt', params: { ask } },
      { key: 'knowledge.sequence.explain', params: { sequence: sequence.id } },
    );
  },
};
