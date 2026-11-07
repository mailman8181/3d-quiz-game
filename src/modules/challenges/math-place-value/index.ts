import { bigNumberChoices, numberChoices } from '../../../core/challenges/choices';
import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';

/**
 * Tens sticks and ones cubes — "Welche Zahl ist das?"; level 4 asks back: "Wie viele Zehner
 * hat 47?". KC Ma Ende Jg. 2: "stellen Zahlen im Zehnersystem dar (Bündeln, Stellenwert)",
 * 2024 draft: "Stufenschrift 46 → 4Z 6E".
 */
export interface PlaceValueData {
  number: number;
  /** number: read the blocks; tens: how many tens; place: the digit at `place` (grades 3–4). */
  ask: 'number' | 'tens' | 'place';
  /** For ask 'place': 2 = hundreds, 3 = thousands. */
  place?: 2 | 3;
}

const LEVELS = [
  { min: 11, max: 20, ask: 'number', choices: 3 },
  { min: 21, max: 50, ask: 'number', choices: 4 },
  { min: 51, max: 99, ask: 'number', choices: 4 },
  { min: 21, max: 99, ask: 'tens', choices: 4 },
  // Grades 3–4 (M15): hundreds plates up to 999, then the digit at a place up to 99 999.
  { min: 101, max: 999, ask: 'number', choices: 4 },
  { min: 1001, max: 99_999, ask: 'place', choices: 4 },
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
    lv('grade3', 'grade3', 'ni.ma4.zahlen'),
    lv('grade4', undefined, 'ni.ma4.zahlen'),
  ],
  generate({ rng, level }): ChallengeInstance<PlaceValueData> {
    const cfg = LEVELS[Math.min(Math.max(level, 1), LEVELS.length) - 1]!;
    if (cfg.ask === 'place') {
      const number = rng.int(cfg.min, cfg.max);
      const place = rng.pick([2, 3] as const);
      const digit = Math.floor(number / 10 ** place) % 10;
      // Distractors: the number's other digits first (the classic "wrong column" mistake).
      const others = [...new Set(String(number).split('').map(Number))].filter((d) => d !== digit);
      const values = new Set<number>([digit]);
      for (const d of rng.shuffle(others)) if (values.size < cfg.choices) values.add(d);
      while (values.size < cfg.choices) values.add(rng.int(0, 9));
      const ordered = [...values].sort((a, b) => a - b);
      const choices = ordered.map((value, i) => ({ id: `c${i}`, value }));
      return {
        typeId: 'math.place-value',
        level,
        data: { number, ask: 'place', place },
        choices,
        correctChoiceId: choices.find((c) => c.value === digit)!.id,
        prompt: { key: 'math.place-value.prompt-place', params: { place } },
        promptDisplay: { key: 'math.place-value.prompt-place', params: { place } },
        explanation: { key: 'math.place-value.explain-big' },
      };
    }
    // Avoid round tens on "number" levels (no ones cubes looks like a trick question).
    let number = rng.int(cfg.min, cfg.max);
    if (cfg.ask === 'number' && number % 10 === 0 && number < cfg.max) number++;
    const tens = Math.floor(number / 10);
    const answer = cfg.ask === 'tens' ? tens : number;
    if (number >= 100) {
      // Hundreds (grade 3): the same task with plates; spoken generically (numbers on screen).
      const { choices, correctChoiceId } = bigNumberChoices(rng, number, cfg.choices, cfg.min, cfg.max);
      return {
        typeId: 'math.place-value',
        level,
        data: { number, ask: 'number' },
        choices,
        correctChoiceId,
        prompt: { key: 'math.place-value.prompt-hundreds' },
        explanation: { key: 'math.place-value.explain-big' },
      };
    }
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
