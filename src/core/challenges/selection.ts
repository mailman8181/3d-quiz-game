import { inStageRange, stageRank, type StageId } from '../learner/stage';
import type { ChallengeType, SubjectId } from './types';

/** A challenge type ready for chest planning: where a new child starts and how far it may go. */
export interface SelectedType {
  type: ChallengeType;
  /** Level for a child without a skill record for this type. */
  startLevel: number;
  /** Highest level the skill model may reach for this child's stage. */
  maxLevel: number;
}

/**
 * Levels of `type` suitable for `stage` (ADR-0009), or null if the type does not fit:
 * - too hard: level 1 is meant for a later stage;
 * - outgrown: every level has a `max` below the stage.
 * The window allows one stage of stretch: levels meant for the next stage can be reached by
 * the skill model (and gold chests), but a new child starts at the highest level meant for
 * its own stage. Without a stage (not set yet), all levels are allowed and play starts at 1.
 */
export function levelWindow(type: ChallengeType, stage: StageId | null): { startLevel: number; maxLevel: number } | null {
  if (stage === null) return { startLevel: 1, maxLevel: type.levels };
  const rank = stageRank(stage);
  const info = type.levelInfo;
  if (info.length === 0 || stageRank(info[0]!.stages.min) > rank) return null;
  const outgrown = info.every((l) => l.stages.max !== undefined && stageRank(l.stages.max) < rank);
  if (outgrown) return null;
  const levelsWhere = (pred: (i: number) => boolean) => info.map((_, i) => i + 1).filter((n) => pred(n - 1));
  // Entry: the highest level meant for this stage; otherwise the highest it may already do.
  const fitting = levelsWhere((i) => inStageRange(stage, info[i]!.stages));
  const reachable = levelsWhere((i) => stageRank(info[i]!.stages.min) <= rank);
  const stretch = levelsWhere((i) => stageRank(info[i]!.stages.min) <= rank + 1);
  const startLevel = Math.max(...(fitting.length > 0 ? fitting : reachable));
  return { startLevel, maxLevel: Math.max(startLevel, ...stretch) };
}

export interface SelectionInput {
  /** Candidate types (the world's list), in a stable order. */
  types: readonly ChallengeType[];
  /** Type ids switched off by parents. */
  disabled: readonly string[];
  /** Subjects chosen for this session. */
  subjects: readonly SubjectId[];
  stage: StageId | null;
  /** Review/test override (`?challenge=<typeId>`): only this type, ignoring all filters. */
  only?: string | null;
  /** Practice topics (ADR-0011): only these type ids, after the other filters. */
  topics?: readonly string[];
}

/**
 * The challenge types a child may meet in this maze (ADR-0009 pipeline):
 * world types − parents' disabled ∩ session subjects ∩ stage window.
 * Never returns an empty list for a non-empty input: if the filters leave nothing (e.g. parents
 * disabled everything for this stage), it falls back to the stage filter alone, then to all.
 */
export function selectChallengeTypes(input: SelectionInput): SelectedType[] {
  const withWindow = (types: readonly ChallengeType[], stage: StageId | null) =>
    types.flatMap((type) => {
      const w = levelWindow(type, stage);
      return w ? [{ type, ...w }] : [];
    });

  if (input.only) {
    const forced = input.types.filter((t) => t.id === input.only);
    if (forced.length > 0) return withWindow(forced, null);
  }
  const filtered = input.types.filter((t) => !input.disabled.includes(t.id) && input.subjects.includes(t.subject));
  const topical = input.topics?.length ? filtered.filter((t) => input.topics!.includes(t.id)) : [];
  for (const candidate of [withWindow(topical, input.stage), withWindow(filtered, input.stage), withWindow(input.types, input.stage)]) {
    if (candidate.length > 0) return candidate;
  }
  return withWindow(input.types, null);
}

/** Subjects that still have at least one type for this stage after the parents' filter. */
export function typesForStage(types: readonly ChallengeType[], stage: StageId | null): ChallengeType[] {
  return types.filter((t) => levelWindow(t, stage) !== null);
}
