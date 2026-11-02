import { type ChallengeType, lv } from '../../../core/challenges/types';
import { de } from '../../../content/de/strings';
import { clampLevel } from '../knowledge/common';

/**
 * A bag of coloured balls: "Du ziehst ohne hinzusehen eine Kugel. Ist es sicher, möglich
 * oder unmöglich, dass sie rot ist?" (KC Ma Ende Jg. 2, Daten und Zufall: "stellen
 * Vermutungen zur Eintrittswahrscheinlichkeit an (sicher, möglich, unmöglich)").
 */
export const BALL_COLOURS = ['red', 'blue', 'yellow', 'green'] as const;
export type BallColour = (typeof BALL_COLOURS)[number];
export const CHANCE_ANSWERS = ['certain', 'possible', 'impossible'] as const;
export type ChanceAnswer = (typeof CHANCE_ANSWERS)[number];

export interface ChanceData {
  balls: BallColour[];
  target: BallColour;
  answer: ChanceAnswer;
}

export const mathChance: ChallengeType<ChanceData> = {
  id: 'math.chance',
  subject: 'math',
  skills: ['math.chance'],
  levels: 3,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.ma2.zufall'),
    lv('grade1', 'grade2', 'ni.ma2.zufall'),
    lv('grade2', 'grade2', 'ni.ma2.zufall'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const answer: ChanceAnswer = l === 1 ? rng.pick(['certain', 'impossible'] as const) : rng.pick(CHANCE_ANSWERS);
    const target = rng.pick(BALL_COLOURS);
    const others = BALL_COLOURS.filter((c) => c !== target);
    const size = l === 3 ? rng.int(6, 9) : rng.int(3, 6);
    let balls: BallColour[];
    if (answer === 'certain') balls = Array.from({ length: size }, () => target);
    else if (answer === 'impossible') {
      const palette = rng.shuffle(others).slice(0, l === 1 ? 1 : 2);
      balls = Array.from({ length: size }, () => rng.pick(palette));
    } else {
      // Possible: at least one target ball; level 3 makes it a rare one.
      const hits = l === 3 ? 1 : rng.int(1, size - 1);
      const palette = rng.shuffle(others).slice(0, 2);
      balls = rng.shuffle([...Array.from({ length: hits }, () => target), ...Array.from({ length: size - hits }, () => rng.pick(palette))]);
    }
    return {
      typeId: 'math.chance',
      level,
      data: { balls, target, answer },
      choices: CHANCE_ANSWERS.map((a, i) => ({ id: `c${i}`, value: i, label: de.chance.answers[a] })),
      correctChoiceId: `c${CHANCE_ANSWERS.indexOf(answer)}`,
      prompt: { key: 'math.chance.prompt', params: { colour: target } },
      explanation: { key: `math.chance.explain-${answer}`, params: { colour: target } },
    };
  },
};
