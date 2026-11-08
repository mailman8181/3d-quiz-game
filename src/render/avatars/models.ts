import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import type { AvatarAnimal } from '../../core/profile/profile';

/**
 * Hand-made animals (Blender → glTF, see ASSETS.md and docs/adr/0014-gltf-avatars.md).
 *
 * Loading never blocks the first screen: `preloadAnimalModels` starts in the background and
 * `buildAnimal` uses the procedural animal until the model is there, then swaps it in place
 * (see `onAnimalModelLoaded`). Animals without a model, or whose model fails to load, stay
 * procedural.
 *
 * Contract for a model file:
 * - stands on y=0, faces +z, about 1 unit tall (like the procedural animals);
 * - one mesh per colour, named by material: `Body` (tinted with the avatar colour),
 *   `Light` (belly/muzzle, a lighter shade of the avatar colour), `Dark`, `Pink`, `White`;
 * - optional skeleton (skinned meshes) and animation clips named `Idle` and `Walk`
 *   (ADR-0015, played by `animation.ts`).
 */
export const MODEL_FILES: Partial<Record<AvatarAnimal, string>> = {
  cat: 'models/cat.glb',
  bunny: 'models/bunny.glb',
  bear: 'models/bear.glb',
  frog: 'models/frog.glb',
  penguin: 'models/penguin.glb',
};

const cache = new Map<AvatarAnimal, THREE.Object3D>();
const clipCache = new Map<AvatarAnimal, THREE.AnimationClip[]>();

/** The model's animation clips (shared, read-only), empty for static or missing models. */
export function animalModelClips(animal: AvatarAnimal): THREE.AnimationClip[] {
  return clipCache.get(animal) ?? [];
}
const pending = new Set<AvatarAnimal>();
const listeners = new Map<AvatarAnimal, Set<() => void>>();

export function hasAnimalModel(animal: AvatarAnimal): boolean {
  return cache.has(animal);
}

/**
 * A fresh clone of the loaded model, or null if there is none (yet). Skinned models are cloned
 * with SkeletonUtils so each clone gets its own bones (Object3D.clone would bind the clone to
 * the cached skeleton). The clone's meshes share their geometry with the cache, so they are
 * marked `sharedGeometry` and `disposeObject` leaves the geometry alone (materials are
 * replaced per avatar and are freed as usual).
 */
export function cloneAnimalModel(animal: AvatarAnimal): THREE.Object3D | null {
  const src = cache.get(animal);
  if (!src) return null;
  const clone = cloneSkinned(src);
  clone.traverse((o) => {
    if (o instanceof THREE.Mesh) o.userData.sharedGeometry = true;
  });
  return clone;
}

/**
 * Calls `cb` once when the model for `animal` has finished loading. Returns false (and never
 * calls back) when no load is in progress for that animal.
 */
export function onAnimalModelLoaded(animal: AvatarAnimal, cb: () => void): boolean {
  if (!pending.has(animal)) return false;
  let set = listeners.get(animal);
  if (!set) listeners.set(animal, (set = new Set()));
  set.add(cb);
  return true;
}

function settle(animal: AvatarAnimal, model: THREE.Object3D | null, clips: THREE.AnimationClip[] = []): void {
  pending.delete(animal);
  const set = listeners.get(animal);
  listeners.delete(animal);
  if (!model) return;
  cache.set(animal, model);
  clipCache.set(animal, clips);
  for (const cb of set ?? []) cb();
}

let preload: Promise<void> | null = null;

/** Starts loading all model files once, in the background. Never rejects. */
export function preloadAnimalModels(): Promise<void> {
  if (preload) return preload;
  const loader = new GLTFLoader();
  const base = import.meta.env.BASE_URL ?? '/';
  const jobs = Object.entries(MODEL_FILES).map(async ([key, file]) => {
    const animal = key as AvatarAnimal;
    pending.add(animal);
    try {
      const gltf = await loader.loadAsync(base + file);
      settle(animal, gltf.scene, gltf.animations);
    } catch (err) {
      console.warn(`Avatar model ${file} could not be loaded, keeping the procedural animal.`, err);
      settle(animal, null);
    }
  });
  preload = Promise.all(jobs).then(() => undefined);
  return preload;
}

/** Test hooks: simulate a load in progress, its success (model) or failure (null). */
export function markAnimalModelPending(animal: AvatarAnimal): void {
  pending.add(animal);
}
export function registerAnimalModel(
  animal: AvatarAnimal,
  model: THREE.Object3D | null,
  clips: THREE.AnimationClip[] = [],
): void {
  if (pending.has(animal)) settle(animal, model, clips);
  else if (model) {
    cache.set(animal, model);
    clipCache.set(animal, clips);
  } else {
    cache.delete(animal);
    clipCache.delete(animal);
  }
}
