import { numberChoices } from '../../../core/challenges/choices';
import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
import type { Rng } from '../../../core/rng';

/**
 * "Was ist 12 geteilt durch 3?" — sharing out (pictures), then the 1×1 reversed, then with a
 * remainder (KC Ma: Aufteilen und Verteilen; Ende Jg. 4: alle Umkehraufgaben, Division).
 */
export interface DivisionData {
  a: number;
  b: number;
  quotient: number;
  remainder: number;
  pictures: boolean;
}

/** Pairs (dividend, divisor) the game can ask without remainder: the 1×1 reversed. */
export function divisionPairs(): { a: number; b: number }[] {
  return Array.from({ length: 10 }, (_, i) => i + 1).flatMap((b) => Array.from({ length: 10 }, (_, j) => ({ a: b * (j + 1), b })));
}

const LEVELS: readonly { pick: (rng: Rng) => [number, number]; pictures: boolean; choices: number; remainder?: boolean }[] = [
  // Share out with pictures: divisor 2, 3 or 5, quotient ≤ 5.
  { pick: (rng) => { const b = rng.pick([2, 3, 5]); return [b * rng.int(1, 5), b]; }, pictures: true, choices: 3 },
  // Core: ÷2, ÷5, ÷10.
  { pick: (rng) => { const b = rng.pick([2, 5, 10]); return [b * rng.int(1, 10), b]; }, pictures: false, choices: 4 },
  // The whole 1×1 reversed.
  { pick: (rng) => { const b = rng.int(2, 10); return [b * rng.int(2, 10), b]; }, pictures: false, choices: 4 },
  // With a remainder (grade 4): 17 : 5 = 3 Rest 2.
  { pick: (rng) => { const b = rng.int(3, 9); return [b * rng.int(2, 9) + rng.int(1, b - 1), b]; }, pictures: false, choices: 4, remainder: true },
];

export const mathDivision: ChallengeType<DivisionData> = {
  id: 'math.division',
  subject: 'math',
  skills: ['math.division'],
  levels: LEVELS.length,
  levelInfo: [
    lv('grade2', 'grade3', 'ni.ma4.division'),
    lv('grade2', 'grade3', 'ni.ma4.division'),
    lv('grade3', 'grade4', 'ni.ma4.division', 'ni.ma4.einmaleins'),
    lv('grade4', undefined, 'ni.ma4.division'),
  ],
  generate({ rng, level }): ChallengeInstance<DivisionData> {
    const cfg = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1]!;
    const [a, b] = cfg.pick(rng);
    const quotient = Math.floor(a / b);
    const remainder = a % b;
    if (cfg.remainder) {
      // Answers "3 R 2": the right one, the remainder off by one, the quotient off by one.
      const options = rng.shuffle(
        [...new Map(
          [
            [quotient, remainder],
            [quotient, (remainder + 1) % b || 1],
            [quotient + 1, remainder],
            [quotient - 1, remainder],
          ].map(([q, r]) => [`${q}-${r}`, [q!, r!] as const]),
        ).values()].filter(([q, r]) => q >= 0 && r < b),
      ).slice(0, 4);
      if (!options.some(([q, r]) => q === quotient && r === remainder)) options[0] = [quotient, remainder];
      const choices = options.map(([q, r], i) => ({ id: `c${i}`, value: q * 100 + r, label: `${q} R ${r}` }));
      return {
        typeId: 'math.division',
        level,
        data: { a, b, quotient, remainder, pictures: false },
        choices,
        correctChoiceId: choices.find((c) => c.value === quotient * 100 + remainder)!.id,
        prompt: { key: 'math.division.prompt-rest' },
        explanation: { key: 'math.division.explain-rest' },
      };
    }
    const { choices, correctChoiceId } = numberChoices(rng, quotient, cfg.choices, 1, 10);
    return {
      typeId: 'math.division',
      level,
      data: { a, b, quotient, remainder, pictures: cfg.pictures },
      choices,
      correctChoiceId,
      prompt: { key: 'math.division.prompt', params: { a, b } },
      explanation: { key: 'math.division.explain', params: { a, b, q: quotient } },
    };
  },
};
