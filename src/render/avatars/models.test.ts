import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { disposeObject } from '../toon';
import { setOutfit } from './accessories';
import { ANIMAL_PALETTE, buildAnimal, modelMaterialSlot } from './animals';
import { hasAnimalModel, markAnimalModelPending, registerAnimalModel } from './models';

/** A tiny stand-in for a model file: one mesh per material name, named `fake-<material>`. */
function fakeModel(names = ['Body', 'Light', 'Dark', 'Pink', 'White', 'Body.001', 'Whiskers']): THREE.Object3D {
  const g = new THREE.Group();
  for (const name of names) {
    const mat = new THREE.MeshStandardMaterial();
    mat.name = name;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat);
    m.name = `fake-${name}`;
    g.add(m);
  }
  return g;
}

const COLOR = '#f08c5a';
const cat = { animal: 'cat', color: COLOR } as const;

function mesh(root: THREE.Object3D, material: string): THREE.Mesh {
  const m = root.getObjectByName(`fake-${material}`);
  expect(m, `mesh for ${material}`).toBeInstanceOf(THREE.Mesh);
  return m as THREE.Mesh;
}
const colourOf = (m: THREE.Mesh) => (m.material as THREE.MeshToonMaterial).color.getHexString();
const hasOutline = (m: THREE.Mesh) => m.children.some((c) => c.userData.isOutline);
const outfitTop = (root: THREE.Object3D) => new THREE.Box3().setFromObject(root.getObjectByName('outfit')!).max.y;

afterEach(() => {
  registerAnimalModel('cat', null);
  vi.restoreAllMocks();
});

describe('model material slots', () => {
  it('matches exact names and Blender suffixes, nothing else', () => {
    expect(modelMaterialSlot('Body')).toBe('Body');
    expect(modelMaterialSlot('Body.001')).toBe('Body');
    expect(modelMaterialSlot('Light')).toBe('Light');
    expect(modelMaterialSlot('Bodywork')).toBeNull();
    expect(modelMaterialSlot('Whiskers')).toBeNull();
  });
});

describe('buildAnimal with a glTF model', () => {
  it('builds the procedural cat when no model is loaded', () => {
    expect(hasAnimalModel('cat')).toBe(false);
    const g = buildAnimal(cat);
    expect(g.getObjectByName('fake-Body')).toBeUndefined();
    expect(g.getObjectByName('outfit')).toBeDefined();
  });

  it('maps materials to toon colours: avatar colour, its lighter shade and the fixed palette', () => {
    registerAnimalModel('cat', fakeModel());
    const g = buildAnimal(cat);
    const lighter = new THREE.Color(COLOR).lerp(new THREE.Color('#ffffff'), 0.55).getHexString();
    expect(mesh(g, 'Body').material).toBeInstanceOf(THREE.MeshToonMaterial);
    expect(colourOf(mesh(g, 'Body'))).toBe('f08c5a');
    expect(colourOf(mesh(g, 'Body.001'))).toBe('f08c5a');
    expect(colourOf(mesh(g, 'Light'))).toBe(lighter);
    expect(colourOf(mesh(g, 'Dark'))).toBe(ANIMAL_PALETTE.dark.slice(1));
    expect(colourOf(mesh(g, 'Pink'))).toBe(ANIMAL_PALETTE.pink.slice(1));
    expect(colourOf(mesh(g, 'White'))).toBe(ANIMAL_PALETTE.white.slice(1));
  });

  it('falls back to Body for unknown material names', () => {
    registerAnimalModel('cat', fakeModel());
    const g = buildAnimal(cat);
    expect(colourOf(mesh(g, 'Whiskers'))).toBe('f08c5a');
    expect(hasOutline(mesh(g, 'Whiskers'))).toBe(true);
  });

  it('outlines Body and Light but not the small face details', () => {
    registerAnimalModel('cat', fakeModel());
    const g = buildAnimal(cat);
    expect(hasOutline(mesh(g, 'Body'))).toBe(true);
    expect(hasOutline(mesh(g, 'Light'))).toBe(true);
    for (const m of ['Dark', 'Pink', 'White']) expect(hasOutline(mesh(g, m))).toBe(false);
  });

  it('attaches the outfit at the model anchors: hats higher and scaled for the bigger head', () => {
    const procedural = buildAnimal(cat, { hat: 'crown', glasses: 'round-glasses' });
    registerAnimalModel('cat', fakeModel());
    const modelled = buildAnimal(cat, { hat: 'crown', glasses: 'round-glasses' });
    const [pHat] = procedural.getObjectByName('outfit')!.children;
    const [mHat, mGlasses] = modelled.getObjectByName('outfit')!.children;
    expect(mHat!.position.y).toBeCloseTo(pHat!.position.y + (1.11 - 1.03), 5);
    expect(mHat!.scale.x).toBeCloseTo(1.22, 5);
    expect(pHat!.scale.x).toBe(1);
    expect(mGlasses!.scale.x).toBe(1); // only hats are scaled
    expect(outfitTop(modelled)).toBeGreaterThan(outfitTop(procedural));
  });

  it('restores the procedural animal after registerAnimalModel(animal, null)', () => {
    registerAnimalModel('cat', fakeModel());
    expect(buildAnimal(cat).getObjectByName('fake-Body')).toBeDefined();
    registerAnimalModel('cat', null);
    expect(buildAnimal(cat).getObjectByName('fake-Body')).toBeUndefined();
  });

  it('disposing an avatar frees its materials but not the cached model geometry', () => {
    const model = fakeModel();
    registerAnimalModel('cat', model);
    const g = buildAnimal(cat);
    const cachedGeo = mesh(model, 'Body').geometry;
    const geoDispose = vi.spyOn(cachedGeo, 'dispose');
    const matDispose = vi.spyOn(mesh(g, 'Body').material as THREE.Material, 'dispose');
    disposeObject(g);
    expect(geoDispose).not.toHaveBeenCalled();
    expect(matDispose).toHaveBeenCalled();
  });
});

describe('model loading after the avatar was built', () => {
  it('swaps a procedural avatar in place once the model arrives, keeping position and outfit', () => {
    markAnimalModelPending('cat');
    const g = buildAnimal(cat);
    g.position.set(3, 0, 2);
    setOutfit(g, 'cat', { hat: 'party-hat' });
    expect(g.getObjectByName('fake-Body')).toBeUndefined();

    registerAnimalModel('cat', fakeModel());

    expect(g.getObjectByName('fake-Body')).toBeDefined();
    expect(g.position.toArray()).toEqual([3, 0, 2]);
    expect(g.getObjectsByProperty('name', 'outfit')).toHaveLength(1);
    expect(g.getObjectByName('outfit')!.children.length).toBeGreaterThan(0);
  });

  it('keeps the procedural avatar if the model fails to load', () => {
    markAnimalModelPending('cat');
    const g = buildAnimal(cat);
    const before = g.children.length;
    registerAnimalModel('cat', null);
    expect(g.children.length).toBe(before);
    expect(g.getObjectByName('fake-Body')).toBeUndefined();
  });
});
