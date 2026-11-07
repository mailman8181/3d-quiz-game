import { practiceLength } from '../../../core/activities/practice';
import type { ActivityDef } from '../types';

/** Rätselpfad (M14d, ADR-0011): questions one after another; always open. */
export const practiceActivity: ActivityDef = {
  id: 'practice',
  chests: practiceLength,
  alwaysOpen: true,
};
