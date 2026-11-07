/**
 * Solids for grades 2–4 (KC Ma: Würfel, Quader, Kugel, Zylinder in Jg. 2; Pyramide and
 * properties — Ecken, Kanten, Flächen — by the end of Jg. 4). Counts only where primary-school
 * maths agrees on them (cube, cuboid, square pyramid).
 */
export interface Solid {
  id: 'cube' | 'cuboid' | 'sphere' | 'cylinder' | 'pyramid' | 'cone';
  name: string;
  /** With article (nominative): "der Würfel". */
  withArticle: string;
  /** Ecken, Kanten, Flächen — only for the solids with clear counts. */
  counts?: { corners: number; edges: number; faces: number };
  level: 1 | 2;
}

export const SOLIDS: readonly Solid[] = [
  { id: 'cube', name: 'Würfel', withArticle: 'der Würfel', counts: { corners: 8, edges: 12, faces: 6 }, level: 1 },
  { id: 'cuboid', name: 'Quader', withArticle: 'der Quader', counts: { corners: 8, edges: 12, faces: 6 }, level: 1 },
  { id: 'sphere', name: 'Kugel', withArticle: 'die Kugel', level: 1 },
  { id: 'cylinder', name: 'Zylinder', withArticle: 'der Zylinder', level: 1 },
  { id: 'pyramid', name: 'Pyramide', withArticle: 'die Pyramide', counts: { corners: 5, edges: 8, faces: 5 }, level: 2 },
  { id: 'cone', name: 'Kegel', withArticle: 'der Kegel', level: 2 },
];

export const SOLID_PROPERTIES = { corners: 'Ecken', edges: 'Kanten', faces: 'Flächen' } as const;
