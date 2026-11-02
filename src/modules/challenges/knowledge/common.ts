import type { Rng } from '../../../core/rng';

/**
 * Shared data shape for the "Wissen" challenges (roadmap M11b): an optional big picture
 * and answer cards with an emoji, a coloured shape or a word. Choice value = option index.
 */
export interface QuizOption {
  label: string;
  emoji?: string;
  /** Coloured shape instead of an emoji (colours & shapes). */
  color?: string;
  shape?: 'circle' | 'triangle' | 'square' | 'star' | 'heart';
  /** Emoji scale relative to the card (1 = fills the card), for "groß und klein". */
  size?: number;
  /** Draw this many dots in pairs under a word/number card (gerade/ungerade). */
  dots?: number;
}

export interface QuizData {
  picture?: string;
  /** Text to read under the picture (word with a gap, riddle, sentence). */
  text?: string;
  options: QuizOption[];
  /** Words on the cards are always visible (word answers) or only as a hint. */
  labels: 'always' | 'hint' | 'never';
  /** Each card has a speaker button that says its name. */
  speakOptions: boolean;
}

/** Puts the correct option among distractors at a random position. */
export function arrange<T>(rng: Rng, correct: T, distractors: readonly T[]): { options: T[]; correctIndex: number } {
  const options = rng.shuffle([correct, ...distractors]);
  return { options, correctIndex: options.indexOf(correct) };
}

export const clampLevel = (level: number, max: number) => Math.min(Math.max(level, 1), max);

export function quizChoices(options: readonly unknown[]) {
  return options.map((_, i) => ({ id: `c${i}`, value: i }));
}
