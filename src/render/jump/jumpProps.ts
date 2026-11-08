import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Crawler, Obstacle } from '../../core/activities/jump';
import { BLOCK_SIZE } from '../../core/activities/jump';
import { addOutlines, toonMaterial } from '../toon';

/**
 * Toon props for the 3D Hüpf-Abenteuer (ADR-0018): built in code from simple shapes like the
 * chests and hedges (no model files, so nothing is added to the precache). Each builder returns
 * a group standing on y = 0 at x = 0 (left edge of the logic box), spanning x to the right and
 * centred on z = 0 (the lane); outlines included.
 */
export const COLOURS = {
  grass: '#7cc75a',
  grassDark: '#5aa845',
  dirt: '#b07a4a',
  dirtDark: '#8a5a34',
  wood: '#b5651d',
  woodLight: '#e7b97a',
  stone: '#a7adb8',
  capRed: '#ef4f4f',
  white: '#fff7ea',
  leaf: '#4fbf6a',
  leafLight: '#9be08a',
  used: '#c99a64',
  shell: '#f2a541',
  shellDark: '#c9741c',
  snail: '#a8d672',
  beetle: '#e84a4a',
  dark: '#2b2233',
  flagPole: '#eeeeee',
  flag: '#ff5d73',
};

const LANE_DEPTH = 1.6;

function mesh(geo: THREE.BufferGeometry, color: string, pos: [number, number, number] = [0, 0, 0]): THREE.Mesh {
  const m = new THREE.Mesh(geo, toonMaterial(color));
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** A grass-topped earth block (steps, platforms). */
function earthBlock(width: number, height: number, depth: number, grassTop = 0.16): THREE.Group {
  const g = new THREE.Group();
  const r = Math.min(0.1, height / 3, width / 4);
  g.add(mesh(new RoundedBoxGeometry(width, Math.max(height - grassTop * 0.5, 0.05), depth, 2, r), COLOURS.dirt, [width / 2, (height - grassTop * 0.5) / 2, 0]));
  g.add(mesh(new RoundedBoxGeometry(width + 0.06, grassTop, depth + 0.06, 2, Math.min(0.07, grassTop / 2.2)), COLOURS.grass, [width / 2, height - grassTop / 2, 0]));
  return g;
}

/** Ground strip from x0 to x1: scalloped grass edge, earth below (deep enough for any camera). */
export function buildGround(x0: number, x1: number): THREE.Group {
  const g = new THREE.Group();
  g.name = 'ground';
  const dirt = mesh(new THREE.BoxGeometry(x1 - x0, 8, 6), COLOURS.dirt, [(x0 + x1) / 2, -4 - 0.12, -1.6]);
  dirt.castShadow = false;
  g.add(dirt);
  // Grass: one merged slab plus a row of round bumps along the front edge.
  const parts: THREE.BufferGeometry[] = [];
  const slab = new THREE.BoxGeometry(x1 - x0, 0.24, 6);
  slab.translate((x0 + x1) / 2, -0.12, -1.6);
  parts.push(slab);
  for (let x = x0; x < x1; x += 0.7) {
    const bump = new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    bump.scale(1.3, 0.5, 0.7);
    bump.rotateX(Math.PI / 2);
    bump.translate(x, -0.12, 1.4);
    parts.push(bump.toNonIndexed());
  }
  const grass = mesh(mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!, COLOURS.grass);
  grass.castShadow = false;
  g.add(grass);
  // Darker stones in the earth (front face) for texture.
  const pebbles: THREE.BufferGeometry[] = [];
  for (let x = x0 + 0.5, i = 0; x < x1; x += 1.9, i++) {
    const p = new THREE.SphereGeometry(0.12 + (i % 3) * 0.04, 8, 6);
    p.scale(1.4, 0.8, 0.3);
    p.translate(x, -0.6 - (i % 4) * 0.55, 1.42);
    pebbles.push(p);
  }
  const peb = mesh(mergeGeometries(pebbles)!, COLOURS.dirtDark);
  peb.castShadow = false;
  g.add(peb);
  return g;
}

/** Log, stone, mushroom or step for one ground obstacle. */
export function buildObstacle(o: Obstacle): THREE.Group {
  const g = new THREE.Group();
  if (o.kind === 'step') {
    g.add(earthBlock(o.width, o.height, LANE_DEPTH));
    // Steps outline only along their silhouette is too busy; the grass top lip reads well.
    return g;
  }
  if (o.kind === 'log') {
    // Turned a little about its middle so a ring cap faces the camera (side-on it read as a box).
    const r = o.height / 2;
    const log = new THREE.Group();
    log.position.set(o.width / 2, r, 0);
    log.rotation.y = -0.45;
    const bark = mesh(new THREE.CylinderGeometry(r, r, o.width, 16), COLOURS.wood);
    bark.rotation.z = Math.PI / 2;
    log.add(bark);
    for (const side of [-1, 1]) {
      const ring = mesh(new THREE.CircleGeometry(r * 0.82, 16), COLOURS.woodLight, [side * (o.width / 2 + 0.005), 0, 0]);
      ring.rotation.y = (side * Math.PI) / 2;
      ring.userData.noOutline = true;
      log.add(ring);
      const core = mesh(new THREE.CircleGeometry(r * 0.3, 12), COLOURS.wood, [side * (o.width / 2 + 0.01), 0, 0]);
      core.rotation.y = (side * Math.PI) / 2;
      core.userData.noOutline = true;
      log.add(core);
    }
    log.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), COLOURS.wood, [-o.width * 0.15, r * 0.95, 0.15]));
    g.add(log);
  } else if (o.kind === 'stone') {
    const geo = new THREE.DodecahedronGeometry(0.5, 1);
    geo.scale(o.width / 1, o.height / 1, 0.9);
    const s = mesh(geo, COLOURS.stone, [o.width / 2, o.height / 2, 0]);
    g.add(s);
    const moss = mesh(new THREE.SphereGeometry(0.16, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), COLOURS.grassDark, [o.width * 0.35, o.height * 0.93, 0.1]);
    moss.scale.set(1.3, 0.5, 1);
    g.add(moss);
  } else {
    const stem = mesh(new THREE.CylinderGeometry(0.17, 0.22, o.height * 0.6, 14), COLOURS.white, [o.width / 2, o.height * 0.3, 0]);
    g.add(stem);
    const capGeo = new THREE.SphereGeometry(o.width / 2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    capGeo.scale(1, (o.height * 0.55) / (o.width / 2), 1);
    const cap = mesh(capGeo, COLOURS.capRed, [o.width / 2, o.height * 0.45, 0]);
    g.add(cap);
    for (const [dx, dy, dz] of [
      [-0.18, 0.2, 0.22],
      [0.16, 0.25, 0.2],
      [0, 0.33, 0.05],
      [0.05, 0.15, 0.33],
    ] as const) {
      const dot = mesh(new THREE.SphereGeometry(0.06, 8, 6), COLOURS.white, [o.width / 2 + dx, o.height * 0.45 + dy, dz]);
      dot.scale.set(1, 0.5, 1);
      dot.userData.noOutline = true;
      g.add(dot);
    }
  }
  addOutlines(g, 0.035);
  return g;
}

/** Floating grass platform; its top surface is at the group's origin height (y = 0). */
export function buildPlatform(width: number): THREE.Group {
  const g = new THREE.Group();
  const block = earthBlock(width, 0.35, 1.2, 0.18);
  block.position.y = -0.35;
  g.add(block);
  // Hanging roots.
  for (let x = 0.3; x < width - 0.2; x += 0.6) {
    const root = mesh(new THREE.ConeGeometry(0.06, 0.25, 6), COLOURS.dirtDark, [x, -0.45, 0.35]);
    root.rotation.x = Math.PI;
    root.userData.noOutline = true;
    g.add(root);
  }
  addOutlines(g, 0.025);
  return g;
}

/**
 * Leaf block (bump from below for a gold chest): a leafy cube with a flower emblem. Child
 * `body` is what bounces; `used` turns it into a wooden box once its chest is out.
 */
export function buildLeafBlock(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Group();
  body.name = 'body';
  const s = BLOCK_SIZE;
  const cube = mesh(new RoundedBoxGeometry(s, s, s, 3, 0.12), COLOURS.leaf, [s / 2, s / 2, 0]);
  cube.name = 'cube';
  body.add(cube);
  // Leaf tufts on the corners.
  for (const [x, y] of [
    [0.05, s - 0.05],
    [s - 0.05, s - 0.05],
    [0.05, 0.05],
    [s - 0.05, 0.05],
  ] as const) {
    const leaf = mesh(new THREE.SphereGeometry(0.13, 10, 8), COLOURS.leafLight, [x, y, s / 2 - 0.05]);
    leaf.scale.set(1, 0.7, 0.5);
    leaf.userData.noOutline = true;
    body.add(leaf);
  }
  // Flower emblem on the front: five petals around a yellow middle.
  const flower = new THREE.Group();
  flower.name = 'emblem';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const petal = mesh(new THREE.SphereGeometry(0.1, 10, 8), COLOURS.white, [Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0]);
    petal.scale.set(1, 1, 0.4);
    flower.add(petal);
  }
  flower.add(mesh(new THREE.SphereGeometry(0.08, 10, 8), '#ffd93d'));
  flower.position.set(s / 2, s / 2, s / 2 + 0.02);
  body.add(flower);
  g.add(body);
  addOutlines(g, 0.03);
  return g;
}

/** Turns a leaf block into its "used" look (wooden, no flower). */
export function setLeafBlockUsed(block: THREE.Object3D, used: boolean): void {
  const cube = block.getObjectByName('cube') as THREE.Mesh | undefined;
  const emblem = block.getObjectByName('emblem');
  if (cube) (cube.material as THREE.MeshToonMaterial).color.set(used ? COLOURS.used : COLOURS.leaf);
  if (emblem) emblem.visible = !used;
}

/**
 * Friendly crawler, facing +x; children `body` (bobs while walking) and `head` (hides when shy).
 * Snail: green body with an orange spiral shell. Beetle: ladybird with black dots.
 */
export function buildCrawler(kind: Crawler['kind']): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Group();
  body.name = 'body';
  const head = new THREE.Group();
  head.name = 'head';
  if (kind === 'snail') {
    const foot = mesh(new THREE.CapsuleGeometry(0.12, 0.45, 6, 12), COLOURS.snail, [0.35, 0.12, 0]);
    foot.rotation.z = Math.PI / 2;
    body.add(foot);
    const shell = mesh(new THREE.SphereGeometry(0.24, 18, 14), COLOURS.shell, [0.3, 0.33, 0]);
    shell.scale.set(1, 1, 0.75);
    body.add(shell);
    const spiral = mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 20), COLOURS.shellDark, [0.3, 0.33, 0.18]);
    spiral.userData.noOutline = true;
    body.add(spiral);
    const spiral2 = mesh(new THREE.SphereGeometry(0.045, 8, 6), COLOURS.shellDark, [0.3, 0.33, 0.19]);
    spiral2.userData.noOutline = true;
    body.add(spiral2);
    head.add(mesh(new THREE.SphereGeometry(0.13, 14, 10), COLOURS.snail, [0, 0, 0]));
    for (const z of [-0.06, 0.06]) {
      const stalk = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 6), COLOURS.snail, [0.02, 0.15, z]);
      stalk.userData.noOutline = true;
      head.add(stalk);
      const eye = mesh(new THREE.SphereGeometry(0.045, 10, 8), COLOURS.white, [0.02, 0.25, z]);
      head.add(eye);
      const pupil = mesh(new THREE.SphereGeometry(0.022, 8, 6), COLOURS.dark, [0.055, 0.25, z * 1.2]);
      pupil.userData.noOutline = true;
      head.add(pupil);
    }
    head.position.set(0.62, 0.2, 0);
  } else {
    const shell = mesh(new THREE.SphereGeometry(0.3, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), COLOURS.beetle, [0.32, 0.08, 0]);
    shell.scale.set(1.05, 0.9, 0.85);
    body.add(shell);
    const belly = mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.08, 18), COLOURS.dark, [0.32, 0.06, 0]);
    belly.scale.set(1.05, 1, 0.85);
    body.add(belly);
    for (const [x, y, z] of [
      [0.2, 0.28, 0.12],
      [0.42, 0.26, 0.13],
      [0.3, 0.2, 0.24],
      [0.18, 0.17, -0.2],
    ] as const) {
      const dot = mesh(new THREE.SphereGeometry(0.05, 8, 6), COLOURS.dark, [x, y, z]);
      dot.userData.noOutline = true;
      body.add(dot);
    }
    for (let i = 0; i < 3; i++) {
      const leg = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 5), COLOURS.dark, [0.18 + i * 0.15, 0.04, 0.22]);
      leg.rotation.x = 0.5;
      leg.userData.noOutline = true;
      body.add(leg);
    }
    head.add(mesh(new THREE.SphereGeometry(0.13, 14, 10), COLOURS.dark));
    for (const z of [-0.06, 0.06]) {
      const eye = mesh(new THREE.SphereGeometry(0.045, 10, 8), COLOURS.white, [0.08, 0.04, z]);
      eye.userData.noOutline = true;
      head.add(eye);
      const pupil = mesh(new THREE.SphereGeometry(0.022, 8, 6), COLOURS.dark, [0.115, 0.04, z * 1.1]);
      pupil.userData.noOutline = true;
      head.add(pupil);
      const antenna = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 5), COLOURS.dark, [0.05, 0.16, z]);
      antenna.rotation.z = -0.4;
      antenna.userData.noOutline = true;
      head.add(antenna);
    }
    head.position.set(0.63, 0.14, 0);
  }
  body.add(head);
  g.add(body);
  addOutlines(g, 0.025);
  return g;
}

/** Goal flag on a little stone base; child `cloth` waves. */
export function buildFlag(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.22, 14), COLOURS.stone, [0, 0.11, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 10), COLOURS.flagPole, [0, 1.4, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.1, 12, 8), '#ffd93d', [0, 2.75, 0]));
  const cloth = new THREE.Group();
  cloth.name = 'cloth';
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0.95, -0.32);
  shape.lineTo(0, -0.64);
  shape.closePath();
  const flag = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false }), COLOURS.flag);
  cloth.add(flag);
  const star = mesh(new THREE.CircleGeometry(0.1, 5), '#ffffff', [0.3, -0.32, 0.045]);
  star.userData.noOutline = true;
  cloth.add(star);
  cloth.position.set(0.04, 2.6, 0);
  g.add(cloth);
  addOutlines(g, 0.03);
  return g;
}

/**
 * Background for the whole course, merged into a few meshes per layer (few draw calls):
 * near bushes and trees (z −3 … −5), rolling hills (z −12), far hills (z −24). Perspective
 * makes the far layers scroll slower (parallax).
 */
export function buildBackdrop(x0: number, x1: number): THREE.Group {
  const g = new THREE.Group();
  g.name = 'backdrop';
  const rand = (() => {
    let s = 12345;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  })();
  const layer = (parts: THREE.BufferGeometry[], color: string, shadow = false) => {
    const m = new THREE.Mesh(mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!, toonMaterial(color));
    m.receiveShadow = shadow;
    g.add(m);
  };
  // Trees: canopies (two greens) and trunks.
  const canopies: THREE.BufferGeometry[] = [];
  const canopiesLight: THREE.BufferGeometry[] = [];
  const trunks: THREE.BufferGeometry[] = [];
  const bushes: THREE.BufferGeometry[] = [];
  for (let x = x0 - 6; x < x1 + 12; x += 2.2 + rand() * 2.6) {
    const z = -3.2 - rand() * 2.2;
    const h = 1.6 + rand() * 1.6;
    const trunk = new THREE.CylinderGeometry(0.14, 0.2, h, 8);
    trunk.translate(x, h / 2 - 0.1, z);
    trunks.push(trunk);
    const round = rand() < 0.6;
    const canopy = round ? new THREE.SphereGeometry(0.9 + rand() * 0.4, 12, 10) : new THREE.ConeGeometry(0.9, 2.2, 10);
    canopy.translate(x, h + (round ? 0.5 : 0.9), z);
    (rand() < 0.5 ? canopies : canopiesLight).push(canopy);
    if (rand() < 0.6) {
      const bush = new THREE.SphereGeometry(0.45 + rand() * 0.25, 10, 8);
      bush.scale(1.4, 0.8, 1);
      bush.translate(x + 1 + rand(), 0.15, -2 - rand());
      bushes.push(bush);
    }
  }
  layer(trunks, COLOURS.wood);
  layer(canopies, '#4fae52');
  layer(canopiesLight, '#6cc35e');
  layer(bushes, '#5cb85c');
  // Hills.
  const hills: THREE.BufferGeometry[] = [];
  for (let x = x0 - 20; x < x1 + 30; x += 7 + rand() * 5) {
    const hill = new THREE.SphereGeometry(5 + rand() * 3, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    hill.scale(1.4, 0.55 + rand() * 0.3, 1);
    hill.translate(x, -0.3, -13);
    hills.push(hill);
  }
  layer(hills, '#9ad37a');
  const far: THREE.BufferGeometry[] = [];
  for (let x = x0 - 40; x < x1 + 60; x += 12 + rand() * 8) {
    const hill = new THREE.SphereGeometry(9 + rand() * 5, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    hill.scale(1.5, 0.6 + rand() * 0.35, 1);
    hill.translate(x, -1, -26);
    far.push(hill);
  }
  layer(far, '#b9dfa4');
  // Clouds (puffs of spheres), high up and far back.
  const clouds: THREE.BufferGeometry[] = [];
  for (let x = x0 - 30; x < x1 + 40; x += 8 + rand() * 7) {
    const y = 6 + rand() * 4;
    const z = -16 - rand() * 6;
    for (let i = 0; i < 4; i++) {
      const puff = new THREE.SphereGeometry(0.8 + rand() * 0.5, 10, 8);
      puff.scale(1.3, 0.8, 0.6);
      puff.translate(x + i * 0.9, y + (i % 2) * 0.35, z);
      clouds.push(puff);
    }
  }
  layer(clouds, '#ffffff');
  return g;
}
