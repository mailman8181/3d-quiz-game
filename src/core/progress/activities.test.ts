import { describe, expect, it } from 'vitest';
import { activityOrder, activityProgress } from './activities';

const ids = ['memory', 'jump', 'river'];
const p = (mazesCompleted: number, activityRounds: Record<string, number> = {}) =>
  activityProgress({ ids, profileId: 'kid-1', mazesCompleted, activityRounds });

describe('activity unlocking (ADR-0010)', () => {
  it('nothing before 3 mazes; then the first one', () => {
    expect(p(2)).toEqual({ unlocked: [], missing: 1, mazesNeeded: true });
    expect(p(3).unlocked).toHaveLength(1);
    expect(p(3).missing).toBe(3);
  });

  it('one more per 3 rounds of any kind, until all are open', () => {
    expect(p(4, { memory: 2 }).unlocked).toHaveLength(2);
    expect(p(3, { memory: 5 }).unlocked).toHaveLength(2);
    expect(p(3, { memory: 6 })).toMatchObject({ missing: null });
    expect(p(20).unlocked).toHaveLength(3);
  });

  it('activity rounds alone never unlock the first one', () => {
    expect(p(1, { memory: 10 }).unlocked).toHaveLength(0);
  });

  it('the order is random per child but stable', () => {
    expect(activityOrder(ids, 'kid-1')).toEqual(activityOrder(ids, 'kid-1'));
    const orders = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => activityOrder(ids, id).join()));
    expect(orders.size).toBeGreaterThan(1);
  });
});
