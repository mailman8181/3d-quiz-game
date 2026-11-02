/**
 * Content for the "Wissen" pack (roadmap M13e), following the KC Sachunterricht (Ende Jg. 2,
 * docs/curriculum/niedersachsen.md §5) and the Orientierungsplan (Natur und Lebenswelt).
 * German only; modules pick from these lists. Adding items: append, run the unit tests, then
 * `npm run audio:generate`.
 */

// ── Müll trennen (KC SU Technik: Wertstoffe unterscheiden) ──────────────────────────────
export interface Bin {
  id: string;
  name: string;
  emoji: string;
  /** "… gehört in die gelbe Tonne." */
  phrase: string;
}

/** Bin names as commonly used in Niedersachsen (colours differ a little between towns). */
export const BINS: readonly Bin[] = [
  { id: 'yellow', name: 'Gelbe Tonne', emoji: '🟨', phrase: 'in die gelbe Tonne' },
  { id: 'paper', name: 'Papiertonne', emoji: '🟦', phrase: 'in die Papiertonne' },
  { id: 'bio', name: 'Biotonne', emoji: '🟫', phrase: 'in die Biotonne' },
  { id: 'glass', name: 'Glascontainer', emoji: '🟩', phrase: 'in den Glascontainer' },
  { id: 'rest', name: 'Restmüll', emoji: '⬛', phrase: 'in den Restmüll' },
];

/** Bins used from level 1 on; glass and Restmüll come later. */
export const BASIC_BINS = ['yellow', 'paper', 'bio'] as const;

export interface WasteItem {
  id: string;
  /** With article, nominative: "die Bananenschale". */
  name: string;
  emoji: string;
  bin: string;
}

export const WASTE_ITEMS: readonly WasteItem[] = [
  { id: 'can', name: 'Die Dose', emoji: '🥫', bin: 'yellow' },
  { id: 'juice', name: 'Der Saftkarton', emoji: '🧃', bin: 'yellow' },
  { id: 'shampoo', name: 'Die Shampooflasche', emoji: '🧴', bin: 'yellow' },
  { id: 'newspaper', name: 'Die Zeitung', emoji: '📰', bin: 'paper' },
  { id: 'box', name: 'Der Karton', emoji: '📦', bin: 'paper' },
  { id: 'letter', name: 'Der Briefumschlag', emoji: '✉️', bin: 'paper' },
  { id: 'peel', name: 'Die Bananenschale', emoji: '🍌', bin: 'bio' },
  { id: 'leaves', name: 'Das welke Laub', emoji: '🍂', bin: 'bio' },
  { id: 'eggshell', name: 'Die Eierschale', emoji: '🥚', bin: 'bio' },
  { id: 'bottle', name: 'Die Glasflasche', emoji: '🍾', bin: 'glass' },
  { id: 'jar', name: 'Das Marmeladenglas', emoji: '🫙', bin: 'glass' },
  { id: 'toothbrush', name: 'Die alte Zahnbürste', emoji: '🪥', bin: 'rest' },
  { id: 'sponge', name: 'Der alte Schwamm', emoji: '🧽', bin: 'rest' },
];

// ── Berufe (KC SU Gesellschaft: typische Arbeitsstätten) ────────────────────────────────
export interface Job {
  id: string;
  /** Both forms, as the KC asks for gender-sensitive language: "Ärztin oder Arzt". */
  name: string;
  emoji: string;
  tool: { name: string; emoji: string };
  explain: string;
}

export const JOBS: readonly Job[] = [
  { id: 'fire', name: 'Feuerwehrfrau oder Feuerwehrmann', emoji: '🧑‍🚒', tool: { name: 'den Feuerlöscher', emoji: '🧯' }, explain: 'Den Feuerlöscher braucht die Feuerwehr.' },
  { id: 'doctor', name: 'Ärztin oder Arzt', emoji: '🧑‍⚕️', tool: { name: 'das Stethoskop', emoji: '🩺' }, explain: 'Das Stethoskop brauchen Ärztinnen und Ärzte.' },
  { id: 'cook', name: 'Köchin oder Koch', emoji: '🧑‍🍳', tool: { name: 'die Pfanne', emoji: '🍳' }, explain: 'Die Pfanne brauchen Köchinnen und Köche.' },
  { id: 'farmer', name: 'Bäuerin oder Bauer', emoji: '🧑‍🌾', tool: { name: 'den Traktor', emoji: '🚜' }, explain: 'Den Traktor brauchen Bäuerinnen und Bauern.' },
  { id: 'police', name: 'Polizistin oder Polizist', emoji: '👮', tool: { name: 'das Polizeiauto', emoji: '🚓' }, explain: 'Das Polizeiauto braucht die Polizei.' },
  { id: 'mechanic', name: 'Mechanikerin oder Mechaniker', emoji: '🧑‍🔧', tool: { name: 'den Schraubenschlüssel', emoji: '🔧' }, explain: 'Den Schraubenschlüssel brauchen Mechanikerinnen und Mechaniker.' },
  { id: 'teacher', name: 'Lehrerin oder Lehrer', emoji: '🧑‍🏫', tool: { name: 'den Rechenrahmen', emoji: '🧮' }, explain: 'Den Rechenrahmen brauchen Lehrerinnen und Lehrer in der Schule.' },
  { id: 'pilot', name: 'Pilotin oder Pilot', emoji: '🧑‍✈️', tool: { name: 'das Flugzeug', emoji: '✈️' }, explain: 'Das Flugzeug fliegen Pilotinnen und Piloten.' },
];

// ── Schwimmt oder sinkt? (KC SU unbelebte Natur: Eigenschaften von Stoffen) ─────────────
export interface FloatItem {
  id: string;
  /** With article: "der Stein". */
  name: string;
  emoji: string;
  floats: boolean;
}

export const FLOAT_ITEMS: readonly FloatItem[] = [
  { id: 'duck', name: 'die Gummiente', emoji: '🦆', floats: true },
  { id: 'leaf', name: 'das Blatt', emoji: '🍃', floats: true },
  { id: 'wood', name: 'das Stück Holz', emoji: '🪵', floats: true },
  { id: 'ball', name: 'der Ball', emoji: '⚽', floats: true },
  { id: 'feather', name: 'die Feder', emoji: '🪶', floats: true },
  { id: 'stone', name: 'der Stein', emoji: '🪨', floats: false },
  { id: 'key', name: 'der Schlüssel', emoji: '🔑', floats: false },
  { id: 'coin', name: 'die Münze', emoji: '🪙', floats: false },
  { id: 'screw', name: 'die Schraube', emoji: '🔩', floats: false },
  { id: 'anchor', name: 'der Anker', emoji: '⚓', floats: false },
];

// ── Sicher unterwegs (KC SU Raum: Wege, Mobilität/Schulweg) ─────────────────────────────
export interface QuizQuestion {
  id: string;
  question: string;
  answer: { label: string; emoji: string };
  distractors: readonly { label: string; emoji: string }[];
  explain: string;
  level: 1 | 2 | 3;
}

export const TRAFFIC_QUESTIONS: readonly QuizQuestion[] = [
  {
    id: 'red',
    question: 'Die Fußgängerampel ist rot. Was machst du?',
    answer: { label: 'stehen bleiben', emoji: '🧍' },
    distractors: [{ label: 'schnell rennen', emoji: '🏃' }, { label: 'auf die Straße hüpfen', emoji: '🤸' }],
    explain: 'Bei Rot bleibst du stehen und wartest.',
    level: 1,
  },
  {
    id: 'green',
    question: 'Bei welcher Ampelfarbe darfst du über die Straße gehen?',
    answer: { label: 'Grün', emoji: '🟢' },
    distractors: [{ label: 'Rot', emoji: '🔴' }, { label: 'Gelb', emoji: '🟡' }],
    explain: 'Bei Grün darfst du gehen. Schau trotzdem nach links und rechts.',
    level: 1,
  },
  {
    id: 'helmet',
    question: 'Was setzt du beim Fahrradfahren auf?',
    answer: { label: 'einen Helm', emoji: '⛑️' },
    distractors: [{ label: 'eine Krone', emoji: '👑' }, { label: 'eine Mütze', emoji: '🧢' }],
    explain: 'Beim Fahrradfahren schützt dich ein Helm.',
    level: 1,
  },
  {
    id: 'look',
    question: 'Bevor du über die Straße gehst, schaust du …',
    answer: { label: 'nach links und rechts', emoji: '👀' },
    distractors: [{ label: 'nach oben in den Himmel', emoji: '☁️' }, { label: 'auf dein Spielzeug', emoji: '🧸' }],
    explain: 'Du schaust nach links, nach rechts und noch einmal nach links.',
    level: 2,
  },
  {
    id: 'dark',
    question: 'Was macht dich im Dunkeln für Autos gut sichtbar?',
    answer: { label: 'eine Warnweste', emoji: '🦺' },
    distractors: [{ label: 'eine Sonnenbrille', emoji: '🕶️' }, { label: 'ein dunkler Mantel', emoji: '🧥' }],
    explain: 'Eine Warnweste und Reflektoren leuchten im Licht der Autos.',
    level: 2,
  },
  {
    id: 'crossing',
    question: 'Wo gehst du am sichersten über die Straße?',
    answer: { label: 'am Zebrastreifen oder an der Ampel', emoji: '🚦' },
    distractors: [{ label: 'zwischen parkenden Autos', emoji: '🚗' }, { label: 'hinter einer Kurve', emoji: '↩️' }],
    explain: 'Am sichersten gehst du am Zebrastreifen oder an der Ampel über die Straße.',
    level: 2,
  },
  {
    id: 'seat',
    question: 'Was machst du zuerst, wenn du im Auto sitzt?',
    answer: { label: 'mich anschnallen', emoji: '🔒' },
    distractors: [{ label: 'das Fenster öffnen', emoji: '🪟' }, { label: 'ein Buch lesen', emoji: '📖' }],
    explain: 'Im Auto schnallst du dich zuerst an.',
    level: 3,
  },
  {
    id: 'ball',
    question: 'Dein Ball rollt auf die Straße. Was machst du?',
    answer: { label: 'einen Erwachsenen fragen', emoji: '🙋' },
    distractors: [{ label: 'sofort hinterherrennen', emoji: '🏃' }, { label: 'die Augen zumachen', emoji: '🙈' }],
    explain: 'Renn nie hinter einem Ball auf die Straße. Frag einen Erwachsenen.',
    level: 3,
  },
];

// ── Gefühle (KC SU Gesellschaft: Gefühle benennen und beschreiben) ───────────────────────
export interface Feeling {
  id: string;
  word: string;
  emoji: string;
}

export const FEELINGS: readonly Feeling[] = [
  { id: 'happy', word: 'fröhlich', emoji: '😄' },
  { id: 'sad', word: 'traurig', emoji: '😢' },
  { id: 'angry', word: 'wütend', emoji: '😠' },
  { id: 'scared', word: 'ängstlich', emoji: '😨' },
  { id: 'surprised', word: 'überrascht', emoji: '😲' },
  { id: 'tired', word: 'müde', emoji: '😴' },
];

/**
 * Everyday situations (level 2+). Neutral, no blame; every feeling is okay
 * (explanations say so). Owner review requested in the PR.
 */
export const FEELING_SITUATIONS: readonly { id: string; text: string; feeling: string }[] = [
  { id: 'icecream', text: 'Mia hat ihr Eis fallen lassen.', feeling: 'sad' },
  { id: 'birthday', text: 'Ben bekommt zum Geburtstag einen Hund.', feeling: 'happy' },
  { id: 'tower', text: 'Jemand hat Leas Turm umgeworfen.', feeling: 'angry' },
  { id: 'thunder', text: 'Draußen donnert es ganz laut.', feeling: 'scared' },
  { id: 'gift', text: 'Tim öffnet die Tür und alle rufen: Überraschung!', feeling: 'surprised' },
  { id: 'evening', text: 'Ella hat den ganzen Tag gespielt. Jetzt ist es Abend.', feeling: 'tired' },
  { id: 'friend', text: 'Nele spielt mit ihrer besten Freundin.', feeling: 'happy' },
  { id: 'lost', text: 'Paul kann seinen Teddy nicht finden.', feeling: 'sad' },
];

// ── Tage und Monate (KC SU Zeit: Zeiteinteilung) ────────────────────────────────────────
export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] as const;
export const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
] as const;
