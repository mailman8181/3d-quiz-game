import { numberChoices } from '../../../core/challenges/choices';
import { type ChallengeType, lv } from '../../../core/challenges/types';

/**
 * "Zahlenhaus": the roof shows the total, one room is empty — "7 ist 3 und wie viel?"
 * KC Ma Ende Jg. 2: "kennen die Zahlzerlegungen bis 10 auswendig", "zerlegen Zahlen";
 * level 4 makes up to 100 with tens (Ergänzen).
 */
export interface NumberBondsData {
  total: number;
  known: number;
  /** Which room is empty. */
  missing: 'left' | 'right';
  /** Draw the total as dots (hint on low levels). */
  dots: boolean;
}

const LEVELS = [
  { totals: [3, 4, 5, 6], step: 1, choices: 3, dots: true },
  { totals: [10], step: 1, choices: 4, dots: true },
  { totals: [5, 6, 7, 8, 9, 10], step: 1, choices: 4, dots: false },
  { totals: [100], step: 10, choices: 4, dots: false },
] as const;

export const mathNumberBonds: ChallengeType<NumberBondsData> = {
  id: 'math.number-bonds',
  subject: 'math',
  skills: ['math.decomposition'],
  levels: LEVELS.length,
  levelInfo: [
    lv('preschool', 'grade1', 'ni.op.mengen', 'ni.ma2.zerlegen'),
    lv('grade1', 'grade1', 'ni.ma2.zerlegen', 'ni.ma2.einspluseins'),
    lv('grade1', 'grade2', 'ni.ma2.zerlegen'),
    lv('grade2', 'grade2', 'ni.ma2.zerlegen', 'ni.ma2.zahlen-100'),
  ],
  generate({ rng, level }) {
    const cfg = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1]!;
    const total = rng.pick(cfg.totals);
    // Parts are ≥ 1 step (no "10 ist 10 und 0").
    const known = rng.int(1, total / cfg.step - 1) * cfg.step;
    const answer = total - known;
    const { choices, correctChoiceId } =
      cfg.step === 1
        ? numberChoices(rng, answer, cfg.choices, 1, total - 1)
        : tensChoices(rng.shuffle([10, 20, 30, 40, 50, 60, 70, 80, 90].filter((v) => v !== answer)).slice(0, cfg.choices - 1), answer);
    return {
      typeId: 'math.number-bonds',
      level,
      data: { total, known, missing: rng.pick(['left', 'right'] as const), dots: cfg.dots },
      choices,
      correctChoiceId,
      prompt: { key: 'math.number-bonds.prompt', params: { total, known } },
      explanation: { key: 'math.number-bonds.explain', params: { total, known, answer } },
    };
  },
};

function tensChoices(distractors: number[], answer: number) {
  const values = [answer, ...distractors].sort((a, b) => a - b);
  const choices = values.map((value, i) => ({ id: `c${i}`, value }));
  return { choices, correctChoiceId: choices.find((c) => c.value === answer)!.id };
}
