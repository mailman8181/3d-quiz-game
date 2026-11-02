import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
import {
  ADJECTIVES,
  ARTICLES,
  COMPOUNDS,
  CONSONANT_GROUPS,
  END_SENTENCES,
  GAP_SENTENCES,
  GAP_WORDS,
  groupAt,
  NOUNS,
  PLURAL_NOUNS,
  RIDDLES,
  SENTENCE_MARKS,
  VERBS,
  VOWEL_GROUPS,
  WORD_TYPES,
  wrongPlurals,
  type WordType,
} from '../../../content/de/grammar';
import { arrange, clampLevel, quizChoices, type QuizData } from '../knowledge/common';

/**
 * Grade 1–2 German pack (roadmap M13d), KC Deutsch Ende Jg. 2 (docs/curriculum/
 * niedersachsen.md §4). Reading is part of these tasks; instructions are always spoken.
 */

const quiz = (
  typeId: string,
  level: number,
  data: QuizData,
  correctIndex: number,
  prompt: ChallengeInstance['prompt'],
  explanation: ChallengeInstance['explanation'],
  promptDisplay?: ChallengeInstance['prompt'],
): ChallengeInstance<QuizData> => ({
  typeId,
  level,
  data,
  choices: quizChoices(data.options),
  correctChoiceId: `c${correctIndex}`,
  prompt,
  ...(promptDisplay ? { promptDisplay } : {}),
  explanation,
});

/** "der, die oder das?" — picture + noun, three article buttons (KC: Nomen mit Artikel). */
export const germanArticle: ChallengeType<QuizData> = {
  id: 'german.article',
  subject: 'german',
  skills: ['german.grammar'],
  levels: 3,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.de2.wortarten'),
    lv('grade1', 'grade2', 'ni.de2.wortarten'),
    lv('grade1', 'grade2', 'ni.de2.wortarten'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    // Level 1: animals and things a child names every day (short words); later all nouns.
    const noun = rng.pick(NOUNS.filter((n) => l > 1 || n.word.length <= 5));
    const order = ['m', 'f', 'n'] as const;
    return quiz(
      'german.article',
      level,
      {
        picture: noun.emoji,
        text: noun.word,
        options: order.map((g) => ({ label: ARTICLES[g] })),
        labels: 'always',
        speakOptions: false,
      },
      order.indexOf(noun.gender),
      { key: 'german.article.prompt', params: { word: noun.word } },
      { key: 'german.article.explain', params: { word: noun.word } },
    );
  },
};


/** "Ein Hund, viele …?" — choose the plural (KC: numerische Nomenprobe, Einzahl/Mehrzahl). */
export const germanPlural: ChallengeType<QuizData> = {
  id: 'german.plural',
  subject: 'german',
  skills: ['german.grammar'],
  levels: 3,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.de2.wortarten'),
    lv('grade1', 'grade2', 'ni.de2.wortarten'),
    lv('grade2', 'grade2', 'ni.de2.wortarten'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    // Level 1: regular -en/-n plurals; level 3: umlaut plurals (Bälle, Häuser).
    const pool = PLURAL_NOUNS.filter((n) =>
      l === 1 ? /e?n$/.test(n.plural!) && !/[äöü]/i.test(n.plural!) : l === 3 ? /[äöüÄÖÜ]/.test(n.plural!) : true,
    );
    const noun = rng.pick(pool.length > 0 ? pool : PLURAL_NOUNS);
    const wrong = rng.shuffle(wrongPlurals(noun)).slice(0, l === 3 ? 3 : 2);
    const { options, correctIndex } = arrange(rng, noun.plural!, wrong);
    return quiz(
      'german.plural',
      level,
      {
        picture: `${noun.emoji}${noun.emoji}${noun.emoji}`,
        text: `${ARTICLES[noun.gender]} ${noun.word} – die …`,
        options: options.map((label) => ({ label })),
        labels: 'always',
        speakOptions: false,
      },
      correctIndex,
      { key: 'german.plural.prompt', params: { word: noun.word } },
      { key: 'german.plural.explain', params: { word: noun.word } },
    );
  },
};

/** "Tippe auf das Verb, das Tunwort!" — Nomen, Verb, Adjektiv (KC: Wortarten erkennen). */
export const germanWordType: ChallengeType<QuizData> = {
  id: 'german.word-type',
  subject: 'german',
  skills: ['german.grammar'],
  levels: 3,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.de2.wortarten'),
    lv('grade1', 'grade2', 'ni.de2.wortarten'),
    lv('grade2', 'grade2', 'ni.de2.wortarten'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const ask: WordType = l === 1 ? 'noun' : rng.pick(WORD_TYPES);
    const sample = (t: WordType) => (t === 'noun' ? rng.pick(NOUNS).word : t === 'verb' ? rng.pick(VERBS) : rng.pick(ADJECTIVES));
    // One word of each type; level 3 adds a second word of a wrong type.
    const words: { word: string; type: WordType }[] = WORD_TYPES.map((t) => ({ word: sample(t), type: t }));
    if (l === 3) {
      const extraType = rng.pick(WORD_TYPES.filter((t) => t !== ask));
      let extra = sample(extraType);
      while (words.some((w) => w.word === extra)) extra = sample(extraType);
      words.push({ word: extra, type: extraType });
    }
    const options = rng.shuffle(words);
    return quiz(
      'german.word-type',
      level,
      { options: options.map((w) => ({ label: w.word })), labels: 'always', speakOptions: true },
      options.findIndex((w) => w.type === ask),
      { key: 'german.word-type.prompt', params: { type: ask } },
      { key: 'german.word-type.explain', params: { type: ask, word: options.find((w) => w.type === ask)!.word } },
    );
  },
};

/** "Welche Buchstaben fehlen?" — Fi▢ + sch / ch / ck (KC: besondere Buchstabenfolgen). */
export const germanMissingLetters: ChallengeType<QuizData> = {
  id: 'german.missing-letters',
  subject: 'german',
  skills: ['german.spelling'],
  levels: 3,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.de2.rechtschreiben'),
    lv('grade1', 'grade2', 'ni.de2.rechtschreiben'),
    lv('grade2', 'grade2', 'ni.de2.rechtschreiben'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const gap = rng.pick(GAP_WORDS.filter((g) => (l === 1 ? g.vowel : l === 2 ? !g.vowel : true)));
    const family: readonly string[] = gap.vowel ? VOWEL_GROUPS : CONSONANT_GROUPS;
    const distractors = rng.shuffle(family.filter((g) => g !== gap.group)).slice(0, l === 3 ? 3 : 2);
    const { options, correctIndex } = arrange(rng, gap.group, distractors);
    const w = gap.word.word;
    return quiz(
      'german.missing-letters',
      level,
      {
        picture: gap.word.emoji,
        text: `${w.slice(0, gap.index)}${'▢'.repeat(gap.group.length)}${w.slice(gap.index + gap.group.length)}`,
        options: options.map((g) => ({ label: groupAt(g, gap.index) })),
        labels: 'always',
        speakOptions: false,
      },
      correctIndex,
      { key: 'german.missing-letters.prompt', params: { word: w } },
      { key: 'german.missing-letters.explain', params: { word: w } },
    );
  },
};

/** Read a riddle, tap the picture (KC Lesen: Sätze und kurze Texte sinnverstehend lesen). */
export const germanRiddle: ChallengeType<QuizData> = {
  id: 'german.riddle',
  subject: 'german',
  skills: ['german.reading'],
  levels: 3,
  levelInfo: [
    lv('grade1', 'grade2', 'ni.de2.lesen', 'ni.de2.lesen-saetze'),
    lv('grade1', 'grade2', 'ni.de2.lesen-saetze'),
    lv('grade2', 'grade2', 'ni.de2.lesen-saetze'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const riddle = rng.pick(RIDDLES);
    const answer = NOUNS.find((n) => n.word === riddle.answer)!;
    const others = rng.shuffle(NOUNS.filter((n) => n.id !== answer.id));
    const { options, correctIndex } = arrange(rng, answer, others.slice(0, l === 3 ? 3 : 2));
    return quiz(
      'german.riddle',
      level,
      { text: riddle.text, options: options.map((n) => ({ label: n.word, emoji: n.emoji })), labels: l === 1 ? 'always' : 'hint', speakOptions: false },
      correctIndex,
      { key: 'german.riddle.prompt' },
      { key: 'german.riddle.explain', params: { riddle: riddle.id } },
    );
  },
};

/** "Welches Wort passt in die Lücke?" (KC Lesen: Informationen auf Satzebene verknüpfen). */
export const germanFillWord: ChallengeType<QuizData> = {
  id: 'german.fill-word',
  subject: 'german',
  skills: ['german.reading'],
  levels: 2,
  levelInfo: [lv('grade1', 'grade2', 'ni.de2.lesen-saetze'), lv('grade1', 'grade2', 'ni.de2.lesen-saetze', 'ni.de2.wortarten')],
  generate({ rng, level }) {
    const sentence = rng.pick(GAP_SENTENCES);
    const { options, correctIndex } = arrange(rng, sentence.options[0], sentence.options.slice(1));
    return quiz(
      'german.fill-word',
      level,
      { text: sentence.text, options: options.map((label) => ({ label })), labels: 'always', speakOptions: level === 1 },
      correctIndex,
      { key: 'german.fill-word.prompt' },
      { key: 'german.fill-word.explain', params: { sentence: sentence.id } },
    );
  },
};

/** ". ? !" — which mark ends the sentence? (KC: Satzschlusszeichen). */
export const germanSentenceEnd: ChallengeType<QuizData> = {
  id: 'german.sentence-end',
  subject: 'german',
  skills: ['german.punctuation'],
  levels: 2,
  levelInfo: [lv('grade1', 'grade2', 'ni.de2.satzzeichen'), lv('grade2', 'grade2', 'ni.de2.satzzeichen')],
  generate({ rng, level }) {
    // Level 1: only "." or "?"; level 2 adds "!".
    const sentence = rng.pick(END_SENTENCES.filter((s) => level > 1 || s.mark !== '!'));
    return quiz(
      'german.sentence-end',
      level,
      { text: `${sentence.text} ▢`, options: SENTENCE_MARKS.map((m) => ({ label: m })), labels: 'always', speakOptions: false },
      SENTENCE_MARKS.indexOf(sentence.mark),
      { key: 'german.sentence-end.prompt' },
      { key: 'german.sentence-end.explain', params: { sentence: sentence.id } },
    );
  },
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** "Welcher Buchstabe kommt nach M?" → "Welches Wort kommt im ABC zuerst?" (KC: Alphabet). */
export const germanAbc: ChallengeType<QuizData> = {
  id: 'german.abc',
  subject: 'german',
  skills: ['german.alphabet'],
  levels: 3,
  levelInfo: [
    lv('grade1', 'grade1', 'ni.de2.alphabet'),
    lv('grade1', 'grade2', 'ni.de2.alphabet'),
    lv('grade2', 'grade2', 'ni.de2.alphabet', 'ni.de2.woerter-ordnen'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    if (l < 3) {
      const ask = l === 1 ? 'after' : rng.pick(['after', 'before'] as const);
      const i = ask === 'after' ? rng.int(0, 24) : rng.int(1, 25);
      const answer = LETTERS[ask === 'after' ? i + 1 : i - 1]!;
      const near = LETTERS.filter((x) => x !== answer && x !== LETTERS[i] && Math.abs(LETTERS.indexOf(x) - i) <= 3);
      const { options, correctIndex } = arrange(rng, answer, rng.shuffle(near).slice(0, 2));
      return quiz(
        'german.abc',
        level,
        { text: ask === 'after' ? `${LETTERS[i]} ▢` : `▢ ${LETTERS[i]}`, options: options.map((label) => ({ label })), labels: 'always', speakOptions: false },
        correctIndex,
        { key: `german.abc.prompt-${ask}`, params: { letter: LETTERS[i]! } },
        { key: `german.abc.explain-${ask}`, params: { letter: LETTERS[i]!, answer } },
      );
    }
    // Words with different first letters; the earliest comes first.
    const picked: typeof NOUNS[number][] = [];
    for (const n of rng.shuffle(NOUNS)) {
      if (picked.length >= 3) break;
      if (!picked.some((p) => p.word[0] === n.word[0])) picked.push(n);
    }
    const first = [...picked].sort((a, b) => a.word.localeCompare(b.word, 'de'))[0]!;
    return quiz(
      'german.abc',
      level,
      { options: picked.map((n) => ({ label: n.word })), labels: 'always', speakOptions: true },
      picked.indexOf(first),
      { key: 'german.abc.prompt-words' },
      { key: 'german.abc.explain-words', params: { word: first.word } },
    );
  },
};

/** "Schnee und Mann — welches Wort entsteht?" (KC: zusammengesetzte Nomen). */
export const germanCompound: ChallengeType<QuizData> = {
  id: 'german.compound',
  subject: 'german',
  skills: ['german.word-formation'],
  levels: 2,
  levelInfo: [lv('grade1', 'grade2', 'ni.de2.wortbildung'), lv('grade1', 'grade2', 'ni.de2.wortbildung')],
  generate({ rng, level }) {
    const compound = rng.pick(COMPOUNDS);
    const others = rng.shuffle(COMPOUNDS.filter((c) => c.id !== compound.id)).slice(0, level === 1 ? 2 : 3);
    const { options, correctIndex } = arrange(rng, compound, others);
    return quiz(
      'german.compound',
      level,
      {
        picture: `${compound.a.emoji} + ${compound.b.emoji}`,
        text: `${compound.a.word} + ${compound.b.word}`,
        options: options.map((c) => ({ label: c.word, emoji: c.emoji })),
        labels: 'hint',
        speakOptions: true,
      },
      correctIndex,
      { key: 'german.compound.prompt', params: { compound: compound.id } },
      { key: 'german.compound.explain', params: { compound: compound.id } },
    );
  },
};
