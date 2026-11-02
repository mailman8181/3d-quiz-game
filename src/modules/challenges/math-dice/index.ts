import { numberChoices } from '../../../core/challenges/choices';
import { type ChallengeType, lv } from '../../../core/challenges/types';

/**
 * "Wie viele Punkte siehst du?" — quantities in structured patterns, grasped at a glance
 * instead of counted one by one (OP Mengen erfassen; KC Ma: strukturierte Anzahlen,
 * "quasi-simultan"). Dice faces first, then two dice, then ten-frames up to 20.
 */
export interface DiceData {
  /** Dots per group: one die, two dice, or full ten-frames plus the rest. */
  groups: number[];
  frame: 'dice' | 'ten';
}

const LEVELS = [
  { frame: 'dice', dice: 1, min: 1, max: 6, choices: 3 },
  { frame: 'dice', dice: 2, min: 2, max: 10, choices: 4 },
  { frame: 'ten', dice: 0, min: 11, max: 20, choices: 4 },
] as const;

export const mathDice: ChallengeType<DiceData> = {
  id: 'math.dice',
  subject: 'math',
  skills: ['math.subitizing'],
  levels: LEVELS.length,
  levelInfo: [
    lv('kita', 'preschool', 'ni.op.mengen'),
    lv('preschool', 'grade1', 'ni.op.mengen', 'ni.ma2.strukturiert'),
    lv('grade1', 'grade2', 'ni.ma2.strukturiert'),
  ],
  generate({ rng, level }) {
    const cfg = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1]!;
    let groups: number[];
    if (cfg.frame === 'ten') groups = [10, rng.int(cfg.min - 10, cfg.max - 10)];
    else if (cfg.dice === 1) groups = [rng.int(1, 6)];
    else {
      const a = rng.int(1, 5);
      groups = [a, rng.int(1, Math.min(5, cfg.max - a))];
    }
    const total = groups.reduce((s, n) => s + n, 0);
    const { choices, correctChoiceId } = numberChoices(rng, total, cfg.choices, cfg.dice === 1 ? 1 : 2, cfg.max);
    return {
      typeId: 'math.dice',
      level,
      data: { groups, frame: cfg.frame },
      choices,
      correctChoiceId,
      prompt: { key: 'math.dice.prompt' },
      explanation: { key: 'math.dice.explain', params: { n: total } },
    };
  },
};
