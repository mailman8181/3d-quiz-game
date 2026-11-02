import { numberChoices } from '../../../core/challenges/choices';
import { type ChallengeType, lv } from '../../../core/challenges/types';

/**
 * "Was ist das Doppelte von 4?" / "Was ist die Hälfte von 8?" — KC Ma Ende Jg. 2:
 * "setzen Zahlen zueinander in Beziehung (die Hälfte/das Doppelte)"; doubles are Kernaufgaben.
 * Low levels show the number as dots next to a mirror line.
 */
export interface DoubleHalfData {
  ask: 'double' | 'half';
  n: number;
  answer: number;
  dots: boolean;
}

const LEVELS = [
  { asks: ['double'], max: 5, dots: true, choices: 3 },
  { asks: ['half'], max: 10, dots: true, choices: 3 },
  { asks: ['double', 'half'], max: 20, dots: false, choices: 4 },
  { asks: ['double', 'half'], max: 100, dots: false, choices: 4 },
] as const;

export const mathDoubleHalf: ChallengeType<DoubleHalfData> = {
  id: 'math.double-half',
  subject: 'math',
  skills: ['math.double-half'],
  levels: LEVELS.length,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.ma2.doppelt-haelfte', 'ni.ma2.einspluseins'),
    lv('grade1', 'grade1', 'ni.ma2.doppelt-haelfte'),
    lv('grade1', 'grade2', 'ni.ma2.doppelt-haelfte'),
    lv('grade2', 'grade2', 'ni.ma2.doppelt-haelfte', 'ni.ma2.zahlen-100'),
  ],
  generate({ rng, level }) {
    const cfg = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1]!;
    const ask = rng.pick(cfg.asks);
    // Level 4: doubles of tens and halves of even tens (40 → 20, 30 → 60).
    const tens = cfg.max === 100;
    let n: number;
    if (ask === 'double') n = tens ? rng.int(1, 5) * 10 : rng.int(1, cfg.max / 2);
    else n = tens ? rng.int(1, 5) * 20 : rng.int(1, cfg.max / 2) * 2;
    const answer = ask === 'double' ? n * 2 : n / 2;
    const { choices, correctChoiceId } = tens
      ? spread(rng.shuffle([10, 20, 30, 40, 50, 60, 70, 80, 90, 100].filter((v) => v !== answer)).slice(0, cfg.choices - 1), answer)
      : numberChoices(rng, answer, cfg.choices, 1, cfg.max);
    return {
      typeId: 'math.double-half',
      level,
      data: { ask, n, answer, dots: cfg.dots },
      choices,
      correctChoiceId,
      prompt: { key: `math.double-half.prompt-${ask}`, params: { n } },
      explanation: { key: `math.double-half.explain-${ask}`, params: { n, m: answer } },
    };
  },
};

function spread(distractors: number[], answer: number) {
  const values = [answer, ...distractors].sort((a, b) => a - b);
  const choices = values.map((value, i) => ({ id: `c${i}`, value }));
  return { choices, correctChoiceId: choices.find((c) => c.value === answer)!.id };
}
