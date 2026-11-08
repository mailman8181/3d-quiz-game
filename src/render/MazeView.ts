import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Tile } from '../core/maze/types';
import { DIRECTIONS, sameTile } from '../core/maze/types';
import type { Avatar } from '../core/profile/profile';
import type { Equipped } from '../core/rewards/rewards';
import { setOutfit } from './avatars/accessories';
import { setAnimalMoving, tickAnimals } from './avatars/animation';
import { TrailEmitter } from './trails';
import { CAMERA_CLOSE, prefersReducedMotion, RescueScene } from './rescueScene';
import { createRng } from '../core/rng';
import type { MazeSession, SessionEvent } from '../core/session/mazeSession';
import type { WorldTheme } from '../modules/worlds/types';
import { buildAnimal } from './avatars/animals';
import { buildLostAnimal } from './avatars/lostAnimals';
import type { LostAnimal } from '../core/profile/lostAnimals';
import { buildChest } from './props';
import { disposeObject, OUTLINE_COLOR, toonMaterial } from './toon';

export interface MazeViewOptions {
  container: HTMLElement;
  session: MazeSession;
  avatar: Avatar;
  equipped: Equipped;
  /** The friend waiting at the goal. */
  lostAnimal: LostAnimal;
  /** Rescued friend following the avatar, if any. */
  pet: LostAnimal | null;
  world: WorldTheme;
  onEvent: (event: SessionEvent) => void;
}

const WALK_SPEED = 3.2; // tiles per second
/** Hedge height: low enough that the camera always sees the avatar. */
const HEDGE_HEIGHT = 0.7;
const KEY_DIRS: Record<string, Tile> = {
  ArrowUp: DIRECTIONS[0]!,
  KeyW: DIRECTIONS[0]!,
  ArrowRight: DIRECTIONS[1]!,
  KeyD: DIRECTIONS[1]!,
  ArrowDown: DIRECTIONS[2]!,
  KeyS: DIRECTIONS[2]!,
  ArrowLeft: DIRECTIONS[3]!,
  KeyA: DIRECTIONS[3]!,
};

/**
 * Three.js presentation of one maze run: builds the scene, handles tap/keyboard input,
 * animates the avatar and reports tile arrivals to the (pure) MazeSession.
 * Tile (x, y) maps to world (x, 0, y).
 */
export class MazeView {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  private readonly avatar: THREE.Group;
  private readonly chick: THREE.Group;
  private readonly marker: THREE.Mesh;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly resizeObserver: ResizeObserver;
  private readonly heldKeys: string[] = [];
  private path: Tile[] = [];
  private tile: Tile;
  private pointerDown: { x: number; y: number } | null = null;
  private elapsed = 0;
  private markerAge = Infinity;
  private disposed = false;
  private paused = false;
  private readonly wayHint: THREE.Mesh[] = [];
  private readonly hintGeo = new THREE.CircleGeometry(0.3, 24);
  private readonly seaweed: THREE.Mesh[] = [];
  private readonly bubbles: THREE.Mesh[] = [];
  private readonly bubbleGeo = new THREE.SphereGeometry(0.09, 10, 8);
  private bubbleTimer = 0;
  private readonly trail: TrailEmitter;
  private petModel: THREE.Group | null = null;
  /** Tile the avatar was on before the current one (the pet walks there). */
  private previousTile: Tile | null = null;
  /** Smoothed point on the ground the camera looks at. */
  private focus: THREE.Vector3 | null = null;
  /** Goal cut-scene (ADR-0017); stays set after it ends so the pair keeps its final poses. */
  private rescue: RescueScene | null = null;
  private rescueResolve: (() => void) | null = null;
  private lastWall = performance.now();
  private readonly chestViews = new Map<string, { root: THREE.Group; lid: THREE.Object3D; beacon: THREE.Object3D }>();

  constructor(private readonly opts: MazeViewOptions) {
    const { container, session, world } = opts;
    this.tile = session.position;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.display = 'block';
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(world.colors.sky);
    this.scene.fog = world.style === 'coral' ? new THREE.Fog(world.colors.sky, 7, 28) : new THREE.Fog(world.colors.sky, 18, 40);
    this.buildLights();
    this.buildMaze();

    this.avatar = buildAnimal(opts.avatar, opts.equipped);
    this.trail = new TrailEmitter(this.scene, opts.equipped.trail, this.camera);
    this.avatar.position.set(this.tile.x, 0, this.tile.y);
    this.scene.add(this.avatar);

    this.chick = buildLostAnimal(opts.lostAnimal);
    this.chick.position.set(session.maze.goal.x, 0, session.maze.goal.y);
    this.scene.add(this.chick);

    for (const chest of session.chests) {
      const root = buildChest(chest.tier);
      root.position.set(chest.tile.x, 0, chest.tile.y);
      root.rotation.y = this.chestFacing(chest.tile);
      this.scene.add(root);
      this.chestViews.set(chest.id, {
        root,
        lid: root.getObjectByName('lid')!,
        beacon: root.getObjectByName('beacon')!,
      });
    }

    this.marker = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.38, 32),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 }),
    );
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.position.y = 0.03;
    this.scene.add(this.marker);

    this.updateCamera(1);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);

    this.publishTile();
    delete container.dataset.rescueScene;
    this.setPet(opts.pet);
    this.renderer.setAnimationLoop(() => this.frame());
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.trail.dispose();
    this.rescue?.dispose();
    this.endRescue();
    this.clearWayHint();
    this.hintGeo.dispose();
    for (const b of this.bubbles) (b.material as THREE.Material).dispose();
    this.bubbleGeo.dispose();
    this.setPet(null);
    disposeObject(this.scene);
    this.renderer.dispose();
    canvas.remove();
  }

  /** Glowing footprints along the given tiles, appearing one after another, then fading. */
  showWayHint(tiles: Tile[]): void {
    this.clearWayHint();
    // Test hook: which tiles are highlighted.
    this.opts.container.dataset.wayHint = tiles.map((t) => `${t.x},${t.y}`).join(';');
    tiles.forEach((t, i) => {
      const glow = new THREE.Mesh(
        this.hintGeo,
        new THREE.MeshBasicMaterial({ color: '#ff8c42', transparent: true, opacity: 0, depthWrite: false }),
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(t.x, 0.06, t.y);
      glow.userData.delay = i * 0.18;
      glow.userData.age = 0;
      this.wayHint.push(glow);
      this.scene.add(glow);
    });
  }

  private clearWayHint(): void {
    for (const g of this.wayHint) {
      this.scene.remove(g);
      (g.material as THREE.Material).dispose();
    }
    this.wayHint.length = 0;
  }

  private updateWayHint(dt: number): void {
    if (this.wayHint.length === 0) return;
    let alive = false;
    for (const g of this.wayHint) {
      g.userData.age = (g.userData.age as number) + dt;
      const t = (g.userData.age as number) - (g.userData.delay as number);
      const visible = t < 0 ? 0 : t < 0.25 ? t / 0.25 : t < 3.5 ? 1 : Math.max(0, 1 - (t - 3.5) / 0.6);
      (g.material as THREE.MeshBasicMaterial).opacity = visible * (0.75 + Math.sin(this.elapsed * 6) * 0.2);
      g.scale.setScalar(0.8 + visible * 0.25);
      if (t < 4.1) alive = true;
    }
    if (!alive) this.clearWayHint();
  }

  /** Shows (or hides) the pet that follows the avatar. */
  setPet(pet: LostAnimal | null): void {
    if (this.petModel) {
      this.scene.remove(this.petModel);
      disposeObject(this.petModel);
      this.petModel = null;
    }
    if (!pet) return;
    this.petModel = buildLostAnimal(pet);
    this.petModel.scale.multiplyScalar(0.8);
    this.petModel.position.copy(this.avatar.position).add(new THREE.Vector3(0, 0, -0.45));
    this.scene.add(this.petModel);
  }

  /** Changes worn items without rebuilding the maze. */
  setEquipped(equipped: Equipped): void {
    setOutfit(this.avatar, this.opts.avatar.animal, equipped);
    this.trail.setKind(equipped.trail);
  }

  /**
   * Plays the cut-scene at the goal: avatar and friend step side by side and cheer together
   * (ADR-0017). Resolves when it ends or is skipped by a tap / Space / Enter. Input is paused.
   */
  playRescueScene(): Promise<void> {
    if (this.rescue) return Promise.resolve();
    this.setPaused(true);
    this.chick.position.y = 0;
    this.rescue = new RescueScene({
      scene: this.scene,
      camera: this.camera,
      goal: new THREE.Vector3(this.opts.session.maze.goal.x, 0, this.opts.session.maze.goal.y),
      avatar: this.avatar,
      friend: this.chick,
      pet: this.petModel,
      reduced: prefersReducedMotion(),
    });
    // Test hook / debugging: "playing" → "done".
    this.opts.container.dataset.rescueScene = 'playing';
    return new Promise((resolve) => {
      this.rescueResolve = resolve;
    });
  }

  /** Ends the cut-scene now (tap to skip). */
  skipRescueScene(): void {
    if (!this.rescue || this.rescue.done) return;
    this.rescue.skip();
    this.endRescue();
  }

  private endRescue(): void {
    if (this.rescueResolve) this.opts.container.dataset.rescueScene = 'done';
    const resolve = this.rescueResolve;
    this.rescueResolve = null;
    resolve?.();
  }

  /** Stops movement and input while a challenge dialog is open. */
  setPaused(paused: boolean): void {
    this.paused = paused;
    this.path = [];
    this.heldKeys.length = 0;
  }

  // ---------- scene ----------

  /** Chests face the open side of their (dead-end) tile. */
  private chestFacing(tile: Tile): number {
    const dir = DIRECTIONS.find((d) => this.opts.session.step(d, tile));
    return dir ? Math.atan2(dir.x, dir.y) : 0;
  }

  private buildLights(): void {
    const underwater = this.opts.world.style === 'coral';
    this.scene.add(new THREE.HemisphereLight(underwater ? '#cdefff' : '#ffffff', underwater ? '#3b6f8f' : '#6b8f4e', 1.6));
    const sun = new THREE.DirectionalLight('#ffffff', 2.2);
    const { width, height } = this.opts.session.maze;
    sun.position.set(width / 2 + 6, 14, height / 2 + 8);
    sun.target.position.set(width / 2, 0, height / 2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const half = Math.max(width, height) * 0.75;
    Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 50 });
    sun.shadow.bias = -0.002;
    this.scene.add(sun, sun.target);
  }

  private buildMaze(): void {
    const { maze } = this.opts.session;
    const { colors } = this.opts.world;
    const rng = createRng(maze.seed ^ 0x9e3779b9);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), toonMaterial(colors.ground));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(maze.width / 2, -0.01, maze.height / 2);
    ground.receiveShadow = true;
    this.scene.add(ground);

    const walls: Tile[] = [];
    const floors: Tile[] = [];
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        (maze.tiles[y * maze.width + x] === 'wall' ? walls : floors).push({ x, y });
      }
    }

    // Path tiles.
    const pathMesh = new THREE.InstancedMesh(
      new RoundedBoxGeometry(0.96, 0.06, 0.96, 2, 0.03),
      toonMaterial(colors.path),
      floors.length,
    );
    pathMesh.receiveShadow = true;
    const m = new THREE.Matrix4();
    floors.forEach((t, i) => pathMesh.setMatrixAt(i, m.makeTranslation(t.x, 0.0, t.y)));
    this.scene.add(pathMesh);

    // Hedges with outline hull.
    const coral = this.opts.world.style === 'coral';
    // Coral: rounder rocks with varied colours and heights (per-instance colour).
    const hedgeGeo = coral ? new RoundedBoxGeometry(0.98, HEDGE_HEIGHT, 0.98, 4, 0.3) : new RoundedBoxGeometry(1, HEDGE_HEIGHT, 1, 3, 0.16);
    const hedges = new THREE.InstancedMesh(hedgeGeo, toonMaterial(coral ? '#ffffff' : colors.wall), walls.length);
    const hedgeOutline = new THREE.InstancedMesh(
      hedgeGeo,
      new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide }),
      walls.length,
    );
    hedgeOutline.userData.isOutline = true;
    hedges.castShadow = true;
    hedges.receiveShadow = true;
    const scale = new THREE.Matrix4();
    walls.forEach((t, i) => {
      const h = coral ? 0.8 + rng.next() * 0.5 : 0.92 + rng.next() * 0.16;
      if (coral && colors.wallVariants) hedges.setColorAt(i, new THREE.Color(rng.pick(colors.wallVariants)));
      m.makeTranslation(t.x, (HEDGE_HEIGHT * h) / 2, t.y).multiply(scale.makeScale(1, h, 1));
      hedges.setMatrixAt(i, m);
      m.makeTranslation(t.x, (HEDGE_HEIGHT * h) / 2, t.y).multiply(scale.makeScale(1.04, h * 1.03, 1.04));
      hedgeOutline.setMatrixAt(i, m);
    });
    this.scene.add(hedges, hedgeOutline);

    if (coral) {
      this.buildSeaweed(walls, rng);
      // Flowers become small shells/pearls on the coral.
    }
    // Flowers on hedges.
    const flowerTiles = walls.filter(() => rng.next() < (coral ? 0.15 : 0.3));
    const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 10, 8), toonMaterial('#ffffff'), flowerTiles.length);
    flowerTiles.forEach((t, i) => {
      m.makeTranslation(t.x + (rng.next() - 0.5) * 0.6, HEDGE_HEIGHT * (coral ? 0.85 : 1) + 0.08, t.y + (rng.next() - 0.5) * 0.6);
      flowers.setMatrixAt(i, m);
      flowers.setColorAt(i, new THREE.Color(coral ? rng.pick(['#ffffff', '#ffe8f0', '#fff3c4']) : rng.pick(colors.decorations)));
    });
    this.scene.add(flowers);

    // Goal glow ring.
    const ring = new THREE.Mesh(
      new THREE.CircleGeometry(0.45, 32),
      new THREE.MeshBasicMaterial({ color: '#fff3a0', transparent: true, opacity: 0.8 }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(maze.goal.x, 0.04, maze.goal.y);
    this.scene.add(ring);
  }

  /** Swaying seaweed between coral rocks (underwater world). */
  private buildSeaweed(walls: Tile[], rng: { next(): number; pick<T>(a: readonly T[]): T }): void {
    const { colors } = this.opts.world;
    const geo = new THREE.CapsuleGeometry(0.08, 0.55, 4, 8);
    geo.translate(0, 0.32, 0);
    for (const t of walls) {
      if (rng.next() > 0.45) continue;
      const blade = new THREE.Mesh(geo, toonMaterial(rng.pick(colors.decorations)));
      blade.position.set(t.x + (rng.next() - 0.5) * 0.7, 0, t.y + (rng.next() - 0.5) * 0.7);
      // Tall enough to stick out of the coral rocks.
      blade.scale.set(1, 1.4 + rng.next() * 0.7, 1);
      blade.userData.phase = rng.next() * Math.PI * 2;
      this.seaweed.push(blade);
      this.scene.add(blade);
    }
  }

  /** Ambient bubbles rising through the water (underwater world). */
  private updateAmbient(dt: number): void {
    for (const blade of this.seaweed) {
      blade.rotation.z = Math.sin(this.elapsed * 1.6 + (blade.userData.phase as number)) * 0.18;
      blade.rotation.x = Math.cos(this.elapsed * 1.3 + (blade.userData.phase as number)) * 0.1;
    }
    if (this.opts.world.style !== 'coral') return;
    this.bubbleTimer += dt;
    const { width, height } = this.opts.session.maze;
    if (this.bubbleTimer > 0.12) {
      this.bubbleTimer = 0;
      const bubble = new THREE.Mesh(
        this.bubbleGeo,
        new THREE.MeshBasicMaterial({ color: '#eaf9ff', transparent: true, opacity: 0.85, depthWrite: false }),
      );
      // Mostly near the avatar so they are on screen.
      const near = Math.random() < 0.7;
      bubble.position.set(
        near ? this.avatar.position.x + (Math.random() - 0.5) * 8 : Math.random() * width,
        0.1,
        near ? this.avatar.position.z + (Math.random() - 0.5) * 8 : Math.random() * height,
      );
      bubble.scale.setScalar(0.5 + Math.random());
      bubble.userData.speed = 0.5 + Math.random() * 0.6;
      this.bubbles.push(bubble);
      this.scene.add(bubble);
    }
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i]!;
      b.position.y += (b.userData.speed as number) * dt;
      b.position.x += Math.sin(this.elapsed * 3 + i) * 0.003;
      if (b.position.y > 4) {
        this.scene.remove(b);
        (b.material as THREE.Material).dispose();
        this.bubbles.splice(i, 1);
      }
    }
  }

  // ---------- input ----------

  private onPointerDown = (e: PointerEvent) => {
    if (this.rescue) {
      this.skipRescueScene();
      return;
    }
    this.pointerDown = { x: e.clientX, y: e.clientY };
  };

  private onPointerUp = (e: PointerEvent) => {
    const down = this.pointerDown;
    this.pointerDown = null;
    if (this.paused || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 20) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, hit)) return;
    const target = { x: Math.round(hit.x), y: Math.round(hit.z) };
    const from = this.path[0] ?? this.tile;
    const path = this.opts.session.pathTo(target, from);
    if (!path) return;
    // Keep moving to the tile we are heading to, then follow the new path.
    this.path = this.path.length > 0 ? [from, ...path.slice(1)] : path.slice(1);
    const end = path[path.length - 1]!;
    this.marker.position.x = end.x;
    this.marker.position.z = end.y;
    this.markerAge = 0;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.rescue && !this.rescue.done && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
      e.preventDefault();
      this.skipRescueScene();
      return;
    }
    if (!(e.code in KEY_DIRS)) return;
    e.preventDefault();
    if (this.paused) return;
    if (!this.heldKeys.includes(e.code)) this.heldKeys.push(e.code);
    // Keyboard overrides a tap path once the current step is done.
    if (this.path.length > 1) this.path = this.path.slice(0, 1);
    // A short key tap always moves one tile, even if released before the next frame.
    if (this.path.length === 0 && !e.repeat) {
      const next = this.opts.session.step(KEY_DIRS[e.code]!, this.tile);
      if (next) this.path = [next];
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const i = this.heldKeys.indexOf(e.code);
    if (i >= 0) this.heldKeys.splice(i, 1);
  };

  private onBlur = () => {
    this.heldKeys.length = 0;
  };

  // ---------- loop ----------

  private frame(): void {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    // The cut-scene runs on wall-clock time, so it lasts the same on slow devices.
    const now = performance.now();
    const wallDt = Math.min((now - this.lastWall) / 1000, 0.25);
    this.lastWall = now;
    this.elapsed += dt;
    this.updateMovement(dt);
    if (this.rescue && !this.rescue.done && this.rescue.update(wallDt)) this.endRescue();
    this.updateCamera(this.rescue ? wallDt : dt);

    if (!this.rescue) {
      this.chick.position.y = Math.abs(Math.sin(this.elapsed * 4)) * 0.12;
      this.chick.rotation.y = Math.sin(this.elapsed * 1.5) * 0.6;
    }
    this.animateChests(dt);
    this.updateAmbient(dt);
    this.updateWayHint(dt);
    this.trail.update(dt, this.avatar.position, this.path.length > 0);
    this.updatePet(dt);
    setAnimalMoving(this.avatar, this.path.length > 0);
    tickAnimals(this.scene, dt);

    this.markerAge += dt;
    const markerMat = this.marker.material as THREE.MeshBasicMaterial;
    markerMat.opacity = Math.max(0, 0.9 - this.markerAge * 1.2);
    this.marker.scale.setScalar(1 + this.markerAge * 0.6);

    this.renderer.render(this.scene, this.camera);
  }

  private updateMovement(dt: number): void {
    if (this.path.length === 0) {
      const key = this.heldKeys[this.heldKeys.length - 1];
      const dir = key ? KEY_DIRS[key] : undefined;
      const next = dir ? this.opts.session.step(dir, this.tile) : null;
      if (next) this.path = [next];
    }

    const next = this.path[0];
    if (!next) {
      this.avatar.position.y = 0;
      return;
    }
    const target = new THREE.Vector3(next.x, 0, next.y);
    const pos = this.avatar.position;
    const flat = new THREE.Vector3(pos.x, 0, pos.z);
    const delta = target.clone().sub(flat);
    const dist = delta.length();
    const stepLen = WALK_SPEED * dt;

    if (dist > 0.001) {
      const targetYaw = Math.atan2(delta.x, delta.z);
      this.avatar.rotation.y = lerpAngle(this.avatar.rotation.y, targetYaw, Math.min(1, dt * 14));
    }
    if (dist <= stepLen) {
      pos.set(target.x, 0, target.z);
      this.path.shift();
      if (!sameTile(next, this.tile)) {
        this.previousTile = this.tile;
        this.tile = next;
        this.publishTile();
        for (const ev of this.opts.session.arrive(next)) {
          if (ev.type === 'goalReached' || ev.type === 'chestReached') {
            this.path = [];
            this.heldKeys.length = 0;
          }
          this.opts.onEvent(ev);
        }
      }
    } else {
      flat.addScaledVector(delta.normalize(), stepLen);
      pos.set(flat.x, Math.abs(Math.sin(this.elapsed * 14)) * 0.08, flat.z);
    }
  }

  private updatePet(dt: number): void {
    const pet = this.petModel;
    if (!pet || this.rescue) return;
    const prev = this.previousTile;
    // Follow one tile behind; keep a little distance when the avatar stands still.
    const target = prev ? new THREE.Vector3(prev.x, 0, prev.y) : this.avatar.position.clone().add(new THREE.Vector3(0, 0, -0.45));
    const toAvatar = this.avatar.position.clone().setY(0).sub(target);
    if (toAvatar.length() > 0.5) target.add(toAvatar.multiplyScalar(0.35));
    const delta = target.sub(pet.position.clone().setY(0));
    const dist = delta.length();
    setAnimalMoving(pet, dist > 0.01);
    if (dist > 0.01) {
      pet.position.addScaledVector(delta.normalize(), Math.min(dist, WALK_SPEED * 1.1 * dt));
      pet.rotation.y = lerpAngle(pet.rotation.y, Math.atan2(delta.x, delta.z), Math.min(1, dt * 10));
      pet.position.y = Math.abs(Math.sin(this.elapsed * 16)) * 0.06;
    } else {
      pet.position.y = 0;
    }
  }

  private animateChests(dt: number): void {
    for (const chest of this.opts.session.chests) {
      const view = this.chestViews.get(chest.id);
      if (!view) continue;
      const solved = chest.state === 'solved';
      const targetLid = solved ? -1.8 : 0;
      view.lid.rotation.x += (targetLid - view.lid.rotation.x) * Math.min(1, dt * 5);
      view.beacon.visible = !solved;
      view.beacon.position.y = 1.0 + Math.sin(this.elapsed * 3 + view.root.position.x) * 0.08;
      view.beacon.rotation.y += dt * 1.5;
    }
  }

  private updateCamera(dt: number): void {
    const aspect = this.camera.aspect;
    // Steep, diorama-like view; portrait screens need more distance to show enough maze.
    const zoom = aspect < 0.8 ? 1.45 : aspect < 1.2 ? 1.2 : 1;
    const offset = new THREE.Vector3(0, 9 * zoom, 4.2 * zoom);
    if (this.rescue) {
      // Cut-scene: move in on the pair, a bit lower for a friendlier angle.
      const b = this.rescue.cameraBlend;
      const close = new THREE.Vector3(0, 9 * zoom * CAMERA_CLOSE * 0.8, 4.2 * zoom * CAMERA_CLOSE * 1.25);
      offset.lerp(close, b);
      const focus = this.rescue.focus;
      if (this.focus === null) this.focus = focus.clone();
      else this.focus.lerp(focus, Math.min(1, dt * 5));
      this.camera.position.copy(this.focus).add(offset);
      this.camera.lookAt(this.focus.x, 0.4 + 0.1 * b, this.focus.z);
      return;
    }

    // Rough size of the visible ground area around the focus point.
    const dist = offset.length();
    const halfTan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const elevation = Math.atan2(offset.y, offset.z);
    const spanDepth = (2 * dist * halfTan) / Math.sin(elevation);
    const spanWidth = 2 * dist * halfTan * aspect;

    // Follow the avatar, but don't show empty grass beyond the maze edges: if the maze
    // fits on screen along an axis, centre it; otherwise clamp the focus to the maze.
    const { width, height } = this.opts.session.maze;
    const target = new THREE.Vector3(
      clampFocus(this.avatar.position.x, width, spanWidth),
      0,
      clampFocus(this.avatar.position.z, height, spanDepth),
    );
    if (this.focus === null) this.focus = target.clone();
    else this.focus.lerp(target, Math.min(1, dt * 4));

    this.camera.position.copy(this.focus).add(offset);
    this.camera.lookAt(this.focus.x, 0.4, this.focus.z);
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.opts.container;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Exposes the avatar tile on the container (used by E2E tests and debugging). */
  private publishTile(): void {
    this.opts.container.dataset.avatarTile = `${this.tile.x},${this.tile.y}`;
  }
}

/**
 * Camera focus along one axis. Tiles span [-0.5, size - 0.5]; `span` is the visible extent.
 */
function clampFocus(pos: number, size: number, span: number): number {
  const margin = 0.6;
  const min = -0.5 + span / 2 - margin;
  const max = size - 0.5 - span / 2 + margin;
  if (min >= max) return (size - 1) / 2;
  return Math.min(max, Math.max(min, pos));
}

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
