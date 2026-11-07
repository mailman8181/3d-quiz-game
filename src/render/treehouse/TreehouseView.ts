import * as THREE from 'three';
import type { LostAnimal } from '../../core/profile/lostAnimals';
import type { Avatar } from '../../core/profile/profile';
import type { Equipped } from '../../core/rewards/rewards';
import { TREEHOUSE_SPOTS, type Treehouse, type TreehouseSpot } from '../../core/rewards/treehouse';
import { buildAnimal } from '../avatars/animals';
import { tickAnimals } from '../avatars/animation';
import { buildLostAnimal } from '../avatars/lostAnimals';
import { addOutlines, disposeObject, toonMaterial } from '../toon';
import { buildDecor } from './decor';

export interface TreehouseViewOptions {
  container: HTMLElement;
  avatar: Avatar;
  equipped: Equipped;
  friends: readonly LostAnimal[];
  onSpot: (spot: TreehouseSpot) => void;
}

/** Spots on the platform (front half, so nothing hides behind the house). */
const SPOT_POSITIONS: Record<TreehouseSpot, [number, number]> = {
  s1: [-1.55, -0.2],
  s2: [-0.9, 0.9],
  s3: [0, 1.35],
  s4: [0.9, 0.9],
  s5: [1.55, -0.2],
  s6: [1.15, -0.95],
};

/**
 * 3D tree house: platform in a big tree, a small hut, six decoration spots, the avatar and
 * rescued friends. Tap a spot → onSpot (the React screen opens the item picker).
 */
export class TreehouseView {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  private readonly resizeObserver: ResizeObserver;
  private readonly clock = new THREE.Clock();
  private lastFrameTime = 0;
  private readonly raycaster = new THREE.Raycaster();
  private readonly spotMarkers = new Map<TreehouseSpot, THREE.Mesh>();
  private readonly decor = new Map<TreehouseSpot, THREE.Group>();
  private readonly friends: Array<{ model: THREE.Group; base: THREE.Vector3; phase: number }> = [];
  private avatarModel: THREE.Group;
  private down: { x: number; y: number } | null = null;

  constructor(private readonly opts: TreehouseViewOptions) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'none';
    opts.container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color('#bfe8ff');
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#6b8f4e', 1.5));
    const sun = new THREE.DirectionalLight('#ffffff', 2.2);
    sun.position.set(4, 8, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);

    this.buildTree();
    for (const spot of TREEHOUSE_SPOTS) this.buildSpot(spot);

    this.avatarModel = buildAnimal(opts.avatar, opts.equipped);
    this.avatarModel.position.set(0, 0.12, -0.2);
    this.scene.add(this.avatarModel);

    opts.friends.forEach((id, i) => {
      const model = buildLostAnimal(id);
      model.scale.multiplyScalar(0.8);
      const angle = Math.PI + (i / Math.max(1, opts.friends.length)) * Math.PI * 2 + 0.4;
      const base = new THREE.Vector3(Math.cos(angle) * 0.75, 0.12, Math.sin(angle) * 0.5 + 0.2);
      model.position.copy(base);
      this.scene.add(model);
      this.friends.push({ model, base, phase: i * 1.3 });
    });

    this.camera.position.set(0, 4.2, 6.2);
    this.camera.lookAt(0, 0.6, 0);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(opts.container);
    this.resize();

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointerup', this.onUp);
    this.renderer.setAnimationLoop(() => this.frame());
  }

  /** Shows the placed decorations (call whenever the tree house data changes). */
  setDecor(house: Treehouse): void {
    for (const spot of TREEHOUSE_SPOTS) {
      const old = this.decor.get(spot);
      if (old) {
        this.scene.remove(old);
        disposeObject(old);
        this.decor.delete(spot);
      }
      const id = house[spot];
      const marker = this.spotMarkers.get(spot)!;
      marker.visible = !id;
      if (!id) continue;
      const model = buildDecor(id);
      const [x, z] = SPOT_POSITIONS[spot];
      model.position.set(x, 0.12, z);
      model.rotation.y = Math.atan2(-x, 3 - z) * 0.6;
      this.scene.add(model);
      this.decor.set(spot, model);
    }
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onDown);
    canvas.removeEventListener('pointerup', this.onUp);
    disposeObject(this.scene);
    this.renderer.dispose();
    canvas.remove();
  }

  private buildTree(): void {
    const wood = '#a0673a';
    const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 32), toonMaterial('#7fcf5f'));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3;
    this.scene.add(ground);
    const tree = new THREE.Group();
    const add = (geo: THREE.BufferGeometry, color: string, pos: [number, number, number], scale?: [number, number, number]) => {
      const m = new THREE.Mesh(geo, toonMaterial(color));
      m.position.set(...pos);
      if (scale) m.scale.set(...scale);
      m.castShadow = true;
      m.receiveShadow = true;
      tree.add(m);
      return m;
    };
    add(new THREE.CylinderGeometry(0.55, 0.8, 4, 12), '#8b5a2b', [0, -1.5, -0.9]);
    add(new THREE.CylinderGeometry(2.2, 2.2, 0.24, 32), wood, [0, 0, 0]);
    // Hut at the back.
    add(new THREE.BoxGeometry(2.2, 1.4, 1.2), '#d9a066', [0, 0.82, -1.25]);
    add(new THREE.BoxGeometry(0.6, 0.9, 0.05), '#6b3e1f', [0, 0.57, -0.63]);
    add(new THREE.BoxGeometry(0.45, 0.4, 0.05), '#9fd8ff', [-0.65, 0.95, -0.63]);
    const roof = add(new THREE.ConeGeometry(1.75, 0.9, 4), '#e63946', [0, 1.95, -1.25], [1, 1, 0.75]);
    roof.rotation.y = Math.PI / 4;
    // Railing.
    for (let i = 0; i < 18; i++) {
      const a = Math.PI * 0.05 + (i / 17) * Math.PI * 0.9;
      add(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 6), wood, [Math.cos(a) * 2.1, 0.33, Math.sin(a) * 2.1]);
    }
    // Leaves around and above.
    const leaves = ['#3f9d4a', '#55b85c', '#4caf50'];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      // Crown behind and above the hut, so the platform stays visible.
      add(new THREE.SphereGeometry(0.95, 14, 10), leaves[i % 3]!, [Math.cos(a) * 2.4, 3.1 + (i % 2) * 0.45, Math.sin(a) * 1.2 - 2.6]);
    }
    addOutlines(tree, 0.04);
    this.scene.add(tree);
  }

  private buildSpot(spot: TreehouseSpot): void {
    const [x, z] = SPOT_POSITIONS[spot];
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.3, 32),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }),
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(x, 0.13, z);
    marker.userData.spot = spot;
    this.scene.add(marker);
    this.spotMarkers.set(spot, marker);
    // Invisible, larger hit area for small fingers.
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.9, 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(x, 0.5, z);
    hit.userData.spot = spot;
    hit.userData.hit = true;
    this.scene.add(hit);
  }

  private onDown = (e: PointerEvent) => {
    this.down = { x: e.clientX, y: e.clientY };
  };

  private onUp = (e: PointerEvent) => {
    const down = this.down;
    this.down = null;
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 20) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children.filter((o) => o.userData.hit));
    const spot = hits[0]?.object.userData.spot as TreehouseSpot | undefined;
    if (spot) this.opts.onSpot(spot);
  };

  private frame(): void {
    const t = this.clock.getElapsedTime();
    for (const marker of this.spotMarkers.values()) marker.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
    for (const f of this.friends) {
      const hop = Math.max(0, Math.sin(t * 2.2 + f.phase));
      f.model.position.set(f.base.x + Math.sin(t * 0.6 + f.phase) * 0.15, f.base.y + hop * 0.12, f.base.z);
      f.model.rotation.y = Math.sin(t * 0.8 + f.phase) * 0.8;
    }
    this.avatarModel.rotation.y = Math.sin(t * 0.7) * 0.4;
    tickAnimals(this.scene, Math.min(t - this.lastFrameTime, 0.1));
    this.lastFrameTime = t;
    this.renderer.render(this.scene, this.camera);
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.opts.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    // Narrow screens: step back so the whole platform fits.
    const back = w / h < 0.8 ? 1.6 : 1;
    this.camera.position.set(0, 4.2 * back, 6.2 * back);
    this.camera.lookAt(0, 0.6, 0);
    this.camera.updateProjectionMatrix();
    this.publishSpots(w, h);
  }

  /** Screen position of every spot (CSS px in the container) — used by E2E tests. */
  private publishSpots(w: number, h: number): void {
    this.camera.updateMatrixWorld();
    const spots: Record<string, [number, number]> = {};
    for (const spot of TREEHOUSE_SPOTS) {
      const [x, z] = SPOT_POSITIONS[spot];
      const p = new THREE.Vector3(x, 0.4, z).project(this.camera);
      spots[spot] = [Math.round(((p.x + 1) / 2) * w), Math.round(((1 - p.y) / 2) * h)];
    }
    this.opts.container.dataset.spots = JSON.stringify(spots);
  }
}
