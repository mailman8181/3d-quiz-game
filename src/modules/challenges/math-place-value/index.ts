import { numberChoices } from '../../../core/challenges/choices';
import { type ChallengeType, lv } from '../../../core/challenges/types';

/**
 * Tens sticks and ones cubes — "Welche Zahl ist das?"; level 4 asks back: "Wie viele Zehner
 * hat 47?". KC Ma Ende Jg. 2: "stellen Zahlen im Zehnersystem dar (Bündeln, Stellenwert)",
 * 2024 draft: "Stufenschrift 46 → 4Z 6E".
 */
export interface PlaceValueData {
  number: number;
  ask: 'number' | 'tens';
}

const LEVELS = [
  { min: 11, max: 20, ask: 'number', choices: 3 },
  { min: 21, max: 50, ask: 'number', choices: 4 },
  { min: 51, max: 99, ask: 'number', choices: 4 },
  { min: 21, max: 99, ask: 'tens', choices: 4 },
] as const;

export const mathPlaceValue: ChallengeType<PlaceValueData> = {
  id: 'math.place-value',
  subject: 'math',
  skills: ['math.place-value'],
  levels: LEVELS.length,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.ma2.stellenwert'),
    lv('grade1', 'grade2', 'ni.ma2.stellenwert', 'ni.ma2.zahlen-100'),
    lv('grade2', 'grade2', 'ni.ma2.stellenwert', 'ni.ma2.zahlen-100'),
    lv('grade2', 'grade2', 'ni.ma2.stellenwert'),
  ],
  generate({ rng, level }) {
    const cfg = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1]!;
    // Avoid round tens on "number" levels (no ones cubes looks like a trick question).
    let number = rng.int(cfg.min, cfg.max);
    if (cfg.ask === 'number' && number % 10 === 0 && number < cfg.max) number++;
    const tens = Math.floor(number / 10);
    const answer = cfg.ask === 'tens' ? tens : number;
    let { choices, correctChoiceId } =
      cfg.ask === 'tens' ? numberChoices(rng, tens, cfg.choices, 1, 9) : numberChoices(rng, number, cfg.choices, cfg.min, cfg.max);
    // "Number" levels: the digit-swap twin (47 ↔ 74) is the classic place-value mistake.
    const twin = (number % 10) * 10 + tens;
    if (cfg.ask === 'number' && twin !== number && twin >= 10 && !choices.some((c) => c.value === twin)) {
      const values = choices.map((c) => c.value);
      values[values.findIndex((v) => v !== number)] = twin;
      values.sort((a, b) => a - b);
      choices = values.map((value, i) => ({ id: `c${i}`, value }));
      correctChoiceId = choices.find((c) => c.value === answer)!.id;
    }
    return {
      typeId: 'math.place-value',
      level,
      data: { number, ask: cfg.ask },
      choices,
      correctChoiceId,
      prompt: cfg.ask === 'tens' ? { key: 'math.place-value.prompt-tens', params: { n: number } } : { key: 'math.place-value.prompt' },
      explanation: { key: 'math.place-value.explain', params: { n: number } },
    };
  },
};
