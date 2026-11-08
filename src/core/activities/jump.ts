import type { StageId } from '../learner/stage';
import type { Rng } from '../rng';

/**
 * "Hüpf-Abenteuer" (M14c, ADR-0010, 3D course ADR-0018): a gentle side scroller. The child
 * walks with buttons (nothing moves unless they press), hops onto stairs and floating
 * platforms, bumps leaf blocks from below (a gold chest pops out) and meets friendly crawlers
 * (hop on them and they tumble away). Nothing can be failed: walking into an obstacle, a step
 * or a crawler is a stumble ("Hoppla!"); the avatar then climbs up by itself, a crawler hides in
 * its shell and lets it pass. Units: 1 = avatar size; y = 0 is the ground.
 */
export type SolidKind = 'log' | 'stone' | 'mushroom' | 'step';

/** Solid box standing on the ground: blocks walking while low, can be stood on. */
export interface Obstacle {
  x: number;
  width: number;
  height: number;
  kind: SolidKind;
}

/** Floating one-way platform: land on it from above, jump through it from below. */
export interface Platform {
  x: number;
  width: number;
  /** Top surface. */
  y: number;
}

/** Floating leaf block; bumping it from below opens its chest. */
export interface Block {
  x: number;
  /** Bottom edge (the head hits it here). */
  y: number;
  /** Index of the chest inside (into the round's chest list). */
  chest: number;
}

/** Friendly crawler walking to and fro on the ground between `from` and `to`. */
export interface Crawler {
  from: number;
  to: number;
  kind: 'snail' | 'beetle';
}

export interface CourseChest {
  /** Index into the round's chest list (useChestFlow). */
  index: number;
  x: number;
  /** 0 = on the ground; on a step top; HIGH_CHEST_Y = inside a leaf block (needs a hop). */
  y: number;
  /** In a leaf block: opens when the block is bumped, not by touching. */
  inBlock: boolean;
}

export interface Course {
  length: number;
  obstacles: Obstacle[];
  platforms: Platform[];
  blocks: Block[];
  crawlers: Crawler[];
  chests: CourseChest[];
  /** The flag (goal) stands here. */
  goalX: number;
}

export interface CrawlerState {
  x: number;
  dir: 1 | -1;
  /** walk: moving; shy: hidden in its shell (no collision) for `t` s; gone: stomped (t counts up). */
  mode: 'walk' | 'shy' | 'gone';
  t: number;
}

export interface JumpState {
  x: number;
  y: number;
  vy: number;
  grounded: boolean;
  /** Seconds spent pushing against an obstacle (> CLIMB_AFTER: climb up). */
  stuck: number;
  /** Chest indices currently touched (a chest opens again only after leaving it). */
  touching: number[];
  crawlers: CrawlerState[];
  done: boolean;
}

export interface JumpInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export type JumpEvent =
  | { kind: 'chest'; index: number }
  | { kind: 'bump'; block: number }
  | { kind: 'stomp'; crawler: number }
  | { kind: 'stumble' }
  | { kind: 'climb' }
  | { kind: 'jump' }
  | { kind: 'land' }
  | { kind: 'goal' };

export const WALK_SPEED = 3.2;
export const GRAVITY = 30;
export const JUMP_SPEED = 11; // peak = v² / 2g ≈ 2.0
export const CLIMB_AFTER = 0.9;
export const AVATAR_WIDTH = 0.8;
export const AVATAR_HEIGHT = 1;
/** Leaf blocks float this high (bottom edge): the head reaches it with a hop from the ground. */
export const HIGH_CHEST_Y = 1.4;
export const BLOCK_SIZE = 0.9;
/**
 * Floating platforms start just behind an obstacle (a high road: hop up from the obstacle or
 * the ground); high enough that every avatar, bunny ears included, walks underneath.
 */
export const PLATFORM_Y = 1.6;
export const PLATFORM_WIDTH = 2.4;
const PLATFORM_GAP = 0.6;
export const CRAWLER_WIDTH = 0.7;
export const CRAWLER_HEIGHT = 0.55;
export const CRAWLER_SPEED = 0.7;
/** A crawler stays in its shell this long after being bumped into. */
export const SHY_SECONDS = 2.5;
/** Bounce after hopping on a crawler. */
export const STOMP_BOUNCE = 7;
const STEP_W = 0.9;
const EPS = 0.001;

/** Course size by stage: more chests, a longer path and a few more obstacles for older kids. */
export function jumpLayout(stage: StageId | null): { chests: number; obstacles: number } {
  if (stage === 'kita') return { chests: 3, obstacles: 3 };
  if (stage === null || stage === 'preschool') return { chests: 4, obstacles: 5 };
  return { chests: 5, obstacles: 7 };
}

/**
 * Builds a course from segments, never overlapping, with room to land between them:
 * - a gold chest (`highChests`) sits in a leaf block (bump it from below);
 * - other chests stand on the ground or on top of a small staircase (climbing is automatic);
 * - obstacles are logs, stones or mushrooms (about half followed by a floating platform as an
 *   optional high road), or a friendly crawler patrolling its own stretch (about 2 in 5).
 */
export function createCourse(rng: Rng, chestCount: number, obstacleCount: number, highChests: readonly boolean[]): Course {
  const items: ('chest' | 'obstacle')[] = rng.shuffle([
    ...Array.from({ length: chestCount }, () => 'chest' as const),
    ...Array.from({ length: obstacleCount }, () => 'obstacle' as const),
  ]);
  const crawlerCount = Math.round(obstacleCount * 0.4);
  const crawlerSlots = new Set(rng.shuffle(Array.from({ length: obstacleCount }, (_, i) => i)).slice(0, crawlerCount));
  const course: Course = { length: 0, obstacles: [], platforms: [], blocks: [], crawlers: [], chests: [], goalX: 0 };
  let x = 4; // a calm start
  let chest = 0;
  let obstacle = 0;
  for (const item of items) {
    let span: number;
    if (item === 'chest') {
      if (highChests[chest]) {
        course.blocks.push({ x, y: HIGH_CHEST_Y, chest });
        course.chests.push({ index: chest, x, y: HIGH_CHEST_Y, inBlock: true });
        span = BLOCK_SIZE;
      } else if (rng.next() < 0.5) {
        // Staircase: up 0.5, a wide top at 1.0 with the chest, down 0.5.
        course.obstacles.push(
          { x, width: STEP_W, height: 0.5, kind: 'step' },
          { x: x + STEP_W, width: STEP_W * 2, height: 1, kind: 'step' },
          { x: x + STEP_W * 3, width: STEP_W, height: 0.5, kind: 'step' },
        );
        course.chests.push({ index: chest, x: x + STEP_W * 1.5, y: 1, inBlock: false });
        span = STEP_W * 4;
      } else {
        course.chests.push({ index: chest, x, y: 0, inBlock: false });
        span = 0.9;
      }
      chest++;
    } else {
      if (crawlerSlots.has(obstacle)) {
        const kind = rng.pick(['snail', 'beetle'] as const);
        course.crawlers.push({ from: x, to: x + 2.5, kind });
        span = 2.5 + CRAWLER_WIDTH;
      } else {
        const kind = rng.pick(['log', 'stone', 'mushroom'] as const);
        const o: Obstacle = { x, width: kind === 'log' ? 1.2 : 0.8, height: kind === 'stone' ? 0.6 : 0.8, kind };
        course.obstacles.push(o);
        span = o.width;
        if (rng.next() < 0.5) {
          course.platforms.push({ x: x + o.width + PLATFORM_GAP, width: PLATFORM_WIDTH, y: PLATFORM_Y });
          span += PLATFORM_GAP + PLATFORM_WIDTH;
        }
      }
      obstacle++;
    }
    x += span + rng.int(3, 5);
  }
  course.length = x + 4;
  course.goalX = x + 1;
  return course;
}

export function initialJump(course?: Course): JumpState {
  return {
    x: 1,
    y: 0,
    vy: 0,
    grounded: true,
    stuck: 0,
    touching: [],
    crawlers: (course?.crawlers ?? []).map((c) => ({ x: c.from, dir: 1, mode: 'walk', t: 0 })),
    done: false,
  };
}

const overlaps = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1;

/** Height of what the avatar stands on at x: ground, solids, and platforms not above `feet`. */
export function floorAt(course: Course, px: number, feet: number): number {
  let floor = 0;
  for (const o of course.obstacles) if (overlaps(px, px + AVATAR_WIDTH, o.x, o.x + o.width)) floor = Math.max(floor, o.height);
  for (const p of course.platforms) {
    if (p.y <= feet + EPS && overlaps(px, px + AVATAR_WIDTH, p.x, p.x + p.width)) floor = Math.max(floor, p.y);
  }
  return floor;
}

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

  // Vertical first (so a jump started this frame already lifts the avatar).
  if (!grounded) {
    const prevY = y;
    vy -= GRAVITY * dt;
    y += vy * dt;
    // Head against a leaf block from below: bump it (opens its chest) and fall back.
    if (vy > 0) {
      course.blocks.forEach((b, i) => {
        if (overlaps(x, x + AVATAR_WIDTH, b.x, b.x + BLOCK_SIZE) && prevY + AVATAR_HEIGHT <= b.y + EPS && y + AVATAR_HEIGHT > b.y) {
          y = b.y - AVATAR_HEIGHT;
          vy = 0;
          events.push({ kind: 'bump', block: i }, { kind: 'chest', index: b.chest });
        }
      });
    }
    const floor = floorAt(course, x, prevY);
    if (y <= floor && vy <= 0) {
      y = floor;
      vy = 0;
      grounded = true;
      events.push({ kind: 'land' });
    }
  }

  // Horizontal: walk, but a solid in the way stops the avatar while it is low.
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let nx = Math.min(course.length - 1, Math.max(0, x + dir * WALK_SPEED * dt));
  const blocker = course.obstacles.find(
    (o) => y < o.height - EPS && overlaps(nx, nx + AVATAR_WIDTH, o.x, o.x + o.width) && !overlaps(x, x + AVATAR_WIDTH, o.x, o.x + o.width),
  );
  if (blocker && dir !== 0) {
    nx = x;
    if (stuck === 0) events.push({ kind: 'stumble' });
    stuck += dt;
    if (stuck >= CLIMB_AFTER) {
      // Climb up: stand on the blocker's near edge.
      nx = dir > 0 ? blocker.x - AVATAR_WIDTH + 0.35 : blocker.x + blocker.width - 0.35;
      y = blocker.height;
      vy = 0;
      grounded = true;
      stuck = 0;
      events.push({ kind: 'climb' });
    }
  } else {
    stuck = 0;
  }
  x = nx;

  // Walked off a step or platform: fall down.
  if (grounded && y > floorAt(course, x, y) + EPS) grounded = false;

  // Crawlers walk to and fro. Hop on one (falling, feet above its lower third) and it tumbles
  // away with a bounce; bump into one and it hides in its shell, so the avatar passes.
  const crawlers = s.crawlers.map((c, i): CrawlerState => {
    const def = course.crawlers[i]!;
    if (c.mode === 'gone') return { ...c, t: c.t + dt };
    if (c.mode === 'shy') return c.t - dt <= 0 ? { ...c, mode: 'walk', t: 0 } : { ...c, t: c.t - dt };
    let cx = c.x + c.dir * CRAWLER_SPEED * dt;
    let cdir = c.dir;
    if (cx > def.to) [cx, cdir] = [def.to, -1];
    if (cx < def.from) [cx, cdir] = [def.from, 1];
    return { x: cx, dir: cdir, mode: 'walk', t: 0 };
  });
  crawlers.forEach((c, i) => {
    if (c.mode !== 'walk' || y >= CRAWLER_HEIGHT || !overlaps(x, x + AVATAR_WIDTH, c.x, c.x + CRAWLER_WIDTH)) return;
    if (vy < 0 && y > CRAWLER_HEIGHT * 0.35) {
      crawlers[i] = { ...c, mode: 'gone', t: 0 };
      y = CRAWLER_HEIGHT;
      vy = STOMP_BOUNCE;
      grounded = false;
      events.push({ kind: 'stomp', crawler: i });
    } else {
      crawlers[i] = { ...c, mode: 'shy', t: SHY_SECONDS };
      events.push({ kind: 'stumble' });
    }
  });

  // Chests on the ground or a step: touching opens once; leaving and touching again re-opens
  // (for skipped ones). Chests in blocks open by bumping (above).
  const touchingNow = course.chests
    .filter((c) => !c.inBlock && overlaps(x, x + AVATAR_WIDTH, c.x, c.x + 0.9) && overlaps(y, y + AVATAR_HEIGHT, c.y, c.y + 0.8))
    .map((c) => c.index);
  for (const index of touchingNow) if (!s.touching.includes(index)) events.push({ kind: 'chest', index });

  let done = false;
  if (x + AVATAR_WIDTH >= course.goalX) {
    done = true;
    events.push({ kind: 'goal' });
  }
  return { state: { x, y, vy, grounded, stuck, touching: touchingNow, crawlers, done }, events };
}
