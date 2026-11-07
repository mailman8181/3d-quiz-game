import { activityProgress, type ActivityProgress } from '../../core/progress/activities';
import { stageRank, type StageId } from '../../core/learner/stage';
import type { Profile } from '../../core/profile/profile';
import { jumpActivity } from './jump';
import { memoryActivity } from './memory';
import type { ActivityDef } from './types';

/**
 * Registry of activities besides the maze (ADR-0010). Add one: follow the skill
 * `.claude/skills/add-activity/`, then list it here. Unlocking is automatic.
 */
export const activities: readonly ActivityDef[] = [memoryActivity, jumpActivity];

export function getActivity(id: string): ActivityDef {
  const a = activities.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown activity: ${id}`);
  return a;
}

/** Which activities this child can play and how far the next one is. */
export function progressFor(profile: Profile, stage: StageId | null, extraMazes = 0): ActivityProgress {
  const playable = activities.filter((a) => !a.minStage || stage === null || stageRank(stage) >= stageRank(a.minStage));
  return activityProgress({
    ids: playable.map((a) => a.id),
    profileId: profile.id,
    mazesCompleted: profile.mazesCompleted + extraMazes,
    activityRounds: profile.activityRounds ?? {},
  });
}
