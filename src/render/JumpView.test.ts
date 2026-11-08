import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCourse } from '../core/activities/jump';
import { createRng } from '../core/rng';
import { buildBackdrop, buildCrawler, buildFlag, buildLeafBlock, buildObstacle, buildPlatform, COLOURS, setLeafBlockUsed } from './jump/jumpProps';
import { cameraDistance, cameraX, VISIBLE_HEIGHT, VISIBLE_WIDTH } from './JumpView';

const FOV_TAN = Math.tan(THREE.MathUtils.degToRad(20));

describe('JumpView camera', () => {
  it('shows VISIBLE_WIDTH units across portrait phones and at least VISIBLE_HEIGHT on wide screens', () => {
    const portrait = 390 / 844;
    const d = cameraDistance(portrait);
    expect(2 * d * FOV_TAN * portrait).toBeCloseTo(VISIBLE_WIDTH, 5);
    const wide = 16 / 9;
    expect(2 * cameraDistance(wide) * FOV_TAN).toBeCloseTo(VISIBLE_HEIGHT, 5);
  });

  it('keeps the avatar at about a third of the screen, clamped to the course ends', () => {
    const aspect = 390 / 844;
    const width = 2 * cameraDistance(aspect) * FOV_TAN * aspect;
    const length = 60;
    expect(cameraX(0, aspect, length)).toBeCloseTo(width / 2 - 0.6, 5); // course start: clamped
    const mid = cameraX(30, aspect, length);
    expect((30.4 - (mid - width / 2)) / width).toBeCloseTo(1 / 3, 5);
    expect(cameraX(58, aspect, length)).toBeCloseTo(length - width / 2 + 0.6, 5); // end
  });
});

describe('Hüpf-Abenteuer props', () => {
  const box = (o: THREE.Object3D) => new THREE.Box3().setFromObject(o);

  it('obstacles fill their logic box (x from 0 to width, y from 0 to height)', () => {
    for (const kind of ['log', 'stone', 'mushroom', 'step'] as const) {
      const o = { x: 0, width: kind === 'log' ? 1.2 : 0.8, height: kind === 'stone' ? 0.6 : 0.8, kind };
      const b = box(buildObstacle(o));
      expect(b.min.y, kind).toBeGreaterThan(-0.08);
      expect(Math.abs(b.max.y - o.height), kind).toBeLessThan(0.15);
      expect(b.min.x, kind).toBeGreaterThan(-0.15);
      expect(Math.abs(b.max.x - o.width), kind).toBeLessThan(0.15);
    }
  });

  it('a platform top is at its origin; a leaf block turns wooden when used', () => {
    expect(box(buildPlatform(2.4)).max.y).toBeLessThan(0.05);
    const block = buildLeafBlock();
    const cube = block.getObjectByName('cube') as THREE.Mesh;
    setLeafBlockUsed(block, true);
    expect((cube.material as THREE.MeshToonMaterial).color.getHexString()).toBe(COLOURS.used.slice(1));
    expect(block.getObjectByName('emblem')!.visible).toBe(false);
  });

  it('crawlers have a body and a head that can hide; the flag has a waving cloth', () => {
    for (const kind of ['snail', 'beetle'] as const) {
      const c = buildCrawler(kind);
      expect(c.getObjectByName('body')).toBeDefined();
      expect(c.getObjectByName('head')).toBeDefined();
      expect(box(c).max.y).toBeLessThan(0.75);
    }
    expect(buildFlag().getObjectByName('cloth')).toBeDefined();
  });

  it('the backdrop is merged into a handful of meshes (few draw calls for any course length)', () => {
    const course = createCourse(createRng(1), 5, 7, [true, false, false, false, false]);
    let meshes = 0;
    buildBackdrop(-6, course.length + 6).traverse((o) => {
      if (o instanceof THREE.Mesh) meshes++;
    });
    expect(meshes).toBeLessThanOrEqual(8);
  });
});
