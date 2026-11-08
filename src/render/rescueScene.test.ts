import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createAnimator, getAnimator } from './avatars/animation';
import {
  AVATAR_SIDE,
  FACE_YAW,
  FRIEND_SIDE,
  PAIR_BACK,
  PET_FRONT,
  RESCUE_SECONDS,
  RESCUE_SECONDS_REDUCED,
  RescueScene,
  rescueTimeline,
} from './rescueScene';

/** A bone-less animal with Idle and Cheer clips that move its scale (enough for the mixer). */
function clipAnimal(): THREE.Group {
  const root = new THREE.Group();
  const model = new THREE.Group();
  model.name = 'model';
  root.add(model);
  const track = (v: number) => new THREE.VectorKeyframeTrack('model.scale', [0, 0.5], [1, 1, 1, v, v, v]);
  const clips = [new THREE.AnimationClip('Idle', 0.5, [track(1.05)]), new THREE.AnimationClip('Cheer', 0.5, [track(1.3)])];
  root.userData.animator = createAnimator(model, clips);
  return root;
}

function setup(opts: { pet?: boolean; reduced?: boolean; clips?: boolean } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  const goal = new THREE.Vector3(4, 0, 2);
  const avatar = opts.clips ? clipAnimal() : new THREE.Group();
  const friend = opts.clips ? clipAnimal() : new THREE.Group();
  avatar.position.copy(goal);
  friend.position.copy(goal);
  const pet = opts.pet ? new THREE.Group() : null;
  pet?.position.set(4, 0, 3);
  for (const o of [avatar, friend, pet]) if (o) scene.add(o);
  const rescue = new RescueScene({ scene, camera, goal, avatar, friend, pet, reduced: !!opts.reduced });
  return { scene, rescue, avatar, friend, pet, goal };
}

/** Runs the scene in steps of `dt` until `seconds` have passed. */
function run(rescue: RescueScene, seconds: number, dt = 0.05): void {
  for (let t = 0; t < seconds - 1e-9; t += dt) rescue.update(dt);
}

describe('rescueTimeline', () => {
  it('steps aside, cheers, then ends', () => {
    const start = rescueTimeline(0, false);
    expect(start).toMatchObject({ approach: 0, camera: 0, cheering: false, done: false });
    const mid = rescueTimeline(2, false);
    expect(mid).toMatchObject({ approach: 1, camera: 1, cheering: true, particles: true, done: false });
    expect(rescueTimeline(RESCUE_SECONDS - 0.3, false).particles).toBe(false); // last particles fade out
    expect(rescueTimeline(RESCUE_SECONDS, false)).toMatchObject({ cheering: false, done: true });
  });

  it('is shorter with reduced motion and keeps the camera still', () => {
    expect(RESCUE_SECONDS_REDUCED).toBeLessThan(RESCUE_SECONDS);
    for (const t of [0, 0.5, 1, 2]) expect(rescueTimeline(t, true).camera).toBe(0);
    expect(rescueTimeline(1, true).cheering).toBe(true);
    expect(rescueTimeline(RESCUE_SECONDS_REDUCED, true).done).toBe(true);
  });

  it('eases monotonically', () => {
    let last = -1;
    for (let t = 0; t <= 1.2; t += 0.05) {
      const { approach } = rescueTimeline(t, false);
      expect(approach).toBeGreaterThanOrEqual(last);
      last = approach;
    }
  });
});

describe('RescueScene', () => {
  it('places avatar and friend side by side, facing each other, pet behind', () => {
    const { rescue, avatar, friend, pet, goal } = setup({ pet: true });
    run(rescue, 1.5);
    expect(avatar.position.x).toBeCloseTo(goal.x + AVATAR_SIDE, 5);
    expect(friend.position.x).toBeCloseTo(goal.x + FRIEND_SIDE, 5);
    expect(avatar.position.z).toBeCloseTo(goal.z + PAIR_BACK, 5);
    expect(avatar.rotation.y).toBeCloseTo(FACE_YAW, 5);
    expect(friend.rotation.y).toBeCloseTo(-FACE_YAW, 5);
    expect(pet!.position.z).toBeCloseTo(goal.z + PET_FRONT, 5);
    expect(Math.abs(pet!.position.x - goal.x)).toBeLessThan(0.1);
    expect(pet!.rotation.y).toBeCloseTo(0, 5);
    expect(rescue.focus.x).toBeCloseTo(goal.x + (AVATAR_SIDE + FRIEND_SIDE) / 2, 5);
  });

  it('procedural animals hop in code while cheering, and land at the end', () => {
    const { rescue, avatar, friend } = setup();
    let maxY = 0;
    for (let t = 0; t < 3; t += 0.03) {
      rescue.update(0.03);
      maxY = Math.max(maxY, avatar.position.y, friend.position.y);
    }
    expect(maxY).toBeGreaterThan(0.15);
    run(rescue, RESCUE_SECONDS);
    expect(rescue.done).toBe(true);
    expect(avatar.position.y).toBe(0);
    expect(friend.position.y).toBe(0);
  });

  it('animals with a Cheer clip play it (no code hop) and go back to idle at the end', () => {
    const { rescue, avatar, friend } = setup({ clips: true });
    run(rescue, 1.5);
    for (const o of [avatar, friend]) {
      const a = getAnimator(o)!;
      expect(a.cheering).toBe(true);
      expect(a.cheer!.isRunning()).toBe(true);
      expect(o.position.y).toBe(0);
    }
    run(rescue, RESCUE_SECONDS);
    for (const o of [avatar, friend]) expect(getAnimator(o)!.cheering).toBe(false);
  });

  it('spawns hearts and stars and removes them all when done', () => {
    const { rescue, scene } = setup();
    const before = scene.children.length;
    run(rescue, 2);
    expect(rescue.particleCount).toBeGreaterThan(5);
    expect(scene.children.length).toBe(before + rescue.particleCount);
    run(rescue, RESCUE_SECONDS);
    expect(rescue.particleCount).toBe(0);
    expect(scene.children.length).toBe(before);
  });

  it('a skip jumps to the final poses and ends at once', () => {
    const { rescue, avatar, friend, goal } = setup({ clips: true });
    run(rescue, 1.2);
    rescue.skip();
    expect(rescue.done).toBe(true);
    expect(rescue.particleCount).toBe(0);
    expect(avatar.position.x).toBeCloseTo(goal.x + AVATAR_SIDE, 5);
    expect(getAnimator(friend)!.cheering).toBe(false);
    expect(rescue.update(1)).toBe(true); // stays ended
  });

  it('lasts the same wall-clock time at 3 fps as at 60 fps', () => {
    const slow = setup().rescue;
    const fast = setup().rescue;
    run(slow, RESCUE_SECONDS - 0.4, 1 / 3);
    run(fast, RESCUE_SECONDS - 0.4, 1 / 60);
    expect(slow.done).toBe(false);
    expect(fast.done).toBe(false);
    run(slow, 0.7, 1 / 3);
    run(fast, 0.7, 1 / 60);
    expect(slow.done).toBe(true);
    expect(fast.done).toBe(true);
  });
});
