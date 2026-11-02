import { AdditionView } from './AdditionView';
import { CompareView } from './CompareView';
import { CountView } from './CountView';
import { DiceView } from './DiceView';
import { ChanceView } from './ChanceView';
import { ClockView } from './ClockView';
import { DoubleHalfView } from './DoubleHalfView';
import { MoneyView } from './MoneyView';
import { NumberBondsView } from './NumberBondsView';
import { PlaceValueView } from './PlaceValueView';
import { SymmetryView } from './SymmetryView';
import { TimesView } from './TimesView';
import { NeighborsView } from './NeighborsView';
import { PositionView } from './PositionView';
import { FindNumberView } from './FindNumberView';
import { InitialSoundView } from './InitialSoundView';
import { KnowledgeView } from './KnowledgeView';
import { ReadWordView } from './ReadWordView';
import { RhymeView } from './RhymeView';
import { SyllablesView } from './SyllablesView';
import { PatternView } from './PatternView';
import { SubtractionView } from './SubtractionView';
import type { ChallengeView, ChallengeViewEntry } from './types';

/** View registry, keyed by challenge type id (architecture §3.1). */
export const challengeViews: Record<string, ChallengeViewEntry> = {
  'math.count': { View: CountView as ChallengeView },
  'math.find-number': { View: FindNumberView as ChallengeView },
  'math.compare': { View: CompareView as ChallengeView, ownsChoices: true },
  'math.addition': { View: AdditionView as ChallengeView },
  'math.subtraction': { View: SubtractionView as ChallengeView },
  'math.pattern': { View: PatternView as ChallengeView, ownsChoices: true },
  'german.initial-sound': { View: InitialSoundView as ChallengeView },
  'german.syllables': { View: SyllablesView as ChallengeView },
  'german.rhyme': { View: RhymeView as ChallengeView, ownsChoices: true },
  'german.read-word': { View: ReadWordView as ChallengeView, ownsChoices: true },
  'knowledge.animal-name': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.animal-baby': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.colors': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.seasons': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.odd-one-out': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  // Preschool pack (M13b)
  'math.dice': { View: DiceView as ChallengeView },
  'math.neighbors': { View: NeighborsView as ChallengeView },
  'math.position': { View: PositionView as ChallengeView, ownsChoices: true },
  'math.sizes': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.same-start': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.syllable-blend': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.opposites': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.habitat': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.body': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.sequence': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  // Grade 1–2 math pack (M13c)
  'math.number-bonds': { View: NumberBondsView as ChallengeView },
  'math.double-half': { View: DoubleHalfView as ChallengeView },
  'math.place-value': { View: PlaceValueView as ChallengeView },
  'math.even-odd': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'math.times': { View: TimesView as ChallengeView },
  'math.money': { View: MoneyView as ChallengeView },
  'math.clock': { View: ClockView as ChallengeView, ownsChoices: true },
  'math.symmetry': { View: SymmetryView as ChallengeView, ownsChoices: true },
  'math.chance': { View: ChanceView as ChallengeView },
  // Grade 1–2 German pack (M13d): all quiz cards
  'german.article': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.plural': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.word-type': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.missing-letters': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.riddle': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.fill-word': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.sentence-end': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.abc': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.compound': { View: KnowledgeView as ChallengeView, ownsChoices: true },
};
