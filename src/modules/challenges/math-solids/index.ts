import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
import { SOLIDS, type Solid } from '../../../content/de/solids';
import { arrange, clampLevel, quizChoices } from '../knowledge/common';

/**
 * Solids: name the drawn solid (Würfel, Quader, Kugel, Zylinder; then Pyramide, Kegel), then
 * "Wie viele Ecken hat der Würfel?" (KC Ma Raum und Form, Ende Jg. 2 → Jg. 4).
 */
export interface SolidsData {
  solid: Solid['id'];
  ask: 'name' | 'corners' | 'edges' | 'faces';
  /** Answer cards: solid names, or numbers. */
  options: string[];
}

export const mathSolids: ChallengeType<SolidsData> = {
  id: 'math.solids',
  subject: 'math',
  skills: ['math.geometry'],
  levels: 3,
  levelInfo: [
    lv('grade2', 'grade3', 'ni.ma4.koerper'),
    lv('grade3', 'grade4', 'ni.ma4.koerper'),
    lv('grade4', undefined, 'ni.ma4.koerper'),
  ],
  generate({ rng, level }): ChallengeInstance<SolidsData> {
    const l = clampLevel(level, 3);
    if (l === 3) {
      const solid = rng.pick(SOLIDS.filter((s) => s.counts));
      const ask = rng.pick(['corners', 'edges', 'faces'] as const);
      const right = solid.counts![ask];
      // Other properties of the same solid are the tempting mix-ups (8 Ecken vs 12 Kanten).
      const others = [...new Set([...Object.values(solid.counts!), right + 1, right - 1].filter((v) => v !== right && v > 0))];
      const { options, correctIndex } = arrange(rng, right, rng.shuffle(others).slice(0, 3));
      return {
        typeId: 'math.solids',
        level,
        data: { solid: solid.id, ask, options: options.map(String) },
        choices: quizChoices(options),
        correctChoiceId: `c${correctIndex}`,
        prompt: { key: 'math.solids.prompt-count', params: { solid: solid.id, ask } },
        explanation: { key: 'math.solids.explain-count', params: { solid: solid.id, ask } },
      };
    }
    const pool = SOLIDS.filter((s) => s.level <= l);
    const solid = rng.pick(pool);
    const { options, correctIndex } = arrange(rng, solid, rng.shuffle(pool.filter((s) => s.id !== solid.id)).slice(0, l === 1 ? 2 : 3));
    return {
      typeId: 'math.solids',
      level,
      data: { solid: solid.id, ask: 'name', options: options.map((s) => s.name) },
      choices: quizChoices(options),
      correctChoiceId: `c${correctIndex}`,
      prompt: { key: 'math.solids.prompt-name' },
      explanation: { key: 'math.solids.explain-name', params: { solid: solid.id } },
    };
  },
};
