import { numberChoices } from '../../../core/challenges/choices';
import { type ChallengeType, lv } from '../../../core/challenges/types';

/**
 * "Welche Zahl kommt nach 4?" — predecessor and successor on a number row
 * (OP Zählen; KC Ma Ende Jg. 2: "Vorgänger/Nachfolger", flexibles Zählen bis 100).
 */
export interface NeighborsData {
  n: number;
  ask: 'after' | 'before';
  answer: number;
}

const LEVELS = [
  { max: 10, asks: ['after'], choices: 3 },
  { max: 10, asks: ['after', 'before'], choices: 3 },
  { max: 20, asks: ['after', 'before'], choices: 4 },
  { max: 100, asks: ['after', 'before'], choices: 4 },
] as const;

export const mathNeighbors: ChallengeType<NeighborsData> = {
  id: 'math.neighbors',
  subject: 'math',
  skills: ['math.number-sequence'],
  levels: LEVELS.length,
  levelInfo: [
    lv('preschool', 'grade1', 'ni.op.zaehlen'),
    lv('preschool', 'grade1', 'ni.op.zaehlen', 'ni.ma2.vergleichen'),
    lv('grade1', 'grade1', 'ni.ma2.vergleichen'),
    lv('grade1', 'grade2', 'ni.ma2.vergleichen', 'ni.ma2.zahlen-100'),
  ],
  generate({ rng, level }) {
    const cfg = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1]!;
    const ask = rng.pick(cfg.asks);
    // The answer stays in 1..max; the shown number too.
    const n = ask === 'after' ? rng.int(1, cfg.max - 1) : rng.int(2, cfg.max);
    const answer = ask === 'after' ? n + 1 : n - 1;
    const { choices, correctChoiceId } = numberChoices(rng, answer, cfg.choices, 1, cfg.max);
    return {
      typeId: 'math.neighbors',
      level,
      data: { n, ask, answer },
      choices,
      correctChoiceId,
      prompt: { key: `math.neighbors.prompt-${ask}`, params: { n } },
      explanation: { key: `math.neighbors.explain-${ask}`, params: { n, m: answer } },
    };
  },
};
