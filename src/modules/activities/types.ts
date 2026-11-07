import type { StageId } from '../../core/learner/stage';

/**
 * An activity: one way to find chests (ADR-0010). The screen lives in src/ui/activities/,
 * pure logic in src/core/activities/. The maze is the always-open activity "maze".
 */
export interface ActivityDef {
  id: string;
  /** Chests per round for a stage (3–5; fewer for Kita where the activity is small). */
  chests(stage: StageId | null): number;
  /** Lowest stage that can play it; missing = everyone. */
  minStage?: StageId;
  /** Open from the start, outside the random unlock order (ADR-0011, practice). */
  alwaysOpen?: boolean;
}
