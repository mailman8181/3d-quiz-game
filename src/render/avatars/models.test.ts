import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { buildAnimal } from './animals';
import { setOutfit } from './accessories';
import { hasAnimalModel, markAnimalModelPending, registerAnimalModel } from './models';

/** A tiny stand-in for a model file: one mesh per contract material. */
function fakeModel(): THREE.Object3D {
  const g = new THREE.Group();
  for (const name of ['Body', 'Light', 'Dark', 'Pink', 'White']) {
    const mat = new THREE.MeshStandardMaterial();
    mat.name = name;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat);
    m.name = `fake-${name}`;
    g.add(m);
  }
  return g;
}

const cat = { animal: 'cat', color: '#f08c5a' } as const;

function meshByName(root: THREE.Object3D, name: string): THREE.Mesh {
  const m = root.getObjectByName(name);
  expect(m).toBeInstanceOf(THREE.Mesh);
  return m as THREE.Mesh;
}

afterEach(() => registerAnimalModel('cat', null));

describe('glTF avatar models', () => {
  it('builds the procedural cat when no model is loaded', () => {
    expect(hasAnimalModel('cat')).toBe(false);
    const g = buildAnimal(cat);
    expect(g.getObjectByName('fake-Body')).toBeUndefined();
    expect(g.children.length).toBeGreaterThan(5);
  });

  it('uses a loaded model with toon materials in the avatar colour', () => {
    registerAnimalModel('cat', fakeModel());
    const g = buildAnimal(cat);
    const body = meshByName(g, 'fake-Body');
    expect(body.material).toBeInstanceOf(THREE.MeshToonMaterial);
    expect((body.material as THREE.MeshToonMaterial).color.getHexString()).toBe('f08c5a');
    expect(meshByName(g, 'fake-Dark').userData.noOutline).toBe(true);
    expect(g.getObjectByName('outfit')).toBeDefined();
  });

  it('swaps a procedural avatar in place once the model finishes loading, keeping the outfit', () => {
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
