import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { AvatarAnimal } from '../../core/profile/profile';

/**
 * Hand-modelled animals (Blender → glTF, see ASSETS.md and docs/adr/0014-gltf-avatars.md).
 *
 * Models are preloaded once at start-up so `buildAnimal` can stay synchronous. Every animal
 * without a model here (or whose model failed to load) keeps the procedural version.
 *
 * Contract for a model file:
 * - stands on y=0, faces +z, about 1 unit tall (like the procedural animals);
 * - one mesh per colour, named by material: `Body` (tinted with the avatar colour),
 *   `Light` (belly/muzzle, a lighter shade of the avatar colour), `Dark`, `Pink`, `White`.
 */
const MODEL_FILES: Partial<Record<AvatarAnimal, string>> = {
  cat: 'models/cat.glb',
};

const cache = new Map<AvatarAnimal, THREE.Object3D>();

export function hasAnimalModel(animal: AvatarAnimal): boolean {
  return cache.has(animal);
}

/** A fresh clone of the preloaded model, or null if there is none. */
export function cloneAnimalModel(animal: AvatarAnimal): THREE.Object3D | null {
  const src = cache.get(animal);
  return src ? src.clone(true) : null;
}

let preload: Promise<void> | null = null;

/** Loads all model files once. Never rejects: failed models fall back to procedural. */
export function preloadAnimalModels(timeoutMs = 4000): Promise<void> {
  if (preload) return preload;
  const loader = new GLTFLoader();
  const base = import.meta.env.BASE_URL ?? '/';
  const jobs = Object.entries(MODEL_FILES).map(async ([animal, file]) => {
    try {
      const gltf = await loader.loadAsync(base + file);
      cache.set(animal as AvatarAnimal, gltf.scene);
    } catch (err) {
      console.warn(`Avatar model ${file} could not be loaded, using procedural animal.`, err);
    }
  });
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  preload = Promise.race([Promise.all(jobs).then(() => undefined), timeout]);
  return preload;
}

/** Test hook. */
export function registerAnimalModel(animal: AvatarAnimal, model: THREE.Object3D | null): void {
  if (model) cache.set(animal, model);
  else cache.delete(animal);
}
