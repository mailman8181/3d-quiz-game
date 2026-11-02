import { type ChallengeType, lv } from '../../../core/challenges/types';
import { type ClockMinute } from '../../../content/de/clock';
import { arrange, clampLevel, quizChoices } from '../knowledge/common';

/**
 * "Wie spät ist es?" — read an analogue clock (KC Ma Ende Jg. 2: "lesen Uhrzeiten von
 * analogen Uhren ab (viertel nach, halb, viertel vor, volle Stunde)").
 * Distractors are the classic mix-ups: halb 4 vs. halb 3, Viertel nach vs. Viertel vor.
 */
export interface ClockTime {
  hour: number;
  minute: ClockMinute;
}

export interface ClockData {
  time: ClockTime;
  options: ClockTime[];
}

const wrap = (h: number) => ((h - 1 + 12) % 12) + 1;
const same = (a: ClockTime, b: ClockTime) => a.hour === b.hour && a.minute === b.minute;

export const mathClock: ChallengeType<ClockData> = {
  id: 'math.clock',
  subject: 'math',
  skills: ['math.time'],
  levels: 3,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.ma2.uhr'),
    lv('grade1', 'grade2', 'ni.ma2.uhr'),
    lv('grade2', 'grade2', 'ni.ma2.uhr'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const hour = rng.int(1, 12);
    const minute: ClockMinute = l === 1 ? 0 : l === 2 ? rng.pick([0, 30] as const) : rng.pick([15, 45] as const);
    const time = { hour, minute };
    const candidates: ClockTime[] =
      l === 1
        ? [{ hour: wrap(hour + 1), minute: 0 }, { hour: wrap(hour - 1), minute: 0 }, { hour: wrap(hour + 6), minute: 0 }]
        : l === 2
          ? [
              { hour: wrap(hour + 1), minute: 0 },
              { hour: wrap(hour - 1), minute: 30 },
              { hour: wrap(hour + 1), minute: 30 },
              { hour, minute: minute === 0 ? 30 : 0 },
            ]
          : [
              { hour, minute: minute === 15 ? 45 : 15 },
              { hour: wrap(hour + 1), minute: 15 },
              { hour: wrap(hour - 1), minute: 45 },
              { hour, minute: 30 },
            ];
    const distractors: ClockTime[] = [];
    for (const c of rng.shuffle(candidates)) {
      if (distractors.length >= (l === 1 ? 2 : 3)) break;
      if (!same(c, time) && !distractors.some((d) => same(d, c))) distractors.push(c);
    }
    const { options, correctIndex } = arrange(rng, time, distractors);
    return {
      typeId: 'math.clock',
      level,
      data: { time, options },
      choices: quizChoices(options),
      correctChoiceId: `c${correctIndex}`,
      prompt: { key: 'math.clock.prompt' },
      explanation: { key: 'math.clock.explain', params: { hour, minute } },
    };
  },
};
