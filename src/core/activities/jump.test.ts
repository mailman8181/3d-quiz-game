import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { createCourse, HIGH_CHEST_Y, initialJump, jumpLayout, step, type JumpEvent, type JumpInput } from './jump';

const run = (course: ReturnType<typeof createCourse>, input: (t: number) => JumpInput, seconds: number) => {
  let s = initialJump();
  const events: JumpEvent[] = [];
  for (let t = 0; t < seconds && !s.done; t += 1 / 60) {
    const r = step(course, s, input(t), 1 / 60);
    s = r.state;
    events.push(...r.events);
  }
  return { s, events };
};

describe('Hüpf-Abenteuer', () => {
  it('builds a course per stage: chests and obstacles never overlap; gold chests float', () => {
    for (const stage of ['kita', 'preschool', 'grade2'] as const) {
      const { chests, obstacles } = jumpLayout(stage);
      const high = Array.from({ length: chests }, (_, i) => i === 0);
      const c = createCourse(createRng(3), chests, obstacles, high);
      expect(c.chests).toHaveLength(chests);
      expect(c.obstacles).toHaveLength(obstacles);
      const xs = [...c.chests.map((x) => x.x), ...c.obstacles.map((o) => o.x)].sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeGreaterThanOrEqual(4);
      expect(c.chests.find((x) => x.index === 0)!.y).toBe(HIGH_CHEST_Y);
      expect(c.goalX).toBeGreaterThan(xs[xs.length - 1]!);
    }
  });

  it('nothing moves without input', () => {
    const c = createCourse(createRng(1), 3, 3, [false, false, false]);
    const { s } = run(c, () => ({ left: false, right: false, jump: false }), 3);
    expect(s.x).toBe(1);
  });

  it('only walking right reaches the goal: obstacles cause a stumble and a climb, never a failure', () => {
    const c = createCourse(createRng(2), 4, 5, [false, false, false, false]);
    const { s, events } = run(c, () => ({ left: false, right: true, jump: false }), 120);
    expect(s.done).toBe(true);
    expect(events.filter((e) => e.kind === 'stumble').length).toBe(5);
    expect(events.filter((e) => e.kind === 'climb').length).toBe(5);
    // Every ground chest was touched once.
    expect(events.filter((e) => e.kind === 'chest').map((e) => (e as { index: number }).index).sort()).toEqual([0, 1, 2, 3]);
  });

  it('a high chest needs a jump; standing under it and jumping is enough (no timing)', () => {
    const c = createCourse(createRng(4), 1, 0, [true]);
    const chestX = c.chests[0]!.x;
    const walkPast = run(c, () => ({ left: false, right: true, jump: false }), 60);
    expect(walkPast.events.some((e) => e.kind === 'chest')).toBe(false);
    // Walk until under the chest, then jump on the spot.
    let s = initialJump();
    const events: JumpEvent[] = [];
    for (let t = 0; t < 30; t += 1 / 60) {
      const under = s.x >= chestX - 0.2;
      const r = step(c, s, { left: false, right: !under, jump: under }, 1 / 60);
      s = r.state;
      events.push(...r.events);
      if (events.some((e) => e.kind === 'chest')) break;
    }
    expect(events.some((e) => e.kind === 'chest')).toBe(true);
  });

  it('jumping shortly before an obstacle clears it without a stumble', () => {
    const c = createCourse(createRng(5), 0, 1, []);
    const o = c.obstacles[0]!;
    let s = initialJump();
    const events: JumpEvent[] = [];
    for (let t = 0; t < 30 && !s.done; t += 1 / 60) {
      const r = step(c, s, { left: false, right: true, jump: s.x > o.x - 1.6 && s.x < o.x }, 1 / 60);
      s = r.state;
      events.push(...r.events);
    }
    expect(s.done).toBe(true);
    expect(events.some((e) => e.kind === 'jump')).toBe(true);
    expect(events.some((e) => e.kind === 'stumble')).toBe(false);
  });

  it('a touched chest opens again only after leaving it', () => {
    const c = createCourse(createRng(6), 1, 0, [false]);
    let s = initialJump();
    let opens = 0;
    const go = (input: JumpInput, sec: number) => {
      for (let t = 0; t < sec; t += 1 / 60) {
        const r = step(c, s, input, 1 / 60);
        s = r.state;
        opens += r.events.filter((e) => e.kind === 'chest').length;
      }
    };
    const toChest = (c.chests[0]!.x - 1) / 3.2 + 0.1;
    go({ left: false, right: true, jump: false }, toChest);
    go({ left: false, right: false, jump: false }, 1);
    expect(opens).toBe(1);
    go({ left: true, right: false, jump: false }, 1);
    go({ left: false, right: true, jump: false }, 1);
    expect(opens).toBe(2);
  });
});
