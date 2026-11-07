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

const skinnedOutlineMaterials = new Map<number, THREE.MeshBasicMaterial>();

/**
 * Outline material for skinned meshes: a scaled hull can't follow the bones, so the hull is
 * pushed out along the skinned normal in the vertex shader instead (`thickness` in model
 * units). One shared material per thickness; `disposeObject` keeps it.
 */
export function skinnedOutlineMaterial(thickness: number): THREE.MeshBasicMaterial {
  let mat = skinnedOutlineMaterials.get(thickness);
  if (mat) return mat;
  mat = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide });
  mat.userData.sharedOutline = true;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.outlineThickness = { value: thickness };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float outlineThickness;')
      .replace(
        '#include <skinning_vertex>',
        '#include <skinning_vertex>\n#ifdef USE_SKINNING\n  transformed += normalize( objectNormal ) * outlineThickness;\n#endif',
      );
  };
  mat.customProgramCacheKey = () => `skinned-outline-${thickness}`;
  skinnedOutlineMaterials.set(thickness, mat);
  return mat;
}

/**
 * Adds an "inverted hull" outline to every mesh in the object (cheap comic outline that
 * works on mobile; no post-processing pass needed). Skinned meshes get a skinned hull bound to
 * the same skeleton, so the outline moves with the animation.
 */
export function addOutlines(root: THREE.Object3D, thickness = 0.06): void {
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if (o instanceof THREE.Mesh && !o.userData.isOutline && !o.userData.noOutline) meshes.push(o);
  });
  for (const mesh of meshes) {
    if (mesh instanceof THREE.SkinnedMesh) {
      const outline = new THREE.SkinnedMesh(mesh.geometry, skinnedOutlineMaterial(thickness));
      outline.userData.isOutline = true;
      outline.bind(mesh.skeleton, mesh.bindMatrix);
      mesh.add(outline);
      continue;
    }
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
 * Disposes geometries and materials of a subtree. Kept: the shared outline materials, and
 * geometry marked `userData.sharedGeometry` (meshes cloned from a cached glTF model, whose
 * geometry the cache still owns; see avatars/models.ts).
 */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh || o instanceof THREE.InstancedMesh) {
      if (!o.userData.isOutline && !o.userData.sharedGeometry) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) if (m !== outlineMaterial && !m.userData.sharedOutline) m.dispose();
    }
  });
}
