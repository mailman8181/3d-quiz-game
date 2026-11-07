import { numberChoices } from '../../../core/challenges/choices';
import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
import type { Rng } from '../../../core/rng';
import { clampLevel } from '../knowledge/common';

/**
 * A figure on squared paper: "Wie viele Kästchen groß ist die Fläche?", later "Wie lang ist
 * der Rand?" (KC Ma Ende Jg. 4: Flächeninhalt durch Auslegen, Umfang; unterscheiden).
 */
export interface AreaData {
  cols: number;
  rows: number;
  /** Filled cells as "x,y". */
  cells: string[];
  ask: 'area' | 'perimeter';
  answer: number;
}

const COLS = 6;
const ROWS = 5;

/** A connected figure grown cell by cell from the middle. */
function growFigure(rng: Rng, size: number): Set<string> {
  const cells = new Set<string>([`${Math.floor(COLS / 2)},${Math.floor(ROWS / 2)}`]);
  while (cells.size < size) {
    const [x, y] = rng.pick([...cells]).split(',').map(Number) as [number, number];
    const [dx, dy] = rng.pick([[1, 0], [-1, 0], [0, 1], [0, -1]] as const);
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) cells.add(`${nx},${ny}`);
  }
  return cells;
}

export function perimeter(cells: ReadonlySet<string>): number {
  let edges = 0;
  for (const c of cells) {
    const [x, y] = c.split(',').map(Number) as [number, number];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!cells.has(`${x + dx!},${y + dy!}`)) edges++;
  }
  return edges;
}

export const mathArea: ChallengeType<AreaData> = {
  id: 'math.area',
  subject: 'math',
  skills: ['math.geometry'],
  levels: 3,
  levelInfo: [
    lv('grade2', 'grade3', 'ni.ma4.flaeche'),
    lv('grade3', 'grade4', 'ni.ma4.flaeche'),
    lv('grade4', undefined, 'ni.ma4.flaeche'),
  ],
  generate({ rng, level }): ChallengeInstance<AreaData> {
    const l = clampLevel(level, 3);
    const cells = growFigure(rng, l === 1 ? rng.int(4, 8) : rng.int(6, 12));
    const ask = l === 1 ? 'area' : l === 2 ? rng.pick(['area', 'perimeter'] as const) : 'perimeter';
    const answer = ask === 'area' ? cells.size : perimeter(cells);
    // Perimeter: the area is the classic wrong answer, so offer it.
    let { choices, correctChoiceId } = numberChoices(rng, answer, 4, 1, 40);
    if (ask === 'perimeter' && !choices.some((c) => c.value === cells.size) && cells.size !== answer) {
      const values = choices.map((c) => c.value);
      values[values.findIndex((v) => v !== answer)] = cells.size;
      values.sort((a, b) => a - b);
      choices = values.map((value, i) => ({ id: `c${i}`, value }));
      correctChoiceId = choices.find((c) => c.value === answer)!.id;
    }
    return {
      typeId: 'math.area',
      level,
      data: { cols: COLS, rows: ROWS, cells: [...cells], ask, answer },
      choices,
      correctChoiceId,
      prompt: { key: `math.area.prompt-${ask}` },
      explanation: { key: `math.area.explain-${ask}`, params: { n: answer } },
    };
  },
};
