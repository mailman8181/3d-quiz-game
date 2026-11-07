import { describe, expect, it } from 'vitest';
import { createProfile } from '../../core/profile/profile';
import { alwaysOpenActivities, progressFor } from '.';

describe('activity registry', () => {
  const profile = createProfile({ id: 'k', name: '', avatar: { animal: 'cat', color: '#f6c453' }, now: 0 });

  it('the Rätselpfad is always open and never part of the unlock order', () => {
    expect(alwaysOpenActivities()).toEqual(['practice']);
    expect(progressFor(profile, null).unlocked).toEqual([]);
    expect(progressFor({ ...profile, mazesCompleted: 20 }, null).unlocked).not.toContain('practice');
  });

  it('practice rounds count towards unlocking the next game', () => {
    const base = { ...profile, mazesCompleted: 3 };
    expect(progressFor(base, null).unlocked).toHaveLength(1);
    expect(progressFor({ ...base, activityRounds: { practice: 3 } }, null).unlocked).toHaveLength(2);
  });
});
