import { numberWord } from './numbers';

/** German clock times as children learn them (KC Ma Jg. 2: volle Stunde, halb, viertel nach/vor). */
export const CLOCK_MINUTES = [0, 15, 30, 45] as const;
/** Grades 3–4 (M15): every 5 minutes, read like a digital clock ("3:25 Uhr"). */
export const FIVE_MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
export type ClockMinute = number;
const QUARTERS: readonly number[] = CLOCK_MINUTES;

const next = (h: number) => (h % 12) + 1;

/** Shown on the answer buttons: "3 Uhr", "halb 4", "Viertel nach 3", "Viertel vor 4". */
export function clockLabel(hour: number, minute: ClockMinute, digital = false): string {
  if (digital || !QUARTERS.includes(minute)) return `${hour}:${String(minute).padStart(2, '0')} Uhr`;
  if (minute === 0) return `${hour} Uhr`;
  if (minute === 30) return `halb ${next(hour)}`;
  if (minute === 15) return `Viertel nach ${hour}`;
  return `Viertel vor ${next(hour)}`;
}

/** Spoken: "drei Uhr", "halb vier" (number words read better than digits). */
export function clockSpoken(hour: number, minute: ClockMinute, digital = false): string {
  const w = (n: number) => (n === 1 ? 'eins' : numberWord(n));
  if (digital || !QUARTERS.includes(minute)) {
    return minute === 0 ? `${hour === 1 ? 'ein' : numberWord(hour)} Uhr` : `${hour === 1 ? 'ein' : numberWord(hour)} Uhr ${numberWord(minute)}`;
  }
  if (minute === 0) return `${hour === 1 ? 'ein' : numberWord(hour)} Uhr`;
  if (minute === 30) return `halb ${w(next(hour))}`;
  if (minute === 15) return `Viertel nach ${w(hour)}`;
  return `Viertel vor ${w(next(hour))}`;
}

export const ALL_CLOCK_TIMES = Array.from({ length: 12 }, (_, i) => i + 1).flatMap((hour) =>
  CLOCK_MINUTES.map((minute) => ({ hour, minute })),
);

/** Grades 3–4: every 5 minutes, read digitally. */
export const DIGITAL_CLOCK_TIMES = Array.from({ length: 12 }, (_, i) => i + 1).flatMap((hour) =>
  FIVE_MINUTES.map((minute) => ({ hour, minute })),
);
