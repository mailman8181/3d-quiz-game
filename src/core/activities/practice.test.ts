import { describe, expect, it } from 'vitest';
import { lv, type ChallengeType, type LevelInfo, type SubjectId } from '../challenges/types';
import { nextStone, practiceLength, practiceTopics } from './practice';

const type = (id: string, subject: SubjectId, levelInfo: LevelInfo[]) =>
  ({ id, subject, skills: [], levels: levelInfo.length, levelInfo, generate: () => null }) as unknown as ChallengeType;
const types = [
  type('count', 'math', [lv('kita', 'grade1')]),
  type('times', 'math', [lv('grade2', undefined)]),
  type('rhyme', 'german', [lv('kita', 'grade1')]),
  type('read', 'german', [lv('grade1', 'grade2')]),
];

describe('Rätselpfad rules (ADR-0011)', () => {
  it('round length by stage: Kita 5, Vorschule 6, school 8', () => {
    expect(practiceLength('kita')).toBe(5);
    expect(practiceLength('preschool')).toBe(6);
    expect(practiceLength(null)).toBe(6);
    expect(practiceLength('grade2')).toBe(8);
  });

  it('the next stone is the first unanswered one; skipped ones never block the end', () => {
    expect(nextStone(['solved', 'closed', 'closed'])).toBe(1);
    expect(nextStone(['solved', 'skipped', 'closed'])).toBe(2);
    expect(nextStone(['solved', 'skipped', 'solved'])).toBeNull();
  });

  it('topics: only allowed, stage-fitting types in the chosen subjects; empty subjects drop out', () => {
    expect(practiceTopics(types, [], 'preschool', ['math', 'german'])).toEqual([
      { subject: 'math', typeIds: ['count'] },
      { subject: 'german', typeIds: ['rhyme'] },
    ]);
    expect(practiceTopics(types, ['rhyme'], 'preschool', ['math', 'german'])).toEqual([{ subject: 'math', typeIds: ['count'] }]);
    // Outgrown types (count ends at grade 1) are not offered any more.
    expect(practiceTopics(types, [], 'grade2', ['math'])).toEqual([{ subject: 'math', typeIds: ['times'] }]);
  });
});
