import type { StageId } from '../learner/stage';
import type { Rng } from '../rng';

/**
 * Memory activity (ADR-0010, M14b): flip two cards, find pairs. Some pairs are chests in
 * different colours (tier) and emblems; finding a chest pair opens a challenge.
 * Pure state machine — the screen renders it and reports flips.
 */
export interface MemoryPicture {
  emoji: string;
  /** Spoken when the card is turned. */
  label: string;
}

export interface MemoryCard {
  id: string;
  pairId: string;
  /** Picture card, or the chest with this index in the round's chest list. */
  face: { kind: 'picture'; picture: MemoryPicture } | { kind: 'chest'; chest: number; emblem: string };
}

export interface MemoryState {
  cards: readonly MemoryCard[];
  /** Ids of turned, not yet matched cards (0–2). */
  open: readonly string[];
  matched: readonly string[];
}

export type FlipEvent =
  | { kind: 'ignored' }
  | { kind: 'first'; card: MemoryCard }
  | { kind: 'match'; card: MemoryCard; chest: number | null }
  | { kind: 'mismatch'; card: MemoryCard };

/** Emblems that tell chest pairs apart even when two chests share a tier colour. */
export const CHEST_EMBLEMS = ['⭐', '❤️', '🌙', '🌸', '🍀'] as const;

/** Grid by stage (game-design §4b): Kita 2×4, Vorschule 3×4, school 4×4. */
export function memoryLayout(stage: StageId | null): { cols: number; rows: number; chests: number } {
  // Upright grids: phones are held in portrait.
  if (stage === 'kita') return { cols: 2, rows: 4, chests: 2 };
  if (stage === null || stage === 'preschool') return { cols: 3, rows: 4, chests: 3 };
  return { cols: 4, rows: 4, chests: 4 };
}

export function createMemory(rng: Rng, pictures: readonly MemoryPicture[], pairs: number, chests: number): MemoryState {
  const pictureCount = pairs - chests;
  if (pictureCount < 0 || pictures.length < pictureCount) throw new Error('createMemory: not enough pictures');
  const emblems = rng.shuffle(CHEST_EMBLEMS);
  const faces: MemoryCard['face'][] = [
    ...Array.from({ length: chests }, (_, i) => ({ kind: 'chest' as const, chest: i, emblem: emblems[i % emblems.length]! })),
    ...rng.shuffle(pictures).slice(0, pictureCount).map((picture) => ({ kind: 'picture' as const, picture })),
  ];
  const cards = rng.shuffle(
    faces.flatMap((face, p) => [
      { id: `m${p}a`, pairId: `p${p}`, face },
      { id: `m${p}b`, pairId: `p${p}`, face },
    ]),
  );
  return { cards, open: [], matched: [] };
}

/** Turn a card. A third tap while two non-matching cards are open first hides them. */
export function flip(state: MemoryState, cardId: string): { state: MemoryState; event: FlipEvent } {
  const card = state.cards.find((c) => c.id === cardId);
  if (!card || state.matched.includes(cardId) || state.open.includes(cardId)) return { state, event: { kind: 'ignored' } };
  const open = state.open.length >= 2 ? [] : state.open;
  if (open.length === 0) return { state: { ...state, open: [cardId] }, event: { kind: 'first', card } };
  const other = state.cards.find((c) => c.id === open[0])!;
  if (other.pairId === card.pairId) {
    return {
      state: { ...state, open: [], matched: [...state.matched, other.id, card.id] },
      event: { kind: 'match', card, chest: card.face.kind === 'chest' ? card.face.chest : null },
    };
  }
  return { state: { ...state, open: [other.id, card.id] }, event: { kind: 'mismatch', card } };
}

/** Turn back two non-matching cards (the screen calls this after a short look). */
export function hideOpen(state: MemoryState): MemoryState {
  return state.open.length === 2 ? { ...state, open: [] } : state;
}

export function isDone(state: MemoryState): boolean {
  return state.matched.length === state.cards.length;
}
