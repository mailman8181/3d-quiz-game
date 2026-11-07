import { describe, expect, it } from 'vitest';
import { generateMaze } from '../maze/generate';
import { distancesFrom, findPath } from '../maze/pathfinding';
import { isFloor, tileIndex, type Tile } from '../maze/types';
import { MazeSession, TAP_WALK } from './mazeSession';

const manhattan = (a: Tile, b: Tile) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

describe('MazeSession', () => {
  it('emits goalReached once when walking to the goal', () => {
    const maze = generateMaze({ cols: 4, rows: 4, braid: 0, seed: 3 });
    const session = new MazeSession(maze);
    const path = findPath(maze, maze.start, maze.goal)!;
    const events = path.slice(1).flatMap((t) => session.arrive(t));
    expect(events).toEqual([{ type: 'goalReached' }]);
    expect(session.isFinished).toBe(true);
    expect(session.pathTo(maze.start)).toBeNull();
  });

  it('blocks steps into walls', () => {
    const maze = generateMaze({ cols: 4, rows: 4, braid: 0, seed: 3 });
    expect(new MazeSession(maze).step({ x: -1, y: 0 })).toBeNull();
  });
});

describe('tap-to-walk does not solve the maze', () => {
  it('never walks further than TAP_WALK.maxSteps or around hedges', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const maze = generateMaze({ cols: 5, rows: 5, braid: 0.35, seed });
      const session = new MazeSession(maze);
      for (let y = 0; y < maze.height; y++) {
        for (let x = 0; x < maze.width; x++) {
          const path = session.pathTo({ x, y });
          if (!path) continue;
          const end = path[path.length - 1]!;
          expect(path.length - 1).toBeLessThanOrEqual(TAP_WALK.maxSteps);
          expect(path.length - 1).toBeLessThanOrEqual(manhattan(maze.start, end) + TAP_WALK.maxDetour);
          for (const t of path) expect(isFloor(maze, t)).toBe(true);
        }
      }
    }
  });

  it('tapping the goal does not reach it when the way is long', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const maze = generateMaze({ cols: 5, rows: 5, braid: 0.35, seed });
      const steps = distancesFrom(maze, maze.start)[tileIndex(maze, maze.goal)]!;
      if (steps <= TAP_WALK.maxSteps) continue;
      const path = new MazeSession(maze).pathTo(maze.goal);
      const end = path?.[path.length - 1];
      expect(end).not.toEqual(maze.goal);
    }
  });

  it('walks straight down an open corridor to the tapped tile', () => {
    const maze = generateMaze({ cols: 5, rows: 5, braid: 0, seed: 7 });
    const session = new MazeSession(maze);
    // Find a floor tile two steps straight from start.
    const target = [
      { x: maze.start.x + 2, y: maze.start.y },
      { x: maze.start.x, y: maze.start.y + 2 },
    ].find((t) => isFloor(maze, t) && isFloor(maze, { x: (t.x + maze.start.x) / 2, y: (t.y + maze.start.y) / 2 }))!;
    expect(session.pathTo(target)?.at(-1)).toEqual(target);
  });

  it('snaps taps on walls to a nearby floor tile', () => {
    const maze = generateMaze({ cols: 4, rows: 4, braid: 0, seed: 3 });
    const path = new MazeSession(maze).pathTo({ x: 0, y: 0 });
    // Start is the closest floor to the corner, so the avatar stays put.
    expect(path).toBeNull();
  });
});

describe('chests', () => {
  const fakeType = {
    id: 'fake',
    subject: 'math' as const,
    skills: [],
    levels: 1,
    levelInfo: [],
    generate: () => ({
      typeId: 'fake',
      level: 1,
      data: null,
      choices: [{ id: 'c0', value: 1 }],
      correctChoiceId: 'c0',
      prompt: { key: 'p' },
      explanation: { key: 'e' },
    }),
  };
  const chest = { challenge: fakeType.generate(), tier: 'silver' as const, stars: 2 };
  const plan = { chests: [chest, chest, chest] };

  it('places chests on distinct floor tiles that are not start or goal', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const maze = generateMaze({ cols: 5, rows: 5, braid: 0.35, seed });
      const session = new MazeSession(maze, plan);
      expect(session.chests).toHaveLength(3);
      const keys = new Set(session.chests.map((c) => `${c.tile.x},${c.tile.y}`));
      expect(keys.size).toBe(3);
      for (const c of session.chests) {
        expect(isFloor(maze, c.tile)).toBe(true);
        expect(c.tile).not.toEqual(maze.start);
        expect(c.tile).not.toEqual(maze.goal);
      }
    }
  });

  it('opens a chest on arrival, can be skipped and retried, solved only once', () => {
    const maze = generateMaze({ cols: 5, rows: 5, braid: 0.35, seed: 9 });
    const session = new MazeSession(maze, plan);
    const chest = session.chests[0]!;
    expect(session.arrive(chest.tile)).toEqual([{ type: 'chestReached', chestId: chest.id }]);
    session.skipChest(chest.id);
    expect(chest.state).toBe('skipped');
    expect(session.arrive(chest.tile)).toEqual([{ type: 'chestReached', chestId: chest.id }]);
    session.solveChest(chest.id, 2);
    session.solveChest(chest.id, 2);
    expect(session.starsEarned).toBe(2);
    expect(session.arrive(chest.tile)).toEqual([]);
  });
});

describe('way hint', () => {
  it('shows the next steps of the shortest way to the goal, nothing after finishing', () => {
    const maze = generateMaze({ cols: 6, rows: 6, braid: 0.2, seed: 21 });
    const session = new MazeSession(maze);
    const full = findPath(maze, maze.start, maze.goal)!;
    expect(session.hintPath(6)).toEqual(full.slice(1, 7));
    for (const t of full.slice(1)) session.arrive(t);
    expect(session.hintPath()).toEqual([]);
  });
});
