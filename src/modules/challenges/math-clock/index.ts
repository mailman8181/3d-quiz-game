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
  /** Grades 3–4: answers read like a digital clock ("3:25 Uhr"). */
  digital?: boolean;
}

const wrap = (h: number) => ((h - 1 + 12) % 12) + 1;
const same = (a: ClockTime, b: ClockTime) => a.hour === b.hour && a.minute === b.minute;

export const mathClock: ChallengeType<ClockData> = {
  id: 'math.clock',
  subject: 'math',
  skills: ['math.time'],
  levels: 4,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.ma2.uhr'),
    lv('grade1', 'grade2', 'ni.ma2.uhr'),
    lv('grade2', 'grade2', 'ni.ma2.uhr'),
    lv('grade3', undefined, 'ni.ma4.uhr'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 4);
    const hour = rng.int(1, 12);
    if (l === 4) {
      // Every 5 minutes. Distractors: the hands swapped in mind (minute read as hour),
      // the hour hand read one too far, and the minutes mirrored (25 ↔ 35).
      const minute = rng.int(1, 11) * 5;
      const time = { hour, minute };
      const candidates: ClockTime[] = [
        { hour: wrap(hour + 1), minute },
        { hour, minute: 60 - minute },
        { hour: wrap(minute / 5), minute: hour * 5 === 60 ? 0 : hour * 5 },
        { hour: wrap(hour - 1), minute },
      ];
      const distractors: ClockTime[] = [];
      for (const c of rng.shuffle(candidates)) {
        if (distractors.length >= 3) break;
        if (!same(c, time) && !distractors.some((d) => same(d, c))) distractors.push(c);
      }
      const { options, correctIndex } = arrange(rng, time, distractors);
      return {
        typeId: 'math.clock',
        level,
        data: { time, options, digital: true },
        choices: quizChoices(options),
        correctChoiceId: `c${correctIndex}`,
        prompt: { key: 'math.clock.prompt' },
        explanation: { key: 'math.clock.explain-digital', params: { hour, minute } },
      };
    }
    const minute: ClockMinute = l === 1 ? 0 : l === 2 ? rng.pick([0, 30]) : rng.pick([15, 45]);
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
