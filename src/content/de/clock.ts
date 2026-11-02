import { numberWord } from './numbers';

/** German clock times as children learn them (KC Ma Jg. 2: volle Stunde, halb, viertel nach/vor). */
export const CLOCK_MINUTES = [0, 15, 30, 45] as const;
export type ClockMinute = (typeof CLOCK_MINUTES)[number];

const next = (h: number) => (h % 12) + 1;

/** Shown on the answer buttons: "3 Uhr", "halb 4", "Viertel nach 3", "Viertel vor 4". */
export function clockLabel(hour: number, minute: ClockMinute): string {
  if (minute === 0) return `${hour} Uhr`;
  if (minute === 30) return `halb ${next(hour)}`;
  if (minute === 15) return `Viertel nach ${hour}`;
  return `Viertel vor ${next(hour)}`;
}

/** Spoken: "drei Uhr", "halb vier" (number words read better than digits). */
export function clockSpoken(hour: number, minute: ClockMinute): string {
  const w = (n: number) => (n === 1 ? 'eins' : numberWord(n));
  if (minute === 0) return `${hour === 1 ? 'ein' : numberWord(hour)} Uhr`;
  if (minute === 30) return `halb ${w(next(hour))}`;
  if (minute === 15) return `Viertel nach ${w(hour)}`;
  return `Viertel vor ${w(next(hour))}`;
}

export const ALL_CLOCK_TIMES = Array.from({ length: 12 }, (_, i) => i + 1).flatMap((hour) =>
  CLOCK_MINUTES.map((minute) => ({ hour, minute })),
);
