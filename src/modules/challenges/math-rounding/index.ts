import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
import { clampLevel } from '../knowledge/common';

/**
 * "Runde 47 auf Zehner!" — on a number line between the two neighbouring tens/hundreds/
 * thousands (KC Ma Ende Jg. 4: "runden Zahlen sachangemessen"). 5 and above rounds up.
 */
export interface RoundingData {
  n: number;
  to: 10 | 100 | 1000;
  lower: number;
  upper: number;
  answer: number;
}

const LEVELS = [
  { to: 10, min: 11, max: 99 },
  { to: 100, min: 101, max: 999 },
  { to: 1000, min: 1001, max: 99_999 },
] as const;

export const mathRounding: ChallengeType<RoundingData> = {
  id: 'math.rounding',
  subject: 'math',
  skills: ['math.rounding'],
  levels: LEVELS.length,
  levelInfo: [
    lv('grade3', 'grade3', 'ni.ma4.runden'),
    lv('grade3', 'grade4', 'ni.ma4.runden'),
    lv('grade4', undefined, 'ni.ma4.runden'),
  ],
  generate({ rng, level }): ChallengeInstance<RoundingData> {
    const cfg = LEVELS[clampLevel(level, LEVELS.length) - 1]!;
    let n = rng.int(cfg.min, cfg.max);
    if (n % cfg.to === 0) n += rng.int(1, cfg.to - 1);
    // Often the tricky middle: exactly 5 (rounds up).
    if (rng.int(0, 3) === 0) n = Math.floor(n / cfg.to) * cfg.to + cfg.to / 2;
    const lower = Math.floor(n / cfg.to) * cfg.to;
    const upper = lower + cfg.to;
    const answer = n - lower >= cfg.to / 2 ? upper : lower;
    const values = [...new Set([lower, upper, lower - cfg.to, upper + cfg.to].filter((v) => v >= 0))].sort((a, b) => a - b);
    const choices = values.map((value, i) => ({ id: `c${i}`, value, label: value.toLocaleString('de-DE') }));
    return {
      typeId: 'math.rounding',
      level,
      data: { n, to: cfg.to, lower, upper, answer },
      choices,
      correctChoiceId: choices.find((c) => c.value === answer)!.id,
      prompt: { key: 'math.rounding.prompt', params: { to: cfg.to } },
      explanation: { key: `math.rounding.explain-${answer === upper ? 'up' : 'down'}` },
    };
  },
};
