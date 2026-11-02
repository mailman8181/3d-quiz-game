import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
import {
  ANIMALS,
  BABIES,
  COLORS,
  ODD_CATEGORIES,
  SEASON_QUESTIONS,
  SEASONS,
  SHAPES,
  WEATHER_ITEMS,
  WEATHER_QUESTIONS,
} from '../../../content/de/knowledge';
import { arrange, clampLevel, quizChoices, type QuizData, type QuizOption } from './common';


/** "Wie heißt dieses Tier?" — picture → tap the name (names are read out by 🔊). */
export const knowledgeAnimalName: ChallengeType<QuizData> = {
  id: 'knowledge.animal-name',
  subject: 'knowledge',
  skills: ['knowledge.animals'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.op.natur'),
    lv('kita', 'grade1', 'ni.op.natur', 'ni.su2.tiere'),
    lv('preschool', 'grade2', 'ni.su2.tiere'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const animal = rng.pick(ANIMALS);
    const others = rng.shuffle(ANIMALS.filter((a) => a.id !== animal.id)).slice(0, l);
    const { options, correctIndex } = arrange(rng, animal, others);
    return {
      typeId: 'knowledge.animal-name',
      level,
      data: { picture: animal.emoji, options: options.map((a) => ({ label: a.name })), labels: 'always', speakOptions: true },
      choices: quizChoices(options),
      correctChoiceId: `c${correctIndex}`,
      prompt: { key: 'knowledge.animal.prompt' },
      explanation: { key: 'knowledge.animal.explain', params: { name: animal.name } },
    };
  },
};

/** "Wie heißt das Baby vom Schaf?" */
export const knowledgeAnimalBaby: ChallengeType<QuizData> = {
  id: 'knowledge.animal-baby',
  subject: 'knowledge',
  skills: ['knowledge.animals'],
  levels: 3,
  levelInfo: [
    lv('kita', 'grade1', 'ni.op.natur', 'ni.su2.tiere'),
    lv('preschool', 'grade1', 'ni.su2.tiere'),
    lv('preschool', 'grade2', 'ni.su2.tiere'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const pair = rng.pick(BABIES);
    const others = rng.shuffle(BABIES.filter((b) => b.id !== pair.id)).slice(0, l);
    const { options, correctIndex } = arrange(rng, pair, others);
    return {
      typeId: 'knowledge.animal-baby',
      level,
      data: { picture: pair.parentEmoji, options: options.map((b) => ({ label: b.baby })), labels: 'always', speakOptions: true },
      choices: quizChoices(options),
      correctChoiceId: `c${correctIndex}`,
      prompt: { key: 'knowledge.baby.prompt', params: { of: pair.of } },
      explanation: { key: 'knowledge.baby.explain', params: { of: pair.of, baby: pair.baby } },
    };
  },
};

/** "Tippe auf Rot!" → level 3: "Tippe auf den blauen Kreis!" */
export const knowledgeColors: ChallengeType<QuizData> = {
  id: 'knowledge.colors',
  subject: 'knowledge',
  skills: ['knowledge.colors-shapes'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.op.sortieren'),
    lv('kita', 'preschool', 'ni.op.sortieren'),
    lv('preschool', 'grade1', 'ni.op.formen'),
  ],
  generate({ rng, level }): ChallengeInstance<QuizData> {
    const l = clampLevel(level, 3);
    if (l < 3) {
      const pool = l === 1 ? COLORS.filter((c) => c.adj) : COLORS;
      const color = rng.pick(pool);
      const others = rng.shuffle(pool.filter((c) => c.id !== color.id)).slice(0, l === 1 ? 2 : 3);
      const { options, correctIndex } = arrange(rng, color, others);
      return {
        typeId: 'knowledge.colors',
        level,
        data: {
          options: options.map((c): QuizOption => ({ label: c.name, color: c.hex, shape: 'circle' })),
          labels: 'never',
          speakOptions: false,
        },
        choices: quizChoices(options),
        correctChoiceId: `c${correctIndex}`,
        prompt: { key: 'knowledge.color.prompt', params: { color: color.id } },
        explanation: { key: 'knowledge.color.explain', params: { color: color.id } },
      };
    }
    const basic = COLORS.filter((c) => c.adj);
    const color = rng.pick(basic);
    const shape = rng.pick(SHAPES);
    // Tricky distractors: same colour other shape, same shape other colour, then anything.
    const key = (c: string, s: string) => `${c}/${s}`;
    const seen = new Set([key(color.id, shape.id)]);
    const distractors: Array<{ c: (typeof basic)[number]; s: (typeof SHAPES)[number] }> = [];
    const add = (c: (typeof basic)[number], s: (typeof SHAPES)[number]) => {
      if (distractors.length < 3 && !seen.has(key(c.id, s.id))) {
        seen.add(key(c.id, s.id));
        distractors.push({ c, s });
      }
    };
    add(color, rng.pick(SHAPES.filter((s) => s.id !== shape.id)));
    add(rng.pick(basic.filter((c) => c.id !== color.id)), shape);
    while (distractors.length < 3) add(rng.pick(basic), rng.pick(SHAPES));
    const { options, correctIndex } = arrange(rng, { c: color, s: shape }, distractors);
    return {
      typeId: 'knowledge.colors',
      level,
      data: {
        options: options.map((o): QuizOption => ({ label: `${o.c.name} ${o.s.noun}`, color: o.c.hex, shape: o.s.id })),
        labels: 'never',
        speakOptions: false,
      },
      choices: quizChoices(options),
      correctChoiceId: `c${correctIndex}`,
      prompt: { key: 'knowledge.shape.prompt', params: { color: color.id, shape: shape.id } },
      explanation: { key: 'knowledge.shape.explain', params: { color: color.id, shape: shape.id } },
    };
  },
};

/** "Wann fällt Schnee?" → level 3: "Was brauchst du, wenn es regnet?" */
export const knowledgeSeasons: ChallengeType<QuizData> = {
  id: 'knowledge.seasons',
  subject: 'knowledge',
  skills: ['knowledge.seasons-weather'],
  levels: 3,
  levelInfo: [
    lv('kita', 'grade1', 'ni.op.zeit', 'ni.su2.zeit'),
    lv('preschool', 'grade1', 'ni.su2.zeit'),
    lv('preschool', 'grade2', 'ni.su2.zeit', 'ni.su2.natur'),
  ],
  generate({ rng, level }): ChallengeInstance<QuizData> {
    const l = clampLevel(level, 3);
    if (l < 3) {
      const q = rng.pick(SEASON_QUESTIONS.filter((x) => x.level === l));
      const correctIndex = SEASONS.findIndex((s) => s.id === q.answer);
      return {
        typeId: 'knowledge.seasons',
        level,
        data: { options: SEASONS.map((s) => ({ label: s.name, emoji: s.emoji })), labels: 'always', speakOptions: true },
        choices: quizChoices(SEASONS),
        correctChoiceId: `c${correctIndex}`,
        prompt: { key: 'knowledge.season.prompt', params: { q: q.id } },
        explanation: { key: 'knowledge.season.explain', params: { q: q.id } },
      };
    }
    const q = rng.pick(WEATHER_QUESTIONS);
    const options = rng.shuffle(WEATHER_ITEMS);
    return {
      typeId: 'knowledge.seasons',
      level,
      data: { options: options.map((i) => ({ label: i.name, emoji: i.emoji })), labels: 'hint', speakOptions: true },
      choices: quizChoices(options),
      correctChoiceId: `c${options.findIndex((i) => i.id === q.answer)}`,
      prompt: { key: 'knowledge.weather.prompt', params: { q: q.id } },
      explanation: { key: 'knowledge.weather.explain', params: { q: q.id } },
    };
  },
};

/** "Was gehört nicht dazu?" — 3 (or 4) of a kind and one odd picture. */
export const knowledgeOddOneOut: ChallengeType<QuizData> = {
  id: 'knowledge.odd-one-out',
  subject: 'knowledge',
  skills: ['knowledge.categories'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.op.sortieren'),
    lv('preschool', 'grade1', 'ni.op.sortieren', 'ni.de2.woerter-ordnen'),
    lv('preschool', 'grade2', 'ni.de2.woerter-ordnen'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const category = rng.pick(ODD_CATEGORIES);
    const near = ODD_CATEGORIES.filter((c) => category.near?.includes(c.id));
    const far = ODD_CATEGORIES.filter((c) => c.id !== category.id && !category.near?.includes(c.id));
    const oddCategory = l >= 2 && near.length > 0 ? rng.pick(near) : rng.pick(far);
    const odd = rng.pick(oddCategory.items);
    const same = rng.shuffle(category.items).slice(0, l === 3 ? 4 : 3);
    const { options, correctIndex } = arrange(rng, odd, same);
    return {
      typeId: 'knowledge.odd-one-out',
      level,
      data: { options: options.map((i) => ({ label: i.name, emoji: i.emoji })), labels: 'hint', speakOptions: true },
      choices: quizChoices(options),
      correctChoiceId: `c${correctIndex}`,
      prompt: { key: 'knowledge.odd.prompt' },
      explanation: { key: 'knowledge.odd.explain', params: { odd: odd.id, category: category.id } },
    };
  },
};
