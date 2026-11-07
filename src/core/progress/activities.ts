import { createRng } from '../rng';

/**
 * Activity unlocking (ADR-0010, owner decision): the first activity after 3 finished mazes,
 * then one more per 3 finished rounds of any kind; order random per child but fixed.
 */
export const FIRST_UNLOCK_MAZES = 3;
export const ROUNDS_PER_UNLOCK = 3;

/** FNV-1a: a stable number from a profile id, to seed the per-child order. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function activityOrder(ids: readonly string[], profileId: string): string[] {
  return createRng(hashString(`activities:${profileId}`)).shuffle(ids);
}

export interface ActivityProgress {
  /** Unlocked activity ids, in unlock order. */
  unlocked: string[];
  /** Rounds (or mazes, see `mazesNeeded`) until the next unlock; null when all are open. */
  missing: number | null;
  /** True while the first unlock still waits for mazes specifically. */
  mazesNeeded: boolean;
}

export function activityProgress(input: {
  /** Activity ids except the always-open maze. */
  ids: readonly string[];
  profileId: string;
  mazesCompleted: number;
  activityRounds: Readonly<Record<string, number>>;
}): ActivityProgress {
  const { ids, mazesCompleted } = input;
  const rounds = mazesCompleted + Object.values(input.activityRounds).reduce((s, n) => s + n, 0);
  const earned = mazesCompleted < FIRST_UNLOCK_MAZES ? 0 : 1 + Math.floor((rounds - FIRST_UNLOCK_MAZES) / ROUNDS_PER_UNLOCK);
  const count = Math.min(ids.length, earned);
  const unlocked = activityOrder(ids, input.profileId).slice(0, count);
  if (count >= ids.length) return { unlocked, missing: null, mazesNeeded: false };
  if (mazesCompleted < FIRST_UNLOCK_MAZES) return { unlocked, missing: FIRST_UNLOCK_MAZES - mazesCompleted, mazesNeeded: true };
  return { unlocked, missing: ROUNDS_PER_UNLOCK - ((rounds - FIRST_UNLOCK_MAZES) % ROUNDS_PER_UNLOCK), mazesNeeded: false };
}
