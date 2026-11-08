import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { LOST_ANIMALS, type LostAnimal } from '../../core/profile/lostAnimals';
import { AVATAR_ANIMALS } from '../../core/profile/profile';
import { MODEL_ANCHORS } from './accessories';
import { CHEER_CLIP, getAnimator, IDLE_CLIP, OUTFIT_BONES, setAnimalCheering, WALK_CLIP } from './animation';
import { buildAnimal, modelMaterialSlot } from './animals';
import { buildLostAnimal, FRIEND_SCALE, friendMaterialSlot } from './lostAnimals';
import { MODEL_FILES, type ModelId, registerAnimalModel } from './models';

/**
 * Contract tests for the shipped model files (public/models and public/models/friends, ADR-0014..0017):
 * they run the real files through GLTFLoader, buildAnimal and buildLostAnimal, so a broken
 * Blender export fails here, not on a child's phone.
 */
const MAX_BYTES = 400 * 1024;
const MAX_TOTAL_BYTES = 1.5 * 1024 * 1024;
const MAX_FRIENDS_TOTAL_BYTES = 2.2 * 1024 * 1024;
const MAX_TRIANGLES = 12_000;
const ALL_CLIPS = [CHEER_CLIP, IDLE_CLIP, WALK_CLIP].sort();

/** Lost friends with their own model (kitten and bunny baby are the cat and bunny). */
const FRIENDS = LOST_ANIMALS.filter((a) => a !== 'kitten' && a !== 'bunny-baby');
const FRIEND_SLOTS = ['Body', 'Light', 'Accent', 'Dark', 'Pink', 'White', 'Orange', 'ShellDark', 'Fin'];

/** The shipped files, inlined by Vite as data URLs (no Node APIs in src). */
const FILES = import.meta.glob<string>('../../../public/models/**/*.glb', { query: '?inline', import: 'default', eager: true });

interface GltfJson {
  materials: { name: string }[];
  images?: unknown[];
  buffers: { uri?: string }[];
  extensionsRequired?: string[];
}

function readGlb(file: string): { json: GltfJson; buffer: ArrayBuffer } {
  const dataUrl = FILES[`../../../public/${file}`];
  if (!dataUrl) throw new Error(`${file} not found in public/`);
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  const jsonLength = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength))) as GltfJson;
  return { json, buffer: bytes.buffer };
}

const loaded = new Map<ModelId, { scene: THREE.Object3D; clips: THREE.AnimationClip[] }>();

beforeAll(async () => {
  const loader = new GLTFLoader();
  for (const animal of [...AVATAR_ANIMALS, ...FRIENDS]) {
    const file = MODEL_FILES[animal];
    if (!file) continue;
    const gltf = await loader.parseAsync(readGlb(file).buffer, '');
    loaded.set(animal, { scene: gltf.scene, clips: gltf.animations });
  }
});

afterEach(() => {
  for (const animal of [...AVATAR_ANIMALS, ...FRIENDS]) registerAnimalModel(animal, null);
});

function checkRig(scene: THREE.Object3D, clips: THREE.AnimationClip[]): void {
  let triangles = 0;
  let skinned = 0;
  scene.traverse((o) => {
    if (o instanceof THREE.SkinnedMesh) {
      skinned++;
      triangles += (o.geometry.index?.count ?? 0) / 3;
    }
  });
  expect(skinned).toBeGreaterThanOrEqual(4);
  expect(triangles).toBeLessThan(MAX_TRIANGLES);
  expect(clips.map((c) => c.name).sort()).toEqual(ALL_CLIPS);
  for (const c of clips) expect(c.duration).toBeGreaterThan(0.3);
  // GLTFLoader sanitizes node names ("Eye.L" → "EyeL"); the clips' tracks use the same names.
  expect(scene.getObjectByName('EyeL')).toBeDefined();
  expect(scene.getObjectByName('EyeR')).toBeDefined();
  const boneNames = new Set<string>();
  scene.traverse((o) => {
    if (o instanceof THREE.Bone) boneNames.add(o.name);
  });
  for (const clip of clips) {
    for (const track of clip.tracks) expect(boneNames, track.name).toContain(track.name.split('.')[0]);
  }
}

describe('shipped avatar model files', () => {
  it('every avatar animal has a model file, within the size budget', () => {
    let total = 0;
    for (const animal of AVATAR_ANIMALS) {
      const file = MODEL_FILES[animal];
      expect(file, animal).toBe(`models/${animal}.glb`);
      const size = readGlb(file!).buffer.byteLength;
      expect(size, `${animal} bytes`).toBeLessThan(MAX_BYTES);
      total += size;
    }
    expect(total).toBeLessThan(MAX_TOTAL_BYTES);
  });

  it.each(AVATAR_ANIMALS)('%s: self-contained, known materials, no textures or extensions', (animal) => {
    const { json } = readGlb(MODEL_FILES[animal]!);
    expect(json.images ?? []).toHaveLength(0);
    expect(json.buffers.every((b) => b.uri === undefined)).toBe(true);
    expect(json.extensionsRequired ?? []).toHaveLength(0);
    const slots = json.materials.map((m) => modelMaterialSlot(m.name));
    expect(slots).not.toContain(null);
    expect(slots).toContain('Body');
  });

  it.each(AVATAR_ANIMALS)('%s: stands on y=0, faces +z, fits the avatar size', (animal) => {
    const box = new THREE.Box3().setFromObject(loaded.get(animal)!.scene);
    expect(box.min.y).toBeGreaterThan(-0.02);
    expect(box.min.y).toBeLessThan(0.05);
    expect(box.max.y).toBeGreaterThan(0.95);
    expect(box.max.y).toBeLessThan(1.5); // bunny ears are the tallest part
    // The face is at +z: more of the model is in front than behind (tails are short).
    expect(box.max.z).toBeGreaterThan(0.25);
  });

  it.each(AVATAR_ANIMALS)('%s: skinned, with Idle/Walk/Cheer clips and the outfit bones', (animal) => {
    const { scene, clips } = loaded.get(animal)!;
    checkRig(scene, clips);
    for (const bone of new Set(Object.values(OUTFIT_BONES))) expect(scene.getObjectByName(bone), bone).toBeDefined();
  });

  it.each(AVATAR_ANIMALS)('%s: builds as an animated avatar with outfit on its bones', (animal) => {
    const { scene, clips } = loaded.get(animal)!;
    registerAnimalModel(animal, scene, clips);
    const g = buildAnimal({ animal, color: '#8fd16a' }, { hat: 'party-hat', neck: 'bow-tie' });
    const a = getAnimator(g)!;
    expect(a).not.toBeNull();
    expect(a.idle!.isRunning()).toBe(true);
    // Hat on the head bone; at rest it sits exactly where buildOutfit put it (the holder undoes
    // the real bone's rest pose), i.e. near the model's head top. Neck item on the body bone.
    const hat = g.getObjectByName('Head')!.getObjectByName('outfit')!.children[0]!;
    expect(hat.userData.slot).toBe('hat');
    g.updateWorldMatrix(true, true);
    const world = hat.getWorldPosition(new THREE.Vector3());
    expect(world.distanceTo(hat.position)).toBeLessThan(1e-5);
    expect(Math.abs(world.y - MODEL_ANCHORS[animal].headTop)).toBeLessThan(0.1);
    const bodyHolder = g.getObjectByName('Body')!.children.find((c) => c.name === 'outfit')!;
    expect(bodyHolder.children[0]!.userData.slot).toBe('neck');
    // Only toon materials, avatar colour on Body.
    g.traverse((o) => {
      if (o instanceof THREE.SkinnedMesh && !o.userData.isOutline) {
        expect(o.material).toBeInstanceOf(THREE.MeshToonMaterial);
      }
    });
  });
});

describe('shipped lost-friend model files', () => {
  it('every friend except kitten and bunny baby has a model file, within the size budget', () => {
    let total = 0;
    for (const id of FRIENDS) {
      const file = MODEL_FILES[id];
      expect(file, id).toBe(`models/friends/${id}.glb`);
      const size = readGlb(file!).buffer.byteLength;
      expect(size, `${id} bytes`).toBeLessThan(MAX_BYTES);
      total += size;
    }
    expect(total).toBeLessThan(MAX_FRIENDS_TOTAL_BYTES);
    expect(MODEL_FILES.kitten).toBeUndefined();
    expect(MODEL_FILES['bunny-baby']).toBeUndefined();
  });

  it.each(FRIENDS)('%s: self-contained, own colour materials <friend>_<Slot>', (id) => {
    const { json } = readGlb(MODEL_FILES[id]!);
    expect(json.images ?? []).toHaveLength(0);
    expect(json.buffers.every((b) => b.uri === undefined)).toBe(true);
    expect(json.extensionsRequired ?? []).toHaveLength(0);
    for (const m of json.materials) {
      expect(m.name.startsWith(`${id}_`), m.name).toBe(true);
      expect(FRIEND_SLOTS, m.name).toContain(friendMaterialSlot(m.name));
    }
    expect(json.materials.map((m) => friendMaterialSlot(m.name))).toContain('Body');
  });

  it.each(FRIENDS)('%s: stands on y=0 (fish float), faces +z, fits the friend size', (id) => {
    const box = new THREE.Box3().setFromObject(loaded.get(id)!.scene);
    expect(box.min.y).toBeGreaterThan(-0.02);
    expect(box.max.y).toBeGreaterThan(0.55);
    expect(box.max.y).toBeLessThan(1.5);
    expect(box.max.z).toBeGreaterThan(0.2);
  });

  it.each(FRIENDS)('%s: skinned, with Idle/Walk/Cheer clips', (id) => {
    const { scene, clips } = loaded.get(id)!;
    checkRig(scene, clips);
  });

  it.each(FRIENDS)('%s: builds as an animated friend in the file colours, and can cheer', (id) => {
    const { scene, clips } = loaded.get(id)!;
    registerAnimalModel(id as LostAnimal, scene, clips);
    const g = buildLostAnimal(id as LostAnimal);
    const a = getAnimator(g)!;
    expect(a).not.toBeNull();
    expect(a.idle!.isRunning()).toBe(true);
    expect(g.children[0]!.scale.x).toBeCloseTo(FRIEND_SCALE, 5);
    const fileColours = new Set<string>();
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) fileColours.add((o.material as THREE.MeshStandardMaterial).color.getHexString());
    });
    g.traverse((o) => {
      if (o instanceof THREE.SkinnedMesh && !o.userData.isOutline) {
        expect(o.material).toBeInstanceOf(THREE.MeshToonMaterial);
        expect(fileColours).toContain((o.material as THREE.MeshToonMaterial).color.getHexString());
      }
    });
    expect(setAnimalCheering(g, true)).toBe(true);
    expect(a.cheer!.isRunning()).toBe(true);
  });
});
