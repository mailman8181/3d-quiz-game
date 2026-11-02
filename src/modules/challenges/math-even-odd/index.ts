import { type ChallengeType, lv } from '../../../core/challenges/types';
import { arrange, clampLevel, quizChoices, type QuizData } from '../knowledge/common';

/**
 * "Tippe auf die gerade Zahl!" — one number of the asked kind among others
 * (KC Ma 2024 draft, Ende Jg. 2: "erkennen gerade und ungerade Zahlen"). Level 1 shows the
 * numbers as dot pairs, so "gerade" is visible: every dot has a partner.
 */
const LEVELS = [
  { max: 10, pairs: true },
  { max: 20, pairs: false },
  { max: 100, pairs: false },
] as const;

export const mathEvenOdd: ChallengeType<QuizData> = {
  id: 'math.even-odd',
  subject: 'math',
  skills: ['math.number-properties'],
  levels: LEVELS.length,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.ma2.gerade'),
    lv('grade1', 'grade2', 'ni.ma2.gerade'),
    lv('grade2', 'grade2', 'ni.ma2.gerade', 'ni.ma2.zahlen-100'),
  ],
  generate({ rng, level }) {
    const cfg = LEVELS[clampLevel(level, LEVELS.length) - 1]!;
    const ask = rng.pick(['even', 'odd'] as const);
    const isAsked = (n: number) => (n % 2 === 0) === (ask === 'even');
    const target = rng.pick(Array.from({ length: cfg.max }, (_, i) => i + 1).filter(isAsked));
    const others: number[] = [];
    while (others.length < 2) {
      const n = rng.int(1, cfg.max);
      if (!isAsked(n) && !others.includes(n)) others.push(n);
    }
    const { options, correctIndex } = arrange(rng, target, others);
    return {
      typeId: 'math.even-odd',
      level,
      data: {
        options: options.map((n) => ({ label: String(n), ...(cfg.pairs ? { dots: n } : {}) })),
        labels: 'always',
        speakOptions: false,
      },
      choices: quizChoices(options),
      correctChoiceId: `c${correctIndex}`,
      prompt: { key: `math.even-odd.prompt-${ask}` },
      explanation: { key: `math.even-odd.explain-${ask}`, params: { n: target } },
    };
  },
};
