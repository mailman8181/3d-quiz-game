import { memoryLayout } from '../../../core/activities/memory';
import type { ActivityDef } from '../types';

/** Memory (M14b): chest pairs among picture pairs; grid grows with the stage. */
export const memoryActivity: ActivityDef = {
  id: 'memory',
  chests: (stage) => memoryLayout(stage).chests,
};
