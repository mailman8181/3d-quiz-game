import { numberChoices } from '../../../core/challenges/choices';
import { type ChallengeType, lv } from '../../../core/challenges/types';
import type { Rng } from '../../../core/rng';
import { de } from '../../../content/de/strings';

/**
 * "Wie viel Geld ist das?" — coins and notes (KC Ma Ende Jg. 2: "erfassen, stellen dar,
 * wechseln und vergleichen Geldbeträge", Einheiten € und ct). Euro amounts first, then cents.
 */
export interface MoneyData {
  /** Coin/note values in the shown unit (euro or cent). */
  items: number[];
  unit: 'euro' | 'cent';
}

const LEVELS: readonly { unit: 'euro' | 'cent'; values: readonly number[]; max: number; count: [number, number]; choices: number }[] = [
  { unit: 'euro', values: [1, 2], max: 10, count: [2, 4], choices: 3 },
  { unit: 'euro', values: [1, 2, 5, 10], max: 20, count: [2, 4], choices: 4 },
  { unit: 'cent', values: [10, 20, 50], max: 100, count: [2, 4], choices: 4 },
];

function pickItems(rng: Rng, values: readonly number[], max: number, count: number): number[] {
  const items: number[] = [];
  for (let i = 0; i < count; i++) {
    const fitting = values.filter((v) => items.reduce((s, x) => s + x, 0) + v <= max);
    if (fitting.length === 0) break;
    items.push(rng.pick(fitting));
  }
  // Biggest first, like counting money.
  return items.sort((a, b) => b - a);
}

export const mathMoney: ChallengeType<MoneyData> = {
  id: 'math.money',
  subject: 'math',
  skills: ['math.money'],
  levels: LEVELS.length,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.ma2.geld'),
    lv('grade1', 'grade2', 'ni.ma2.geld'),
    lv('grade2', 'grade2', 'ni.ma2.geld'),
  ],
  generate({ rng, level }) {
    const cfg = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1]!;
    const items = pickItems(rng, cfg.values, cfg.max, rng.int(cfg.count[0], cfg.count[1]));
    const total = items.reduce((s, x) => s + x, 0);
    const step = cfg.unit === 'cent' ? 10 : 1;
    const { choices, correctChoiceId } = numberChoices(rng, total / step, cfg.choices, 1, cfg.max / step);
    const label = cfg.unit === 'cent' ? de.money.cent : de.money.euro;
    return {
      typeId: 'math.money',
      level,
      data: { items, unit: cfg.unit },
      choices: choices.map((c) => ({ ...c, value: c.value * step, label: label(c.value * step) })),
      correctChoiceId,
      prompt: { key: 'math.money.prompt' },
      explanation: { key: `math.money.explain-${cfg.unit}`, params: { n: total } },
    };
  },
};
