/**
 * Content for grades 3–4 German (roadmap M15b), KC Deutsch Ende Jg. 4 (docs/curriculum/
 * niedersachsen.md §4/§8): Zeitformen, Satzglieder, Wortfamilien, Rechtschreibstrategien,
 * Groß- und Kleinschreibung (Abstrakta), Steigerung, Textverständnis.
 */

// ── Zeitformen ───────────────────────────────────────────────────────────────────────────
export interface VerbForms {
  inf: string;
  /** ich-Form Präsens, Präteritum; Partizip II with its auxiliary. */
  present: string;
  past: string;
  perfect: string;
  /** Regular (spielen → spielte) or irregular (gehen → ging). */
  regular: boolean;
}

const v = (inf: string, present: string, past: string, perfect: string, regular: boolean): VerbForms => ({ inf, present, past, perfect, regular });

export const VERBS4: readonly VerbForms[] = [
  v('spielen', 'spiele', 'spielte', 'habe gespielt', true),
  v('malen', 'male', 'malte', 'habe gemalt', true),
  v('lachen', 'lache', 'lachte', 'habe gelacht', true),
  v('kochen', 'koche', 'kochte', 'habe gekocht', true),
  v('bauen', 'baue', 'baute', 'habe gebaut', true),
  v('tanzen', 'tanze', 'tanzte', 'habe getanzt', true),
  v('hüpfen', 'hüpfe', 'hüpfte', 'bin gehüpft', true),
  v('gehen', 'gehe', 'ging', 'bin gegangen', false),
  v('laufen', 'laufe', 'lief', 'bin gelaufen', false),
  v('essen', 'esse', 'aß', 'habe gegessen', false),
  v('schwimmen', 'schwimme', 'schwamm', 'bin geschwommen', false),
  v('singen', 'singe', 'sang', 'habe gesungen', false),
  v('schreiben', 'schreibe', 'schrieb', 'habe geschrieben', false),
  v('lesen', 'lese', 'las', 'habe gelesen', false),
  v('fahren', 'fahre', 'fuhr', 'bin gefahren', false),
  v('springen', 'springe', 'sprang', 'bin gesprungen', false),
  v('trinken', 'trinke', 'trank', 'habe getrunken', false),
];

export const TENSES = ['present', 'past', 'perfect', 'future'] as const;
export type Tense = (typeof TENSES)[number];

/** "Ich spiele." / "Ich spielte." / "Ich habe gespielt." / "Ich werde spielen." */
export function tenseSentence(verb: VerbForms, tense: Tense): string {
  if (tense === 'present') return `Ich ${verb.present}.`;
  if (tense === 'past') return `Ich ${verb.past}.`;
  if (tense === 'perfect') return `Ich ${verb.perfect}.`;
  return `Ich werde ${verb.inf}.`;
}

/** Grade 3 names (time) and grade 4 names (grammar terms). */
export const TENSE_NAMES: Record<Tense, { simple: string; term: string }> = {
  present: { simple: 'Gegenwart', term: 'Präsens' },
  past: { simple: 'Vergangenheit', term: 'Präteritum' },
  perfect: { simple: 'Vergangenheit', term: 'Perfekt' },
  future: { simple: 'Zukunft', term: 'Futur' },
};

/** Typical wrong past forms: regularised irregulars (gehte), present, infinitive. */
export function wrongPast(verb: VerbForms): string[] {
  const stem = verb.inf.replace(/en$/, '').replace(/n$/, '');
  return [...new Set([`${stem}te`, verb.present, verb.inf, `${stem}t`])].filter((w) => w !== verb.past);
}

// ── Satzglieder ──────────────────────────────────────────────────────────────────────────
/** Sentences split into parts; `subject` and `predicate` are indices into `parts`. */
export const PART_SENTENCES: readonly { id: string; parts: readonly string[]; subject: number; predicate: number }[] = [
  { id: 'dog', parts: ['Der Hund', 'bellt', 'laut.'], subject: 0, predicate: 1 },
  { id: 'cat', parts: ['Die Katze', 'schläft', 'auf dem Sofa.'], subject: 0, predicate: 1 },
  { id: 'kids', parts: ['Die Kinder', 'spielen', 'im Garten.'], subject: 0, predicate: 1 },
  { id: 'mia', parts: ['Mia', 'liest', 'ein Buch.'], subject: 0, predicate: 1 },
  { id: 'morning', parts: ['Am Morgen', 'scheint', 'die Sonne.'], subject: 2, predicate: 1 },
  { id: 'ben', parts: ['Ben', 'malt', 'ein Bild', 'für Oma.'], subject: 0, predicate: 1 },
  { id: 'bird', parts: ['Der kleine Vogel', 'singt', 'im Baum.'], subject: 0, predicate: 1 },
  { id: 'today', parts: ['Heute', 'backt', 'Papa', 'einen Kuchen.'], subject: 2, predicate: 1 },
  { id: 'ball', parts: ['Der rote Ball', 'rollt', 'unter den Tisch.'], subject: 0, predicate: 1 },
  { id: 'school', parts: ['In der Schule', 'lernen', 'wir', 'das ABC.'], subject: 2, predicate: 1 },
];

export const sentenceText = (s: { parts: readonly string[] }) => s.parts.join(' ');

// ── Wortfamilien ─────────────────────────────────────────────────────────────────────────
/** A stem, words of its family, and look-alikes that do not belong (Fahne ≠ fahren). */
export const FAMILIES: readonly { id: string; stem: string; members: readonly string[]; lookAlikes: readonly string[] }[] = [
  { id: 'fahren', stem: 'fahren', members: ['Fahrrad', 'Fahrer', 'Abfahrt'], lookAlikes: ['Farbe', 'Fahne', 'Farn'] },
  { id: 'spielen', stem: 'spielen', members: ['Spielzeug', 'Spieler', 'Spielplatz'], lookAlikes: ['Spiegel', 'Spitze', 'spitz'] },
  { id: 'backen', stem: 'backen', members: ['Bäcker', 'Backofen', 'Gebäck'], lookAlikes: ['Bach', 'Banane', 'Bauch'] },
  { id: 'schreiben', stem: 'schreiben', members: ['Schreibtisch', 'Schrift', 'Schreiber'], lookAlikes: ['Schrank', 'schräg', 'Schraube'] },
  { id: 'lesen', stem: 'lesen', members: ['Leser', 'Lesebuch', 'lesbar'], lookAlikes: ['Besen', 'Lehrer', 'leer'] },
  { id: 'malen', stem: 'malen', members: ['Maler', 'Malstift', 'Gemälde'], lookAlikes: ['Mantel', 'Mahlzeit', 'Mal'] },
  { id: 'schwimmen', stem: 'schwimmen', members: ['Schwimmbad', 'Schwimmer', 'Schwimmflügel'], lookAlikes: ['Schwamm', 'Schwein', 'schwer'] },
  { id: 'haus', stem: 'Haus', members: ['Häuschen', 'Hausaufgabe', 'Haustür'], lookAlikes: ['Hase', 'Hals', 'Haut'] },
  { id: 'kind', stem: 'Kind', members: ['Kindergarten', 'kindlich', 'Kindheit'], lookAlikes: ['Kinn', 'Kino', 'Kiste'] },
  { id: 'wasser', stem: 'Wasser', members: ['Wasserhahn', 'wässrig', 'Wasserfall'], lookAlikes: ['waschen', 'Wanne', 'Walross'] },
];

// ── Rechtschreibstrategien ───────────────────────────────────────────────────────────────
export type Strategy = 'lengthen' | 'derive' | 'syllable' | 'remember';

/** A word, two wrong spellings, the strategy and its hint (spoken in the explanation). */
export interface SpellingItem {
  word: string;
  emoji: string;
  wrong: readonly [string, string];
  strategy: Strategy;
  /** "Hunde" — the lengthened/related word that shows the spelling. */
  helper: string;
  level: 1 | 2 | 3;
}

const sp = (word: string, emoji: string, w1: string, w2: string, strategy: Strategy, helper: string, level: 1 | 2 | 3): SpellingItem => ({
  word,
  emoji,
  wrong: [w1, w2],
  strategy,
  helper,
  level,
});

export const SPELLING: readonly SpellingItem[] = [
  // Level 1 (grade 2–3): ie and double consonants — silbisch sprechen.
  sp('Biene', '🐝', 'Bine', 'Bihne', 'syllable', 'Bie-ne', 1),
  sp('Sonne', '☀️', 'Sone', 'Sohne', 'syllable', 'Son-ne', 1),
  sp('Teller', '🍽️', 'Teler', 'Tehler', 'syllable', 'Tel-ler', 1),
  sp('Tasse', '☕', 'Tase', 'Taße', 'syllable', 'Tas-se', 1),
  sp('Ziege', '🐐', 'Zige', 'Ziehge', 'syllable', 'Zie-ge', 1),
  sp('Puppe', '🪆', 'Pupe', 'Pubbe', 'syllable', 'Pup-pe', 1),
  // Level 2 (grade 3): final devoicing — verlängern; ck/tz.
  sp('Hund', '🐶', 'Hunt', 'Hundt', 'lengthen', 'die Hunde', 2),
  sp('Wald', '🌲', 'Walt', 'Waldt', 'lengthen', 'die Wälder', 2),
  sp('Berg', '⛰️', 'Berk', 'Berck', 'lengthen', 'die Berge', 2),
  sp('Korb', '🧺', 'Korp', 'Korbp', 'lengthen', 'die Körbe', 2),
  sp('Zug', '🚂', 'Zuk', 'Zugk', 'lengthen', 'die Züge', 2),
  sp('Decke', '🛌', 'Deke', 'Dekke', 'syllable', 'De-cke', 2),
  sp('Glocke', '🔔', 'Gloke', 'Glokke', 'syllable', 'Glo-cke', 2),
  sp('Katze', '🐱', 'Kaze', 'Kazze', 'syllable', 'Kat-ze', 2),
  sp('Mütze', '🧢', 'Müze', 'Müzze', 'syllable', 'Müt-ze', 2),
  // Level 3 (grade 4): ä/äu by deriving, ß after long vowels, stretching h (remember).
  sp('Bäume', '🌳', 'Beume', 'Boime', 'derive', 'der Baum', 3),
  sp('Häuser', '🏘️', 'Heuser', 'Hoiser', 'derive', 'das Haus', 3),
  sp('Hände', '👐', 'Hende', 'Hente', 'derive', 'die Hand', 3),
  sp('Fuß', '🦶', 'Fus', 'Fuss', 'lengthen', 'die Füße', 3),
  sp('Straße', '🛣️', 'Strase', 'Strasse', 'remember', 'Straße', 3),
  sp('Zahn', '🦷', 'Zan', 'Zaan', 'remember', 'Zahn', 3),
  sp('Uhr', '⌚', 'Ur', 'Uhrr', 'remember', 'Uhr', 3),
];

// ── Groß oder klein ──────────────────────────────────────────────────────────────────────
/** Nouns that must be capitalised (concrete, then abstract, then with endings) and other words. */
export const CAPITAL_NOUNS: readonly { word: string; level: 1 | 2 | 3 }[] = [
  ...['Hund', 'Baum', 'Schule', 'Garten', 'Fenster'].map((word) => ({ word, level: 1 as const })),
  ...['Freude', 'Mut', 'Angst', 'Glück', 'Ruhe'].map((word) => ({ word, level: 2 as const })),
  ...['Zeitung', 'Freiheit', 'Freundschaft', 'Sauberkeit', 'Hoffnung', 'Ergebnis'].map((word) => ({ word, level: 3 as const })),
];
export const LOWER_WORDS: readonly string[] = ['laufen', 'schön', 'leise', 'fröhlich', 'springen', 'mutig', 'schnell', 'denken', 'freundlich', 'hoffen'];

// ── Steigerung ───────────────────────────────────────────────────────────────────────────
export const ADJECTIVE_FORMS: readonly { base: string; comp: string; sup: string; regular: boolean }[] = [
  { base: 'klein', comp: 'kleiner', sup: 'am kleinsten', regular: true },
  { base: 'schnell', comp: 'schneller', sup: 'am schnellsten', regular: true },
  { base: 'laut', comp: 'lauter', sup: 'am lautesten', regular: true },
  { base: 'schön', comp: 'schöner', sup: 'am schönsten', regular: true },
  { base: 'leise', comp: 'leiser', sup: 'am leisesten', regular: true },
  { base: 'groß', comp: 'größer', sup: 'am größten', regular: false },
  { base: 'alt', comp: 'älter', sup: 'am ältesten', regular: false },
  { base: 'jung', comp: 'jünger', sup: 'am jüngsten', regular: false },
  { base: 'warm', comp: 'wärmer', sup: 'am wärmsten', regular: false },
  { base: 'lang', comp: 'länger', sup: 'am längsten', regular: false },
  { base: 'gut', comp: 'besser', sup: 'am besten', regular: false },
  { base: 'viel', comp: 'mehr', sup: 'am meisten', regular: false },
];

/** Wrong forms children build by the regular rule: guter, am gutesten, großer, am großesten. */
export function wrongComparison(a: { base: string; comp: string; sup: string }, ask: 'comp' | 'sup'): string[] {
  const right = a[ask];
  const forms = ask === 'comp' ? [`${a.base}er`, `${a.base}erer`, a.sup.replace('am ', '')] : [`am ${a.base}sten`, `am ${a.base}esten`, a.comp];
  return [...new Set(forms)].filter((f) => f !== right);
}

// ── Lesen: kurze Texte ───────────────────────────────────────────────────────────────────
export const TEXTS: readonly { id: string; text: string; question: string; answer: string; wrong: readonly [string, string] }[] = [
  {
    id: 'lena',
    text: 'Lena hat heute Geburtstag. Sie wird acht Jahre alt. Ihre Oma schenkt ihr ein rotes Fahrrad.',
    question: 'Was schenkt die Oma?',
    answer: 'ein Fahrrad',
    wrong: ['einen Ball', 'ein Buch'],
  },
  {
    id: 'tim',
    text: 'Tim geht mit seinem Hund in den Park. Dort trifft er seinen Freund Ali. Zusammen werfen sie Stöckchen.',
    question: 'Wen trifft Tim im Park?',
    answer: 'Ali',
    wrong: ['seine Oma', 'einen Lehrer'],
  },
  {
    id: 'rain',
    text: 'Am Morgen regnet es. Deshalb nimmt Paula ihren gelben Regenschirm mit. Am Nachmittag scheint die Sonne.',
    question: 'Warum nimmt Paula den Regenschirm mit?',
    answer: 'weil es regnet',
    wrong: ['weil die Sonne scheint', 'weil es schneit'],
  },
  {
    id: 'cake',
    text: 'Papa backt einen Apfelkuchen. Zuerst schneidet er die Äpfel. Dann rührt er den Teig.',
    question: 'Was macht Papa zuerst?',
    answer: 'Äpfel schneiden',
    wrong: ['den Teig rühren', 'den Kuchen essen'],
  },
  {
    id: 'hedgehog',
    text: 'Igel schlafen im Winter. Im Herbst fressen sie viel. Dann bauen sie sich ein Nest aus Blättern.',
    question: 'Woraus bauen Igel ihr Nest?',
    answer: 'aus Blättern',
    wrong: ['aus Steinen', 'aus Sand'],
  },
  {
    id: 'library',
    text: 'In der Bücherei leiht sich Jonas zwei Bücher aus. Eines handelt von Dinosauriern, das andere von Piraten.',
    question: 'Wie viele Bücher leiht Jonas aus?',
    answer: 'zwei',
    wrong: ['eins', 'drei'],
  },
  {
    id: 'garden',
    text: 'Im Frühling pflanzt Emma Sonnenblumen. Jeden Tag gießt sie die Blumen. Im Sommer sind sie größer als Emma.',
    question: 'Wann sind die Sonnenblumen größer als Emma?',
    answer: 'im Sommer',
    wrong: ['im Frühling', 'im Winter'],
  },
  {
    id: 'trip',
    text: 'Die Klasse 3b fährt mit dem Bus an die Nordsee. Am Strand suchen die Kinder Muscheln. Am Abend fahren sie zurück.',
    question: 'Womit fährt die Klasse an die Nordsee?',
    answer: 'mit dem Bus',
    wrong: ['mit dem Zug', 'mit dem Fahrrad'],
  },
];
