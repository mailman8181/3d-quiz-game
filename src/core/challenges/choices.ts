import type { Rng } from '../rng';
import type { Choice } from './types';

/**
 * Builds `count` unique number choices including `correct`, with distractors close to it
 * (±1, ±2, …) inside [min, max]. Returns ascending choices and the id of the correct one.
 */
export function numberChoices(
  rng: Rng,
  correct: number,
  count: number,
  min: number,
  max: number,
): { choices: Choice[]; correctChoiceId: string } {
  const values = new Set<number>([correct]);
  const near: number[] = [];
  for (let d = 1; d <= max - min && near.length < 12; d++) {
    if (correct - d >= min) near.push(correct - d);
    if (correct + d <= max) near.push(correct + d);
  }
  // Prefer the closest distractors, but shuffle within the nearest few.
  const pool = rng.shuffle(near.slice(0, Math.max(count + 1, 4))).concat(near.slice(Math.max(count + 1, 4)));
  for (const v of pool) {
    if (values.size >= count) break;
    values.add(v);
  }
  // Ascending like a number line: easier for young children than random order.
  const ordered = [...values].sort((a, b) => a - b);
  const choices = ordered.map((value, i) => ({ id: `c${i}`, value }));
  const correctChoiceId = choices.find((c) => c.value === correct)!.id;
  return { choices, correctChoiceId };
}

/**
 * Choices for big numbers (grades 3–4): distractors are place-value mistakes (±10, ±100,
 * ±1000, swapped digits), not ±1, which would be too easy to rule out. Ascending order.
 */
export function bigNumberChoices(rng: Rng, correct: number, count: number, min = 0, max = 999_999): { choices: Choice[]; correctChoiceId: string } {
  const digits = String(correct).split('');
  const swaps: number[] = [];
  for (let i = 0; i + 1 < digits.length; i++) {
    if (digits[i] === digits[i + 1]) continue;
    const d = [...digits];
    [d[i], d[i + 1]] = [d[i + 1]!, d[i]!];
    if (d[0] !== '0') swaps.push(Number(d.join('')));
  }
  const step = correct >= 10_000 ? 1000 : correct >= 1000 ? 100 : 10;
  const pool = rng.shuffle([...new Set([correct + step, correct - step, correct + step * 10, correct - step * 10, ...swaps, correct + 1, correct - 1])]);
  const values = new Set<number>([correct]);
  for (const v of pool) {
    if (values.size >= count) break;
    if (v >= min && v <= max && v !== correct) values.add(v);
  }
  const ordered = [...values].sort((a, b) => a - b);
  const choices = ordered.map((value, i) => ({ id: `c${i}`, value, label: value.toLocaleString('de-DE') }));
  return { choices, correctChoiceId: choices.find((c) => c.value === correct)!.id };
}
