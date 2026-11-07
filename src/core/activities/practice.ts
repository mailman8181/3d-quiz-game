import { levelWindow } from '../challenges/selection';
import type { ChallengeType, SubjectId } from '../challenges/types';
import type { StageId } from '../learner/stage';

/**
 * "Rätselpfad" (ADR-0011): questions one after another along a path of stepping stones.
 * The chest flow holds each question's state; this file only has the rules.
 */

/** Questions per round (owner: Kita 5, Vorschule 6, school 8). */
export function practiceLength(stage: StageId | null): number {
  if (stage === 'kita') return 5;
  if (stage === null || stage === 'preschool') return 6;
  return 8;
}

/** The stone the animal goes to next: the first question not yet answered or skipped. */
export function nextStone(states: readonly string[]): number | null {
  const i = states.indexOf('closed');
  return i < 0 ? null : i;
}

export interface TopicGroup {
  subject: SubjectId;
  typeIds: string[];
}

/** Topics a child can pick: allowed by parents, fitting the stage, in the chosen subjects. */
export function practiceTopics(
  types: readonly ChallengeType[],
  disabled: readonly string[],
  stage: StageId | null,
  subjects: readonly SubjectId[],
): TopicGroup[] {
  return subjects
    .map((subject) => ({
      subject,
      typeIds: types.filter((t) => t.subject === subject && !disabled.includes(t.id) && levelWindow(t, stage) !== null).map((t) => t.id),
    }))
    .filter((g) => g.typeIds.length > 0);
}
