import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
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
  wrongComparison,
  wrongPast,
  type Tense,
} from '../../../content/de/grammar4';
import { arrange, clampLevel, quizChoices, type QuizData } from '../knowledge/common';

/**
 * Grades 3–4 German (roadmap M15b), KC Deutsch Ende Jg. 4. All on the shared quiz cards.
 * Reading is part of these tasks; the instruction is always spoken.
 */
const quiz = (
  typeId: string,
  level: number,
  data: QuizData,
  correctIndex: number,
  prompt: ChallengeInstance['prompt'],
  explanation: ChallengeInstance['explanation'],
): ChallengeInstance<QuizData> => ({ typeId, level, data, choices: quizChoices(data.options), correctChoiceId: `c${correctIndex}`, prompt, explanation });

const cards = (labels: readonly string[], speak = false): Pick<QuizData, 'options' | 'labels' | 'speakOptions'> => ({
  options: labels.map((label) => ({ label })),
  labels: 'always',
  speakOptions: speak,
});

/** "In welcher Zeit steht der Satz?" → "Gestern … ich." (Präteritum) → Perfekt or Präteritum? */
export const germanTense: ChallengeType<QuizData> = {
  id: 'german.tense',
  subject: 'german',
  skills: ['german.grammar'],
  levels: 3,
  levelInfo: [lv('grade3', 'grade3', 'ni.de4.zeitformen'), lv('grade3', 'grade4', 'ni.de4.zeitformen'), lv('grade4', undefined, 'ni.de4.zeitformen')],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const verb = rng.pick(l === 2 ? VERBS4 : VERBS4.filter((x) => x.regular || l === 3));
    if (l === 2) {
      const { options, correctIndex } = arrange(rng, verb.past, rng.shuffle(wrongPast(verb)).slice(0, 2));
      return quiz(
        'german.tense',
        level,
        { text: `Heute ${verb.present} ich. Gestern ___ ich.`, ...cards(options) },
        correctIndex,
        { key: 'german.tense.prompt-past' },
        { key: 'german.tense.explain-past', params: { verb: verb.inf } },
      );
    }
    // Level 1: Gegenwart / Vergangenheit / Zukunft; level 3: the grammar terms.
    const pool: readonly Tense[] = l === 1 ? ['present', 'past', 'future'] : TENSES;
    const tense = rng.pick(pool);
    const name = (t: Tense) => (l === 1 ? TENSE_NAMES[t].simple : TENSE_NAMES[t].term);
    const options = l === 1 ? ['present', 'past', 'future'] : rng.shuffle([...TENSES]);
    return quiz(
      'german.tense',
      level,
      { text: tenseSentence(verb, tense), ...cards(options.map((t) => name(t as Tense)), true) },
      options.indexOf(tense),
      { key: 'german.tense.prompt-which' },
      { key: `german.tense.explain-${l === 1 ? 'simple' : 'term'}`, params: { verb: verb.inf, tense } },
    );
  },
};

/** Tap the predicate ("Was tut …?"), then the subject ("Wer oder was …?"). */
export const germanSentenceParts: ChallengeType<QuizData> = {
  id: 'german.sentence-parts',
  subject: 'german',
  skills: ['german.grammar'],
  levels: 3,
  levelInfo: [lv('grade3', 'grade3', 'ni.de4.satzglieder'), lv('grade3', 'grade4', 'ni.de4.satzglieder'), lv('grade4', undefined, 'ni.de4.satzglieder')],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    // Level 3: sentences where the subject is not first ("Heute backt Papa …").
    const sentence = rng.pick(PART_SENTENCES.filter((s) => (l === 3 ? s.subject !== 0 : l === 1 ? s.subject === 0 : true)));
    const ask = l === 1 ? 'predicate' : rng.pick(['predicate', 'subject'] as const);
    const index = ask === 'subject' ? sentence.subject : sentence.predicate;
    return quiz(
      'german.sentence-parts',
      level,
      { text: sentence.parts.join(' '), ...cards(sentence.parts.map((p) => p.replace(/\.$/, ''))) },
      index,
      { key: `german.sentence-parts.prompt-${ask}` },
      { key: `german.sentence-parts.explain-${ask}`, params: { sentence: sentence.id } },
    );
  },
};

/** "Welches Wort gehört zur Wortfamilie fahren?" — look-alikes as distractors. */
export const germanWordFamily: ChallengeType<QuizData> = {
  id: 'german.word-family',
  subject: 'german',
  skills: ['german.word-formation'],
  levels: 2,
  levelInfo: [lv('grade3', 'grade4', 'ni.de4.wortfamilien'), lv('grade3', undefined, 'ni.de4.wortfamilien')],
  generate({ rng, level }) {
    const family = rng.pick(FAMILIES);
    const member = rng.pick(family.members);
    const { options, correctIndex } = arrange(rng, member, rng.shuffle(family.lookAlikes).slice(0, level === 1 ? 2 : 3));
    return quiz(
      'german.word-family',
      level,
      { text: family.stem, ...cards(options, true) },
      correctIndex,
      { key: 'german.word-family.prompt', params: { family: family.id } },
      { key: 'german.word-family.explain', params: { family: family.id, word: member } },
    );
  },
};

/** "Welches Wort ist richtig geschrieben?" — with the strategy in the explanation. */
export const germanSpelling: ChallengeType<QuizData> = {
  id: 'german.spelling',
  subject: 'german',
  skills: ['german.spelling'],
  levels: 3,
  levelInfo: [
    lv('grade2', 'grade3', 'ni.de2.rechtschreiben', 'ni.de4.rechtschreibstrategien'),
    lv('grade3', 'grade4', 'ni.de4.rechtschreibstrategien'),
    lv('grade4', undefined, 'ni.de4.rechtschreibstrategien'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const item = rng.pick(SPELLING.filter((s) => s.level === l));
    const { options, correctIndex } = arrange(rng, item.word, item.wrong);
    return quiz(
      'german.spelling',
      level,
      { picture: item.emoji, ...cards(options) },
      correctIndex,
      { key: 'german.spelling.prompt', params: { word: item.word } },
      { key: 'german.spelling.explain', params: { word: item.word } },
    );
  },
};

/** "Welches Wort schreibt man groß?" — words shown in small letters; nouns incl. abstract ones. */
export const germanCapital: ChallengeType<QuizData> = {
  id: 'german.capital',
  subject: 'german',
  skills: ['german.spelling'],
  levels: 3,
  levelInfo: [
    lv('grade2', 'grade3', 'ni.de2.rechtschreiben'),
    lv('grade3', 'grade4', 'ni.de4.grossschreibung'),
    lv('grade4', undefined, 'ni.de4.grossschreibung'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const noun = rng.pick(CAPITAL_NOUNS.filter((n) => n.level === l));
    const { options, correctIndex } = arrange(rng, noun.word, rng.shuffle(LOWER_WORDS).slice(0, l === 1 ? 2 : 3));
    return quiz(
      'german.capital',
      level,
      { ...cards(options.map((w) => w.toLowerCase()), true) },
      correctIndex,
      { key: 'german.capital.prompt' },
      { key: 'german.capital.explain', params: { word: noun.word } },
    );
  },
};

/** "groß – größer – ?" — wrong forms by the regular rule (am großesten, guter). */
export const germanComparison: ChallengeType<QuizData> = {
  id: 'german.comparison',
  subject: 'german',
  skills: ['german.grammar'],
  levels: 2,
  levelInfo: [lv('grade3', 'grade3', 'ni.de4.wortarten'), lv('grade3', undefined, 'ni.de4.wortarten')],
  generate({ rng, level }) {
    const adj = rng.pick(ADJECTIVE_FORMS.filter((a) => (level === 1 ? a.regular : true)));
    const ask = rng.pick(['comp', 'sup'] as const);
    const { options, correctIndex } = arrange(rng, adj[ask], wrongComparison(adj, ask).slice(0, 2));
    return quiz(
      'german.comparison',
      level,
      { text: ask === 'comp' ? `${adj.base} – ___ – ${adj.sup}` : `${adj.base} – ${adj.comp} – ___`, ...cards(options) },
      correctIndex,
      { key: 'german.comparison.prompt' },
      { key: 'german.comparison.explain', params: { adj: adj.base } },
    );
  },
};

/** A short text and a question (KC Lesen: Informationen auf Textebene verknüpfen). */
export const germanReading: ChallengeType<QuizData> = {
  id: 'german.reading',
  subject: 'german',
  skills: ['german.reading'],
  levels: 1,
  levelInfo: [lv('grade3', undefined, 'ni.de4.lesen')],
  generate({ rng, level }) {
    const t = rng.pick(TEXTS);
    const { options, correctIndex } = arrange(rng, t.answer, t.wrong);
    return quiz(
      'german.reading',
      level,
      { text: `${t.text}\n\n${t.question}`, ...cards(options) },
      correctIndex,
      { key: 'german.reading.prompt' },
      { key: 'german.reading.explain', params: { text: t.id } },
    );
  },
};
