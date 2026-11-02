import { numberChoices } from '../../../core/challenges/choices';
import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
import type { Rng } from '../../../core/rng';
import { HUNDRED_FROM_LEVEL } from '../math-addition';
import { COUNT_OBJECTS, type CountObject } from '../objects';

/** "Was ist 7 minus 3?" — with crossed-out pictures on low levels. */
export interface SubtractionData {
  a: number;
  b: number;
  difference: number;
  object: CountObject;
  showPictures: boolean;
}

interface Level {
  pick: (rng: Rng) => [number, number];
  pictures: boolean;
  choices: number;
  max: number;
}

const LEVELS: readonly Level[] = [
  // 1: a ≤ 5 with pictures
  { pick: (rng) => minuend(rng, 2, 5), pictures: true, choices: 3, max: 5 },
  // 2: a ≤ 10 with pictures
  { pick: (rng) => minuend(rng, 3, 10), pictures: true, choices: 4, max: 10 },
  // 3: a ≤ 10, numbers only
  { pick: (rng) => minuend(rng, 3, 10), pictures: false, choices: 4, max: 10 },
  // 4: ≤ 20 without borrowing (17 − 5)
  {
    pick: (rng) => {
      const ones = rng.int(1, 9);
      return [10 + ones, rng.int(1, ones)];
    },
    pictures: false,
    choices: 4,
    max: 20,
  },
  // 5: ≤ 20 with borrowing (13 − 5)
  {
    pick: (rng) => {
      const ones = rng.int(1, 8);
      return [10 + ones, rng.int(ones + 1, 9)];
    },
    pictures: false,
    choices: 4,
    max: 20,
  },
  // 6–8 (M13c, up to 100): ZE − E without borrowing (37 − 5), ZE − Z (57 − 20),
  // ZE − E with borrowing (42 − 5).
  {
    pick: (rng) => {
      const ones = rng.int(2, 9);
      return [rng.int(2, 9) * 10 + ones, rng.int(1, ones - 1)];
    },
    pictures: false,
    choices: 4,
    max: 99,
  },
  {
    pick: (rng) => {
      const a = rng.int(3, 9) * 10 + rng.int(1, 9);
      return [a, rng.int(1, Math.floor(a / 10) - 1) * 10];
    },
    pictures: false,
    choices: 4,
    max: 99,
  },
  {
    pick: (rng) => {
      const ones = rng.int(1, 8);
      return [rng.int(2, 9) * 10 + ones, rng.int(ones + 1, 9)];
    },
    pictures: false,
    choices: 4,
    max: 99,
  },
];

function minuend(rng: Rng, min: number, max: number): [number, number] {
  const a = rng.int(min, max);
  return [a, rng.int(1, a - 1)];
}

export const mathSubtraction: ChallengeType<SubtractionData> = {
  id: 'math.subtraction',
  subject: 'math',
  skills: ['math.subtraction'],
  levels: LEVELS.length,
  levelInfo: [
    lv('preschool', 'grade1', 'ni.op.hinzufuegen'),
    lv('preschool', 'grade1', 'ni.op.hinzufuegen', 'ni.ma2.subtraktion'),
    lv('grade1', 'grade1', 'ni.ma2.subtraktion', 'ni.ma2.einspluseins'),
    lv('grade1', 'grade2', 'ni.ma2.einspluseins'),
    lv('grade1', 'grade2', 'ni.ma2.einspluseins'),
    lv('grade2', 'grade2', 'ni.ma2.subtraktion-100'),
    lv('grade2', undefined, 'ni.ma2.subtraktion-100'),
    lv('grade2', undefined, 'ni.ma2.subtraktion-100'),
  ],
  generate({ rng, level }): ChallengeInstance<SubtractionData> {
    const cfg = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1]!;
    const [a, b] = cfg.pick(rng);
    const difference = a - b;
    const object = rng.pick(COUNT_OBJECTS);
    const { choices, correctChoiceId } = numberChoices(rng, difference, cfg.choices, 0, cfg.max);
    return {
      typeId: 'math.subtraction',
      level,
      data: { a, b, difference, object, showPictures: cfg.pictures },
      choices,
      correctChoiceId,
      ...(level >= HUNDRED_FROM_LEVEL
        ? { prompt: { key: 'math.calc100.prompt' }, explanation: { key: 'math.calc100.explain', params: { n: difference } } }
        : {
            prompt: { key: 'math.subtraction.prompt', params: { a, b } },
            explanation: { key: 'math.subtraction.explain', params: { a, b, difference } },
          }),
    };
  },
};
