import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
import { CONVERSIONS } from '../../../content/de/units';
import { arrange, clampLevel, quizChoices, type QuizData } from '../knowledge/common';

/**
 * "Wie viele Zentimeter sind 3 Meter?" — converting standard units (KC Ma Ende Jg. 4).
 * Distractors use the wrong factor (×10, ×1000) and one unit too many: the typical mistakes.
 */
export const mathUnits: ChallengeType<QuizData> = {
  id: 'math.units',
  subject: 'math',
  skills: ['math.measures'],
  levels: 2,
  levelInfo: [lv('grade3', 'grade4', 'ni.ma4.groessen'), lv('grade4', undefined, 'ni.ma4.groessen')],
  generate({ rng, level }): ChallengeInstance<QuizData> {
    const l = clampLevel(level, 2);
    const conv = rng.pick(CONVERSIONS.filter((c) => (l === 1 ? c.minStage === 'grade3' : true)));
    const n = rng.int(1, 9);
    const right = n * conv.factor;
    const wrong = [...new Set([n * 10, n * 1000, n * 60, n * 100, (n + 1) * conv.factor])].filter((v) => v !== right);
    const { options, correctIndex } = arrange(rng, right, rng.shuffle(wrong).slice(0, 3));
    return {
      typeId: 'math.units',
      level,
      data: {
        picture: conv.emoji,
        text: `${n} ${conv.from.short} = ? ${conv.to.short}`,
        options: options.map((v) => ({ label: `${v.toLocaleString('de-DE')} ${conv.to.short}` })),
        labels: 'always',
        speakOptions: false,
      },
      choices: quizChoices(options),
      correctChoiceId: `c${correctIndex}`,
      prompt: { key: 'math.units.prompt', params: { conv: conv.id, n } },
      explanation: { key: 'math.units.explain', params: { conv: conv.id, n } },
    };
  },
};
