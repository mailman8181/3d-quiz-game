/**
 * Content for the preschool pack (roadmap M13b, ADR-0009). Research: docs/curriculum/
 * niedersachsen.md §2 (Orientierungsplan ch. 6/8, KC Deutsch annex A2) and §5 (KC Sachunterricht).
 * All German; modules only pick from these lists. Adding items: append, run the unit tests,
 * then `npm run audio:generate`.
 */

type Gender = 'm' | 'f' | 'n';

const DEF_NOM: Record<Gender, string> = { m: 'der', f: 'die', n: 'das' };
const DEF_ACC: Record<Gender, string> = { m: 'den', f: 'die', n: 'das' };

// ── Gegenteile ───────────────────────────────────────────────────────────────────────────
export interface OppositePair {
  id: string;
  a: { word: string; emoji: string };
  b: { word: string; emoji: string };
}

const pair = (id: string, a: string, ae: string, b: string, be: string): OppositePair => ({
  id,
  a: { word: a, emoji: ae },
  b: { word: b, emoji: be },
});

export const OPPOSITES: readonly OppositePair[] = [
  pair('temperature', 'heiß', '🔥', 'kalt', '🧊'),
  pair('daytime', 'Tag', '☀️', 'Nacht', '🌙'),
  pair('mood', 'lachen', '😄', 'weinen', '😢'),
  pair('speed', 'schnell', '🐆', 'langsam', '🐌'),
  pair('volume', 'laut', '📢', 'leise', '🤫'),
  pair('size', 'groß', '🐘', 'klein', '🐭'),
  pair('age', 'alt', '👴', 'jung', '👶'),
  pair('direction', 'oben', '⬆️', 'unten', '⬇️'),
  pair('light', 'hell', '💡', 'dunkel', '🌑'),
  pair('wet', 'nass', '💦', 'trocken', '🌵'),
  pair('fill', 'voll', '🔋', 'leer', '🪫'),
  pair('lock', 'offen', '🔓', 'zu', '🔒'),
  pair('taste', 'süß', '🍭', 'sauer', '🍋'),
];

/** Every word of the opposite pairs with its partner, both directions. */
export const OPPOSITE_WORDS = OPPOSITES.flatMap((p) => [
  { ...p.a, partner: p.b, pairId: p.id },
  { ...p.b, partner: p.a, pairId: p.id },
]);

// ── Wo lebt das Tier? ────────────────────────────────────────────────────────────────────
export interface Habitat {
  id: string;
  name: string;
  emoji: string;
  /** "Der Fuchs lebt …" */
  phrase: string;
}

export const HABITATS: readonly Habitat[] = [
  { id: 'forest', name: 'Wald', emoji: '🌲', phrase: 'im Wald' },
  { id: 'sea', name: 'Meer', emoji: '🌊', phrase: 'im Meer' },
  { id: 'farm', name: 'Bauernhof', emoji: '🚜', phrase: 'auf dem Bauernhof' },
  { id: 'ice', name: 'Eis und Schnee', emoji: '❄️', phrase: 'im Eis und Schnee' },
  { id: 'desert', name: 'Wüste', emoji: '🏜️', phrase: 'in der Wüste' },
  { id: 'jungle', name: 'Urwald', emoji: '🌴', phrase: 'im Urwald' },
];

/** Habitats a kita child knows first (level 1). */
export const BASIC_HABITATS = ['forest', 'sea', 'farm'] as const;

export interface HabitatAnimal {
  id: string;
  /** With article, nominative: "der Fuchs". */
  name: string;
  emoji: string;
  habitat: string;
}

const ha = (name: string, emoji: string, habitat: string): HabitatAnimal => ({
  id: name.split(' ')[1]!.toLowerCase(),
  name,
  emoji,
  habitat,
});

export const HABITAT_ANIMALS: readonly HabitatAnimal[] = [
  ha('der Fuchs', '🦊', 'forest'),
  ha('das Reh', '🦌', 'forest'),
  ha('die Eule', '🦉', 'forest'),
  ha('das Eichhörnchen', '🐿️', 'forest'),
  ha('der Fisch', '🐟', 'sea'),
  ha('der Wal', '🐳', 'sea'),
  ha('der Krake', '🐙', 'sea'),
  ha('der Delfin', '🐬', 'sea'),
  ha('die Kuh', '🐮', 'farm'),
  ha('das Schwein', '🐷', 'farm'),
  ha('das Huhn', '🐔', 'farm'),
  ha('das Schaf', '🐑', 'farm'),
  ha('der Eisbär', '🐻‍❄️', 'ice'),
  ha('der Pinguin', '🐧', 'ice'),
  ha('das Kamel', '🐪', 'desert'),
  ha('der Skorpion', '🦂', 'desert'),
  ha('der Affe', '🐒', 'jungle'),
  ha('der Papagei', '🦜', 'jungle'),
  ha('der Tiger', '🐯', 'jungle'),
];

// ── Körper und Sinne ─────────────────────────────────────────────────────────────────────
export interface BodyPart {
  id: string;
  word: string;
  gender: Gender;
  emoji: string;
}

const bp = (word: string, gender: Gender, emoji: string): BodyPart => ({ id: word.toLowerCase(), word, gender, emoji });

export const BODY_PARTS: readonly BodyPart[] = [
  bp('Nase', 'f', '👃'),
  bp('Ohr', 'n', '👂'),
  bp('Auge', 'n', '👁️'),
  bp('Mund', 'm', '👄'),
  bp('Hand', 'f', '✋'),
  bp('Fuß', 'm', '🦶'),
  bp('Bein', 'n', '🦵'),
  bp('Zahn', 'm', '🦷'),
  bp('Zunge', 'f', '👅'),
  bp('Arm', 'm', '💪'),
];

export const bodyAccusative = (p: BodyPart) => `${DEF_ACC[p.gender]} ${p.word}`;
export const bodyNominative = (p: BodyPart) => `${DEF_NOM[p.gender]} ${p.word}`;

/** The five senses: "Womit hörst du?" → Ohr. */
export const SENSES: readonly { id: string; question: string; part: string; answer: string }[] = [
  { id: 'hear', question: 'Womit hörst du?', part: 'ohr', answer: 'Mit den Ohren hörst du.' },
  { id: 'see', question: 'Womit siehst du?', part: 'auge', answer: 'Mit den Augen siehst du.' },
  { id: 'smell', question: 'Womit riechst du?', part: 'nase', answer: 'Mit der Nase riechst du.' },
  { id: 'taste', question: 'Womit schmeckst du?', part: 'zunge', answer: 'Mit der Zunge schmeckst du.' },
  { id: 'touch', question: 'Womit fühlst du am besten?', part: 'hand', answer: 'Mit den Händen fühlst du.' },
];

// ── Was kommt zuerst? ────────────────────────────────────────────────────────────────────
export interface SequenceStep {
  /** With article: "das Ei". */
  name: string;
  emoji: string;
}

export interface Sequence {
  id: string;
  steps: readonly [SequenceStep, SequenceStep, SequenceStep];
}

const seq = (id: string, ...steps: [string, string][]): Sequence => ({
  id,
  steps: steps.map(([name, emoji]) => ({ name, emoji })) as unknown as Sequence['steps'],
});

export const SEQUENCES: readonly Sequence[] = [
  seq('chicken', ['das Ei', '🥚'], ['das Küken', '🐣'], ['das Huhn', '🐔']),
  seq('tree', ['der Keimling', '🌱'], ['die Pflanze', '🪴'], ['der Baum', '🌳']),
  seq('human', ['das Baby', '👶'], ['das Kind', '🧒'], ['der Erwachsene', '🧑']),
  seq('day', ['der Morgen', '🌅'], ['der Mittag', '🌞'], ['die Nacht', '🌙']),
  seq('apple', ['die Blüte', '🌸'], ['der grüne Apfel', '🍏'], ['der rote Apfel', '🍎']),
  seq('snowman', ['der Schnee', '❄️'], ['der Schneemann', '⛄'], ['das Wasser', '💧']),
];

export const SEQUENCE_ASKS = ['first', 'last', 'middle'] as const;
export type SequenceAsk = (typeof SEQUENCE_ASKS)[number];

// ── Groß und klein ───────────────────────────────────────────────────────────────────────
export interface SizeItem {
  id: string;
  word: string;
  gender: Gender;
  emoji: string;
}

const si = (word: string, gender: Gender, emoji: string): SizeItem => ({ id: word.toLowerCase(), word, gender, emoji });

export const SIZE_ITEMS: readonly SizeItem[] = [
  si('Baum', 'm', '🌳'),
  si('Blume', 'f', '🌷'),
  si('Haus', 'n', '🏠'),
  si('Ball', 'm', '⚽'),
  si('Fisch', 'm', '🐟'),
  si('Stern', 'm', '⭐'),
  si('Apfel', 'm', '🍎'),
  si('Katze', 'f', '🐱'),
  si('Auto', 'n', '🚗'),
  si('Herz', 'n', '❤️'),
];

const SUPERLATIVE_ACC: Record<'big' | 'small', Record<Gender, string>> = {
  big: { m: 'den größten', f: 'die größte', n: 'das größte' },
  small: { m: 'den kleinsten', f: 'die kleinste', n: 'das kleinste' },
};
const SUPERLATIVE_NOM: Record<'big' | 'small', Record<Gender, string>> = {
  big: { m: 'der größte', f: 'die größte', n: 'das größte' },
  small: { m: 'der kleinste', f: 'die kleinste', n: 'das kleinste' },
};

/** "den größten Baum" */
export const sizeAccusative = (item: SizeItem, ask: 'big' | 'small') => `${SUPERLATIVE_ACC[ask][item.gender]} ${item.word}`;
/** "der größte Baum" */
export const sizeNominative = (item: SizeItem, ask: 'big' | 'small') => `${SUPERLATIVE_NOM[ask][item.gender]} ${item.word}`;

// ── Wo ist …? (Raumlage) ─────────────────────────────────────────────────────────────────
export const POSITIONS = ['on', 'under', 'beside', 'between'] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_PHRASES: Record<Position, string> = {
  on: 'auf der Kiste',
  under: 'unter der Kiste',
  beside: 'neben der Kiste',
  between: 'zwischen den Kisten',
};

export const POSITION_OBJECTS: readonly { id: string; name: string; emoji: string }[] = [
  { id: 'ball', name: 'Der Ball', emoji: '⚽' },
  { id: 'cat', name: 'Die Katze', emoji: '🐱' },
  { id: 'teddy', name: 'Der Teddy', emoji: '🧸' },
  { id: 'duck', name: 'Die Ente', emoji: '🦆' },
];

export const BOX_EMOJI = '📦';
