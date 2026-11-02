import { numberChoices } from '../../../core/challenges/choices';
import { type ChallengeType, lv } from '../../../core/challenges/types';
import type { Rng } from '../../../core/rng';

/**
 * "Was ist 3 mal 5?" — the Kernaufgaben of the 1×1 (KC Ma Ende Jg. 2; 2024 draft: factors
 * 1, 2, 5, 10 and squares). Low levels draw "3 mal 5" as 3 groups of 5 ("3 Fünfer").
 */
export interface TimesData {
  /** Number of groups. */
  a: number;
  /** Size of each group. */
  b: number;
  pictures: boolean;
}

/** Factor pairs the game can ask (shared with the speech variants). */
export const CORE_FACTORS = [1, 2, 5, 10] as const;

export function timesPairs(): { a: number; b: number }[] {
  const pairs = new Map<string, { a: number; b: number }>();
  for (let a = 1; a <= 10; a++) {
    for (const b of CORE_FACTORS) {
      pairs.set(`${a}x${b}`, { a, b });
      pairs.set(`${b}x${a}`, { a: b, b: a });
    }
    pairs.set(`${a}x${a}`, { a, b: a });
  }
  return [...pairs.values()];
}

const LEVELS: readonly { pick: (rng: Rng) => [number, number]; pictures: boolean; choices: number }[] = [
  // ×2 and ×10 with pictures, a ≤ 5
  { pick: (rng) => [rng.int(1, 5), rng.pick([2, 10])], pictures: true, choices: 3 },
  // ×5 and ×1 with pictures
  { pick: (rng) => [rng.int(1, 6), rng.pick([1, 5])], pictures: true, choices: 4 },
  // all Kernaufgaben, either order, no pictures
  {
    pick: (rng) => {
      const pair: [number, number] = [rng.int(1, 10), rng.pick(CORE_FACTORS)];
      return rng.pick([true, false]) ? pair : [pair[1], pair[0]];
    },
    pictures: false,
    choices: 4,
  },
  // squares
  {
    pick: (rng) => {
      const a = rng.int(2, 10);
      return [a, a];
    },
    pictures: false,
    choices: 4,
  },
];

export const mathTimes: ChallengeType<TimesData> = {
  id: 'math.times',
  subject: 'math',
  skills: ['math.multiplication'],
  levels: LEVELS.length,
  levelInfo: [
    lv('grade2', 'grade2', 'ni.ma2.mal'),
    lv('grade2', 'grade2', 'ni.ma2.mal'),
    lv('grade2', undefined, 'ni.ma2.einmaleins'),
    lv('grade2', undefined, 'ni.ma2.einmaleins'),
  ],
  generate({ rng, level }) {
    const cfg = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1]!;
    const [a, b] = cfg.pick(rng);
    const product = a * b;
    const { choices, correctChoiceId } = numberChoices(rng, product, cfg.choices, 1, 100);
    return {
      typeId: 'math.times',
      level,
      data: { a, b, pictures: cfg.pictures },
      choices,
      correctChoiceId,
      prompt: { key: 'math.times.prompt', params: { a, b } },
      explanation: { key: 'math.times.explain', params: { a, b, p: product } },
    };
  },
};
