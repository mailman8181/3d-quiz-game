import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
import { arrange, clampLevel, quizChoices } from '../knowledge/common';

/**
 * "Welches Obst mögen die meisten Kinder?" — read a pictogram, then a bar chart, then compare
 * two bars (KC Ma Daten: einfachen Darstellungen / Diagrammen Informationen entnehmen).
 */
export const CHART_FRUITS = [
  { id: 'apple', emoji: '🍎', plural: 'Äpfel' },
  { id: 'banana', emoji: '🍌', plural: 'Bananen' },
  { id: 'pear', emoji: '🍐', plural: 'Birnen' },
  { id: 'strawberry', emoji: '🍓', plural: 'Erdbeeren' },
] as const;
export type ChartFruit = (typeof CHART_FRUITS)[number]['id'];

export interface ChartData {
  values: Record<ChartFruit, number>;
  style: 'pictogram' | 'bars';
  ask: 'most' | 'count' | 'diff';
  /** count: the asked fruit; diff: a minus b. */
  a?: ChartFruit;
  b?: ChartFruit;
  options: string[];
}

export const mathChart: ChallengeType<ChartData> = {
  id: 'math.chart',
  subject: 'math',
  skills: ['math.data'],
  levels: 3,
  levelInfo: [
    lv('grade2', 'grade3', 'ni.ma4.daten'),
    lv('grade3', 'grade4', 'ni.ma4.daten'),
    lv('grade4', undefined, 'ni.ma4.daten'),
  ],
  generate({ rng, level }): ChallengeInstance<ChartData> {
    const l = clampLevel(level, 3);
    // Distinct values, so "the most" is always clear.
    const vals = rng.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
    const values = Object.fromEntries(CHART_FRUITS.map((f, i) => [f.id, vals[i]!])) as Record<ChartFruit, number>;
    const style = l === 1 ? 'pictogram' : 'bars';
    const ask = l === 1 ? rng.pick(['most', 'count'] as const) : l === 2 ? rng.pick(['most', 'count'] as const) : 'diff';
    const base = { values, style } as const;
    if (ask === 'most') {
      const top = CHART_FRUITS.reduce((m, f) => (values[f.id] > values[m.id] ? f : m), CHART_FRUITS[0]);
      const { options, correctIndex } = arrange(rng, top.id as ChartFruit, CHART_FRUITS.filter((f) => f.id !== top.id).map((f) => f.id as ChartFruit).slice(0, 2));
      return {
        typeId: 'math.chart',
        level,
        data: { ...base, ask, options: options.map((id) => `${CHART_FRUITS.find((f) => f.id === id)!.emoji} ${CHART_FRUITS.find((f) => f.id === id)!.plural}`) },
        choices: quizChoices(options),
        correctChoiceId: `c${correctIndex}`,
        prompt: { key: 'math.chart.prompt-most' },
        explanation: { key: 'math.chart.explain-most', params: { fruit: top.id } },
      };
    }
    // "How many more": a must have a smaller fruit to compare with, so never the minimum.
    const min = Math.min(...Object.values(values));
    const a = rng.pick(CHART_FRUITS.filter((f) => ask !== 'diff' || values[f.id] > min)).id as ChartFruit;
    const smaller = CHART_FRUITS.filter((f) => values[f.id] < values[a]);
    const b = ask === 'diff' && smaller.length > 0 ? (rng.pick(smaller).id as ChartFruit) : undefined;
    const isDiff = b !== undefined;
    const right = isDiff ? values[a] - values[b!] : values[a];
    const wrong = [...new Set([right + 1, right - 1, isDiff ? values[a] : right + 2, isDiff ? values[b!] : right - 2])].filter((v) => v !== right && v >= 0);
    const { options, correctIndex } = arrange(rng, right, rng.shuffle(wrong).slice(0, 3));
    return {
      typeId: 'math.chart',
      level,
      data: { ...base, ask: isDiff ? 'diff' : 'count', a, ...(isDiff ? { b } : {}), options: options.map(String) },
      choices: quizChoices(options),
      correctChoiceId: `c${correctIndex}`,
      prompt: isDiff ? { key: 'math.chart.prompt-diff', params: { a, b: b! } } : { key: 'math.chart.prompt-count', params: { fruit: a } },
      explanation: isDiff ? { key: 'math.chart.explain-diff', params: { a, b: b!, n: right } } : { key: 'math.chart.explain-count', params: { fruit: a, n: right } },
    };
  },
};
