import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import {
  AVATAR_WIDTH,
  BLOCK_SIZE,
  createCourse,
  floorAt,
  HIGH_CHEST_Y,
  initialJump,
  jumpLayout,
  PLATFORM_Y,
  step,
  type Course,
  type JumpEvent,
  type JumpInput,
  type JumpState,
} from './jump';

const RIGHT: JumpInput = { left: false, right: true, jump: false };
const STILL: JumpInput = { left: false, right: false, jump: false };

const run = (course: Course, input: (t: number, s: JumpState) => JumpInput, seconds: number, from = initialJump(course)) => {
  let s = from;
  const events: JumpEvent[] = [];
  for (let t = 0; t < seconds && !s.done; t += 1 / 60) {
    const r = step(course, s, input(t, s), 1 / 60);
    s = r.state;
    events.push(...r.events);
  }
  return { s, events };
};
const kinds = (events: JumpEvent[], kind: JumpEvent['kind']) => events.filter((e) => e.kind === kind);
const empty = (): Course => ({ length: 40, obstacles: [], platforms: [], blocks: [], crawlers: [], chests: [], goalX: 30 });

describe('Hüpf-Abenteuer course', () => {
  it('builds a course per stage: segments never overlap; gold chests sit in leaf blocks', () => {
    for (const stage of ['kita', 'preschool', 'grade2'] as const) {
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        const { chests, obstacles } = jumpLayout(stage);
        const high = Array.from({ length: chests }, (_, i) => i === 0);
        const c = createCourse(createRng(seed), chests, obstacles, high);
        expect(c.chests).toHaveLength(chests);
        const solids = c.obstacles.filter((o) => o.kind !== 'step').length;
        expect(solids + c.crawlers.length).toBe(obstacles);
        expect(c.crawlers.length).toBe(Math.round(obstacles * 0.4));
        // Gold chest 0 is in a block at the bump height; the others are reachable by walking.
        const gold = c.chests.find((x) => x.index === 0)!;
        expect(gold).toMatchObject({ inBlock: true, y: HIGH_CHEST_Y });
        expect(c.blocks).toEqual([{ x: gold.x, y: HIGH_CHEST_Y, chest: 0 }]);
        for (const ch of c.chests.filter((x) => !x.inBlock)) expect([0, 1]).toContain(ch.y);
        // Segments (crawlers with their patrol) keep at least 3 units apart; steps of one
        // staircase touch.
        const spans = [
          ...c.obstacles.map((o) => [o.x, o.x + o.width]),
          ...c.blocks.map((b) => [b.x, b.x + BLOCK_SIZE]),
          ...c.crawlers.map((k) => [k.from, k.to + 0.7]),
          ...c.chests.filter((x) => x.y === 0).map((x) => [x.x, x.x + 0.9]),
        ].sort((a, b) => a[0]! - b[0]!);
        for (let i = 1; i < spans.length; i++) {
          const gap = spans[i]![0]! - spans[i - 1]![1]!;
          expect(Math.abs(gap) < 1e-9 || gap >= 3 - 1e-9, `gap ${gap}`).toBe(true);
        }
        expect(c.goalX).toBeGreaterThan(spans[spans.length - 1]![1]!);
        // Platforms follow an obstacle, never over another segment, and the avatar fits under.
        for (const p of c.platforms) {
          expect(p.y).toBeGreaterThan(1.45);
          const before = c.obstacles.find((o) => o.kind !== 'step' && Math.abs(o.x + o.width + 0.6 - p.x) < 1e-9);
          expect(before).toBeDefined();
          for (const [s0] of spans) if (s0! > p.x) expect(s0! - (p.x + p.width)).toBeGreaterThanOrEqual(3 - 1e-9);
        }
      }
    }
  });
});

describe('Hüpf-Abenteuer physics', () => {
  it('nothing moves without input', () => {
    const c = createCourse(createRng(1), 3, 3, [false, false, false]);
    const { s } = run(c, () => STILL, 3);
    expect(s.x).toBe(1);
  });

  it('only walking right reaches the goal on every course: stumbles and climbs, never a failure', () => {
    for (const seed of [2, 7, 11, 13, 21]) {
      const c = createCourse(createRng(seed), 5, 7, [false, false, true, false, false]);
      const { s, events } = run(c, () => RIGHT, 180);
      expect(s.done, `seed ${seed}`).toBe(true);
      // Every log, stone or mushroom is climbed after a stumble; a staircase twice (going down
      // is just walking off).
      const staircases = c.obstacles.filter((o) => o.kind === 'step').length / 3;
      const ups = c.obstacles.filter((o) => o.kind !== 'step').length + staircases * 2;
      expect(kinds(events, 'climb').length, `seed ${seed}`).toBe(ups);
      expect(kinds(events, 'stumble').length, `seed ${seed}`).toBe(ups + c.crawlers.length);
      // Every chest not in a block was opened by walking (on the ground and on top of stairs).
      const walkable = c.chests.filter((x) => !x.inBlock).map((x) => x.index).sort();
      expect(kinds(events, 'chest').map((e) => (e as { index: number }).index).sort()).toEqual(walkable);
    }
  });

  it('a leaf block opens its chest when bumped from below (stand under it and hop, no timing)', () => {
    const c = createCourse(createRng(4), 1, 0, [true]);
    const b = c.blocks[0]!;
    expect(kinds(run(c, () => RIGHT, 60).events, 'chest')).toHaveLength(0);
    let maxHead = 0;
    const { events } = run(
      c,
      (_, st) => {
        maxHead = Math.max(maxHead, st.y + 1);
        return st.x >= b.x - 0.1 ? { ...STILL, jump: true } : RIGHT;
      },
      10,
    );
    expect(events).toContainEqual({ kind: 'bump', block: 0 });
    expect(events).toContainEqual({ kind: 'chest', index: 0 });
    // The head stops at the block's underside.
    expect(maxHead).toBeLessThanOrEqual(HIGH_CHEST_Y + 1e-6);
  });

  it('jumping shortly before an obstacle clears it without a stumble', () => {
    const c: Course = { ...empty(), obstacles: [{ x: 6, width: 1.2, height: 0.8, kind: 'log' }], goalX: 12 };
    const { s, events } = run(c, (_, st) => ({ ...RIGHT, jump: st.x > 6 - 1.6 && st.x < 6 }), 30);
    expect(s.done).toBe(true);
    expect(kinds(events, 'jump').length).toBeGreaterThan(0);
    expect(kinds(events, 'stumble')).toHaveLength(0);
  });

  it('platforms carry the avatar from above and let it jump through from below', () => {
    const c: Course = { ...empty(), platforms: [{ x: 3, width: 3, y: PLATFORM_Y }] };
    // Under the platform: a hop goes through it, peaks above and lands on top.
    const start: JumpState = { ...initialJump(c), x: 4 };
    const { s } = run(c, (t) => ({ ...STILL, jump: t < 0.02 }), 2, start);
    expect(s.grounded).toBe(true);
    expect(s.y).toBeCloseTo(PLATFORM_Y, 5);
    expect(floorAt(c, s.x, s.y)).toBeCloseTo(PLATFORM_Y, 5);
    // Walking off the edge falls back to the ground.
    const off = run(c, () => RIGHT, 2, s);
    expect(off.s.y).toBe(0);
    expect(kinds(off.events, 'land')).toHaveLength(1);
  });

  it('a step is climbed onto (Hoppla, then up), and the avatar walks down the other side', () => {
    const c: Course = { ...empty(), obstacles: [{ x: 4, width: 0.9, height: 0.5, kind: 'step' }] };
    const { events, s } = run(c, () => RIGHT, 3);
    expect(kinds(events, 'stumble')).toHaveLength(1);
    expect(kinds(events, 'climb')).toHaveLength(1);
    expect(s.x).toBeGreaterThan(4.9);
    expect(s.y).toBe(0);
  });

  it('hopping on a crawler sends it tumbling with a bounce', () => {
    const c: Course = { ...empty(), crawlers: [{ from: 5, to: 5, kind: 'snail' }] };
    const { events, s } = run(c, (_, st) => ({ ...RIGHT, jump: st.x > 3.3 && st.x < 3.5 }), 3);
    expect(events).toContainEqual({ kind: 'stomp', crawler: 0 });
    expect(kinds(events, 'stumble')).toHaveLength(0);
    expect(s.crawlers[0]!.mode).toBe('gone');
  });

  it('walking into a crawler is only a Hoppla: it hides in its shell and the avatar walks past', () => {
    const c: Course = { ...empty(), crawlers: [{ from: 5, to: 7.5, kind: 'beetle' }], goalX: 12 };
    const { events, s } = run(c, () => RIGHT, 10);
    expect(kinds(events, 'stumble')).toHaveLength(1);
    expect(kinds(events, 'stomp')).toHaveLength(0);
    expect(s.done).toBe(true);
  });

  it('crawlers patrol their stretch and turn at its ends', () => {
    const c: Course = { ...empty(), crawlers: [{ from: 10, to: 12, kind: 'snail' }] };
    let s = initialJump(c);
    let min = Infinity;
    let max = -Infinity;
    for (let t = 0; t < 12; t += 1 / 30) {
      s = step(c, s, STILL, 1 / 30).state;
      min = Math.min(min, s.crawlers[0]!.x);
      max = Math.max(max, s.crawlers[0]!.x);
    }
    expect(min).toBeCloseTo(10, 5);
    expect(max).toBeCloseTo(12, 5);
  });

  it('a touched chest opens again only after leaving it', () => {
    const c: Course = { ...empty(), chests: [{ index: 0, x: 6, y: 0, inBlock: false }] };
    let s = initialJump(c);
    let opens = 0;
    const go = (input: JumpInput, sec: number) => {
      for (let t = 0; t < sec; t += 1 / 60) {
        const r = step(c, s, input, 1 / 60);
        s = r.state;
        opens += kinds(r.events, 'chest').length;
      }
    };
    go(RIGHT, (6 - 1 - AVATAR_WIDTH) / 3.2 + 0.15);
    go(STILL, 1);
    expect(opens).toBe(1);
    go({ ...STILL, left: true }, 1);
    go(RIGHT, 1);
    expect(opens).toBe(2);
  });
});
