import { bigNumberChoices, numberChoices } from '../../../core/challenges/choices';
import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';

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
  // M15 (grade 3): up to 1000, mostly across tens and hundreds (399 → 400).
  { max: 1000, asks: ['after', 'before'], choices: 4 },
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
    lv('grade3', 'grade3', 'ni.ma4.zahlen'),
  ],
  generate({ rng, level }): ChallengeInstance<NeighborsData> {
    const cfg = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1]!;
    const ask = rng.pick(cfg.asks);
    if (cfg.max > 100) {
      // The interesting crossings: …99 → …00 and …00 → …99.
      const h = rng.int(1, 9) * 100;
      const n = ask === 'after' ? rng.pick([h - 1, h + 9, h + 49, rng.int(101, 998)]) : rng.pick([h, h + 10, h + 50, rng.int(102, 999)]);
      const answer = ask === 'after' ? n + 1 : n - 1;
      const { choices, correctChoiceId } = bigNumberChoices(rng, answer, cfg.choices, 1, 1000);
      return {
        typeId: 'math.neighbors',
        level,
        data: { n, ask, answer },
        choices,
        correctChoiceId,
        prompt: { key: `math.neighbors.prompt-${ask}-big` },
        explanation: { key: 'math.neighbors.explain-big' },
      };
    }
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
