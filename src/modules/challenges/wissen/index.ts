import { type ChallengeInstance, type ChallengeType, lv } from '../../../core/challenges/types';
import {
  BASIC_BINS,
  BINS,
  FEELING_SITUATIONS,
  FEELINGS,
  FLOAT_ITEMS,
  JOBS,
  MONTHS,
  TRAFFIC_QUESTIONS,
  WASTE_ITEMS,
  WEEKDAYS,
} from '../../../content/de/wissen';
import { BIKE_QUESTIONS } from '../../../content/de/wissen4';
import { arrange, clampLevel, quizChoices, type QuizData } from '../knowledge/common';

/**
 * "Wissen" pack (roadmap M13e): KC Sachunterricht, Ende Jg. 2 (docs/curriculum/niedersachsen.md §5).
 * All use the shared quiz view; answer cards can be heard (🔊) so pre-readers can play.
 */

const quiz = (
  typeId: string,
  level: number,
  data: QuizData,
  correctIndex: number,
  prompt: ChallengeInstance['prompt'],
  explanation: ChallengeInstance['explanation'],
): ChallengeInstance<QuizData> => ({
  typeId,
  level,
  data,
  choices: quizChoices(data.options),
  correctChoiceId: `c${correctIndex}`,
  prompt,
  explanation,
});

/** "In welche Tonne gehört das?" (KC SU Technik: Wertstoffe unterscheiden, Recycling). */
export const knowledgeRecycling: ChallengeType<QuizData> = {
  id: 'knowledge.recycling',
  subject: 'knowledge',
  skills: ['knowledge.environment'],
  levels: 3,
  levelInfo: [
    lv('preschool', 'grade1', 'ni.su2.wertstoffe'),
    lv('preschool', 'grade2', 'ni.su2.wertstoffe'),
    lv('grade1', 'grade2', 'ni.su2.wertstoffe'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const basic = (id: string) => (BASIC_BINS as readonly string[]).includes(id);
    const bins = BINS.filter((b) => l === 3 || (l === 2 ? b.id !== 'rest' : basic(b.id)));
    const item = rng.pick(WASTE_ITEMS.filter((w) => bins.some((b) => b.id === w.bin)));
    const home = bins.find((b) => b.id === item.bin)!;
    const { options, correctIndex } = arrange(rng, home, rng.shuffle(bins.filter((b) => b.id !== home.id)).slice(0, l === 3 ? 3 : 2));
    return quiz(
      'knowledge.recycling',
      level,
      { picture: item.emoji, options: options.map((b) => ({ label: b.name, emoji: b.emoji })), labels: 'always', speakOptions: true },
      correctIndex,
      { key: 'knowledge.recycling.prompt', params: { item: item.id } },
      { key: 'knowledge.recycling.explain', params: { item: item.id } },
    );
  },
};

/** "Wer braucht das bei der Arbeit?" (KC SU Gesellschaft: Arbeitsstätten). */
export const knowledgeJobs: ChallengeType<QuizData> = {
  id: 'knowledge.jobs',
  subject: 'knowledge',
  skills: ['knowledge.society'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.su2.arbeit'),
    lv('preschool', 'grade1', 'ni.su2.arbeit'),
    lv('preschool', 'grade2', 'ni.su2.arbeit'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const job = rng.pick(JOBS);
    const { options, correctIndex } = arrange(rng, job, rng.shuffle(JOBS.filter((j) => j.id !== job.id)).slice(0, l === 3 ? 3 : 2));
    return quiz(
      'knowledge.jobs',
      level,
      { picture: job.tool.emoji, options: options.map((j) => ({ label: j.name, emoji: j.emoji })), labels: l === 1 ? 'hint' : 'always', speakOptions: true },
      correctIndex,
      { key: 'knowledge.jobs.prompt' },
      { key: 'knowledge.jobs.explain', params: { job: job.id } },
    );
  },
};

/** "Tippe auf das, was im Wasser schwimmt!" (KC SU: Eigenschaften von Stoffen; OP Natur). */
export const knowledgeFloat: ChallengeType<QuizData> = {
  id: 'knowledge.float',
  subject: 'knowledge',
  skills: ['knowledge.nature'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.op.natur', 'ni.su2.stoffe'),
    lv('kita', 'grade1', 'ni.su2.stoffe'),
    lv('preschool', 'grade2', 'ni.su2.stoffe'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const ask = l === 1 ? 'floats' : rng.pick(['floats', 'sinks'] as const);
    const wantFloat = ask === 'floats';
    const target = rng.pick(FLOAT_ITEMS.filter((i) => i.floats === wantFloat));
    const others = rng.shuffle(FLOAT_ITEMS.filter((i) => i.floats !== wantFloat)).slice(0, l === 3 ? 3 : 2);
    const { options, correctIndex } = arrange(rng, target, others);
    return quiz(
      'knowledge.float',
      level,
      { options: options.map((i) => ({ label: i.name, emoji: i.emoji })), labels: 'hint', speakOptions: true },
      correctIndex,
      { key: `knowledge.float.prompt-${ask}` },
      { key: `knowledge.float.explain-${ask}`, params: { item: target.id } },
    );
  },
};

/** "Die Ampel ist rot. Was machst du?" (KC SU Raum: Wege, Mobilität/Schulweg). */
export const knowledgeTraffic: ChallengeType<QuizData> = {
  id: 'knowledge.traffic',
  subject: 'knowledge',
  skills: ['knowledge.safety'],
  levels: 4,
  levelInfo: [
    lv('preschool', 'grade1', 'ni.su2.schulweg'),
    lv('preschool', 'grade2', 'ni.su2.schulweg'),
    lv('grade1', 'grade2', 'ni.su2.schulweg'),
    // M15c (grades 3–4): bike safety and traffic rules (Radfahrausbildung).
    lv('grade3', undefined, 'ni.su4.mobilitaet'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 4);
    const q = l === 4 ? rng.pick(BIKE_QUESTIONS) : rng.pick(TRAFFIC_QUESTIONS.filter((x) => x.level === l));
    const { options, correctIndex } = arrange(rng, q.answer, q.distractors);
    return quiz(
      'knowledge.traffic',
      level,
      { options: options.map((o) => ({ label: o.label, emoji: o.emoji })), labels: 'always', speakOptions: true },
      correctIndex,
      { key: 'knowledge.traffic.prompt', params: { q: q.id } },
      { key: 'knowledge.traffic.explain', params: { q: q.id } },
    );
  },
};

/** "Wie fühlt sich das Kind?" — faces, then situations (KC SU Gesellschaft: Gefühle benennen). */
export const knowledgeFeelings: ChallengeType<QuizData> = {
  id: 'knowledge.feelings',
  subject: 'knowledge',
  skills: ['knowledge.feelings'],
  levels: 3,
  levelInfo: [
    lv('kita', 'preschool', 'ni.su2.gefuehle'),
    lv('preschool', 'grade1', 'ni.su2.gefuehle'),
    lv('preschool', 'grade2', 'ni.su2.gefuehle'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    if (l === 1) {
      const feeling = rng.pick(FEELINGS);
      const { options, correctIndex } = arrange(rng, feeling, rng.shuffle(FEELINGS.filter((f) => f.id !== feeling.id)).slice(0, 2));
      return quiz(
        'knowledge.feelings',
        level,
        { picture: feeling.emoji, options: options.map((f) => ({ label: f.word })), labels: 'always', speakOptions: true },
        correctIndex,
        { key: 'knowledge.feelings.prompt-face' },
        { key: 'knowledge.feelings.explain-face', params: { feeling: feeling.id } },
      );
    }
    // Situation → face cards (level 2: 3 faces, level 3: 4 faces).
    const situation = rng.pick(FEELING_SITUATIONS);
    const feeling = FEELINGS.find((f) => f.id === situation.feeling)!;
    const { options, correctIndex } = arrange(
      rng,
      feeling,
      rng.shuffle(FEELINGS.filter((f) => f.id !== feeling.id)).slice(0, l === 3 ? 3 : 2),
    );
    return quiz(
      'knowledge.feelings',
      level,
      { text: situation.text, options: options.map((f) => ({ label: f.word, emoji: f.emoji })), labels: 'hint', speakOptions: true },
      correctIndex,
      { key: 'knowledge.feelings.prompt-situation', params: { situation: situation.id } },
      { key: 'knowledge.feelings.explain-situation', params: { situation: situation.id } },
    );
  },
};

/** "Welcher Tag kommt nach Montag?" → months (KC SU Zeit: Zeiteinteilung; OP Wochentage). */
export const knowledgeCalendar: ChallengeType<QuizData> = {
  id: 'knowledge.calendar',
  subject: 'knowledge',
  skills: ['knowledge.time'],
  levels: 3,
  levelInfo: [
    lv('preschool', 'grade1', 'ni.op.zeit', 'ni.su2.zeiteinteilung'),
    lv('grade1', 'grade2', 'ni.su2.zeiteinteilung'),
    lv('grade1', 'grade2', 'ni.su2.zeiteinteilung'),
  ],
  generate({ rng, level }) {
    const l = clampLevel(level, 3);
    const list: readonly string[] = l === 3 ? MONTHS : WEEKDAYS;
    const kind = l === 3 ? 'month' : 'day';
    const ask = l === 1 ? 'after' : rng.pick(['after', 'before'] as const);
    // Cyclic: after Sonntag comes Montag, before Januar comes Dezember.
    const i = rng.int(0, list.length - 1);
    const j = (i + (ask === 'after' ? 1 : -1) + list.length) % list.length;
    const answer = list[j]!;
    const distractors = rng
      .shuffle(list.filter((x) => x !== answer && x !== list[i]))
      .slice(0, 2);
    const { options, correctIndex } = arrange(rng, answer, distractors);
    return quiz(
      'knowledge.calendar',
      level,
      { text: list[i]!, options: options.map((label) => ({ label })), labels: 'always', speakOptions: true },
      correctIndex,
      { key: `knowledge.calendar.prompt-${kind}-${ask}`, params: { name: list[i]! } },
      { key: `knowledge.calendar.explain-${ask}`, params: { name: list[i]!, answer } },
    );
  },
};
