import { type ChallengeType, lv } from '../../../core/challenges/types';
import { POSITION_OBJECTS, POSITIONS, type Position } from '../../../content/de/preschool';
import { arrange, clampLevel, quizChoices } from '../knowledge/common';

/**
 * "Tippe auf das Bild: Der Ball ist unter der Kiste." — position words
 * (OP Raum-Lage-Beziehungen; KC Ma Raum und Form: über, unter, neben, zwischen).
 * Each answer card is a small scene with the same object in a different place.
 */
export interface PositionData {
  object: string;
  scenes: Position[];
}

export const mathPosition: ChallengeType<PositionData> = {
  id: 'math.position',
  subject: 'math',
  skills: ['math.space'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.op.raumlage'),
    lv('preschool', 'grade1', 'ni.op.raumlage', 'ni.ma2.raumlage'),
    lv('preschool', 'grade1', 'ni.ma2.raumlage'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const object = rng.pick(POSITION_OBJECTS);
    // Level 1 without "zwischen"; level 3 shows all four places.
    const pool: Position[] = l === 1 ? ['on', 'under', 'beside'] : [...POSITIONS];
    const target = rng.pick(pool);
    const others = rng.shuffle(pool.filter((p) => p !== target)).slice(0, l === 3 ? 3 : 2);
    const { options, correctIndex } = arrange(rng, target, others);
    return {
      typeId: 'math.position',
      level,
      data: { object: object.id, scenes: options },
      choices: quizChoices(options),
      correctChoiceId: `c${correctIndex}`,
      prompt: { key: 'math.position.prompt', params: { object: object.id, position: target } },
      explanation: { key: 'math.position.explain', params: { object: object.id, position: target } },
    };
  },
};
