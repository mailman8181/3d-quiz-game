import { jumpLayout } from '../../../core/activities/jump';
import type { ActivityDef } from '../types';

/** Hüpf-Abenteuer (M14c): gentle side scroller; chests on the path, gold ones up high. */
export const jumpActivity: ActivityDef = {
  id: 'jump',
  chests: (stage) => jumpLayout(stage).chests,
};
