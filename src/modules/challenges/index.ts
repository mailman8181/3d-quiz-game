import type { ChallengeType } from '../../core/challenges/types';
import { germanInitialSound } from './german-initial-sound';
import { germanReadWord } from './german-read-word';
import { germanRhyme } from './german-rhyme';
import { germanSyllables } from './german-syllables';
import {
  knowledgeAnimalBaby,
  knowledgeAnimalName,
  knowledgeColors,
  knowledgeOddOneOut,
  knowledgeSeasons,
} from './knowledge';
import { mathAddition } from './math-addition';
import { mathCompare } from './math-compare';
import { mathCount } from './math-count';
import { mathFindNumber } from './math-find-number';
import { mathPattern } from './math-pattern';
import { mathSubtraction } from './math-subtraction';
import { mathDice } from './math-dice';
import {
  germanAbc,
  germanArticle,
  germanCompound,
  germanFillWord,
  germanMissingLetters,
  germanPlural,
  germanRiddle,
  germanSentenceEnd,
  germanWordType,
} from './german2';
import { mathChance } from './math-chance';
import { mathClock } from './math-clock';
import { mathDoubleHalf } from './math-double-half';
import { mathEvenOdd } from './math-even-odd';
import { mathMoney } from './math-money';
import { mathNumberBonds } from './math-number-bonds';
import { mathPlaceValue } from './math-place-value';
import { mathSymmetry } from './math-symmetry';
import { mathTimes } from './math-times';
import { mathNeighbors } from './math-neighbors';
import { mathPosition } from './math-position';
import {
  germanOpposites,
  germanSameStart,
  germanSyllableBlend,
  knowledgeBody,
  knowledgeHabitat,
  knowledgeSequence,
  mathSizes,
} from './preschool';

/**
 * Registry of all challenge types (architecture §3.1).
 * Add a new type: create `src/modules/challenges/<id>/`, register it here, register its
 * view in `src/ui/challenges/`, add speech templates in `src/content/de/speech.ts`, and declare
 * `levelInfo` (stages + curriculum competencies per level, ADR-0009).
 */
export const challengeTypes: readonly ChallengeType[] = [
  mathCount,
  mathFindNumber,
  mathCompare,
  mathAddition,
  mathSubtraction,
  mathPattern,
  mathDice,
  mathNeighbors,
  mathPosition,
  mathSizes,
  mathNumberBonds,
  mathDoubleHalf,
  mathPlaceValue,
  mathEvenOdd,
  mathTimes,
  mathMoney,
  mathClock,
  mathSymmetry,
  mathChance,
  germanInitialSound,
  germanSyllables,
  germanRhyme,
  germanReadWord,
  germanSameStart,
  germanSyllableBlend,
  germanOpposites,
  germanArticle,
  germanPlural,
  germanWordType,
  germanMissingLetters,
  germanRiddle,
  germanFillWord,
  germanSentenceEnd,
  germanAbc,
  germanCompound,
  knowledgeAnimalName,
  knowledgeAnimalBaby,
  knowledgeColors,
  knowledgeSeasons,
  knowledgeOddOneOut,
  knowledgeHabitat,
  knowledgeBody,
  knowledgeSequence,
] as ChallengeType[];

export function getChallengeType(id: string): ChallengeType {
  const type = challengeTypes.find((t) => t.id === id);
  if (!type) throw new Error(`Unknown challenge type: ${id}`);
  return type;
}
