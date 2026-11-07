import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { createMemory, flip, hideOpen, isDone, memoryLayout, type MemoryState } from './memory';

const pictures = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨'].map((emoji, i) => ({ emoji, label: `Tier ${i}` }));

const solveAll = (start: MemoryState) => {
  let s = start;
  const events: string[] = [];
  const byPair = new Map<string, string[]>();
  for (const c of s.cards) byPair.set(c.pairId, [...(byPair.get(c.pairId) ?? []), c.id]);
  for (const [a, b] of byPair.values()) {
    s = flip(s, a!).state;
    const r = flip(s, b!);
    s = r.state;
    events.push(r.event.kind);
  }
  return { s, events };
};

describe('memory', () => {
  it('builds pairs: chests + pictures, every card twice, layout by stage', () => {
    for (const stage of ['kita', 'preschool', 'grade1', null] as const) {
      const { cols, rows, chests } = memoryLayout(stage);
      const m = createMemory(createRng(1), pictures, (cols * rows) / 2, chests);
      expect(m.cards).toHaveLength(cols * rows);
      const chestCards = m.cards.filter((c) => c.face.kind === 'chest');
      expect(chestCards).toHaveLength(chests * 2);
      // Chest pairs look different from each other (emblem).
      const emblems = new Set(chestCards.map((c) => (c.face.kind === 'chest' ? c.face.emblem : '')));
      expect(emblems.size).toBe(chests);
    }
  });

  it('matches pairs, reports chest pairs, ends when all are found', () => {
    const m = createMemory(createRng(7), pictures, 6, 3);
    const { s, events } = solveAll(m);
    expect(events.every((e) => e === 'match')).toBe(true);
    expect(isDone(s)).toBe(true);
  });

  it('a mismatch stays open until hidden or the next tap; matched cards ignore taps', () => {
    const m = createMemory(createRng(3), pictures, 6, 3);
    const [a, b] = [m.cards[0]!, m.cards.find((c) => c.pairId !== m.cards[0]!.pairId)!];
    let s = flip(m, a.id).state;
    const r = flip(s, b.id);
    expect(r.event.kind).toBe('mismatch');
    s = r.state;
    expect(s.open).toHaveLength(2);
    expect(hideOpen(s).open).toHaveLength(0);
    // A third tap hides the two and opens the new one.
    const third = m.cards.find((c) => c.id !== a.id && c.id !== b.id)!;
    expect(flip(s, third.id).state.open).toEqual([third.id]);
    expect(flip(s, a.id).event.kind).toBe('ignored');
  });

  it('match event carries the chest index for chest pairs only', () => {
    const m = createMemory(createRng(5), pictures, 6, 3);
    const chestCard = m.cards.find((c) => c.face.kind === 'chest')!;
    const twin = m.cards.find((c) => c.pairId === chestCard.pairId && c.id !== chestCard.id)!;
    const r = flip(flip(m, chestCard.id).state, twin.id);
    expect(r.event).toMatchObject({ kind: 'match', chest: chestCard.face.kind === 'chest' ? chestCard.face.chest : -1 });
  });
});
