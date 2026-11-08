import * as THREE from 'three';
import {
  AVATAR_WIDTH,
  BLOCK_SIZE,
  CRAWLER_WIDTH,
  floorAt,
  type Course,
  type JumpEvent,
  type JumpState,
} from '../core/activities/jump';
import type { Avatar } from '../core/profile/profile';
import type { LostAnimal } from '../core/profile/lostAnimals';
import type { Equipped } from '../core/rewards/rewards';
import { setAnimalCheering, setAnimalMoving, tickAnimals } from './avatars/animation';
import { buildAnimal } from './avatars/animals';
import { buildLostAnimal } from './avatars/lostAnimals';
import {
  buildBackdrop,
  buildCrawler,
  buildFlag,
  buildGround,
  buildLeafBlock,
  buildObstacle,
  buildPlatform,
  setLeafBlockUsed,
} from './jump/jumpProps';
import { buildChest, starGeometry } from './props';
import { disposeObject } from './toon';

export interface JumpViewOptions {
  container: HTMLElement;
  course: Course;
  avatar: Avatar;
  equipped: Equipped;
  pet: LostAnimal | null;
  /** Tier per chest (bronze/silver/gold) for the chest models. */
  chestTiers: readonly string[];
  /** A tap on a leaf block (pre-readers get the spoken hint). */
  onTapBlock?: () => void;
}

/** Chest state as the chest flow reports it. */
export type ChestViewState = 'closed' | 'solved' | 'skipped' | undefined;

/** Units visible across a portrait phone (as in the 2D version) and at least this much height. */
export const VISIBLE_WIDTH = 5.2;
export const VISIBLE_HEIGHT = 6;
const FOV = 40;
/** The avatar stands at about a third of the screen from the left. */
const AVATAR_SCREEN_X = 1 / 3;
/** Ground at about this fraction of the visible height from the bottom (controls sit below). */
const GROUND_SCREEN_Y = 0.32;

interface Puff {
  mesh: THREE.Object3D;
  materials: THREE.MeshBasicMaterial[];
  age: number;
  life: number;
  velocity: THREE.Vector3;
  grow: number;
  spin: number;
}

/** Camera distance so that the course fits the screen: VISIBLE_WIDTH across, ≥ VISIBLE_HEIGHT tall. */
export function cameraDistance(aspect: number): number {
  const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const forWidth = VISIBLE_WIDTH / (2 * tan * aspect);
  const forHeight = VISIBLE_HEIGHT / (2 * tan);
  return Math.min(22, Math.max(forWidth, forHeight));
}

/** Camera x for the avatar at `x` (logic units): avatar at a third of the screen, clamped to the course. */
export function cameraX(x: number, aspect: number, length: number): number {
  const dist = cameraDistance(aspect);
  const width = 2 * dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * aspect;
  const want = x + AVATAR_WIDTH / 2 + width * (0.5 - AVATAR_SCREEN_X);
  const min = width / 2 - 0.6;
  const max = length - width / 2 + 0.6;
  return min >= max ? length / 2 : Math.min(max, Math.max(min, want));
}

/**
 * Three.js presentation of the Hüpf-Abenteuer (ADR-0018): a side view of the course with the
 * child's animated avatar (outfit, pet), toon props, a parallax backdrop and little effects.
 * The game logic stays in `core/activities/jump.ts`; the screen calls `sync` every frame with
 * the current state and passes the step's events to `handleEvents`.
 */
export class JumpView {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);
  private readonly sun = new THREE.DirectionalLight('#ffffff', 2.1);
  private readonly avatar: THREE.Group;
  private readonly pet: THREE.Group | null;
  private readonly chests: { root: THREE.Group; lid: THREE.Object3D; beacon: THREE.Object3D; inBlock: boolean; baseY: number }[] = [];
  private readonly blocks: { root: THREE.Group; body: THREE.Object3D; bump: number }[] = [];
  private readonly crawlers: { root: THREE.Group; body: THREE.Object3D; head: THREE.Object3D }[] = [];
  private readonly flagCloth: THREE.Object3D;
  private readonly puffs: Puff[] = [];
  private readonly puffGeo = new THREE.SphereGeometry(0.12, 10, 8);
  private readonly starGeo = starGeometry(0.14, 0.06, 0.03);
  private readonly resizeObserver: ResizeObserver;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private state: JumpState | null = null;
  private facing: 1 | -1 = 1;
  private camX = 0;
  private camY = 0;
  private elapsed = 0;
  /** Squash and stretch of the avatar (1 = normal). */
  private squash = 1;
  private stumbleTime = Infinity;
  private cheering = false;
  private petX = 0;
  private petY = 0;
  private disposed = false;
  private readonly chestStates: ChestViewState[] = [];
  private readonly blockOpened = new Set<number>();

  constructor(private readonly opts: JumpViewOptions) {
    const { container, course } = opts;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color('#a8dcff');
    this.scene.fog = new THREE.Fog('#c9ecff', 22, 46);
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#6b8f4e', 1.5));
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, { left: -9, right: 9, top: 7, bottom: -3, near: 1, far: 40 });
    this.sun.shadow.bias = -0.002;
    this.scene.add(this.sun, this.sun.target);

    this.scene.add(buildBackdrop(-6, course.length + 6));
    this.scene.add(buildGround(-12, course.length + 14));

    for (const o of course.obstacles) {
      const g = buildObstacle(o);
      g.position.x = o.x;
      this.scene.add(g);
    }
    for (const p of course.platforms) {
      const g = buildPlatform(p.width);
      g.position.set(p.x, p.y, 0);
      this.scene.add(g);
    }
    for (const b of course.blocks) {
      const root = buildLeafBlock();
      root.position.set(b.x, b.y, 0);
      root.userData.tapBlock = true;
      this.scene.add(root);
      this.blocks.push({ root, body: root.getObjectByName('body')!, bump: Infinity });
    }
    for (const c of course.chests) {
      const root = buildChest(opts.chestTiers[c.index] ?? 'bronze');
      // Chests face the camera a little turned; chests in blocks wait inside (hidden).
      const baseY = c.inBlock ? c.y + BLOCK_SIZE : c.y;
      root.position.set(c.x + 0.45, baseY, 0);
      root.rotation.y = -0.25;
      root.visible = !c.inBlock;
      if (c.inBlock) root.scale.multiplyScalar(0.85);
      this.scene.add(root);
      this.chests[c.index] = { root, lid: root.getObjectByName('lid')!, beacon: root.getObjectByName('beacon')!, inBlock: c.inBlock, baseY };
    }
    for (const k of course.crawlers) {
      const root = buildCrawler(k.kind);
      root.position.set(k.from, 0, 0.1);
      this.scene.add(root);
      this.crawlers.push({ root, body: root.getObjectByName('body')!, head: root.getObjectByName('head')! });
    }
    const flag = buildFlag();
    flag.position.set(course.goalX + 0.3, 0, -0.3);
    this.flagCloth = flag.getObjectByName('cloth')!;
    this.scene.add(flag);

    this.avatar = buildAnimal(opts.avatar, opts.equipped);
    this.avatar.traverse((o) => (o.castShadow = true));
    this.scene.add(this.avatar);
    this.pet = opts.pet ? buildLostAnimal(opts.pet) : null;
    if (this.pet) {
      this.pet.scale.multiplyScalar(0.8);
      this.pet.position.set(0, 0, -0.35);
      this.scene.add(this.pet);
    }

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.setAnimationLoop(() => this.frame());
  }

  /** Latest logic state and walking direction (called every logic step). */
  sync(state: JumpState, dir: number): void {
    this.state = state;
    if (dir !== 0) this.facing = dir > 0 ? 1 : -1;
    if (state.done && !this.cheering) {
      this.cheering = true;
      this.facing = 1;
      setAnimalCheering(this.avatar, true);
      if (this.pet) setAnimalCheering(this.pet, true);
      this.burst(new THREE.Vector3(this.opts.course.goalX + 0.3, 2.4, 0), 14, 'star');
    }
  }

  /** Visual reactions to the step's events (squash, dust, block bump, stars). */
  handleEvents(events: readonly JumpEvent[]): void {
    const s = this.state;
    for (const ev of events) {
      if (ev.kind === 'jump') this.squash = 1.18;
      else if (ev.kind === 'land' && s) {
        this.squash = 0.82;
        this.dust(s.x + AVATAR_WIDTH / 2, s.y);
      } else if (ev.kind === 'climb') this.squash = 0.9;
      else if (ev.kind === 'stumble') this.stumbleTime = 0;
      else if (ev.kind === 'bump') {
        const b = this.blocks[ev.block];
        const def = this.opts.course.blocks[ev.block];
        if (b && def) {
          b.bump = 0;
          this.burst(new THREE.Vector3(def.x + BLOCK_SIZE / 2, def.y + BLOCK_SIZE + 0.2, 0.3), 6, 'star');
          if (!this.blockOpened.has(ev.block)) {
            this.blockOpened.add(ev.block);
            const chest = this.chests[def.chest];
            if (chest) {
              chest.root.visible = true;
              chest.root.userData.popAge = 0;
            }
          }
        }
      } else if (ev.kind === 'stomp') {
        const c = this.crawlers[ev.crawler];
        if (c) this.burst(c.root.position.clone().add(new THREE.Vector3(CRAWLER_WIDTH / 2, 0.5, 0.3)), 6, 'star');
      }
    }
  }

  /** Chest flow states (lids open on solved chests; a used leaf block turns wooden). */
  setChestStates(states: readonly ChestViewState[]): void {
    states.forEach((st, i) => (this.chestStates[i] = st));
    this.opts.course.blocks.forEach((b, i) => {
      if (this.chestStates[b.chest] === 'solved') setLeafBlockUsed(this.blocks[i]!.root, true);
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    for (const p of this.puffs) for (const m of p.materials) m.dispose();
    this.puffGeo.dispose();
    this.starGeo.dispose();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.opts.onTapBlock) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObjects(this.blocks.map((b) => b.root), true)[0];
    if (hit) this.opts.onTapBlock();
  };

  // ---------- frame ----------

  private frame(): void {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.elapsed += dt;
    const s = this.state;
    if (s) this.updateAvatar(s, dt);
    this.updateProps(dt);
    this.updatePuffs(dt);
    this.updateCamera(dt);
    tickAnimals(this.scene, dt);
    this.renderer.render(this.scene, this.camera);
  }

  private updateAvatar(s: JumpState, dt: number): void {
    const a = this.avatar;
    const x = s.x + AVATAR_WIDTH / 2;
    a.position.set(x, s.y, 0);
    // Face the walking direction, turned a little towards the camera; the goal faces it.
    const yaw = this.cheering ? 0.25 : this.facing * (Math.PI / 2 - 0.45);
    a.rotation.y += (yaw - a.rotation.y) * Math.min(1, dt * 12);
    const moving = !s.done && s.grounded && Math.abs(x - (a.userData.lastX ?? x)) > 1e-4;
    a.userData.lastX = x;
    setAnimalMoving(a, moving);
    // Squash and stretch: in the air stretch with the speed, on landing squash, then settle.
    const target = s.grounded ? 1 : 1 + Math.min(0.12, Math.abs(s.vy) * 0.012);
    this.squash += (target - this.squash) * Math.min(1, dt * 10);
    a.scale.set(1 / Math.sqrt(this.squash), this.squash, 1 / Math.sqrt(this.squash));
    // Stumble: a quick wobble with dizzy stars.
    this.stumbleTime += dt;
    a.rotation.z = this.stumbleTime < 0.6 ? Math.sin(this.stumbleTime * 30) * 0.12 * (1 - this.stumbleTime / 0.6) : 0;
    if (this.stumbleTime < 0.6 && Math.floor(this.stumbleTime * 10) !== Math.floor((this.stumbleTime - dt) * 10)) {
      this.burst(new THREE.Vector3(x, s.y + 1.15, 0.3), 1, 'star', 0.6);
    }

    // Pet follows one step behind on the ground (or wherever the avatar walked).
    if (this.pet) {
      const behind = x - this.facing * 0.9;
      const dx = behind - this.petX;
      const speed = Math.min(Math.abs(dx), 4 * dt);
      this.petX += Math.sign(dx) * speed;
      const petFloor = floorAt(this.opts.course, this.petX - AVATAR_WIDTH / 2, s.grounded ? s.y : this.petY);
      this.petY += (petFloor - this.petY) * Math.min(1, dt * 8);
      const walking = speed > 0.01;
      this.pet.position.set(this.petX, this.petY + (walking ? Math.abs(Math.sin(this.elapsed * 14)) * 0.06 : 0), -0.35);
      this.pet.rotation.y = this.cheering ? 0.3 : (Math.sign(dx || this.facing) * Math.PI) / 2 - Math.sign(dx || this.facing) * 0.45;
      setAnimalMoving(this.pet, walking && !this.cheering);
    }
  }

  private updateProps(dt: number): void {
    const s = this.state;
    // Leaf blocks bounce when bumped.
    for (const b of this.blocks) {
      b.bump += dt;
      b.body.position.y = b.bump < 0.25 ? Math.sin((b.bump / 0.25) * Math.PI) * 0.22 : 0;
    }
    // Chests: lid open when solved, beacon star bobbing; popped-out chests rise from the block.
    this.chests.forEach((c, i) => {
      if (!c) return;
      const solved = this.chestStates[i] === 'solved';
      const lidTarget = solved ? -1.8 : 0;
      c.lid.rotation.x += (lidTarget - c.lid.rotation.x) * Math.min(1, dt * 5);
      c.beacon.visible = !solved;
      c.beacon.position.y = 1.0 + Math.sin(this.elapsed * 3 + i) * 0.08;
      c.beacon.rotation.y += dt * 1.5;
      const pop = c.root.userData.popAge as number | undefined;
      if (pop !== undefined) {
        const t = pop + dt;
        c.root.userData.popAge = t;
        const k = Math.min(1, t / 0.45);
        c.root.position.y = c.baseY - 0.5 + 0.5 * (1 - (1 - k) * (1 - k)) + Math.sin(k * Math.PI) * 0.35;
      }
    });
    // Crawlers: walk with a wobble, face their direction; shy = hide (head in, shell shakes);
    // gone = flip and tumble away.
    s?.crawlers.forEach((c, i) => {
      const v = this.crawlers[i];
      if (!v) return;
      const r = v.root;
      if (c.mode === 'gone') {
        const t = c.t;
        r.position.set(c.x + t * 2.2, Math.max(-3, 0.6 * t * 8 - 14 * t * t), 0.6);
        r.rotation.z = -t * 9;
        r.visible = t < 1.4;
        return;
      }
      r.position.x = c.x;
      r.rotation.z = 0;
      r.rotation.y = c.dir > 0 ? -0.35 : Math.PI + 0.35;
      // rotation around y mirrors the model about its own origin (left edge): keep the box.
      r.position.x = c.dir > 0 ? c.x : c.x + CRAWLER_WIDTH;
      const shy = c.mode === 'shy';
      v.head.scale.setScalar(shy ? Math.max(0.01, v.head.scale.x - dt * 6) : Math.min(1, v.head.scale.x + dt * 4));
      v.body.position.y = shy ? 0 : Math.abs(Math.sin(this.elapsed * 6 + i)) * 0.04;
      v.body.rotation.x = shy ? Math.sin(this.elapsed * 30) * 0.05 : 0;
    });
    // Flag waves.
    this.flagCloth.rotation.y = Math.sin(this.elapsed * 3) * 0.25;
    this.flagCloth.scale.x = 1 + Math.sin(this.elapsed * 5) * 0.05;
  }

  private updateCamera(dt: number): void {
    const s = this.state;
    const aspect = this.camera.aspect;
    const dist = cameraDistance(aspect);
    const height = 2 * dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const x = s ? cameraX(s.x, aspect, this.opts.course.length) : cameraX(1, aspect, this.opts.course.length);
    // Look up a little when the avatar is high (platforms), never below the base framing.
    const baseY = height * (0.5 - GROUND_SCREEN_Y);
    const y = baseY + Math.max(0, (s?.y ?? 0) - 1.2) * 0.6;
    if (this.camX === 0 && this.camY === 0) {
      this.camX = x;
      this.camY = y;
    }
    this.camX += (x - this.camX) * Math.min(1, dt * 6);
    this.camY += (y - this.camY) * Math.min(1, dt * 3);
    this.camera.position.set(this.camX, this.camY + 0.6, dist);
    this.camera.lookAt(this.camX, this.camY, 0);
    // The sun (and its shadow box) follows the camera.
    this.sun.position.set(this.camX + 4, 12, 9);
    this.sun.target.position.set(this.camX, 0, 0);
  }

  // ---------- effects ----------

  private dust(x: number, y: number): void {
    for (const side of [-1, 1]) {
      const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false });
      const m = new THREE.Mesh(this.puffGeo, mat);
      m.position.set(x + side * 0.3, y + 0.08, 0.3);
      this.scene.add(m);
      this.puffs.push({ mesh: m, materials: [mat], age: 0, life: 0.45, velocity: new THREE.Vector3(side * 0.9, 0.3, 0), grow: 2.2, spin: 0 });
    }
  }

  private burst(at: THREE.Vector3, count: number, _kind: 'star', life = 0.9): void {
    for (let i = 0; i < count; i++) {
      const a = (i / Math.max(1, count)) * Math.PI * 2 + this.elapsed;
      const mat = new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffd60a' : '#ffffff', transparent: true, depthWrite: false });
      const m = new THREE.Mesh(this.starGeo, mat);
      m.position.copy(at);
      this.scene.add(m);
      const speed = count === 1 ? 0.6 : 2.2;
      this.puffs.push({
        mesh: m,
        materials: [mat],
        age: 0,
        life,
        velocity: new THREE.Vector3(Math.cos(a) * speed, Math.abs(Math.sin(a)) * speed + 0.8, 0),
        grow: 0,
        spin: 6,
      });
    }
  }

  private updatePuffs(dt: number): void {
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i]!;
      p.age += dt;
      const t = p.age / p.life;
      if (t >= 1) {
        this.scene.remove(p.mesh);
        for (const m of p.materials) m.dispose();
        this.puffs.splice(i, 1);
        continue;
      }
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= dt * (p.spin ? 3 : 0);
      p.mesh.rotation.z += p.spin * dt;
      p.mesh.scale.setScalar(p.grow ? 1 + t * p.grow : 1 - t * 0.3);
      for (const m of p.materials) m.opacity = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
    }
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.opts.container;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // Haze starts behind the course and swallows only the far hills.
    const dist = cameraDistance(this.camera.aspect);
    (this.scene.fog as THREE.Fog).near = dist + 10;
    (this.scene.fog as THREE.Fog).far = dist + 48;
  }
}

