import * as THREE from 'three';
import { setAnimalCheering } from './avatars/animation';
import { starGeometry } from './props';
import { createRng, type Rng } from '../core/rng';

/**
 * The little cut-scene at the maze goal (ADR-0017): the avatar and the found friend step
 * side by side, turn to each other and cheer together while hearts and stars rise; the pet
 * (if any) joins behind them. Plain timeline, driven by wall-clock seconds so it lasts the
 * same on slow devices. A tap skips it (`skip()`); with reduced motion it is shorter, the
 * camera stays put and fewer particles appear.
 *
 * Animals with a `Cheer` clip play it; procedural animals (no clip) hop in code instead.
 */
export interface RescueTimeline {
  /** Steps aside and turns to each other, 0 → 1 (eased). */
  readonly approach: number;
  /** Camera move towards the pair, 0 → 1 (eased); always 0 with reduced motion. */
  readonly camera: number;
  /** Both cheer (clip or code hop). */
  readonly cheering: boolean;
  /** Seconds since cheering began (for the code hop). */
  readonly cheerTime: number;
  /** Particles are spawned. */
  readonly particles: boolean;
  readonly done: boolean;
}

export const RESCUE_SECONDS = 4.2;
export const RESCUE_SECONDS_REDUCED = 2.2;
const APPROACH_SECONDS = 0.8;
const APPROACH_SECONDS_REDUCED = 0.4;
/**
 * Places relative to the goal tile centre: the pair side by side along x (always across the
 * camera's view) and a little back, the pet in front between them facing the camera (behind
 * them it was hidden by the avatar). All stay inside the tile.
 */
export const AVATAR_SIDE = -0.3;
export const FRIEND_SIDE = 0.32;
export const PAIR_BACK = -0.1;
export const PET_FRONT = 0.34;
/** Yaw turning the pair towards each other but a bit towards the camera (+z). */
export const FACE_YAW = (Math.PI / 2) * 0.62;
/** Camera distance factor at the end of the camera move (1 = normal maze view). */
export const CAMERA_CLOSE = 0.52;

const easeInOut = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** Pure timeline: what happens `t` seconds into the scene. */
export function rescueTimeline(t: number, reduced: boolean): RescueTimeline {
  const total = reduced ? RESCUE_SECONDS_REDUCED : RESCUE_SECONDS;
  const approachEnd = reduced ? APPROACH_SECONDS_REDUCED : APPROACH_SECONDS;
  const approach = easeInOut(t / approachEnd);
  const camera = reduced ? 0 : easeInOut(t / 1.1);
  const cheering = t >= approachEnd * 0.75 && t < total;
  return {
    approach,
    camera,
    cheering,
    cheerTime: Math.max(0, t - approachEnd * 0.75),
    particles: t >= approachEnd && t < total - 0.6,
    done: t >= total,
  };
}

interface Actor {
  root: THREE.Object3D;
  from: THREE.Vector3;
  fromYaw: number;
  to: THREE.Vector3;
  toYaw: number;
  /** True when the model has a Cheer clip; false → code hop. */
  clip: boolean;
}

interface Particle {
  group: THREE.Group;
  materials: THREE.MeshBasicMaterial[];
  age: number;
  life: number;
  velocity: THREE.Vector3;
  spin: number;
}

function heartShape(size: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, -size);
  s.bezierCurveTo(size * 1.25, -size * 0.15, size * 0.95, size * 1.05, 0, size * 0.45);
  s.bezierCurveTo(-size * 0.95, size * 1.05, -size * 1.25, -size * 0.15, 0, -size);
  return s;
}

const PARTICLE_COLOURS = { heart: ['#ff2d6f', '#ff5fa2'], star: ['#ffd60a', '#ffb703'] };

export interface RescueSceneOptions {
  scene: THREE.Scene;
  camera: THREE.Camera;
  /** Centre of the goal tile (y = 0). */
  goal: THREE.Vector3;
  avatar: THREE.Object3D;
  friend: THREE.Object3D;
  pet: THREE.Object3D | null;
  reduced: boolean;
  seed?: number;
}

export class RescueScene {
  /** Seconds since the start (wall clock, set by the view). */
  time = 0;
  private readonly actors: Actor[];
  private readonly particles: Particle[] = [];
  private readonly geos: { heart: THREE.BufferGeometry; heartBorder: THREE.BufferGeometry; star: THREE.BufferGeometry; starBorder: THREE.BufferGeometry };
  private readonly rng: Rng;
  private sinceSpawn = 0;
  private cheerStarted = false;
  private finished = false;

  constructor(private readonly opts: RescueSceneOptions) {
    const { goal, avatar, friend, pet } = opts;
    this.rng = createRng(opts.seed ?? 7);
    const actor = (root: THREE.Object3D, dx: number, dz: number, yaw: number): Actor => ({
      root,
      from: root.position.clone().setY(0),
      fromYaw: root.rotation.y,
      to: new THREE.Vector3(goal.x + dx, 0, goal.z + dz),
      toYaw: yaw,
      clip: false,
    });
    this.actors = [actor(avatar, AVATAR_SIDE, PAIR_BACK, FACE_YAW), actor(friend, FRIEND_SIDE, PAIR_BACK, -FACE_YAW)];
    if (pet) this.actors.push(actor(pet, (AVATAR_SIDE + FRIEND_SIDE) / 2, PET_FRONT, 0));

    this.geos = {
      heart: new THREE.ShapeGeometry(heartShape(0.1)).center(),
      heartBorder: new THREE.ShapeGeometry(heartShape(0.135)).center(),
      star: starGeometry(0.11, 0.05, 0.01),
      starBorder: starGeometry(0.145, 0.075, 0.005),
    };
  }

  get done(): boolean {
    return this.finished;
  }

  /** Midpoint the camera should look at. */
  get focus(): THREE.Vector3 {
    const { x, z } = this.opts.goal;
    return new THREE.Vector3(x + (AVATAR_SIDE + FRIEND_SIDE) / 2, 0, z + PAIR_BACK);
  }

  /** Current camera move, 0 → 1. */
  get cameraBlend(): number {
    return rescueTimeline(this.time, this.opts.reduced).camera;
  }

  /** Advances by `dt` wall-clock seconds. Returns true once the scene has ended. */
  update(dt: number): boolean {
    if (this.finished) return true;
    this.time += dt;
    const tl = rescueTimeline(this.time, this.opts.reduced);
    this.applyPoses(tl);

    if (tl.cheering && !this.cheerStarted) {
      this.cheerStarted = true;
      for (const a of this.actors) a.clip = setAnimalCheering(a.root, true);
    }
    // Code hop for animals without a Cheer clip, slightly out of phase per actor.
    this.actors.forEach((a, i) => {
      if (a.clip) return;
      a.root.position.y = tl.cheering ? Math.abs(Math.sin(tl.cheerTime * 7 + i * 0.9)) * 0.22 : 0;
    });

    this.sinceSpawn += dt;
    const interval = this.opts.reduced ? 0.4 : 0.11;
    while (tl.particles && this.sinceSpawn >= interval) {
      this.sinceSpawn -= interval;
      this.spawn();
    }
    if (!tl.particles) this.sinceSpawn = 0;
    this.updateParticles(dt);

    if (tl.done) this.finish();
    return this.finished;
  }

  /** Jumps to the end: final poses, cheering stopped, particles cleared. */
  skip(): void {
    if (this.finished) return;
    this.time = this.opts.reduced ? RESCUE_SECONDS_REDUCED : RESCUE_SECONDS;
    this.applyPoses(rescueTimeline(this.time, this.opts.reduced));
    this.finish();
  }

  /** Number of live particles (tests). */
  get particleCount(): number {
    return this.particles.length;
  }

  dispose(): void {
    this.clearParticles();
    for (const g of Object.values(this.geos)) g.dispose();
  }

  private finish(): void {
    this.finished = true;
    for (const a of this.actors) {
      setAnimalCheering(a.root, false);
      a.root.position.y = 0;
    }
    this.clearParticles();
  }

  private applyPoses(tl: RescueTimeline): void {
    for (const a of this.actors) {
      const y = a.root.position.y;
      a.root.position.lerpVectors(a.from, a.to, tl.approach).setY(y);
      a.root.rotation.y = lerpAngle(a.fromYaw, a.toYaw, tl.approach);
    }
  }

  private spawn(): void {
    const heart = this.rng.next() < 0.6;
    const colours = heart ? PARTICLE_COLOURS.heart : PARTICLE_COLOURS.star;
    const mat = (color: string) =>
      new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const borderMat = mat('#ffffff');
    const fillMat = mat(colours[this.rng.int(0, colours.length - 1)]!);
    const group = new THREE.Group();
    const border = new THREE.Mesh(heart ? this.geos.heartBorder : this.geos.starBorder, borderMat);
    border.renderOrder = 12;
    const fill = new THREE.Mesh(heart ? this.geos.heart : this.geos.star, fillMat);
    fill.renderOrder = 13;
    fill.position.z = 0.002;
    group.add(border, fill);
    const c = this.focus;
    group.position.set(c.x + (this.rng.next() - 0.5) * 0.9, 0.55 + this.rng.next() * 0.3, c.z + (this.rng.next() - 0.5) * 0.4);
    group.quaternion.copy(this.opts.camera.quaternion);
    this.opts.scene.add(group);
    this.particles.push({
      group,
      materials: [borderMat, fillMat],
      age: 0,
      life: 1.3 + this.rng.next() * 0.5,
      velocity: new THREE.Vector3((this.rng.next() - 0.5) * 0.5, 0.7 + this.rng.next() * 0.4, 0),
      spin: (this.rng.next() - 0.5) * 2,
    });
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.age += dt;
      const t = p.age / p.life;
      if (t >= 1) {
        this.removeParticle(p);
        this.particles.splice(i, 1);
        continue;
      }
      p.group.position.addScaledVector(p.velocity, dt);
      const opacity = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
      for (const m of p.materials) m.opacity = opacity;
      // Pop in, then gently pulse.
      p.group.scale.setScalar(Math.min(1, t * 6) * (1 + Math.sin(p.age * 9) * 0.08));
      p.group.quaternion.copy(this.opts.camera.quaternion);
      p.group.rotateZ(Math.sin(p.age * 3) * 0.3 * p.spin);
    }
  }

  private removeParticle(p: Particle): void {
    this.opts.scene.remove(p.group);
    for (const m of p.materials) m.dispose();
  }

  private clearParticles(): void {
    for (const p of this.particles) this.removeParticle(p);
    this.particles.length = 0;
  }
}

/** True when the player asked the OS for less motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
