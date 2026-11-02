import { numberChoices } from '../../../core/challenges/choices';
import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
import type { Rng } from '../../../core/rng';
import { COUNT_OBJECTS, type CountObject } from '../objects';

/** "Was ist 3 plus 2?" — with pictures on low levels, numbers only later. */
export interface AdditionData {
  a: number;
  b: number;
  sum: number;
  object: CountObject;
  /** Show the summands as pictures (always shown as hint after the 2nd wrong try). */
  showPictures: boolean;
}

interface Level {
  pick: (rng: Rng) => [number, number];
  pictures: boolean;
  choices: number;
  max: number;
}

const LEVELS: readonly Level[] = [
  // 1: sum ≤ 5 with pictures
  { pick: (rng) => pair(rng, 1, 5), pictures: true, choices: 3, max: 5 },
  // 2: sum ≤ 10 with pictures
  { pick: (rng) => pair(rng, 2, 10), pictures: true, choices: 4, max: 10 },
  // 3: sum ≤ 10, numbers only
  { pick: (rng) => pair(rng, 2, 10), pictures: false, choices: 4, max: 10 },
  // 4: ≤ 20 without carrying (e.g. 12 + 5)
  {
    pick: (rng) => {
      const ones = rng.int(0, 8);
      const b = rng.int(1, 9 - ones);
      return [10 + ones, b];
    },
    pictures: false,
    choices: 4,
    max: 20,
  },
  // 5: ≤ 20 with carrying (e.g. 8 + 5)
  {
    pick: (rng) => {
      const a = rng.int(2, 9);
      const b = rng.int(Math.max(1, 10 - a), 9);
      return [a, b];
    },
    pictures: false,
    choices: 4,
    max: 20,
  },
  // 6–8 (M13c, KC Ma Ende Jg. 2 "bis 100"): ZE + E without carry (34 + 5), ZE + Z (34 + 20),
  // ZE + E with carry (37 + 5). Spoken generically; the equation is shown (see speech).
  {
    pick: (rng) => {
      const tens = rng.int(2, 8) * 10;
      const ones = rng.int(1, 7);
      return [tens + ones, rng.int(1, 9 - ones)];
    },
    pictures: false,
    choices: 4,
    max: 99,
  },
  {
    pick: (rng) => {
      const a = rng.int(2, 7) * 10 + rng.int(1, 9);
      return [a, rng.int(1, Math.floor((99 - a) / 10)) * 10];
    },
    pictures: false,
    choices: 4,
    max: 99,
  },
  {
    pick: (rng) => {
      const ones = rng.int(2, 9);
      const a = rng.int(2, 8) * 10 + ones;
      return [a, rng.int(10 - ones, 9)];
    },
    pictures: false,
    choices: 4,
    max: 99,
  },
];

/** Levels from here on use the generic "up to 100" sentences (ADR-0007 clip budget). */
export const HUNDRED_FROM_LEVEL = 6;

/** Two positive numbers whose sum is in [minSum, maxSum]. */
function pair(rng: Rng, minSum: number, maxSum: number): [number, number] {
  const sum = rng.int(Math.max(2, minSum), maxSum);
  const a = rng.int(1, sum - 1);
  return [a, sum - a];
}

export const mathAddition: ChallengeType<AdditionData> = {
  id: 'math.addition',
  subject: 'math',
  skills: ['math.addition'],
  levels: LEVELS.length,
  levelInfo: [
    lv('preschool', 'grade1', 'ni.op.hinzufuegen'),
    lv('preschool', 'grade1', 'ni.op.hinzufuegen', 'ni.ma2.addition'),
    lv('grade1', 'grade1', 'ni.ma2.addition', 'ni.ma2.einspluseins'),
    lv('grade1', 'grade2', 'ni.ma2.einspluseins'),
    lv('grade1', 'grade2', 'ni.ma2.einspluseins'),
    lv('grade2', 'grade2', 'ni.ma2.addition-100'),
    lv('grade2', undefined, 'ni.ma2.addition-100'),
    lv('grade2', undefined, 'ni.ma2.addition-100'),
  ],
  generate({ rng, level }): ChallengeInstance<AdditionData> {
    const cfg = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1]!;
    const [a, b] = cfg.pick(rng);
    const sum = a + b;
    const object = rng.pick(COUNT_OBJECTS);
    const { choices, correctChoiceId } = numberChoices(rng, sum, cfg.choices, 0, cfg.max);
    return {
      typeId: 'math.addition',
      level,
      data: { a, b, sum, object, showPictures: cfg.pictures },
      choices,
      correctChoiceId,
      ...(level >= HUNDRED_FROM_LEVEL
        ? { prompt: { key: 'math.calc100.prompt' }, explanation: { key: 'math.calc100.explain', params: { n: sum } } }
        : {
            prompt: { key: 'math.addition.prompt', params: { a, b } },
            explanation: { key: 'math.addition.explain', params: { a, b, sum } },
          }),
    };
  },
};
