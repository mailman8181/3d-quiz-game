import { type ChallengeType, lv } from '../../../core/challenges/types';
import type { Rng } from '../../../core/rng';
import { arrange, clampLevel, quizChoices } from '../knowledge/common';

/**
 * "Welche Hälfte macht das Bild symmetrisch?" — the left half of a coloured grid is given,
 * the child picks the mirrored right half (KC Ma Ende Jg. 2: "untersuchen Figuren auf
 * Achsensymmetrie", "erstellen einfache symmetrische Muster").
 * Distractors: the un-mirrored copy (the classic mistake), a flipped one, a one-cell change.
 */
export type Half = number[][]; // rows × cols, 0 = empty, 1..3 = colours

export interface SymmetryData {
  left: Half;
  options: Half[];
}

const key = (h: Half) => h.map((r) => r.join('')).join('/');
const mirror = (h: Half) => h.map((r) => [...r].reverse());

const LEVELS = [
  { rows: 3, cols: 2, colours: 1, options: 3 },
  { rows: 4, cols: 3, colours: 2, options: 3 },
  { rows: 4, cols: 3, colours: 3, options: 4 },
] as const;

function randomHalf(rng: Rng, rows: number, cols: number, colours: number): Half {
  for (;;) {
    const h = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rng.int(0, 9) < 5 ? rng.int(1, colours) : 0)));
    // The copy must look different from the mirror: at least one row is not a palindrome.
    const filled = h.flat().filter((c) => c > 0).length;
    if (filled >= 3 && key(h) !== key(mirror(h))) return h;
  }
}

export const mathSymmetry: ChallengeType<SymmetryData> = {
  id: 'math.symmetry',
  subject: 'math',
  skills: ['math.symmetry'],
  levels: LEVELS.length,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.ma2.symmetrie'),
    lv('grade1', 'grade2', 'ni.ma2.symmetrie'),
    lv('grade2', 'grade2', 'ni.ma2.symmetrie'),
  ],
  generate({ rng, level }) {
    const cfg = LEVELS[clampLevel(level, LEVELS.length) - 1]!;
    const left = randomHalf(rng, cfg.rows, cfg.cols, cfg.colours);
    const correct = mirror(left);
    const changed = correct.map((r) => [...r]);
    const r = rng.int(0, cfg.rows - 1);
    const c = rng.int(0, cfg.cols - 1);
    changed[r]![c] = changed[r]![c] === 0 ? 1 : 0;
    const candidates = [left.map((row) => [...row]), [...correct].reverse(), changed];
    const distractors: Half[] = [];
    for (const d of candidates) {
      if (distractors.length >= cfg.options - 1) break;
      if (key(d) !== key(correct) && !distractors.some((x) => key(x) === key(d))) distractors.push(d);
    }
    while (distractors.length < cfg.options - 1) {
      const d = randomHalf(rng, cfg.rows, cfg.cols, cfg.colours);
      if (key(d) !== key(correct) && !distractors.some((x) => key(x) === key(d))) distractors.push(d);
    }
    const { options, correctIndex } = arrange(rng, correct, distractors);
    return {
      typeId: 'math.symmetry',
      level,
      data: { left, options },
      choices: quizChoices(options),
      correctChoiceId: `c${correctIndex}`,
      prompt: { key: 'math.symmetry.prompt' },
      explanation: { key: 'math.symmetry.explain' },
    };
  },
};
