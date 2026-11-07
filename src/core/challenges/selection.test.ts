import { describe, expect, it } from 'vitest';
import { levelWindow, selectChallengeTypes } from './selection';
import { lv, type ChallengeType, type LevelInfo, type SubjectId } from './types';

const type = (id: string, subject: SubjectId, levelInfo: LevelInfo[]) =>
  ({ id, subject, skills: [], levels: levelInfo.length, levelInfo, generate: () => null }) as unknown as ChallengeType;

// kita–preschool, preschool–grade1, grade1–grade2, grade2+
const count = type('count', 'math', [lv('kita', 'preschool'), lv('preschool', 'grade1'), lv('grade1', 'grade2'), lv('grade2', undefined)]);
const reading = type('read', 'german', [lv('grade1', 'grade1'), lv('grade1', 'grade2')]);
const colors = type('colors', 'knowledge', [lv('kita', 'preschool'), lv('kita', 'grade1')]);

describe('levelWindow', () => {
  it('starts at the highest level meant for the stage, allows one stage of stretch', () => {
    expect(levelWindow(count, 'kita')).toEqual({ startLevel: 1, maxLevel: 2 });
    expect(levelWindow(count, 'preschool')).toEqual({ startLevel: 2, maxLevel: 3 });
    expect(levelWindow(count, 'grade1')).toEqual({ startLevel: 3, maxLevel: 4 });
    expect(levelWindow(count, 'grade4')).toEqual({ startLevel: 4, maxLevel: 4 });
  });

  it('drops types that are too hard (level 1 is for a later stage)', () => {
    expect(levelWindow(reading, 'preschool')).toBeNull();
    expect(levelWindow(reading, 'grade1')).toEqual({ startLevel: 2, maxLevel: 2 });
  });

  it('drops types the child has outgrown', () => {
    expect(levelWindow(colors, 'grade1')).toEqual({ startLevel: 2, maxLevel: 2 });
    expect(levelWindow(colors, 'grade2')).toBeNull();
  });

  it('without a stage allows everything, starting at level 1', () => {
    expect(levelWindow(reading, null)).toEqual({ startLevel: 1, maxLevel: 2 });
  });
});

describe('selectChallengeTypes', () => {
  const types = [count, reading, colors];
  const all: SubjectId[] = ['math', 'german', 'knowledge'];

  it('filters by parents, session subjects and stage', () => {
    const ids = (r: ReturnType<typeof selectChallengeTypes>) => r.map((s) => s.type.id);
    expect(ids(selectChallengeTypes({ types, disabled: [], subjects: all, stage: 'preschool' }))).toEqual(['count', 'colors']);
    expect(ids(selectChallengeTypes({ types, disabled: ['count'], subjects: all, stage: 'grade1' }))).toEqual(['read', 'colors']);
    expect(ids(selectChallengeTypes({ types, disabled: [], subjects: ['german'], stage: 'grade1' }))).toEqual(['read']);
  });

  it('never returns nothing: falls back to the stage filter, then to everything', () => {
    const ids = (r: ReturnType<typeof selectChallengeTypes>) => r.map((s) => s.type.id);
    expect(ids(selectChallengeTypes({ types, disabled: [], subjects: ['german'], stage: 'kita' }))).toEqual(['count', 'colors']);
    expect(ids(selectChallengeTypes({ types: [reading], disabled: [], subjects: all, stage: 'kita' }))).toEqual(['read']);
  });

  it('practice topics narrow the selection; unusable topics fall back (ADR-0011)', () => {
    const ids = (r: ReturnType<typeof selectChallengeTypes>) => r.map((s) => s.type.id);
    expect(ids(selectChallengeTypes({ types, disabled: [], subjects: all, stage: 'grade1', topics: ['read'] }))).toEqual(['read']);
    // Disabled by parents → ignored, normal selection.
    expect(ids(selectChallengeTypes({ types, disabled: ['read'], subjects: all, stage: 'grade1', topics: ['read'] }))).toEqual(['count', 'colors']);
  });

  it('?challenge= forces one type regardless of filters', () => {
    const r = selectChallengeTypes({ types, disabled: ['read'], subjects: ['math'], stage: 'kita', only: 'read' });
    expect(r.map((s) => s.type.id)).toEqual(['read']);
  });
});
