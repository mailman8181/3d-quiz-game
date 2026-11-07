import * as THREE from 'three';

let gradientMap: THREE.DataTexture | null = null;

/** 3-step gradient for the comic/cel-shaded look. Shared by all toon materials. */
function getGradientMap(): THREE.DataTexture {
  if (gradientMap) return gradientMap;
  const data = new Uint8Array([110, 110, 110, 255, 190, 190, 190, 255, 255, 255, 255, 255]);
  gradientMap = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

export function toonMaterial(color: THREE.ColorRepresentation): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, gradientMap: getGradientMap() });
}

export const OUTLINE_COLOR = '#2b2233';

const outlineMaterial = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide });

/**
 * Adds an "inverted hull" outline to every mesh in the object (cheap comic outline that
 * works on mobile; no post-processing pass needed).
 */
export function addOutlines(root: THREE.Object3D, thickness = 0.06): void {
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && !o.userData.isOutline && !o.userData.noOutline) meshes.push(o);
  });
  for (const mesh of meshes) {
    const outline = new THREE.Mesh(mesh.geometry, outlineMaterial);
    outline.userData.isOutline = true;
    // Scale relative to the mesh's own size so small parts keep a similar line width.
    mesh.geometry.computeBoundingSphere();
    const r = mesh.geometry.boundingSphere?.radius ?? 1;
    const s = 1 + thickness / Math.max(r, 0.05);
    outline.scale.setScalar(s);
    mesh.add(outline);
  }
}

/**
 * Disposes geometries and materials of a subtree. Kept: the shared outline material, and
 * geometry marked `userData.sharedGeometry` (meshes cloned from a cached glTF model, whose
 * geometry the cache still owns; see avatars/models.ts).
 */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh || o instanceof THREE.InstancedMesh) {
      if (!o.userData.isOutline && !o.userData.sharedGeometry) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) if (m !== outlineMaterial) m.dispose();
    }
  });
}
