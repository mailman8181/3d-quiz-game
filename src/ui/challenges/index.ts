import { AdditionView } from './AdditionView';
import { CompareView } from './CompareView';
import { CountView } from './CountView';
import { DiceView } from './DiceView';
import { CompassView } from './CompassView';
import { AreaView } from './AreaView';
import { ChartView } from './ChartView';
import { DivisionView } from './DivisionView';
import { RoundingView } from './RoundingView';
import { SolidsView } from './SolidsView';
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
  // Grades 3–4 math (M15a)
  'math.division': { View: DivisionView as ChallengeView },
  'math.units': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'math.rounding': { View: RoundingView as ChallengeView },
  'math.area': { View: AreaView as ChallengeView },
  'math.solids': { View: SolidsView as ChallengeView, ownsChoices: true },
  'math.chart': { View: ChartView as ChallengeView, ownsChoices: true },
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
  // Grades 3–4 German (M15b)
  'german.tense': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.sentence-parts': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.word-family': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.spelling': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.capital': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.comparison': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'german.reading': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  // Wissen pack (M13e)
  'knowledge.recycling': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.jobs': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.float': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.traffic': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.feelings': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.calendar': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  // Grades 3–4 Wissen (M15c)
  'knowledge.states': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.science': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.compass': { View: CompassView as ChallengeView, ownsChoices: true },
  'knowledge.germany': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.past': { View: KnowledgeView as ChallengeView, ownsChoices: true },
  'knowledge.together': { View: KnowledgeView as ChallengeView, ownsChoices: true },
};
