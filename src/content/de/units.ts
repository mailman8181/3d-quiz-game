import type { StageId } from '../../core/learner/stage';

/**
 * Unit conversions for grades 3–4 (KC Ma Ende Jg. 4: Standardeinheiten umwandeln, z. B.
 * 1 l = 1000 ml, 1 kg = 1000 g, 1 h = 60 min). Names in German: [singular, plural], short form.
 */
export interface Conversion {
  id: string;
  from: { one: string; many: string; short: string };
  to: { one: string; many: string; short: string };
  factor: number;
  emoji: string;
  minStage: StageId;
}

export const CONVERSIONS: readonly Conversion[] = [
  { id: 'm-cm', from: { one: 'Meter', many: 'Meter', short: 'm' }, to: { one: 'Zentimeter', many: 'Zentimeter', short: 'cm' }, factor: 100, emoji: '📏', minStage: 'grade3' },
  { id: 'h-min', from: { one: 'Stunde', many: 'Stunden', short: 'h' }, to: { one: 'Minute', many: 'Minuten', short: 'min' }, factor: 60, emoji: '⏰', minStage: 'grade3' },
  { id: 'eur-ct', from: { one: 'Euro', many: 'Euro', short: '€' }, to: { one: 'Cent', many: 'Cent', short: 'ct' }, factor: 100, emoji: '💶', minStage: 'grade3' },
  { id: 'km-m', from: { one: 'Kilometer', many: 'Kilometer', short: 'km' }, to: { one: 'Meter', many: 'Meter', short: 'm' }, factor: 1000, emoji: '🛣️', minStage: 'grade4' },
  { id: 'kg-g', from: { one: 'Kilogramm', many: 'Kilogramm', short: 'kg' }, to: { one: 'Gramm', many: 'Gramm', short: 'g' }, factor: 1000, emoji: '⚖️', minStage: 'grade4' },
  { id: 'l-ml', from: { one: 'Liter', many: 'Liter', short: 'l' }, to: { one: 'Milliliter', many: 'Milliliter', short: 'ml' }, factor: 1000, emoji: '🥛', minStage: 'grade4' },
  { id: 'min-s', from: { one: 'Minute', many: 'Minuten', short: 'min' }, to: { one: 'Sekunde', many: 'Sekunden', short: 's' }, factor: 60, emoji: '⏱️', minStage: 'grade4' },
];

/** "1 Meter", "3 Stunden". */
export const amount = (n: number, unit: { one: string; many: string }) => `${n} ${n === 1 ? unit.one : unit.many}`;
