import * as THREE from 'three';

/**
 * Looping body animations for animals built from a rigged glTF model (ADR-0015).
 *
 * Each animal group built by `buildAnimal` from a model with clips gets an `AnimalAnimator`
 * in `userData.animator`. Views advance all animators in their scene once per frame with
 * `tickAnimals(scene, dt)` and switch idle/walk with `setAnimalMoving`. Procedural animals and
 * static models have no animator; both functions ignore them.
 *
 * Only state loops (idle, walk) for now; one-off scene animations (cheer at the goal etc.)
 * are not part of this.
 */
export const IDLE_CLIP = 'Idle';
export const WALK_CLIP = 'Walk';
const FADE_SECONDS = 0.2;

/** Bone each outfit slot follows (hats and glasses turn with the head). */
export const OUTFIT_BONES: Readonly<Record<string, string>> = { hat: 'Head', glasses: 'Head', neck: 'Body' };

export interface AnimalAnimator {
  readonly mixer: THREE.AnimationMixer;
  readonly idle: THREE.AnimationAction | null;
  readonly walk: THREE.AnimationAction | null;
  /** Bones named in OUTFIT_BONES, with the inverse of their rest pose in model space. */
  readonly outfitBones: ReadonlyMap<string, { bone: THREE.Object3D; restInverse: THREE.Matrix4 }>;
  moving: boolean;
}

let instances = 0;

/**
 * Creates the mixer for `model` (the freshly cloned glTF scene, still in its rest pose) and
 * starts the idle loop. Returns null when the clips contain neither `Idle` nor `Walk`. Each
 * instance starts the idle loop at a different, deterministic offset so two cats on screen
 * don't blink in sync.
 */
export function createAnimator(model: THREE.Object3D, clips: readonly THREE.AnimationClip[]): AnimalAnimator | null {
  const idleClip = THREE.AnimationClip.findByName(clips as THREE.AnimationClip[], IDLE_CLIP);
  const walkClip = THREE.AnimationClip.findByName(clips as THREE.AnimationClip[], WALK_CLIP);
  if (!idleClip && !walkClip) return null;

  model.updateMatrixWorld(true);
  const modelInverse = model.matrixWorld.clone().invert();
  const outfitBones = new Map<string, { bone: THREE.Object3D; restInverse: THREE.Matrix4 }>();
  for (const name of new Set(Object.values(OUTFIT_BONES))) {
    const bone = model.getObjectByName(name);
    if (!bone) continue;
    const rest = modelInverse.clone().multiply(bone.matrixWorld);
    outfitBones.set(name, { bone, restInverse: rest.invert() });
  }

  const mixer = new THREE.AnimationMixer(model);
  const idle = idleClip ? mixer.clipAction(idleClip) : null;
  const walk = walkClip ? mixer.clipAction(walkClip) : null;
  if (idle && idleClip) {
    idle.play();
    idle.time = (instances++ * 0.83) % idleClip.duration;
  }
  return { mixer, idle, walk, outfitBones, moving: false };
}

/**
 * Moves the items of the `outfit` group directly under `root` onto the bones they belong to
 * (OUTFIT_BONES by `userData.slot`), each bone getting a group named `outfit` that undoes the
 * bone's rest pose, so items keep their place at rest and follow the bone when it moves.
 * Items without a bone (or animals without an animator) stay where they are.
 */
export function attachOutfitToBones(root: THREE.Object3D): void {
  const a = getAnimator(root);
  const outfit = root.children.find((c) => c.name === 'outfit');
  if (!a || !outfit) return;
  for (const item of [...outfit.children]) {
    const boneName = OUTFIT_BONES[item.userData.slot as string];
    const entry = boneName ? a.outfitBones.get(boneName) : undefined;
    if (!entry) continue;
    let holder = entry.bone.children.find((c) => c.name === 'outfit');
    if (!holder) {
      holder = new THREE.Group();
      holder.name = 'outfit';
      entry.restInverse.decompose(holder.position, holder.quaternion, holder.scale);
      entry.bone.add(holder);
    }
    holder.add(item);
  }
}

export function getAnimator(root: THREE.Object3D): AnimalAnimator | null {
  return (root.userData.animator as AnimalAnimator | undefined) ?? null;
}

/** The animator of `root` or of the first animal inside it (e.g. a scaled lost-animal group). */
function findAnimator(root: THREE.Object3D): AnimalAnimator | null {
  let found = getAnimator(root);
  if (!found) {
    root.traverse((o) => {
      if (!found) found = getAnimator(o);
    });
  }
  return found;
}

/**
 * Switches between the idle and the walk loop (cross-fade). No-op without an animator, so it
 * is safe to call every frame for any animal.
 */
export function setAnimalMoving(root: THREE.Object3D, moving: boolean): void {
  const a = findAnimator(root);
  if (!a || a.moving === moving) return;
  a.moving = moving;
  const from = moving ? a.idle : a.walk;
  const to = moving ? a.walk : a.idle;
  if (!to) return;
  to.reset().play();
  if (from) from.crossFadeTo(to, FADE_SECONDS, false);
}

/** Advances every animator under `root` (usually the view's scene) by `dt` seconds. */
export function tickAnimals(root: THREE.Object3D, dt: number): void {
  root.traverse((o) => {
    const a = getAnimator(o);
    if (a) a.mixer.update(dt);
  });
}
