import * as THREE from 'three';
import type { Avatar, AvatarAnimal } from '../../core/profile/profile';
import type { Equipped } from '../../core/rewards/rewards';
import { addOutlines, disposeObject, toonMaterial } from '../toon';
import { buildOutfit } from './accessories';
import { cloneAnimalModel, onAnimalModelLoaded } from './models';

/** Fixed colours shared by the procedural animals and the glTF models (one source of truth). */
export const ANIMAL_PALETTE = {
  dark: '#2b2233',
  white: '#ffffff',
  pink: '#ff8fb1',
  orange: '#ff9f1c',
} as const;

/**
 * Builds a chunky comic animal. Uses the hand-made glTF model when it is loaded
 * (see models.ts), otherwise builds it from primitives. If the model is still loading,
 * the returned group swaps its contents to the model once it arrives (same group, so
 * position, rotation and parent stay; the outfit last set via `setOutfit` is kept).
 * The returned group stands on y=0, faces +z and is about 1 unit tall.
 */
export function buildAnimal(avatar: Avatar, equipped: Equipped = {}): THREE.Group {
  const modelled = buildModelledAnimal(avatar, equipped);
  if (modelled) return modelled;

  const root = buildProceduralAnimal(avatar, equipped);
  onAnimalModelLoaded(avatar.animal, () => {
    const next = buildModelledAnimal(avatar, (root.userData.equipped as Equipped | undefined) ?? equipped);
    if (!next) return;
    const old = [...root.children];
    root.clear();
    for (const o of old) disposeObject(o);
    root.add(...next.children);
  });
  return root;
}

function buildProceduralAnimal(avatar: Avatar, equipped: Equipped): THREE.Group {
  const root = new THREE.Group();
  root.userData.equipped = equipped;
  const body = toonMaterial(avatar.color);
  const light = toonMaterial(lighten(avatar.color, 0.55));
  const dark = toonMaterial(ANIMAL_PALETTE.dark);
  const white = toonMaterial(ANIMAL_PALETTE.white);
  const pink = toonMaterial(ANIMAL_PALETTE.pink);
  const orange = toonMaterial(ANIMAL_PALETTE.orange);

  const sphere = (r: number, mat: THREE.Material, pos: [number, number, number], scale?: [number, number, number]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
    m.position.set(...pos);
    if (scale) m.scale.set(...scale);
    root.add(m);
    return m;
  };

  // Body + head shared by all animals.
  sphere(0.3, body, [0, 0.33, 0], [1, 1.05, 0.95]);
  sphere(0.27, body, [0, 0.78, 0.02]);
  // Belly patch.
  sphere(0.2, light, [0, 0.3, 0.14], [1, 1.1, 0.6]);
  // Feet.
  sphere(0.09, body, [-0.13, 0.05, 0.08], [1, 0.6, 1.4]);
  sphere(0.09, body, [0.13, 0.05, 0.08], [1, 0.6, 1.4]);

  const eyeY = avatar.animal === 'frog' ? 1.0 : 0.82;
  const eyeZ = avatar.animal === 'frog' ? 0.12 : 0.22;
  const eyeX = avatar.animal === 'frog' ? 0.13 : 0.1;
  for (const side of [-1, 1]) {
    const eye = sphere(avatar.animal === 'frog' ? 0.09 : 0.075, white, [side * eyeX, eyeY, eyeZ]);
    eye.userData.noOutline = avatar.animal !== 'frog';
    const pupil = sphere(0.04, dark, [side * eyeX, eyeY, eyeZ + (avatar.animal === 'frog' ? 0.07 : 0.055)]);
    pupil.userData.noOutline = true;
  }

  addAnimalDetails(avatar.animal, { root, sphere, body, light, dark, pink, orange });
  addOutlines(root, 0.035);
  root.traverse((o) => {
    o.castShadow = true;
  });
  root.add(buildOutfit(avatar.animal, equipped));
  return root;
}

interface Parts {
  root: THREE.Group;
  sphere: (r: number, mat: THREE.Material, pos: [number, number, number], scale?: [number, number, number]) => THREE.Mesh;
  body: THREE.Material;
  light: THREE.Material;
  dark: THREE.Material;
  pink: THREE.Material;
  orange: THREE.Material;
}

function addAnimalDetails(animal: AvatarAnimal, p: Parts): void {
  switch (animal) {
    case 'bunny': {
      for (const side of [-1, 1]) {
        const ear = p.sphere(0.08, p.body, [side * 0.1, 1.12, -0.02], [0.9, 3.2, 0.7]);
        ear.rotation.z = side * -0.15;
        const inner = p.sphere(0.05, p.pink, [side * 0.1, 1.12, 0.03], [0.8, 2.9, 0.4]);
        inner.rotation.z = side * -0.15;
        inner.userData.noOutline = true;
      }
      p.sphere(0.04, p.pink, [0, 0.74, 0.27]);
      p.sphere(0.09, p.light, [0, 0.3, -0.28]); // tail
      break;
    }
    case 'bear': {
      for (const side of [-1, 1]) {
        p.sphere(0.09, p.body, [side * 0.19, 1.0, 0]);
        p.sphere(0.05, p.light, [side * 0.19, 1.0, 0.05]).userData.noOutline = true;
      }
      p.sphere(0.1, p.light, [0, 0.72, 0.22], [1.2, 0.8, 0.8]);
      p.sphere(0.04, p.dark, [0, 0.76, 0.3]).userData.noOutline = true;
      break;
    }
    case 'cat': {
      for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 4), p.body);
        ear.position.set(side * 0.15, 1.04, 0);
        ear.rotation.z = side * -0.3;
        p.root.add(ear);
      }
      p.sphere(0.035, p.pink, [0, 0.75, 0.27]).userData.noOutline = true;
      const tail = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16, Math.PI * 1.2), p.body);
      tail.position.set(0, 0.35, -0.3);
      tail.rotation.y = Math.PI / 2;
      p.root.add(tail);
      break;
    }
    case 'frog': {
      const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 6, 16, Math.PI), p.dark);
      mouth.position.set(0, 0.74, 0.24);
      mouth.rotation.z = Math.PI;
      mouth.userData.noOutline = true;
      p.root.add(mouth);
      for (const side of [-1, 1]) p.sphere(0.04, p.pink, [side * 0.17, 0.72, 0.2]).userData.noOutline = true;
      break;
    }
    case 'penguin': {
      p.sphere(0.07, p.orange, [0, 0.74, 0.27], [1.3, 0.6, 1.4]);
      for (const side of [-1, 1]) {
        const wing = p.sphere(0.08, p.body, [side * 0.3, 0.38, 0], [0.5, 2, 1]);
        wing.rotation.z = side * 0.25;
      }
      p.sphere(0.2, p.light, [0, 0.8, 0.12], [1, 0.75, 0.6]).userData.noOutline = true;
      break;
    }
  }
}

/** The lost chick waiting at the maze goal. */
export function buildChick(): THREE.Group {
  const root = new THREE.Group();
  const yellow = toonMaterial('#ffd93d');
  const orange = toonMaterial(ANIMAL_PALETTE.orange);
  const dark = toonMaterial(ANIMAL_PALETTE.dark);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    root.add(m);
    return m;
  };
  add(new THREE.SphereGeometry(0.22, 18, 12), yellow, [0, 0.22, 0]);
  add(new THREE.SphereGeometry(0.16, 18, 12), yellow, [0, 0.5, 0.04]);
  const beak = add(new THREE.ConeGeometry(0.05, 0.1, 8), orange, [0, 0.49, 0.21]);
  beak.rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) {
    add(new THREE.SphereGeometry(0.03, 8, 8), dark, [side * 0.06, 0.55, 0.16]).userData.noOutline = true;
    const wing = add(new THREE.SphereGeometry(0.07, 10, 8), yellow, [side * 0.21, 0.25, 0]);
    wing.scale.set(0.5, 1, 1.2);
  }
  addOutlines(root, 0.03);
  return root;
}

/** Material names used in the model files (see models.ts) and their fixed toon colours. */
const MODEL_COLOURS = { Dark: ANIMAL_PALETTE.dark, Pink: ANIMAL_PALETTE.pink, White: ANIMAL_PALETTE.white } as const;
/** Small face details: no outline, it would swallow them. */
const NO_OUTLINE = new Set(['Dark', 'Pink', 'White']);

/** Material slot for a glTF material name: exact, or with Blender's ".001" suffix. */
export function modelMaterialSlot(name: string): string | null {
  const slots = ['Body', 'Light', ...Object.keys(MODEL_COLOURS)];
  return slots.find((k) => name === k || name.startsWith(k + '.')) ?? null;
}

function buildModelledAnimal(avatar: Avatar, equipped: Equipped): THREE.Group | null {
  const model = cloneAnimalModel(avatar.animal);
  if (!model) return null;
  const mats: Record<string, THREE.Material> = {
    Body: toonMaterial(avatar.color),
    Light: toonMaterial(lighten(avatar.color, 0.55)),
    ...Object.fromEntries(Object.entries(MODEL_COLOURS).map(([k, c]) => [k, toonMaterial(c)])),
  };
  model.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const name = (Array.isArray(o.material) ? o.material[0] : o.material)?.name ?? '';
    let key = modelMaterialSlot(name);
    if (!key) {
      if (import.meta.env.DEV) {
        console.warn(`Avatar model "${avatar.animal}": material "${name}" matches no slot, using Body.`);
      }
      key = 'Body';
    }
    o.material = mats[key];
    if (NO_OUTLINE.has(key)) o.userData.noOutline = true;
  });
  const root = new THREE.Group();
  root.userData.equipped = equipped;
  root.add(model);
  addOutlines(root, 0.035);
  root.traverse((o) => {
    o.castShadow = true;
  });
  root.add(buildOutfit(avatar.animal, equipped));
  return root;
}

function lighten(hex: string, amount: number): THREE.Color {
  return new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), amount);
}
