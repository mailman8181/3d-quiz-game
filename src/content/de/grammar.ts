/**
 * Content for the grade 1–2 German pack (roadmap M13d, ADR-0009). Research:
 * docs/curriculum/niedersachsen.md §4 (KC Deutsch, Ende Jg. 2). German only; modules pick from
 * these lists. Adding items: append, run the unit tests, then `npm run audio:generate`.
 */
import { WORDS, type Word } from './words';

export type Gender = 'm' | 'f' | 'n';
export const ARTICLES: Record<Gender, 'der' | 'die' | 'das'> = { m: 'der', f: 'die', n: 'das' };

/** Gender and plural for the word bank (plural null = unusual, skipped in plural tasks). */
const FORMS: Record<string, [Gender, string | null]> = {
  Maus: ['f', 'Mäuse'], Haus: ['n', 'Häuser'], Hose: ['f', 'Hosen'], Rose: ['f', 'Rosen'], Dose: ['f', 'Dosen'],
  Nase: ['f', 'Nasen'], Hase: ['m', 'Hasen'], Hund: ['m', 'Hunde'], Mund: ['m', 'Münder'], Kuh: ['f', 'Kühe'],
  Schuh: ['m', 'Schuhe'], Schwein: ['n', 'Schweine'], Stein: ['m', 'Steine'], Bein: ['n', 'Beine'], Zahn: ['m', 'Zähne'],
  Hahn: ['m', 'Hähne'], Ziege: ['f', 'Ziegen'], Fliege: ['f', 'Fliegen'], Katze: ['f', 'Katzen'], Tatze: ['f', 'Tatzen'],
  Sonne: ['f', 'Sonnen'], Tonne: ['f', 'Tonnen'], Wal: ['m', 'Wale'], Schal: ['m', 'Schals'], Hand: ['f', 'Hände'],
  Strand: ['m', 'Strände'], Mond: ['m', 'Monde'], Baum: ['m', 'Bäume'], Ball: ['m', 'Bälle'], Banane: ['f', 'Bananen'],
  Apfel: ['m', 'Äpfel'], Auto: ['n', 'Autos'], Ente: ['f', 'Enten'], Igel: ['m', 'Igel'], Eis: ['n', null],
  Uhr: ['f', 'Uhren'], Ohr: ['n', 'Ohren'], Bus: ['m', 'Busse'], Fisch: ['m', 'Fische'], Tomate: ['f', 'Tomaten'],
  Rakete: ['f', 'Raketen'], Giraffe: ['f', 'Giraffen'], Elefant: ['m', 'Elefanten'], Krokodil: ['n', 'Krokodile'],
  Zitrone: ['f', 'Zitronen'], Kirsche: ['f', 'Kirschen'], Birne: ['f', 'Birnen'], Möhre: ['f', 'Möhren'],
  Kuchen: ['m', 'Kuchen'], Brot: ['n', 'Brote'], Boot: ['n', 'Boote'], Löwe: ['m', 'Löwen'], Tiger: ['m', 'Tiger'],
  Pferd: ['n', 'Pferde'], Biene: ['f', 'Bienen'], Raupe: ['f', 'Raupen'], Schnecke: ['f', 'Schnecken'], Pilz: ['m', 'Pilze'],
  Wolke: ['f', 'Wolken'], Blume: ['f', 'Blumen'], Buch: ['n', 'Bücher'], Stern: ['m', 'Sterne'], Herz: ['n', 'Herzen'],
  Kerze: ['f', 'Kerzen'], Gitarre: ['f', 'Gitarren'], Schmetterling: ['m', 'Schmetterlinge'], Erdbeere: ['f', 'Erdbeeren'],
  Ananas: ['f', null], Pinguin: ['m', 'Pinguine'], Kamel: ['n', 'Kamele'], Hamster: ['m', 'Hamster'], Panda: ['m', 'Pandas'],
  Teddy: ['m', 'Teddys'], Roller: ['m', 'Roller'], Dino: ['m', 'Dinos'], Drache: ['m', 'Drachen'], Kartoffel: ['f', 'Kartoffeln'],
  Salat: ['m', 'Salate'], Ufo: ['n', 'Ufos'], Oma: ['f', 'Omas'], Opa: ['m', 'Opas'], Ameise: ['f', 'Ameisen'],
  Affe: ['m', 'Affen'], Robbe: ['f', 'Robben'], Muschel: ['f', 'Muscheln'], Ring: ['m', 'Ringe'], Zebra: ['n', 'Zebras'],
  Tasse: ['f', 'Tassen'], Zug: ['m', 'Züge'], Bett: ['n', 'Betten'], Fuß: ['m', 'Füße'], Pizza: ['f', null], Lama: ['n', 'Lamas'],
};

export interface Noun extends Word {
  gender: Gender;
  plural: string | null;
}

/** Word-bank nouns with grammar (Nudeln is a plural-only word and left out). */
export const NOUNS: readonly Noun[] = WORDS.filter((w) => FORMS[w.word]).map((w) => ({
  ...w,
  gender: FORMS[w.word]![0],
  plural: FORMS[w.word]![1],
}));

export const withArticle = (n: Noun) => `${ARTICLES[n.gender]} ${n.word}`;

const UMLAUT: Record<string, string> = { a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü' };

/** Umlaut on the last stem vowel: Haus → Häus, Hund → Hünd, Ball → Bäll ("au" → "äu"). */
function umlaut(w: string): string {
  if (/aa|oo/i.test(w)) return w; // Boot, Haar: no umlaut mistake to make
  const au = w.lastIndexOf('au');
  const last = Math.max(w.lastIndexOf('a'), w.lastIndexOf('o'), w.lastIndexOf('u'), w.lastIndexOf('A'), w.lastIndexOf('O'), w.lastIndexOf('U'));
  if (au >= 0 && au + 1 >= last) return `${w.slice(0, au)}äu${w.slice(au + 2)}`;
  return last < 0 ? w : `${w.slice(0, last)}${UMLAUT[w[last]!]}${w.slice(last + 1)}`;
}

/**
 * Wrong plurals of the kind children produce (KC: "numerische Nomenprobe"), by word ending,
 * never the correct one: Hund → Hunds, Hunden, Hünde, Hunder · Hase → Hases, Haser, Häsen ·
 * Apfel → Apfels, Apfeln, Äpfeln.
 */
export function wrongPlurals(n: Noun): string[] {
  const w = n.word;
  // Umlaut mistakes only where a child would make them: short words (Hünde, Häsen, Äpfeln).
  const u = n.syllables.length <= 2 ? umlaut(w) : w;
  const forms = /(el|er|en)$/.test(w)
    ? [`${w}s`, `${w}n`, u, `${u}n`]
    : w.endsWith('e')
      ? [`${w}s`, `${w}r`, `${u}n`]
      : [`${w}s`, `${w}e`, `${w}en`, `${w}er`, `${u}e`, `${u}er`];
  return [...new Set(forms)].filter((f) => f !== n.plural && f !== w && !UNSUITABLE.has(f));
}

/** Real words that must not appear as distractors in a children's game. */
const UNSUITABLE = new Set(['Busen']);

/**
 * Nouns for plural tasks: a real plural, consonant or -e ending (Auto/Oma/Teddy -s plurals left
 * out), and no second accepted plural (Duden: Schals/Schale, Pinguine/Pinguins).
 */
export const PLURAL_NOUNS: readonly Noun[] = NOUNS.filter(
  (n) =>
    n.plural &&
    n.plural !== n.word &&
    !/[aiouy]$/.test(n.word) &&
    !['Schal', 'Pinguin'].includes(n.word) &&
    wrongPlurals(n).length >= 3,
);

// ── Wortarten ────────────────────────────────────────────────────────────────────────────
export const WORD_TYPES = ['noun', 'verb', 'adjective'] as const;
export type WordType = (typeof WORD_TYPES)[number];

export const VERBS: readonly string[] = [
  'laufen', 'springen', 'essen', 'malen', 'singen', 'lachen', 'schwimmen', 'schlafen',
  'spielen', 'tanzen', 'kochen', 'bauen', 'trinken', 'rufen',
];

export const ADJECTIVES: readonly string[] = [
  'groß', 'klein', 'rot', 'schnell', 'lustig', 'laut', 'warm', 'weich', 'süß', 'müde', 'kalt', 'nass', 'bunt', 'leise',
];

// ── Fehlende Buchstaben ──────────────────────────────────────────────────────────────────
/** Letter groups from KC Deutsch Jg. 2 ("ch, sch, -ng, -nk, au, ei, eu, sp, st, …", ie). */
export const VOWEL_GROUPS = ['ei', 'ie', 'au', 'eu'] as const;
export const CONSONANT_GROUPS = ['sch', 'ch', 'ck', 'ng', 'nk', 'pf'] as const;

export interface GapWord {
  word: Noun;
  group: string;
  index: number;
  vowel: boolean;
}

/**
 * Every (word, group) where the group appears once; "ch" inside "sch" does not count. Words
 * shorter than 4 letters are left out (Eis → Aus would be another word).
 */
export const GAP_WORDS: readonly GapWord[] = NOUNS.filter((n) => n.word.length >= 4).flatMap((n) => {
  const lower = n.word.toLowerCase();
  const gaps: GapWord[] = [];
  for (const group of [...VOWEL_GROUPS, ...CONSONANT_GROUPS]) {
    const index = lower.indexOf(group);
    if (index < 0 || lower.indexOf(group, index + 1) >= 0) continue;
    if (group === 'ch' && lower.slice(Math.max(0, index - 1), index + 2) === 'sch') continue;
    gaps.push({ word: n, group, index, vowel: (VOWEL_GROUPS as readonly string[]).includes(group) });
  }
  return gaps;
});

/** The group as written at that position ("Sch" at the start of a noun). */
export const groupAt = (g: string, index: number) => (index === 0 ? g.charAt(0).toUpperCase() + g.slice(1) : g);

// ── Rätsel (Lesen: Sätze verstehen) ──────────────────────────────────────────────────────
export const RIDDLES: readonly { id: string; text: string; answer: string }[] = [
  { id: 'banana', text: 'Ich bin gelb und krumm. Affen essen mich gern.', answer: 'Banane' },
  { id: 'rabbit', text: 'Ich habe lange Ohren und hoppele über die Wiese.', answer: 'Hase' },
  { id: 'sun', text: 'Ich scheine am Tag und mache es warm.', answer: 'Sonne' },
  { id: 'ball', text: 'Ich bin rund und du kannst mich kicken.', answer: 'Ball' },
  { id: 'giraffe', text: 'Ich habe einen langen Hals und fresse Blätter von hohen Bäumen.', answer: 'Giraffe' },
  { id: 'snail', text: 'Ich trage mein Haus auf dem Rücken und bin sehr langsam.', answer: 'Schnecke' },
  { id: 'icecream', text: 'Ich bin kalt und süß. Im Sommer isst du mich gern.', answer: 'Eis' },
  { id: 'hedgehog', text: 'Ich habe viele Stacheln auf dem Rücken.', answer: 'Igel' },
  { id: 'bee', text: 'Ich summe von Blume zu Blume und mache Honig.', answer: 'Biene' },
  { id: 'moon', text: 'Ich leuchte in der Nacht am Himmel.', answer: 'Mond' },
  { id: 'strawberry', text: 'Ich bin rot und süß und habe kleine Kerne außen.', answer: 'Erdbeere' },
  { id: 'train', text: 'Ich fahre auf Schienen und habe viele Wagen.', answer: 'Zug' },
  { id: 'rocket', text: 'Ich fliege hoch hinauf bis zu den Sternen.', answer: 'Rakete' },
  { id: 'elephant', text: 'Ich bin sehr groß, grau und habe einen Rüssel.', answer: 'Elefant' },
  { id: 'book', text: 'In mir stehen viele Geschichten. Du kannst in mir lesen.', answer: 'Buch' },
  { id: 'cow', text: 'Ich gebe Milch und mache Muh.', answer: 'Kuh' },
];

// ── Lückensätze ──────────────────────────────────────────────────────────────────────────
/** `___` marks the gap; `options[0]` is correct, the others never fit. */
export const GAP_SENTENCES: readonly { id: string; text: string; options: readonly [string, string, string] }[] = [
  { id: 'dog', text: 'Der Hund ___ laut.', options: ['bellt', 'fliegt', 'schwimmt'] },
  { id: 'sun', text: 'Die Sonne ___ am Himmel.', options: ['scheint', 'bellt', 'kocht'] },
  { id: 'bird', text: 'Der Vogel ___ zum Baum.', options: ['fliegt', 'bellt', 'kocht'] },
  { id: 'read', text: 'Ich ___ ein Buch.', options: ['lese', 'trinke', 'schlafe'] },
  { id: 'ice', text: 'Das Eis ist sehr ___.', options: ['kalt', 'laut', 'müde'] },
  { id: 'fish', text: 'Der Fisch ___ im Wasser.', options: ['schwimmt', 'läuft', 'singt'] },
  { id: 'soup', text: 'Mama ___ eine Suppe.', options: ['kocht', 'fliegt', 'bellt'] },
  { id: 'winter', text: 'Im Winter ist es oft ___.', options: ['kalt', 'heiß', 'müde'] },
  { id: 'milk', text: 'Die Katze trinkt ___.', options: ['Milch', 'Steine', 'Schuhe'] },
  { id: 'teeth', text: 'Ich putze mir die ___.', options: ['Zähne', 'Äpfel', 'Wolken'] },
  { id: 'round', text: 'Der Ball ist ___.', options: ['rund', 'müde', 'traurig'] },
  { id: 'bed', text: 'Am Abend gehe ich ins ___.', options: ['Bett', 'Brot', 'Salz'] },
  { id: 'apple', text: 'Der Apfel ist ___ und süß.', options: ['rot', 'laut', 'müde'] },
  { id: 'flower', text: 'Die Blume ___ gut.', options: ['riecht', 'bellt', 'fährt'] },
  { id: 'song', text: 'Wir ___ ein Lied.', options: ['singen', 'essen', 'bauen'] },
];

export const gapSentence = (s: { text: string; options: readonly string[] }) => s.text.replace('___', s.options[0]!);

// ── Satzschlusszeichen ───────────────────────────────────────────────────────────────────
export const SENTENCE_MARKS = ['.', '?', '!'] as const;
export type SentenceMark = (typeof SENTENCE_MARKS)[number];

export const END_SENTENCES: readonly { id: string; text: string; mark: SentenceMark }[] = [
  { id: 'name', text: 'Wie heißt du', mark: '?' },
  { id: 'dog', text: 'Ich habe einen Hund', mark: '.' },
  { id: 'careful', text: 'Pass auf', mark: '!' },
  { id: 'live', text: 'Wo wohnst du', mark: '?' },
  { id: 'sun', text: 'Heute scheint die Sonne', mark: '.' },
  { id: 'come', text: 'Komm schnell her', mark: '!' },
  { id: 'ice', text: 'Magst du Eis', mark: '?' },
  { id: 'ball', text: 'Der Ball ist rot', mark: '.' },
  { id: 'help', text: 'Hilfe', mark: '!' },
  { id: 'swim', text: 'Kannst du schwimmen', mark: '?' },
  { id: 'garden', text: 'Wir spielen im Garten', mark: '.' },
  { id: 'stop', text: 'Hör sofort auf', mark: '!' },
];

// ── Zusammengesetzte Nomen ───────────────────────────────────────────────────────────────
export interface Compound {
  id: string;
  a: { word: string; emoji: string };
  b: { word: string; emoji: string };
  word: string;
  emoji: string;
}

const cp = (a: string, ae: string, b: string, be: string, word: string, emoji: string): Compound => ({
  id: word.toLowerCase(),
  a: { word: a, emoji: ae },
  b: { word: b, emoji: be },
  word,
  emoji,
});

export const COMPOUNDS: readonly Compound[] = [
  cp('Schnee', '❄️', 'Mann', '👨', 'Schneemann', '⛄'),
  cp('Sonne', '☀️', 'Blume', '🌸', 'Sonnenblume', '🌻'),
  cp('Hand', '✋', 'Schuh', '👟', 'Handschuh', '🧤'),
  cp('Zahn', '🦷', 'Bürste', '🖌️', 'Zahnbürste', '🪥'),
  cp('Eis', '🧊', 'Bär', '🐻', 'Eisbär', '🐻‍❄️'),
  cp('Sonne', '☀️', 'Brille', '👓', 'Sonnenbrille', '🕶️'),
  cp('Regen', '🌧️', 'Bogen', '🏹', 'Regenbogen', '🌈'),
  cp('Feuer', '🔥', 'Wehr', '🛡️', 'Feuerwehr', '🚒'),
];
