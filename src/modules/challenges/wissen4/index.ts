import { type ChallengeInstance, type ChallengeType, lv, type LevelInfo } from '../../../core/challenges/types';
import type { QuizQuestion } from '../../../content/de/wissen';
import {
  DIRECTION_NAMES,
  DIRECTIONS,
  GERMANY_QUESTIONS,
  MAP_PLACES,
  PAST_QUESTIONS,
  SCIENCE_QUESTIONS,
  STATE_QUESTIONS,
  TOGETHER_QUESTIONS,
  type Direction,
} from '../../../content/de/wissen4';
import { arrange, clampLevel, quizChoices, type QuizData } from '../knowledge/common';

/**
 * Grades 3–4 "Wissen" (roadmap M15c), KC Sachunterricht Ende Jg. 4. Question banks share one
 * generator: level 1 = grade-3 questions (3 answers), level 2 = grade-4 questions (all answers).
 */
function questionBank(id: string, key: string, bank: readonly QuizQuestion[], levelInfo: LevelInfo[]): ChallengeType<QuizData> {
  return {
    id,
    subject: 'knowledge',
    skills: [id],
    levels: 2,
    levelInfo,
    generate({ rng, level }): ChallengeInstance<QuizData> {
      const l = clampLevel(level, 2);
      const pool = bank.filter((x) => x.level === l);
      const question = rng.pick(pool.length > 0 ? pool : bank);
      const { options, correctIndex } = arrange(rng, question.answer, question.distractors);
      return {
        typeId: id,
        level,
        data: { options: options.map((o) => ({ label: o.label, emoji: o.emoji })), labels: 'always', speakOptions: true },
        choices: quizChoices(options),
        correctChoiceId: `c${correctIndex}`,
        prompt: { key: `${key}.prompt`, params: { q: question.id } },
        explanation: { key: `${key}.explain`, params: { q: question.id } },
      };
    },
  };
}

export const knowledgeStates = questionBank('knowledge.states', 'knowledge.states', STATE_QUESTIONS, [
  lv('grade3', 'grade4', 'ni.su4.stoffe'),
  lv('grade4', undefined, 'ni.su4.stoffe'),
]);
export const knowledgeScience = questionBank('knowledge.science', 'knowledge.science', SCIENCE_QUESTIONS, [
  lv('grade3', 'grade4', 'ni.su4.natur', 'ni.su4.technik'),
  lv('grade4', undefined, 'ni.su4.natur', 'ni.su4.technik'),
]);
export const knowledgeGermany = questionBank('knowledge.germany', 'knowledge.germany', GERMANY_QUESTIONS, [
  lv('grade3', 'grade4', 'ni.su4.raum'),
  lv('grade4', undefined, 'ni.su4.raum'),
]);
export const knowledgePast = questionBank('knowledge.past', 'knowledge.past', PAST_QUESTIONS, [
  lv('grade3', 'grade4', 'ni.su4.zeit'),
  lv('grade4', undefined, 'ni.su4.zeit'),
]);
export const knowledgeTogether = questionBank('knowledge.together', 'knowledge.together', TOGETHER_QUESTIONS, [
  lv('grade3', 'grade4', 'ni.su4.gesellschaft'),
  lv('grade4', undefined, 'ni.su4.gesellschaft'),
]);

/** A small map around the school with a compass. */
export interface CompassData {
  /** Place id per direction. */
  places: Record<Direction, string>;
  ask: 'place' | 'direction';
  dir: Direction;
  options: { label: string; emoji?: string }[];
}

/** "Was liegt im Norden der Schule?" → "In welcher Himmelsrichtung liegt der Wald?" (KC SU Raum). */
export const knowledgeCompass: ChallengeType<CompassData> = {
  id: 'knowledge.compass',
  subject: 'knowledge',
  skills: ['knowledge.maps'],
  levels: 2,
  levelInfo: [lv('grade3', 'grade4', 'ni.su4.raum'), lv('grade3', undefined, 'ni.su4.raum')],
  generate({ rng, level }): ChallengeInstance<CompassData> {
    const l = clampLevel(level, 2);
    const chosen = rng.shuffle(MAP_PLACES).slice(0, 4);
    const places = Object.fromEntries(DIRECTIONS.map((d, i) => [d, chosen[i]!.id])) as Record<Direction, string>;
    const dir = rng.pick(DIRECTIONS);
    const place = MAP_PLACES.find((p) => p.id === places[dir])!;
    if (l === 1) {
      const { options, correctIndex } = arrange(
        rng,
        place,
        chosen.filter((p) => p.id !== place.id).slice(0, 2),
      );
      return {
        typeId: 'knowledge.compass',
        level,
        data: { places, ask: 'place', dir, options: options.map((p) => ({ label: p.name, emoji: p.emoji })) },
        choices: quizChoices(options),
        correctChoiceId: `c${correctIndex}`,
        prompt: { key: 'knowledge.compass.prompt-place', params: { dir } },
        explanation: { key: 'knowledge.compass.explain', params: { place: place.id, dir } },
      };
    }
    const options = [...DIRECTIONS];
    return {
      typeId: 'knowledge.compass',
      level,
      data: { places, ask: 'direction', dir, options: options.map((d) => ({ label: DIRECTION_NAMES[d].name })) },
      choices: quizChoices(options),
      correctChoiceId: `c${options.indexOf(dir)}`,
      prompt: { key: 'knowledge.compass.prompt-direction', params: { place: place.id } },
      explanation: { key: 'knowledge.compass.explain', params: { place: place.id, dir } },
    };
  },
};
