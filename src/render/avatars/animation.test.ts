import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addOutlines, disposeObject, skinnedOutlineMaterial } from '../toon';
import { setOutfit } from './accessories';
import { getAnimator, IDLE_CLIP, setAnimalMoving, tickAnimals, WALK_CLIP } from './animation';
import { buildAnimal } from './animals';
import { cloneAnimalModel, markAnimalModelPending, registerAnimalModel } from './models';

/**
 * A tiny rigged stand-in for a model file: bones Root > Body > Head, one skinned mesh per
 * contract material, every vertex bound to Head (so moving Head moves the whole mesh).
 */
function fakeRiggedModel(): THREE.Object3D {
  const scene = new THREE.Group();
  const root = new THREE.Bone();
  root.name = 'Root';
  const body = new THREE.Bone();
  body.name = 'Body';
  body.position.set(0, 0.1, 0);
  const head = new THREE.Bone();
  head.name = 'Head';
  head.position.set(0, 0.5, 0);
  root.add(body);
  body.add(head);
  scene.add(root);
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton([root, body, head]);
  for (const name of ['Body', 'Light', 'Dark']) {
    const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const n = geo.attributes.position!.count;
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Array(n * 4).fill(0).map((_, i) => (i % 4 === 0 ? 2 : 0)), 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Array(n * 4).fill(0).map((_, i) => (i % 4 === 0 ? 1 : 0)), 4));
    const mat = new THREE.MeshStandardMaterial();
    mat.name = name;
    const mesh = new THREE.SkinnedMesh(geo, mat);
    mesh.name = `fake-${name}`;
    scene.add(mesh);
    mesh.bind(skeleton);
  }
  return scene;
}

function fakeClips(): THREE.AnimationClip[] {
  const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
  const q0 = new THREE.Quaternion();
  return [
    new THREE.AnimationClip(IDLE_CLIP, 1, [
      new THREE.QuaternionKeyframeTrack('Head.quaternion', [0, 0.5, 1], [...q0.toArray(), ...turn.toArray(), ...q0.toArray()]),
    ]),
    new THREE.AnimationClip(WALK_CLIP, 0.5, [
      new THREE.VectorKeyframeTrack('Body.position', [0, 0.25, 0.5], [0, 0.1, 0, 0, 0.15, 0, 0, 0.1, 0]),
    ]),
  ];
}

const cat = { animal: 'cat', color: '#f08c5a' } as const;
const worldPos = (o: THREE.Object3D) => {
  o.updateWorldMatrix(true, true);
  return o.getWorldPosition(new THREE.Vector3());
};

afterEach(() => registerAnimalModel('cat', null));

describe('animated glTF avatars', () => {
  it('clones skinned models with their own skeleton', () => {
    registerAnimalModel('cat', fakeRiggedModel(), fakeClips());
    const a = cloneAnimalModel('cat')!;
    const b = cloneAnimalModel('cat')!;
    const skA = a.getObjectByName('fake-Body') as THREE.SkinnedMesh;
    const skB = b.getObjectByName('fake-Body') as THREE.SkinnedMesh;
    expect(skA.skeleton).not.toBe(skB.skeleton);
    expect(skA.skeleton.bones[2]).toBe(a.getObjectByName('Head'));
    expect(skA.userData.sharedGeometry).toBe(true);
  });

  it('gives a rigged model an animator that plays idle, and none for static models', () => {
    registerAnimalModel('cat', fakeRiggedModel(), fakeClips());
    const g = buildAnimal(cat);
    const a = getAnimator(g)!;
    expect(a).not.toBeNull();
    expect(a.idle!.isRunning()).toBe(true);
    expect(a.walk!.isRunning()).toBe(false);

    registerAnimalModel('cat', fakeRiggedModel(), []);
    expect(getAnimator(buildAnimal(cat))).toBeNull();
    registerAnimalModel('cat', null);
    expect(getAnimator(buildAnimal(cat))).toBeNull();
  });

  it('advances the idle loop with tickAnimals and moves the bones', () => {
    registerAnimalModel('cat', fakeRiggedModel(), fakeClips());
    const scene = new THREE.Scene();
    const g = buildAnimal(cat);
    scene.add(g);
    const head = g.getObjectByName('Head')!;
    const idle = getAnimator(g)!.idle!;
    const t0 = idle.time;
    tickAnimals(scene, 0.25);
    expect(idle.time).toBeCloseTo((t0 + 0.25) % 1, 5);
    expect(head.quaternion.angleTo(new THREE.Quaternion())).toBeGreaterThan(0);
  });

  it('cross-fades to walk while moving and back, and ignores animals without animator', () => {
    registerAnimalModel('cat', fakeRiggedModel(), fakeClips());
    const g = buildAnimal(cat);
    const a = getAnimator(g)!;
    setAnimalMoving(g, true);
    expect(a.moving).toBe(true);
    expect(a.walk!.isRunning()).toBe(true);
    tickAnimals(g, 0.5);
    expect(a.idle!.getEffectiveWeight()).toBe(0);
    setAnimalMoving(g, false);
    expect(a.idle!.isRunning()).toBe(true);

    // A scaled wrapper (like lost-animal babies) still finds the animator inside.
    const wrapper = new THREE.Group();
    wrapper.add(buildAnimal(cat));
    setAnimalMoving(wrapper, true);
    expect(getAnimator(wrapper.children[0]!)!.moving).toBe(true);

    registerAnimalModel('cat', null);
    expect(() => setAnimalMoving(buildAnimal(cat), true)).not.toThrow();
  });

  it('puts hats on the head bone so they follow the head, without moving them at rest', () => {
    const restHat = worldPos(
      (() => {
        registerAnimalModel('cat', fakeRiggedModel(), []);
        return buildAnimal(cat, { hat: 'party-hat' }).getObjectByName('outfit')!.children[0]!;
      })(),
    );
    registerAnimalModel('cat', fakeRiggedModel(), fakeClips());
    const g = buildAnimal(cat, { hat: 'party-hat', neck: 'bow-tie' });
    const head = g.getObjectByName('Head')!;
    const body = g.getObjectByName('Body')!;
    const hat = head.getObjectByName('outfit')!.children[0]!;
    expect(hat.userData.slot).toBe('hat');
    expect(body.children.find((c) => c.name === 'outfit')!.children[0]!.userData.slot).toBe('neck');
    expect(worldPos(hat).distanceTo(restHat)).toBeLessThan(1e-6);

    head.rotateZ(0.4);
    expect(worldPos(hat).distanceTo(restHat)).toBeGreaterThan(0.05);
  });

  it('setOutfit on an animated model replaces the items on the bones', () => {
    registerAnimalModel('cat', fakeRiggedModel(), fakeClips());
    const g = buildAnimal(cat, { hat: 'party-hat' });
    setOutfit(g, 'cat', { hat: 'crown' });
    const hats: THREE.Object3D[] = [];
    g.traverse((o) => {
      if (o.userData.slot === 'hat') hats.push(o);
    });
    expect(hats).toHaveLength(1);
    setOutfit(g, 'cat', {});
    let left = 0;
    g.traverse((o) => {
      if (o.userData.slot) left++;
    });
    expect(left).toBe(0);
  });

  it('keeps the animator when a model that was still loading is swapped in', () => {
    markAnimalModelPending('cat');
    const g = buildAnimal(cat, { hat: 'party-hat' });
    expect(getAnimator(g)).toBeNull();
    registerAnimalModel('cat', fakeRiggedModel(), fakeClips());
    expect(getAnimator(g)).not.toBeNull();
    expect(g.getObjectByName('Head')!.getObjectByName('outfit')!.children).toHaveLength(1);
  });
});

describe('outlines for skinned meshes', () => {
  it('adds a skinned hull bound to the same skeleton, with a shared material that is not disposed', () => {
    const model = fakeRiggedModel();
    addOutlines(model, 0.02);
    const mesh = model.getObjectByName('fake-Body') as THREE.SkinnedMesh;
    const outline = mesh.children.find((c) => c.userData.isOutline) as THREE.SkinnedMesh;
    expect(outline).toBeInstanceOf(THREE.SkinnedMesh);
    expect(outline.skeleton).toBe(mesh.skeleton);
    expect(outline.material).toBe(skinnedOutlineMaterial(0.02));
    expect(outline.scale.x).toBe(1);

    const dispose = vi.spyOn(skinnedOutlineMaterial(0.02), 'dispose');
    disposeObject(model);
    expect(dispose).not.toHaveBeenCalled();
  });
});
