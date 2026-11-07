import type { StageId } from '../learner/stage';
import type { Rng } from '../rng';

/**
 * "Hüpf-Abenteuer" (M14c, ADR-0010): a gentle side scroller. The child walks with buttons
 * (nothing moves unless they press), jumps over logs and stones and collects chests. Nothing
 * can be failed: walking into an obstacle is a stumble ("Hoppla!"), and after a moment the
 * avatar climbs over by itself. Units: 1 = avatar size; y = 0 is the ground.
 */
export interface Obstacle {
  x: number;
  width: number;
  height: number;
  kind: 'log' | 'stone' | 'mushroom';
}

export interface CourseChest {
  /** Index into the round's chest list (useChestFlow). */
  index: number;
  x: number;
  /** 0 = on the ground; higher chests (gold) need a jump. */
  y: number;
}

export interface Course {
  length: number;
  obstacles: Obstacle[];
  chests: CourseChest[];
  /** The flag (goal) stands here. */
  goalX: number;
}

export interface JumpState {
  x: number;
  y: number;
  vy: number;
  grounded: boolean;
  /** Seconds spent pushing against an obstacle (> CLIMB_AFTER: climb over). */
  stuck: number;
  /** Chest indices currently touched (a chest opens again only after leaving it). */
  touching: number[];
  done: boolean;
}

export interface JumpInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export type JumpEvent = { kind: 'chest'; index: number } | { kind: 'stumble' } | { kind: 'climb' } | { kind: 'jump' } | { kind: 'goal' };

export const WALK_SPEED = 3.2;
export const GRAVITY = 30;
export const JUMP_SPEED = 11; // peak = v² / 2g ≈ 2.0
export const CLIMB_AFTER = 0.9;
export const AVATAR_WIDTH = 0.8;
/** Chests this high need a jump (gold); the jump peak reaches 2.0. */
export const HIGH_CHEST_Y = 1.4;

/** Course size by stage: more chests, a longer path and a few more obstacles for older kids. */
export function jumpLayout(stage: StageId | null): { chests: number; obstacles: number } {
  if (stage === 'kita') return { chests: 3, obstacles: 3 };
  if (stage === null || stage === 'preschool') return { chests: 4, obstacles: 5 };
  return { chests: 5, obstacles: 7 };
}

/**
 * Builds a course: chests and obstacles alternate in segments, never overlapping, with room to
 * land between them. Chests whose tier is gold float high (`highChests`), the others stand on
 * the ground.
 */
export function createCourse(rng: Rng, chestCount: number, obstacleCount: number, highChests: readonly boolean[]): Course {
  const items: ('chest' | 'obstacle')[] = rng.shuffle([
    ...Array.from({ length: chestCount }, () => 'chest' as const),
    ...Array.from({ length: obstacleCount }, () => 'obstacle' as const),
  ]);
  const obstacles: Obstacle[] = [];
  const chests: CourseChest[] = [];
  let x = 4; // a calm start
  let chest = 0;
  for (const item of items) {
    if (item === 'obstacle') {
      const kind = rng.pick(['log', 'stone', 'mushroom'] as const);
      obstacles.push({ x, width: kind === 'log' ? 1.2 : 0.8, height: kind === 'stone' ? 0.6 : 0.8, kind });
    } else {
      chests.push({ index: chest, x, y: highChests[chest] ? HIGH_CHEST_Y : 0 });
      chest++;
    }
    x += rng.int(4, 6);
  }
  return { length: x + 4, obstacles, chests, goalX: x + 1 };
}

export function initialJump(): JumpState {
  return { x: 1, y: 0, vy: 0, grounded: true, stuck: 0, touching: [], done: false };
}

const overlaps = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1;

/** Advances the avatar by dt seconds. Pure; returns the events of this step. */
export function step(course: Course, s: JumpState, input: JumpInput, dt: number): { state: JumpState; events: JumpEvent[] } {
  if (s.done) return { state: s, events: [] };
  const events: JumpEvent[] = [];
  let { x, y, vy, grounded, stuck } = s;

  if (input.jump && grounded) {
    vy = JUMP_SPEED;
    grounded = false;
    events.push({ kind: 'jump' });
  }

  // Vertical first (so a jump started this frame already lifts the avatar): gravity, then land
  // on the ground or on top of an obstacle.
  const floorAt = (px: number) => {
    const under = course.obstacles.find((o) => overlaps(px, px + AVATAR_WIDTH, o.x, o.x + o.width));
    return under ? under.height : 0;
  };
  if (!grounded) {
    vy -= GRAVITY * dt;
    y += vy * dt;
    if (y <= floorAt(x) && vy <= 0) {
      y = floorAt(x);
      vy = 0;
      grounded = true;
    }
  }

  // Horizontal: walk, but an obstacle in the way stops the avatar while it is low.
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let nx = Math.min(course.length - 1, Math.max(0, x + dir * WALK_SPEED * dt));
  const blocker = course.obstacles.find(
    (o) => y < o.height && overlaps(nx, nx + AVATAR_WIDTH, o.x, o.x + o.width) && !overlaps(x, x + AVATAR_WIDTH, o.x, o.x + o.width),
  );
  if (blocker && dir !== 0) {
    nx = x;
    if (stuck === 0) events.push({ kind: 'stumble' });
    stuck += dt;
    if (stuck >= CLIMB_AFTER) {
      // Climb over: land just behind (or before) the obstacle.
      nx = dir > 0 ? blocker.x + blocker.width + 0.05 : blocker.x - AVATAR_WIDTH - 0.05;
      stuck = 0;
      events.push({ kind: 'climb' });
    }
  } else {
    stuck = 0;
  }
  x = nx;

  // Walked off an obstacle top: fall down.
  if (grounded && y > floorAt(x)) grounded = false;

  // Chests: touching opens once; leaving and touching again re-opens (for skipped ones).
  const touchingNow = course.chests
    .filter((c) => overlaps(x, x + AVATAR_WIDTH, c.x, c.x + 0.9) && overlaps(y, y + 1, c.y, c.y + 0.8))
    .map((c) => c.index);
  for (const index of touchingNow) if (!s.touching.includes(index)) events.push({ kind: 'chest', index });

  let done = false;
  if (x + AVATAR_WIDTH >= course.goalX) {
    done = true;
    events.push({ kind: 'goal' });
  }
  return { state: { x, y, vy, grounded, stuck, touching: touchingNow, done }, events };
}
