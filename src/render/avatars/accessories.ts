import * as THREE from 'three';
import type { AvatarAnimal } from '../../core/profile/profile';
import type { Equipped } from '../../core/rewards/rewards';
import { starGeometry } from '../props';
import { addOutlines, disposeObject, toonMaterial } from '../toon';
import { attachOutfitToBones } from './animation';
import { hasAnimalModel } from './models';

/** Where accessories sit on an animal built by `buildAnimal` (see animals.ts). */
function anchors(animal: AvatarAnimal) {
  // The hand-modelled cat (models/cat.glb) has a bigger, wider head and eyes than the
  // primitives: hats sit a bit higher and are scaled up so they don't sink into the head.
  if (animal === 'cat' && hasAnimalModel('cat')) {
    return { headTop: 1.11, headScale: 1.22, eyeY: 0.85, eyeX: 0.12, eyeZ: 0.34, neckY: 0.58 };
  }
  const frog = animal === 'frog';
  return {
    headTop: frog ? 1.08 : 1.03,
    /** Scale for hats, relative to the procedural head (radius 0.27). */
    headScale: 1,
    eyeY: frog ? 1.0 : 0.82,
    eyeX: frog ? 0.13 : 0.1,
    eyeZ: frog ? 0.21 : 0.29,
    neckY: 0.56,
  };
}

type Builder = (a: ReturnType<typeof anchors>) => THREE.Object3D;

const mesh = (geo: THREE.BufferGeometry, color: THREE.ColorRepresentation, pos: [number, number, number] = [0, 0, 0]) => {
  const m = new THREE.Mesh(geo, toonMaterial(color));
  m.position.set(...pos);
  return m;
};

const group = (...children: THREE.Object3D[]) => {
  const g = new THREE.Group();
  g.add(...children);
  return g;
};

function heartGeometry(size: number, depth: number): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, -size);
  s.bezierCurveTo(size * 1.2, -size * 0.2, size * 0.9, size, 0, size * 0.45);
  s.bezierCurveTo(-size * 0.9, size, -size * 1.2, -size * 0.2, 0, -size);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  geo.center();
  return geo;
}

/** A pair of glasses frames built from a single-lens factory. */
function glasses(a: ReturnType<typeof anchors>, lens: () => THREE.Object3D, bridgeColor: string): THREE.Object3D {
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const l = lens();
    l.position.set(side * a.eyeX, a.eyeY, a.eyeZ);
    g.add(l);
  }
  const bridge = mesh(new THREE.CylinderGeometry(0.012, 0.012, a.eyeX * 2 - 0.12, 6), bridgeColor, [0, a.eyeY + 0.02, a.eyeZ]);
  bridge.rotation.z = Math.PI / 2;
  g.add(bridge);
  return g;
}

const builders: Record<string, Builder> = {
  'party-hat': (a) => {
    const g = group(
      mesh(new THREE.ConeGeometry(0.13, 0.3, 16), '#ff6b8b', [0, 0.15, 0]),
      mesh(new THREE.SphereGeometry(0.05, 10, 8), '#ffd93d', [0, 0.32, 0]),
    );
    g.position.set(0, a.headTop - 0.04, 0);
    g.rotation.z = 0.2;
    return g;
  },
  crown: (a) => {
    const g = group(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.09, 20, 1, true), '#ffd93d', [0, 0.04, 0]));
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      g.add(mesh(new THREE.ConeGeometry(0.035, 0.09, 6), '#ffd93d', [Math.sin(ang) * 0.14, 0.13, Math.cos(ang) * 0.14]));
    }
    g.add(mesh(new THREE.SphereGeometry(0.03, 8, 6), '#e63946', [0, 0.05, 0.15]));
    g.position.set(0, a.headTop - 0.06, 0);
    return g;
  },
  'top-hat': (a) => {
    const g = group(
      mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 20), '#2b2233', [0, 0.01, 0]),
      mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 20), '#2b2233', [0, 0.12, 0]),
      mesh(new THREE.CylinderGeometry(0.123, 0.123, 0.04, 20), '#e63946', [0, 0.05, 0]),
    );
    g.position.set(0, a.headTop - 0.04, 0);
    g.rotation.z = -0.12;
    return g;
  },
  cap: (a) => {
    const dome = mesh(new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#3a86ff');
    dome.scale.set(1, 0.8, 1);
    const brim = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.025, 16, 1, false, -Math.PI / 2, Math.PI), '#3a86ff', [0, 0.01, 0.17]);
    const button = mesh(new THREE.SphereGeometry(0.025, 8, 6), '#ffffff', [0, 0.16, 0]);
    const g = group(dome, brim, button);
    g.position.set(0, a.headTop - 0.08, 0.0);
    g.rotation.x = -0.15;
    return g;
  },
  'flower-wreath': (a) => {
    const g = new THREE.Group();
    const colors = ['#ff6b8b', '#ffd93d', '#ffffff', '#b38cff'];
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      g.add(mesh(new THREE.SphereGeometry(0.045, 8, 6), colors[i % colors.length]!, [Math.sin(ang) * 0.22, 0, Math.cos(ang) * 0.22]));
    }
    g.position.set(0, a.headTop - 0.12, 0.02);
    return g;
  },
  'wizard-hat': (a) => {
    const g = group(
      mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 20), '#6a4c93', [0, 0.01, 0]),
      mesh(new THREE.ConeGeometry(0.15, 0.42, 16), '#6a4c93', [0, 0.22, 0]),
      mesh(starGeometry(0.06, 0.025, 0.02), '#ffd93d', [0, 0.18, 0.12]),
    );
    g.position.set(0, a.headTop - 0.05, 0);
    g.rotation.x = -0.1;
    return g;
  },
  'round-glasses': (a) =>
    glasses(a, () => mesh(new THREE.TorusGeometry(0.075, 0.014, 6, 20), '#2b2233'), '#2b2233'),
  sunglasses: (a) =>
    glasses(a, () => mesh(new THREE.BoxGeometry(0.15, 0.1, 0.02), '#1d1d2c'), '#1d1d2c'),
  'star-glasses': (a) => glasses(a, () => mesh(starGeometry(0.1, 0.045, 0.02), '#ffd93d'), '#ffb703'),
  'heart-glasses': (a) => glasses(a, () => mesh(heartGeometry(0.075, 0.02), '#ff4d8d'), '#ff4d8d'),
  scarf: (a) => {
    const ring = mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 20), '#e63946');
    ring.rotation.x = Math.PI / 2;
    const end = mesh(new THREE.BoxGeometry(0.08, 0.2, 0.04), '#e63946', [0.1, -0.1, 0.2]);
    end.rotation.z = 0.2;
    const g = group(ring, end);
    g.position.set(0, a.neckY, 0);
    return g;
  },
  cape: (a) => {
    const cape = mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.5, 16, 1, true, Math.PI * 0.6, Math.PI * 0.8), '#e63946');
    cape.position.set(0, a.neckY - 0.25, -0.02);
    (cape.material as THREE.MeshToonMaterial).side = THREE.DoubleSide;
    const clasp = mesh(new THREE.SphereGeometry(0.035, 8, 6), '#ffd93d', [0, a.neckY, 0.24]);
    return group(cape, clasp);
  },
  'bow-tie': (a) => {
    const g = new THREE.Group();
    for (const side of [-1, 1]) {
      const wing = mesh(new THREE.ConeGeometry(0.06, 0.12, 4), '#3a86ff', [side * 0.06, 0, 0]);
      wing.rotation.z = side * (Math.PI / 2);
      g.add(wing);
    }
    g.add(mesh(new THREE.SphereGeometry(0.03, 8, 6), '#3a86ff'));
    g.position.set(0, a.neckY, 0.25);
    return g;
  },
  medal: (a) => {
    const ribbon = mesh(new THREE.TorusGeometry(0.19, 0.02, 6, 20, Math.PI), '#3a86ff');
    ribbon.rotation.z = Math.PI;
    ribbon.rotation.x = 0.5;
    ribbon.position.set(0, a.neckY + 0.02, 0.05);
    const disc = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16), '#ffd93d', [0, a.neckY - 0.17, 0.27]);
    disc.rotation.x = Math.PI / 2;
    return group(ribbon, disc);
  },
};

/** Builds all equipped accessories (trails are particles in MazeView, not models). */
export function buildOutfit(animal: AvatarAnimal, equipped: Equipped): THREE.Group {
  const outfit = new THREE.Group();
  outfit.name = 'outfit';
  const a = anchors(animal);
  for (const [slot, id] of Object.entries(equipped)) {
    const build = id ? builders[id] : undefined;
    if (!build) continue;
    const item = build(a);
    // Hats are built for the procedural head; scale them around their own anchor point.
    if (slot === 'hat' && a.headScale !== 1) item.scale.multiplyScalar(a.headScale);
    item.userData.slot = slot;
    outfit.add(item);
  }
  addOutlines(outfit, 0.02);
  outfit.traverse((o) => {
    o.castShadow = true;
  });
  return outfit;
}

/**
 * Replaces the outfit of an animal group built by buildAnimal. On an animated model the
 * items live on the bones (attachOutfitToBones), so every `outfit` group is removed.
 */
export function setOutfit(root: THREE.Object3D, animal: AvatarAnimal, equipped: Equipped): void {
  const old = root.getObjectsByProperty('name', 'outfit');
  for (const o of old) {
    o.removeFromParent();
    disposeObject(o);
  }
  // Remembered so a model that finishes loading later keeps this outfit (animals.ts).
  root.userData.equipped = equipped;
  root.add(buildOutfit(animal, equipped));
  attachOutfitToBones(root);
}

export const accessoryIds = Object.keys(builders);
