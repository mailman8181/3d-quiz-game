import type { SpeechLine } from '../../core/challenges/types';
import { COUNT_OBJECTS, type CountObject } from '../../modules/challenges/objects';
import { de } from './strings';
import { WORDS } from './words';
import {
  ANIMALS,
  BABIES,
  capitalize,
  COLORS,
  ODD_CATEGORIES,
  SEASON_QUESTIONS,
  SEASONS,
  SHAPES,
  shapeAccusative,
  shapeNominative,
  WEATHER_ITEMS,
  WEATHER_QUESTIONS,
} from './knowledge';
import {
  BODY_PARTS,
  bodyAccusative,
  bodyNominative,
  HABITAT_ANIMALS,
  HABITATS,
  OPPOSITE_WORDS,
  POSITION_OBJECTS,
  POSITION_PHRASES,
  POSITIONS,
  SENSES,
  SEQUENCES,
  SIZE_ITEMS,
  sizeAccusative,
  sizeNominative,
  type Position,
} from './preschool';
import {
  COMPOUNDS,
  END_SENTENCES,
  GAP_SENTENCES,
  gapSentence,
  GAP_WORDS,
  NOUNS,
  PLURAL_NOUNS,
  RIDDLES,
  VERBS,
  ADJECTIVES,
  withArticle,
} from './grammar';
import { BINS, FEELING_SITUATIONS, FEELINGS, FLOAT_ITEMS, JOBS, MONTHS, TRAFFIC_QUESTIONS, WASTE_ITEMS, WEEKDAYS } from './wissen';
import {
  ADJECTIVE_FORMS,
  CAPITAL_NOUNS,
  FAMILIES,
  LOWER_WORDS,
  PART_SENTENCES,
  SPELLING,
  TENSE_NAMES,
  TENSES,
  tenseSentence,
  TEXTS,
  VERBS4,
  type Tense,
} from './grammar4';
import {
  BIKE_QUESTIONS,
  BODY_QUESTIONS,
  DIRECTION_NAMES,
  GERMANY_QUESTIONS,
  MAP_PLACES,
  PAST_QUESTIONS,
  SCIENCE_QUESTIONS,
  STATE_QUESTIONS,
  TOGETHER_QUESTIONS,
  type Direction,
} from './wissen4';
import type { QuizQuestion } from './wissen';
import { ALL_CLOCK_TIMES, clockSpoken, DIGITAL_CLOCK_TIMES, type ClockMinute } from './clock';
import { amount, CONVERSIONS } from './units';
import { SOLID_PROPERTIES, SOLIDS } from './solids';
import { divisionPairs } from '../../modules/challenges/math-division';
import { CHART_FRUITS } from '../../modules/challenges/math-chart';
import { timesPairs } from '../../modules/challenges/math-times';

/** German names of countable objects: [singular, plural]. */
export const objectNames: Record<CountObject, readonly [string, string]> = {
  apple: ['Apfel', 'Äpfel'],
  star: ['Stern', 'Sterne'],
  fish: ['Fisch', 'Fische'],
  flower: ['Blume', 'Blumen'],
  ball: ['Ball', 'Bälle'],
};

type Params = Record<string, string | number>;

interface Template {
  render: (p: Params) => string;
  /**
   * Every parameter combination the game can produce. Used to pre-generate one audio clip
   * per sentence (ADR-0007). A sentence missing here falls back to the browser voice.
   */
  variants: () => Params[];
}

const plural = (p: Params) => objectNames[p.object as CountObject]?.[1] ?? '';
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const none = () => [{}];

/** All (a, b) with 1 ≤ b < a ≤ 20 — covers every subtraction level. */
const subtractionPairs = () => range(2, 20).flatMap((a) => range(1, a - 1).map((b) => ({ a, b, difference: a - b })));

/** All (a, b) with a, b ≥ 1 and a + b ≤ 20 — covers every addition level. */
const additionPairs = () => range(1, 19).flatMap((a) => range(1, 20 - a).map((b) => ({ a, b, sum: a + b })));

const color = (id: string | number | undefined) => COLORS.find((c) => c.id === id)!;
const shape = (id: string | number | undefined) => SHAPES.find((s) => s.id === id)!;
const colorName = (id: string | number | undefined) => color(id)?.name ?? '';
// Preschool pack helpers (M13b).
const soundWords = () => WORDS.filter((w) => w.initial && WORDS.some((o) => o.id !== w.id && o.initial === w.initial));
const syllableWords = () => WORDS.filter((w) => w.syllables.length >= 2);
/** Spoken syllables where written hyphenation sounds wrong ("Schne-cke" is spoken "Schnek-ke"). */
const SPOKEN_SYLLABLES: Record<string, string> = { Schnecke: 'Schnek, ke' };
const syllablesOf = (word: string | number | undefined) =>
  SPOKEN_SYLLABLES[String(word)] ?? WORDS.find((w) => w.word === word)?.syllables.join(', ') ?? '';
const sizeItem = (id: string | number | undefined) => SIZE_ITEMS.find((i) => i.id === id)!;
const bigSmall = (ask: string | number | undefined) => (ask === 'small' ? 'small' : 'big');
const sizeVariants = () => SIZE_ITEMS.flatMap((i) => ['big', 'small'].map((ask) => ({ item: i.id, ask })));
const bodyPart = (id: string | number | undefined) => BODY_PARTS.find((b) => b.id === id)!;
const habitatSentence = (id: string | number | undefined) => {
  const animal = HABITAT_ANIMALS.find((a) => a.id === id);
  const home = HABITATS.find((h) => h.id === animal?.habitat);
  return animal && home ? `${capitalize(animal.name)} lebt ${home.phrase}.` : '';
};
const positionSentence = (p: Params) => {
  const object = POSITION_OBJECTS.find((o) => o.id === p.object);
  return `${object?.name ?? ''} ist ${POSITION_PHRASES[p.position as Position] ?? ''}.`;
};
const positionVariants = () => POSITION_OBJECTS.flatMap((o) => POSITIONS.map((position) => ({ object: o.id, position })));

// Grade 1–2 math pack helpers (M13c).
const bondVariants = () => [
  ...range(3, 10).flatMap((total) => range(1, total - 1).map((known) => ({ total, known, answer: total - known }))),
  ...range(1, 9).map((t) => ({ total: 100, known: t * 10, answer: 100 - t * 10 })),
  ...range(1, 9).map((t) => ({ total: 1000, known: t * 100, answer: 1000 - t * 100 })),
];
const doubleNs = () => [...range(1, 10), 20, 30, 40, 50, 100, 200, 300, 400, 500];
const halfNs = () => [...range(1, 10).map((n) => n * 2), 40, 60, 80, 100, 200, 400, 600, 800, 1000];
// Grades 3–4 math helpers (M15a).
const conversion = (id: string | number | undefined) => CONVERSIONS.find((c) => c.id === id)!;
const conversionVariants = () => CONVERSIONS.flatMap((c) => range(1, 9).map((n) => ({ conv: c.id, n })));
const solid = (id: string | number | undefined) => SOLIDS.find((x) => x.id === id)!;
const fruit = (id: string | number | undefined) => CHART_FRUITS.find((f) => f.id === id)!;
const fruitPairs = () => CHART_FRUITS.flatMap((a) => CHART_FRUITS.filter((b) => b.id !== a.id).map((b) => ({ a: a.id, b: b.id })));
const euroCents = (cents: number) => {
  const e = Math.floor(cents / 100);
  const c = cents % 100;
  if (e === 0) return `${c} Cent`;
  if (c === 0) return e === 1 ? 'ein Euro' : `${e} Euro`;
  return `${e} Euro ${c}`;
};
const onesPhrase = (ones: number) => (ones === 0 ? 'keine Einer' : ones === 1 ? 'ein Einer' : `${ones} Einer`);
const tensPhrase = (tens: number) => (tens === 1 ? 'ein Zehner' : `${tens} Zehner`);
const chanceColours = () => Object.keys(de.chance.colours).map((colour) => ({ colour }));
const colourWord = (c: string | number | undefined) => de.chance.colours[String(c)] ?? '';

// Grade 1–2 German pack helpers (M13d).
const noun = (word: string | number | undefined) => NOUNS.find((n) => n.word === word)!;
const pluralNouns = () => PLURAL_NOUNS;
const WORD_TYPE_NAMES: Record<string, string> = {
  noun: 'ein Nomen, ein Namenwort',
  verb: 'ein Verb, ein Tunwort',
  adjective: 'ein Adjektiv, ein Wiewort',
};
const abcLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Wissen pack helpers (M13e).
const wasteSentence = (id: string | number | undefined) => {
  const item = WASTE_ITEMS.find((w) => w.id === id);
  const bin = BINS.find((b) => b.id === item?.bin);
  return item && bin ? `${item.name} gehört ${bin.phrase}.` : '';
};
const floatItem = (id: string | number | undefined) => FLOAT_ITEMS.find((i) => i.id === id);
const feelingWord = (id: string | number | undefined) => FEELINGS.find((f) => f.id === id)?.word ?? '';
const situation = (id: string | number | undefined) => FEELING_SITUATIONS.find((s) => s.id === id);
const cyclicVariants = (list: readonly string[], ask: 'after' | 'before') =>
  list.map((name, i) => ({ name, answer: list[(i + (ask === 'after' ? 1 : -1) + list.length) % list.length]! }));

// Grades 3–4 German helpers (M15b).
const verb4 = (inf: string | number | undefined) => VERBS4.find((x) => x.inf === inf)!;
const partSentence = (id: string | number | undefined) => PART_SENTENCES.find((x) => x.id === id)!;
const partText = (p: string) => p.replace(/\.$/, '');
const spelling = (word: string | number | undefined) => SPELLING.find((x) => x.word === word)!;
const spellingExplain = (word: string | number | undefined) => {
  const item = spelling(word);
  const helper = item.helper.replace(/-/g, ', ');
  if (item.strategy === 'lengthen') return `Verlängere das Wort: ${helper}. Darum schreibt man ${item.word}.`;
  if (item.strategy === 'syllable') return `Sprich in Silben: ${helper}. Darum schreibt man ${item.word}.`;
  if (item.strategy === 'derive') return `Denk an ${helper}. Darum schreibt man ${item.word}.`;
  return `${item.word} ist ein Merkwort. Das merkst du dir.`;
};
const TENSE_DATIVE: Record<Tense, string> = { present: 'im Präsens', past: 'im Präteritum', perfect: 'im Perfekt', future: 'im Futur' };

// Grades 3–4 Wissen helpers (M15c).
const bankTemplates = (key: string, bank: readonly QuizQuestion[]): Record<string, Template> => ({
  [`${key}.prompt`]: { render: (p) => bank.find((x) => x.id === p.q)?.question ?? '', variants: () => bank.map((x) => ({ q: x.id })) },
  [`${key}.explain`]: { render: (p) => bank.find((x) => x.id === p.q)?.explain ?? '', variants: () => bank.map((x) => ({ q: x.id })) },
});
const mapPlace = (id: string | number | undefined) => MAP_PLACES.find((x) => x.id === id)!;

const colorShapePairs = () => COLORS.filter((c) => c.adj).flatMap((c) => SHAPES.map((s) => ({ color: c.id, shape: s.id })));

/** Speech templates referenced by `SpeechLine.key`. */
export const speechTemplates: Record<string, Template> = {
  'math.count.prompt': {
    render: (p) => `Wie viele ${plural(p)} siehst du?`,
    variants: () => COUNT_OBJECTS.map((object) => ({ object })),
  },
  'math.count.explain': {
    render: (p) => `Schau mal, es sind ${p.count} ${plural(p)}.`,
    variants: () => COUNT_OBJECTS.flatMap((object) => range(1, 20).map((count) => ({ object, count }))),
  },
  'math.addition.prompt': { render: (p) => `Was ist ${p.a} plus ${p.b}?`, variants: additionPairs },
  'math.addition.explain': { render: (p) => `${p.a} plus ${p.b} ist ${p.sum}.`, variants: additionPairs },
  'math.find-number.prompt': { render: (p) => `Tippe auf die Zahl ${p.n}.`, variants: () => range(1, 100).map((n) => ({ n })) },
  'math.find-number.display': { render: () => 'Welche Zahl hörst du? Tippe sie an!', variants: none },
  'math.find-number.explain': { render: (p) => `Schau, das ist die ${p.n}.`, variants: () => range(1, 100).map((n) => ({ n })) },
  'math.subtraction.prompt': { render: (p) => `Was ist ${p.a} minus ${p.b}?`, variants: subtractionPairs },
  'math.subtraction.explain': { render: (p) => `${p.a} minus ${p.b} ist ${p.difference}.`, variants: subtractionPairs },
  'math.compare.prompt': {
    render: (p) => `Wo sind mehr ${plural(p)}?`,
    variants: () => COUNT_OBJECTS.map((object) => ({ object })),
  },
  'math.compare.prompt-digits': { render: () => 'Welche Zahl ist größer?', variants: none },
  'math.compare.explain': {
    render: (p) => `${p.big} ist mehr als ${p.small}.`,
    variants: () => range(2, 20).flatMap((big) => range(1, big - 1).map((small) => ({ big, small }))),
  },
  'math.pattern.prompt': { render: () => 'Was kommt als Nächstes?', variants: none },
  'math.pattern.explain': { render: () => 'Schau, so geht das Muster weiter.', variants: none },
  'german.initial.prompt': {
    render: (p) => `Mit welchem Buchstaben beginnt ${p.word}?`,
    variants: () => WORDS.filter((w) => w.initial).map((w) => ({ word: w.word })),
  },
  'german.initial.explain': {
    render: (p) => `${p.word} beginnt mit ${p.letter}.`,
    variants: () => WORDS.filter((w) => w.initial).map((w) => ({ word: w.word, letter: w.initial! })),
  },
  'german.syllables.prompt': {
    render: (p) => `Wie viele Silben hat ${p.word}? Klatsch mit!`,
    variants: () => WORDS.map((w) => ({ word: w.word })),
  },
  'german.syllables.explain': {
    render: (p) => {
      const word = WORDS.find((w) => w.word === p.word);
      const parts = word?.syllables ?? [String(p.word)];
      return `${parts.join(', ')}. ${parts.length === 1 ? 'Das ist eine Silbe.' : `Das sind ${parts.length} Silben.`}`;
    },
    variants: () => WORDS.map((w) => ({ word: w.word })),
  },
  'german.rhyme.prompt': {
    render: (p) => `Was reimt sich auf ${p.word}?`,
    variants: () => WORDS.filter((w) => w.rhyme).map((w) => ({ word: w.word })),
  },
  'german.rhyme.explain': {
    render: (p) => `${p.word} und ${p.match} reimen sich.`,
    variants: () =>
      WORDS.filter((w) => w.rhyme).flatMap((a) =>
        WORDS.filter((b) => b.rhyme === a.rhyme && b.id !== a.id).map((b) => ({ word: a.word, match: b.word })),
      ),
  },
  'german.read.prompt': { render: () => 'Lies das Wort. Welches Bild passt?', variants: none },
  'german.read.explain': {
    render: (p) => `Das Wort heißt ${p.word}.`,
    variants: () => WORDS.map((w) => ({ word: w.word })),
  },
  'knowledge.animal.prompt': { render: () => 'Wie heißt dieses Tier?', variants: none },
  'knowledge.animal.explain': {
    render: (p) => `Das Tier heißt ${p.name}.`,
    variants: () => ANIMALS.map((a) => ({ name: a.name })),
  },
  'knowledge.baby.prompt': {
    render: (p) => `Wie heißt das Baby ${p.of}?`,
    variants: () => BABIES.map((b) => ({ of: b.of })),
  },
  'knowledge.baby.explain': {
    render: (p) => `Das Baby ${p.of} heißt ${p.baby}.`,
    variants: () => BABIES.map((b) => ({ of: b.of, baby: b.baby })),
  },
  'knowledge.color.prompt': {
    render: (p) => `Tippe auf ${colorName(p.color)}!`,
    variants: () => COLORS.map((c) => ({ color: c.id })),
  },
  'knowledge.color.explain': {
    render: (p) => `Schau, das ist ${colorName(p.color)}.`,
    variants: () => COLORS.map((c) => ({ color: c.id })),
  },
  'knowledge.shape.prompt': {
    render: (p) => `Tippe auf ${shapeAccusative(color(p.color), shape(p.shape))}!`,
    variants: colorShapePairs,
  },
  'knowledge.shape.explain': {
    render: (p) => `Schau, das ist ${shapeNominative(color(p.color), shape(p.shape))}.`,
    variants: colorShapePairs,
  },
  'knowledge.season.prompt': {
    render: (p) => SEASON_QUESTIONS.find((q) => q.id === p.q)?.question ?? '',
    variants: () => SEASON_QUESTIONS.map((q) => ({ q: q.id })),
  },
  'knowledge.season.explain': {
    render: (p) => SEASON_QUESTIONS.find((q) => q.id === p.q)?.explain ?? '',
    variants: () => SEASON_QUESTIONS.map((q) => ({ q: q.id })),
  },
  'knowledge.weather.prompt': {
    render: (p) => WEATHER_QUESTIONS.find((q) => q.id === p.q)?.question ?? '',
    variants: () => WEATHER_QUESTIONS.map((q) => ({ q: q.id })),
  },
  'knowledge.weather.explain': {
    render: (p) => WEATHER_QUESTIONS.find((q) => q.id === p.q)?.explain ?? '',
    variants: () => WEATHER_QUESTIONS.map((q) => ({ q: q.id })),
  },
  'knowledge.odd.prompt': { render: () => 'Was gehört nicht dazu?', variants: none },
  'knowledge.odd.explain': {
    render: (p) => {
      const item = ODD_CATEGORIES.flatMap((c) => c.items).find((i) => i.id === p.odd);
      const cat = ODD_CATEGORIES.find((c) => c.id === p.category);
      return `${capitalize(item?.withArticle ?? '')} gehört nicht dazu. Die anderen sind ${cat?.plural ?? ''}.`;
    },
    variants: () =>
      ODD_CATEGORIES.flatMap((cat) =>
        ODD_CATEGORIES.filter((o) => o.id !== cat.id).flatMap((o) => o.items.map((i) => ({ odd: i.id, category: cat.id }))),
      ),
  },
  // ── Preschool pack (M13b) ──
  'german.same-start.prompt': {
    render: (p) => `Was fängt genauso an wie ${p.word}?`,
    variants: () => soundWords().map((w) => ({ word: w.word })),
  },
  'german.same-start.explain': {
    render: (p) => `${p.word} und ${p.match} fangen gleich an.`,
    variants: () =>
      soundWords().flatMap((a) =>
        WORDS.filter((b) => b.initial === a.initial && b.id !== a.id).map((b) => ({ word: a.word, match: b.word })),
      ),
  },
  'german.syllable-blend.prompt': {
    render: (p) => `Hör gut zu: ${syllablesOf(p.word)}. Welches Bild ist das?`,
    variants: () => syllableWords().map((w) => ({ word: w.word })),
  },
  'german.syllable-blend.explain': {
    render: (p) => `${syllablesOf(p.word)}: ${p.word}.`,
    variants: () => syllableWords().map((w) => ({ word: w.word })),
  },
  'german.opposites.prompt': {
    render: (p) => `Was ist das Gegenteil von ${p.word}?`,
    variants: () => OPPOSITE_WORDS.map((w) => ({ word: w.word })),
  },
  'german.opposites.explain': {
    render: (p) => `Das Gegenteil von ${p.word} ist ${p.opposite}.`,
    variants: () => OPPOSITE_WORDS.map((w) => ({ word: w.word, opposite: w.partner.word })),
  },
  'math.sizes.prompt': {
    render: (p) => `Tippe auf ${sizeAccusative(sizeItem(p.item), bigSmall(p.ask))}!`,
    variants: sizeVariants,
  },
  'math.sizes.explain': {
    render: (p) => `Schau, das ist ${sizeNominative(sizeItem(p.item), bigSmall(p.ask))}.`,
    variants: sizeVariants,
  },
  'knowledge.habitat.prompt': { render: () => 'Wo lebt das Tier?', variants: none },
  'knowledge.habitat.explain': {
    render: (p) => habitatSentence(p.animal),
    variants: () => HABITAT_ANIMALS.map((a) => ({ animal: a.id })),
  },
  'knowledge.body.prompt': {
    render: (p) => `Tippe auf ${bodyAccusative(bodyPart(p.part))}!`,
    variants: () => BODY_PARTS.map((b) => ({ part: b.id })),
  },
  'knowledge.body.explain': {
    render: (p) => `Schau, das ist ${bodyNominative(bodyPart(p.part))}.`,
    variants: () => BODY_PARTS.map((b) => ({ part: b.id })),
  },
  'knowledge.sense.prompt': {
    render: (p) => SENSES.find((s) => s.id === p.sense)?.question ?? '',
    variants: () => SENSES.map((s) => ({ sense: s.id })),
  },
  'knowledge.sense.explain': {
    render: (p) => SENSES.find((s) => s.id === p.sense)?.answer ?? '',
    variants: () => SENSES.map((s) => ({ sense: s.id })),
  },
  'knowledge.sequence.prompt': {
    render: (p) => (p.ask === 'last' ? 'Was kommt zuletzt?' : p.ask === 'middle' ? 'Was kommt in der Mitte?' : 'Was kommt zuerst?'),
    variants: () => ['first', 'last', 'middle'].map((ask) => ({ ask })),
  },
  'knowledge.sequence.explain': {
    render: (p) => {
      const steps = SEQUENCES.find((q) => q.id === p.sequence)?.steps;
      return steps ? `Zuerst ${steps[0].name}, dann ${steps[1].name}, dann ${steps[2].name}.` : '';
    },
    variants: () => SEQUENCES.map((q) => ({ sequence: q.id })),
  },
  'math.dice.prompt': { render: () => 'Wie viele Punkte siehst du?', variants: none },
  'math.dice.explain': {
    render: (p) => (p.n === 1 ? 'Das ist ein Punkt.' : `Das sind ${p.n} Punkte.`),
    variants: () => range(1, 20).map((n) => ({ n })),
  },
  'math.neighbors.prompt-after': { render: (p) => `Welche Zahl kommt nach ${p.n}?`, variants: () => range(1, 99).map((n) => ({ n })) },
  'math.neighbors.prompt-before': { render: (p) => `Welche Zahl kommt vor ${p.n}?`, variants: () => range(2, 100).map((n) => ({ n })) },
  'math.neighbors.explain-after': {
    render: (p) => `Nach ${p.n} kommt ${p.m}.`,
    variants: () => range(1, 99).map((n) => ({ n, m: n + 1 })),
  },
  'math.neighbors.explain-before': {
    render: (p) => `Vor ${p.n} kommt ${p.m}.`,
    variants: () => range(2, 100).map((n) => ({ n, m: n - 1 })),
  },
  'math.position.prompt': { render: (p) => `Tippe auf das Bild: ${positionSentence(p)}`, variants: positionVariants },
  'math.position.explain': { render: (p) => `Schau: ${positionSentence(p)}`, variants: positionVariants },
  // ── Grade 1–2 math pack (M13c) ──
  'math.calc100.prompt': { render: () => 'Rechne aus! Wie viel ist das?', variants: none },
  'math.calc100.explain': { render: (p) => `Das Ergebnis ist ${p.n}.`, variants: () => range(1, 99).map((n) => ({ n })) },
  'math.number-bonds.prompt': {
    render: (p) => `${p.total} ist ${p.known} und wie viel?`,
    variants: () => bondVariants().map(({ total, known }) => ({ total, known })),
  },
  'math.number-bonds.explain': { render: (p) => `${p.total} ist ${p.known} und ${p.answer}.`, variants: bondVariants },
  'math.double-half.prompt-double': { render: (p) => `Was ist das Doppelte von ${p.n}?`, variants: () => doubleNs().map((n) => ({ n })) },
  'math.double-half.explain-double': {
    render: (p) => `Das Doppelte von ${p.n} ist ${p.m}.`,
    variants: () => doubleNs().map((n) => ({ n, m: n * 2 })),
  },
  'math.double-half.prompt-half': { render: (p) => `Was ist die Hälfte von ${p.n}?`, variants: () => halfNs().map((n) => ({ n })) },
  'math.double-half.explain-half': {
    render: (p) => `Die Hälfte von ${p.n} ist ${p.m}.`,
    variants: () => halfNs().map((n) => ({ n, m: n / 2 })),
  },
  'math.place-value.prompt': { render: () => 'Welche Zahl ist das? Zähle die Zehner und die Einer.', variants: none },
  'math.place-value.prompt-tens': { render: (p) => `Wie viele Zehner hat die Zahl ${p.n}?`, variants: () => range(21, 99).map((n) => ({ n })) },
  'math.place-value.explain': {
    render: (p) => {
      const n = Number(p.n);
      return `Das ist die ${n}: ${tensPhrase(Math.floor(n / 10))} und ${onesPhrase(n % 10)}.`;
    },
    variants: () => range(11, 99).map((n) => ({ n })),
  },
  'math.even-odd.prompt-even': { render: () => 'Tippe auf die gerade Zahl!', variants: none },
  'math.even-odd.prompt-odd': { render: () => 'Tippe auf die ungerade Zahl!', variants: none },
  'math.even-odd.explain-even': { render: (p) => `${p.n} ist gerade.`, variants: () => range(1, 50).map((n) => ({ n: n * 2 })) },
  'math.even-odd.explain-odd': { render: (p) => `${p.n} ist ungerade.`, variants: () => range(0, 49).map((n) => ({ n: n * 2 + 1 })) },
  'math.times.prompt': { render: (p) => `Was ist ${p.a} mal ${p.b}?`, variants: timesPairs },
  'math.times.explain': {
    render: (p) => `${p.a} mal ${p.b} ist ${p.p}.`,
    variants: () => timesPairs().map(({ a, b }) => ({ a, b, p: a * b })),
  },
  'math.money.prompt': { render: () => 'Wie viel Geld ist das?', variants: none },
  'math.money.explain-euro': {
    render: (p) => (p.n === 1 ? 'Das ist ein Euro.' : `Das sind ${p.n} Euro.`),
    variants: () => range(1, 20).map((n) => ({ n })),
  },
  'math.money.explain-cent': {
    render: (p) => (p.n === 100 ? 'Das sind 100 Cent, also ein Euro.' : `Das sind ${p.n} Cent.`),
    variants: () => range(1, 10).map((n) => ({ n: n * 10 })),
  },
  'math.clock.prompt': { render: () => 'Wie spät ist es?', variants: none },
  'math.clock.explain': {
    render: (p) => `Es ist ${clockSpoken(Number(p.hour), Number(p.minute) as ClockMinute)}.`,
    variants: () => ALL_CLOCK_TIMES,
  },
  'math.symmetry.prompt': { render: () => 'Welche Hälfte passt? Das Bild soll aussehen wie im Spiegel.', variants: none },
  'math.symmetry.explain': { render: () => 'So sieht es aus wie im Spiegel.', variants: none },
  'math.chance.prompt': {
    render: (p) => `Du ziehst ohne hinzusehen eine Kugel. Ist es sicher, möglich oder unmöglich, dass sie ${colourWord(p.colour)} ist?`,
    variants: chanceColours,
  },
  'math.chance.explain-certain': { render: (p) => `Es ist sicher, denn alle Kugeln sind ${colourWord(p.colour)}.`, variants: chanceColours },
  'math.chance.explain-possible': { render: (p) => `Es ist möglich, denn manche Kugeln sind ${colourWord(p.colour)}.`, variants: chanceColours },
  'math.chance.explain-impossible': { render: (p) => `Es ist unmöglich, denn keine Kugel ist ${colourWord(p.colour)}.`, variants: chanceColours },
  // ── Grade 1–2 German pack (M13d) ──
  'german.article.prompt': {
    render: (p) => `Der, die oder das? Welcher Begleiter passt zu ${p.word}?`,
    variants: () => NOUNS.map((n) => ({ word: n.word })),
  },
  'german.article.explain': {
    render: (p) => `Es heißt ${withArticle(noun(p.word))}.`,
    variants: () => NOUNS.map((n) => ({ word: n.word })),
  },
  'german.plural.prompt': {
    render: (p) => `Wie heißt die Mehrzahl von ${p.word}?`,
    variants: () => pluralNouns().map((n) => ({ word: n.word })),
  },
  'german.plural.explain': {
    render: (p) => `Es heißt ${withArticle(noun(p.word))} und die ${noun(p.word).plural}.`,
    variants: () => pluralNouns().map((n) => ({ word: n.word })),
  },
  'german.word-type.prompt': {
    render: (p) => `Welches Wort ist ${WORD_TYPE_NAMES[String(p.type)] ?? ''}?`,
    variants: () => Object.keys(WORD_TYPE_NAMES).map((type) => ({ type })),
  },
  'german.word-type.explain': {
    render: (p) => `${p.word} ist ${WORD_TYPE_NAMES[String(p.type)] ?? ''}.`,
    variants: () => [
      ...NOUNS.map((n) => ({ type: 'noun', word: n.word })),
      ...VERBS.map((word) => ({ type: 'verb', word })),
      ...ADJECTIVES.map((word) => ({ type: 'adjective', word })),
    ],
  },
  'german.missing-letters.prompt': {
    render: (p) => `Welche Buchstaben fehlen? Hör genau: ${p.word}.`,
    variants: () => [...new Set(GAP_WORDS.map((g) => g.word.word))].map((word) => ({ word })),
  },
  'german.missing-letters.explain': {
    render: (p) => `So schreibt man ${p.word}.`,
    variants: () => [...new Set(GAP_WORDS.map((g) => g.word.word))].map((word) => ({ word })),
  },
  'german.riddle.prompt': { render: () => 'Lies das Rätsel. Was ist das?', variants: none },
  'german.riddle.explain': {
    render: (p) => {
      const r = RIDDLES.find((x) => x.id === p.riddle);
      return r ? `Die Lösung ist: ${withArticle(noun(r.answer))}.` : '';
    },
    variants: () => RIDDLES.map((r) => ({ riddle: r.id })),
  },
  'german.fill-word.prompt': { render: () => 'Lies den Satz. Welches Wort passt in die Lücke?', variants: none },
  'german.fill-word.explain': {
    render: (p) => {
      const s = GAP_SENTENCES.find((x) => x.id === p.sentence);
      return s ? gapSentence(s) : '';
    },
    variants: () => GAP_SENTENCES.map((s) => ({ sentence: s.id })),
  },
  'german.sentence-end.prompt': { render: () => 'Lies den Satz. Welches Zeichen gehört an das Ende?', variants: none },
  'german.sentence-end.explain': {
    render: (p) => {
      const s = END_SENTENCES.find((x) => x.id === p.sentence);
      if (!s) return '';
      const name = s.mark === '?' ? 'ein Fragezeichen' : s.mark === '!' ? 'ein Ausrufezeichen' : 'ein Punkt';
      return `${s.text}${s.mark} Hier gehört ${name} hin.`;
    },
    variants: () => END_SENTENCES.map((s) => ({ sentence: s.id })),
  },
  'german.abc.prompt-after': {
    render: (p) => `Welcher Buchstabe kommt im ABC nach ${p.letter}?`,
    variants: () => abcLetters.slice(0, 25).map((letter) => ({ letter })),
  },
  'german.abc.prompt-before': {
    render: (p) => `Welcher Buchstabe kommt im ABC vor ${p.letter}?`,
    variants: () => abcLetters.slice(1).map((letter) => ({ letter })),
  },
  'german.abc.explain-after': {
    render: (p) => `Nach ${p.letter} kommt ${p.answer}.`,
    variants: () => abcLetters.slice(0, 25).map((letter, i) => ({ letter, answer: abcLetters[i + 1]! })),
  },
  'german.abc.explain-before': {
    render: (p) => `Vor ${p.letter} kommt ${p.answer}.`,
    variants: () => abcLetters.slice(1).map((letter, i) => ({ letter, answer: abcLetters[i]! })),
  },
  'german.abc.prompt-words': { render: () => 'Welches Wort kommt im ABC zuerst?', variants: none },
  'german.abc.explain-words': {
    render: (p) => `${p.word} kommt im ABC zuerst.`,
    variants: () => NOUNS.map((n) => ({ word: n.word })),
  },
  'german.compound.prompt': {
    render: (p) => {
      const c = COMPOUNDS.find((x) => x.id === p.compound);
      return c ? `${c.a.word} und ${c.b.word}. Welches Wort entsteht?` : '';
    },
    variants: () => COMPOUNDS.map((c) => ({ compound: c.id })),
  },
  'german.compound.explain': {
    render: (p) => {
      const c = COMPOUNDS.find((x) => x.id === p.compound);
      return c ? `${c.a.word} und ${c.b.word}: ${c.word}.` : '';
    },
    variants: () => COMPOUNDS.map((c) => ({ compound: c.id })),
  },
  // ── Wissen pack (M13e) ──
  'knowledge.recycling.prompt': {
    render: (p) => `In welche Tonne gehört ${WASTE_ITEMS.find((w) => w.id === p.item)?.name.replace(/^./, (c) => c.toLowerCase()) ?? ''}?`,
    variants: () => WASTE_ITEMS.map((w) => ({ item: w.id })),
  },
  'knowledge.recycling.explain': { render: (p) => wasteSentence(p.item), variants: () => WASTE_ITEMS.map((w) => ({ item: w.id })) },
  'knowledge.jobs.prompt': { render: () => 'Wer braucht das bei der Arbeit?', variants: none },
  'knowledge.jobs.explain': {
    render: (p) => JOBS.find((j) => j.id === p.job)?.explain ?? '',
    variants: () => JOBS.map((j) => ({ job: j.id })),
  },
  'knowledge.float.prompt-floats': { render: () => 'Tippe auf das, was im Wasser schwimmt!', variants: none },
  'knowledge.float.prompt-sinks': { render: () => 'Tippe auf das, was im Wasser untergeht!', variants: none },
  'knowledge.float.explain-floats': {
    render: (p) => `${capitalize(floatItem(p.item)?.name ?? '')} schwimmt oben.`,
    variants: () => FLOAT_ITEMS.filter((i) => i.floats).map((i) => ({ item: i.id })),
  },
  'knowledge.float.explain-sinks': {
    render: (p) => `${capitalize(floatItem(p.item)?.name ?? '')} geht unter.`,
    variants: () => FLOAT_ITEMS.filter((i) => !i.floats).map((i) => ({ item: i.id })),
  },
  // Traffic: grade 1–2 questions plus the grade 3–4 bike questions (M15c).
  ...bankTemplates('knowledge.traffic', [...TRAFFIC_QUESTIONS, ...BIKE_QUESTIONS]),
  'knowledge.feelings.prompt-face': { render: () => 'Wie fühlt sich das Kind?', variants: none },
  'knowledge.feelings.explain-face': {
    render: (p) => `Das Kind ist ${feelingWord(p.feeling)}. Alle Gefühle sind in Ordnung.`,
    variants: () => FEELINGS.map((f) => ({ feeling: f.id })),
  },
  'knowledge.feelings.prompt-situation': {
    render: (p) => `${situation(p.situation)?.text ?? ''} Wie fühlt sich das Kind wohl?`,
    variants: () => FEELING_SITUATIONS.map((s) => ({ situation: s.id })),
  },
  'knowledge.feelings.explain-situation': {
    render: (p) => `Das Kind ist vielleicht ${feelingWord(situation(p.situation)?.feeling)}. Das ist in Ordnung.`,
    variants: () => FEELING_SITUATIONS.map((s) => ({ situation: s.id })),
  },
  'knowledge.calendar.prompt-day-after': { render: (p) => `Welcher Tag kommt nach ${p.name}?`, variants: () => WEEKDAYS.map((name) => ({ name })) },
  'knowledge.calendar.prompt-day-before': { render: (p) => `Welcher Tag kommt vor ${p.name}?`, variants: () => WEEKDAYS.map((name) => ({ name })) },
  'knowledge.calendar.prompt-month-after': { render: (p) => `Welcher Monat kommt nach ${p.name}?`, variants: () => MONTHS.map((name) => ({ name })) },
  'knowledge.calendar.prompt-month-before': { render: (p) => `Welcher Monat kommt vor ${p.name}?`, variants: () => MONTHS.map((name) => ({ name })) },
  'knowledge.calendar.explain-after': {
    render: (p) => `Nach ${p.name} kommt ${p.answer}.`,
    variants: () => [...cyclicVariants(WEEKDAYS, 'after'), ...cyclicVariants(MONTHS, 'after')],
  },
  'knowledge.calendar.explain-before': {
    render: (p) => `Vor ${p.name} kommt ${p.answer}.`,
    variants: () => [...cyclicVariants(WEEKDAYS, 'before'), ...cyclicVariants(MONTHS, 'before')],
  },
  // ── Grades 3–4 math (M15a) ──
  'math.calc.explain-big': { render: () => 'Schau, so ist es richtig.', variants: none },
  'math.place-value.prompt-hundreds': { render: () => 'Welche Zahl ist das? Zähle Hunderter, Zehner und Einer.', variants: none },
  'math.place-value.prompt-place': {
    render: (p) => `Welche Ziffer steht an der ${Number(p.place) === 3 ? 'Tausenderstelle' : 'Hunderterstelle'}?`,
    variants: () => [{ place: 2 }, { place: 3 }],
  },
  'math.place-value.explain-big': { render: () => 'Schau in die Stellenwerttafel.', variants: none },
  'math.clock.explain-digital': {
    render: (p) => `Es ist ${clockSpoken(Number(p.hour), Number(p.minute), true)}.`,
    variants: () => DIGITAL_CLOCK_TIMES.filter((t) => t.minute > 0),
  },
  'math.money.explain-mixed': {
    render: (p) => `Das sind ${euroCents(Number(p.n))}.`,
    variants: () => range(1, 100).map((n) => ({ n: n * 10 })),
  },
  'math.neighbors.prompt-after-big': { render: () => 'Welche Zahl kommt danach?', variants: none },
  'math.neighbors.prompt-before-big': { render: () => 'Welche Zahl kommt davor?', variants: none },
  'math.neighbors.explain-big': { render: () => 'Schau, so geht die Zahlenreihe weiter.', variants: none },
  'math.even-odd.explain-even-big': { render: () => 'Die letzte Ziffer ist gerade. Also ist die Zahl gerade.', variants: none },
  'math.even-odd.explain-odd-big': { render: () => 'Die letzte Ziffer ist ungerade. Also ist die Zahl ungerade.', variants: none },
  'math.division.prompt': { render: (p) => `Was ist ${p.a} geteilt durch ${p.b}?`, variants: divisionPairs },
  'math.division.explain': {
    render: (p) => `${p.a} geteilt durch ${p.b} ist ${p.q}.`,
    variants: () => divisionPairs().map(({ a, b }) => ({ a, b, q: a / b })),
  },
  'math.division.prompt-rest': { render: () => 'Teile mit Rest! Wie viel ist das?', variants: none },
  'math.division.explain-rest': { render: () => 'Schau: So oft passt die Zahl hinein, und das bleibt als Rest übrig.', variants: none },
  'math.units.prompt': {
    render: (p) => {
      const c = conversion(p.conv);
      return `Wie viele ${c.to.many} sind ${amount(Number(p.n), c.from)}?`;
    },
    variants: conversionVariants,
  },
  'math.units.explain': {
    render: (p) => {
      const c = conversion(p.conv);
      return `${amount(Number(p.n), c.from)} sind ${Number(p.n) * c.factor} ${c.to.many}.`;
    },
    variants: conversionVariants,
  },
  'math.rounding.prompt': {
    render: (p) => `Runde auf ${Number(p.to) === 1000 ? 'Tausender' : Number(p.to) === 100 ? 'Hunderter' : 'Zehner'}!`,
    variants: () => [{ to: 10 }, { to: 100 }, { to: 1000 }],
  },
  'math.rounding.explain-up': { render: () => 'Ab der Mitte wird aufgerundet.', variants: none },
  'math.rounding.explain-down': { render: () => 'Vor der Mitte wird abgerundet.', variants: none },
  'math.area.prompt-area': { render: () => 'Wie viele Kästchen groß ist die Fläche?', variants: none },
  'math.area.prompt-perimeter': { render: () => 'Wie lang ist der Rand? Zähle die Kästchenseiten rundherum.', variants: none },
  'math.area.explain-area': { render: (p) => `Die Fläche ist ${p.n} Kästchen groß.`, variants: () => range(1, 30).map((n) => ({ n })) },
  'math.area.explain-perimeter': { render: (p) => `Der Rand ist ${p.n} Kästchenseiten lang.`, variants: () => range(4, 40).map((n) => ({ n })) },
  'math.solids.prompt-name': { render: () => 'Wie heißt dieser Körper?', variants: none },
  'math.solids.explain-name': { render: (p) => `Dieser Körper heißt ${solid(p.solid).name}.`, variants: () => SOLIDS.map((x) => ({ solid: x.id })) },
  'math.solids.prompt-count': {
    render: (p) => `Wie viele ${SOLID_PROPERTIES[p.ask as keyof typeof SOLID_PROPERTIES]} hat ${solid(p.solid).withArticle}?`,
    variants: () => SOLIDS.filter((x) => x.counts).flatMap((x) => (['corners', 'edges', 'faces'] as const).map((ask) => ({ solid: x.id, ask }))),
  },
  'math.solids.explain-count': {
    render: (p) => {
      const x = solid(p.solid);
      const ask = p.ask as keyof typeof SOLID_PROPERTIES;
      return `${capitalize(x.withArticle)} hat ${x.counts?.[ask] ?? 0} ${SOLID_PROPERTIES[ask]}.`;
    },
    variants: () => SOLIDS.filter((x) => x.counts).flatMap((x) => (['corners', 'edges', 'faces'] as const).map((ask) => ({ solid: x.id, ask }))),
  },
  'math.chart.prompt-most': { render: () => 'Welches Obst mögen die meisten Kinder?', variants: none },
  'math.chart.explain-most': { render: (p) => `Die meisten Kinder mögen ${fruit(p.fruit).plural}.`, variants: () => CHART_FRUITS.map((f) => ({ fruit: f.id })) },
  'math.chart.prompt-count': { render: (p) => `Wie viele Kinder mögen ${fruit(p.fruit).plural}?`, variants: () => CHART_FRUITS.map((f) => ({ fruit: f.id })) },
  'math.chart.explain-count': {
    render: (p) => `${p.n} Kinder mögen ${fruit(p.fruit).plural}.`,
    variants: () => CHART_FRUITS.flatMap((f) => range(2, 9).map((n) => ({ fruit: f.id, n }))),
  },
  'math.chart.prompt-diff': { render: (p) => `Wie viele Kinder mehr mögen ${fruit(p.a).plural} als ${fruit(p.b).plural}?`, variants: fruitPairs },
  'math.chart.explain-diff': {
    render: (p) => `${p.n} ${Number(p.n) === 1 ? 'Kind mag' : 'Kinder mögen'} lieber ${fruit(p.a).plural} als ${fruit(p.b).plural}.`,
    variants: () => fruitPairs().flatMap((x) => range(1, 7).map((n) => ({ ...x, n }))),
  },
  // ── Grades 3–4 German (M15b) ──
  'german.tense.prompt-which': { render: () => 'Lies den Satz. In welcher Zeit steht er?', variants: none },
  'german.tense.explain-simple': {
    render: (p) => {
      const t = p.tense as Tense;
      return `${tenseSentence(verb4(p.verb), t)} Das ist ${t === 'future' ? 'die Zukunft' : t === 'present' ? 'die Gegenwart' : 'die Vergangenheit'}.`;
    },
    variants: () => VERBS4.flatMap((v) => (['present', 'past', 'future'] as const).map((tense) => ({ verb: v.inf, tense }))),
  },
  'german.tense.explain-term': {
    render: (p) => `${tenseSentence(verb4(p.verb), p.tense as Tense)} Der Satz steht ${TENSE_DATIVE[p.tense as Tense]}.`,
    variants: () => VERBS4.flatMap((v) => TENSES.map((tense) => ({ verb: v.inf, tense }))),
  },
  'german.tense.prompt-past': { render: () => 'Lies den Satz. Welches Wort passt für gestern?', variants: none },
  'german.tense.explain-past': {
    render: (p) => `Heute ${verb4(p.verb).present} ich. Gestern ${verb4(p.verb).past} ich.`,
    variants: () => VERBS4.map((v) => ({ verb: v.inf })),
  },
  'german.sentence-parts.prompt-predicate': { render: () => 'Tippe auf das Prädikat. Frag: Was tut jemand?', variants: none },
  'german.sentence-parts.prompt-subject': { render: () => 'Tippe auf das Subjekt. Frag: Wer oder was?', variants: none },
  'german.sentence-parts.explain-predicate': {
    render: (p) => `Das Prädikat ist: ${partText(partSentence(p.sentence).parts[partSentence(p.sentence).predicate]!)}.`,
    variants: () => PART_SENTENCES.map((x) => ({ sentence: x.id })),
  },
  'german.sentence-parts.explain-subject': {
    render: (p) => `Das Subjekt ist: ${partText(partSentence(p.sentence).parts[partSentence(p.sentence).subject]!)}.`,
    variants: () => PART_SENTENCES.map((x) => ({ sentence: x.id })),
  },
  'german.word-family.prompt': {
    render: (p) => `Welches Wort gehört zur Wortfamilie ${FAMILIES.find((f) => f.id === p.family)?.stem ?? ''}?`,
    variants: () => FAMILIES.map((f) => ({ family: f.id })),
  },
  'german.word-family.explain': {
    render: (p) => `${p.word} gehört zur Wortfamilie ${FAMILIES.find((f) => f.id === p.family)?.stem ?? ''}.`,
    variants: () => FAMILIES.flatMap((f) => f.members.map((word) => ({ family: f.id, word }))),
  },
  'german.spelling.prompt': {
    render: (p) => `Welches Wort ist richtig geschrieben? Hör genau: ${p.word}.`,
    variants: () => SPELLING.map((x) => ({ word: x.word })),
  },
  'german.spelling.explain': { render: (p) => spellingExplain(p.word), variants: () => SPELLING.map((x) => ({ word: x.word })) },
  'german.capital.prompt': { render: () => 'Welches Wort schreibt man groß?', variants: none },
  'german.capital.explain': {
    render: (p) => `${p.word} ist ein Nomen. Nomen schreibt man groß.`,
    variants: () => CAPITAL_NOUNS.map((n) => ({ word: n.word })),
  },
  'german.comparison.prompt': { render: () => 'Lies genau. Welches Wort fehlt?', variants: none },
  'german.comparison.explain': {
    render: (p) => {
      const a = ADJECTIVE_FORMS.find((x) => x.base === p.adj)!;
      return `${a.base}, ${a.comp}, ${a.sup}.`;
    },
    variants: () => ADJECTIVE_FORMS.map((a) => ({ adj: a.base })),
  },
  'german.reading.prompt': { render: () => 'Lies den Text und beantworte die Frage.', variants: none },
  'german.reading.explain': {
    render: (p) => `Die Antwort steht im Text: ${TEXTS.find((t) => t.id === p.text)?.answer ?? ''}.`,
    variants: () => TEXTS.map((t) => ({ text: t.id })),
  },
  // ── Grades 3–4 Wissen (M15c) ──
  ...bankTemplates('knowledge.states', STATE_QUESTIONS),
  ...bankTemplates('knowledge.science', SCIENCE_QUESTIONS),
  ...bankTemplates('knowledge.germany', GERMANY_QUESTIONS),
  ...bankTemplates('knowledge.past', PAST_QUESTIONS),
  ...bankTemplates('knowledge.together', TOGETHER_QUESTIONS),
  ...bankTemplates('knowledge.body4', BODY_QUESTIONS),
  'knowledge.compass.prompt-place': {
    render: (p) => `Was liegt im ${DIRECTION_NAMES[p.dir as Direction]?.name ?? ''} der Schule?`,
    variants: () => (['north', 'east', 'south', 'west'] as const).map((dir) => ({ dir })),
  },
  'knowledge.compass.prompt-direction': {
    render: (p) => `In welcher Himmelsrichtung liegt ${mapPlace(p.place).name}?`,
    variants: () => MAP_PLACES.map((x) => ({ place: x.id })),
  },
  'knowledge.compass.explain': {
    render: (p) => `${capitalize(mapPlace(p.place).name)} liegt im ${DIRECTION_NAMES[p.dir as Direction]?.name ?? ''}.`,
    variants: () => MAP_PLACES.flatMap((x) => (['north', 'east', 'south', 'west'] as const).map((dir) => ({ place: x.id, dir }))),
  },
  'feedback.tryAgain': { render: () => 'Fast! Versuch es nochmal.', variants: none },
  'feedback.hint': { render: () => 'Ich helfe dir. Schau genau hin!', variants: none },
  'feedback.skipQuestion': { render: () => 'Möchtest du diese Aufgabe wirklich überspringen?', variants: none },
};

export function speechText(line: SpeechLine): string {
  const template = speechTemplates[line.key];
  if (!template) throw new Error(`Missing speech template: ${line.key}`);
  return template.render(line.params ?? {});
}

/** Fixed sentences spoken outside challenges (screens, guide). */
export const staticSpokenTexts: readonly string[] = [
  de.createProfile.speakIntro,
  ...Object.values(de.activities.intros),
  de.activities.pair,
  de.practice.title,
  de.practice.mixed,
  de.practice.choose,
  de.practice.halfway,
  de.practice.doneSpeak,
  de.practice.retry,
  ...Object.values(de.subjects.names).map((s) => de.practice.allOf(s)),
  ...Object.values(de.practice.topics).map((t) => t.name),
  de.activities.jump.stumble,
  de.activities.jump.highChest,
  de.activities.jump.goalSpeak,
  de.activities.chest,
  de.activities.doneSpeak,
  de.activities.speakMystery,
  de.activities.speakUnlocked,
  de.stage.question,
  ...Object.values(de.stage.spoken),
  ...Object.values(de.lostAnimals).flatMap((a) => [a.speakStart, a.speakGoal, a.name]),
  ...Object.values(de.animals),
  de.breakTime.speak,
  de.wayHint.speak,
  de.wayHint.wait,
  de.worldSelect.speak,
  de.subjects.speakToday,
  de.subjects.keepOne,
  ...Object.values(de.subjects.names),
  de.worldSelect.speakLocked,
  de.worldSelect.speakUnlocked,
  ...Object.values(de.guideIntro),
  de.rewards.speakPick,
  de.treehouse.speakWelcome,
  de.treehouse.speakEmpty,
  de.rewards.thanks,
  de.rewards.allCollected,
  ...Object.values(de.rewards.items),
  ...range(1, 10).map((n) => de.rewards.jarHint(n)),
  // Single words, for the speaker buttons on pictures (rhyme, read-word, knowledge cards).
  ...WORDS.map((w) => w.word),
  ...ANIMALS.map((a) => a.name),
  ...BABIES.map((b) => b.baby),
  ...SEASONS.map((s) => s.name),
  ...WEATHER_ITEMS.map((i) => i.name),
  ...ODD_CATEGORIES.flatMap((c) => c.items.map((i) => i.name)),
  // Preschool pack: speaker buttons on answer cards.
  ...OPPOSITE_WORDS.map((w) => w.word),
  ...HABITATS.map((h) => h.name),
  ...SEQUENCES.flatMap((q) => q.steps.map((s) => s.name)),
  ...BODY_PARTS.map((b) => b.word),
  // Grade 1–2 math pack: clock answer cards.
  ...ALL_CLOCK_TIMES.map((t) => clockSpoken(t.hour, t.minute)),
  ...DIGITAL_CLOCK_TIMES.map((t) => clockSpoken(t.hour, t.minute, true)),
  ...SOLIDS.map((x) => x.name),
  // Grades 3–4 German: speaker buttons on word cards.
  ...Object.values(TENSE_NAMES).flatMap((t) => [t.simple, t.term]),
  ...FAMILIES.flatMap((f) => [...f.members, ...f.lookAlikes]),
  ...CAPITAL_NOUNS.map((n) => n.word.toLowerCase()),
  ...LOWER_WORDS,
  // Grades 3–4 Wissen: speaker buttons on answer cards.
  ...[STATE_QUESTIONS, SCIENCE_QUESTIONS, GERMANY_QUESTIONS, PAST_QUESTIONS, TOGETHER_QUESTIONS, BODY_QUESTIONS, BIKE_QUESTIONS].flatMap((bank) =>
    bank.flatMap((x) => [x.answer.label, ...x.distractors.map((d) => d.label)]),
  ),
  ...MAP_PLACES.map((x) => x.name),
  ...Object.values(DIRECTION_NAMES).map((d) => d.name),
  // Grade 1–2 German pack: speaker buttons on word cards.
  ...VERBS,
  ...ADJECTIVES,
  ...GAP_SENTENCES.flatMap((s) => s.options),
  ...COMPOUNDS.map((c) => c.word),
  // Wissen pack: speaker buttons on answer cards.
  ...BINS.map((b) => b.name),
  ...JOBS.map((j) => j.name),
  ...FLOAT_ITEMS.map((i) => i.name),
  ...TRAFFIC_QUESTIONS.flatMap((q) => [q.answer.label, ...q.distractors.map((d) => d.label)]),
  ...FEELINGS.map((f) => f.word),
  ...WEEKDAYS,
  ...MONTHS,
];

/** Every sentence the game can speak; input for the audio clip generator. */
export function allSpokenTexts(): string[] {
  const texts = new Set<string>(staticSpokenTexts);
  for (const template of Object.values(speechTemplates)) {
    for (const params of template.variants()) texts.add(template.render(params));
  }
  return [...texts].sort();
}
