import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { speech } from '../../audio/speech';
import { de } from '../../content/de/strings';
import { selectChallengeTypes } from '../../core/challenges/selection';
import type { SubjectId } from '../../core/challenges/types';
import type { StageId } from '../../core/learner/stage';
import type { Profile } from '../../core/profile/profile';
import { createRng } from '../../core/rng';
import { rewardOffer } from '../../core/rewards/rewards';
import type { ChestContent } from '../../core/session/mazeSession';
import { planChests, type ChallengeOutcome } from '../../core/skills/skillModel';
import { getChallengeType } from '../../modules/challenges';
import { rewardCatalog } from '../../modules/rewards/catalog';
import { getWorld } from '../../modules/worlds';
import { ChallengeDialog } from '../challenges/ChallengeDialog';
import { RewardPicker } from '../rewards/RewardPicker';

export type ChestState = 'closed' | 'solved' | 'skipped';

export interface ChestFlowOptions {
  profile: Profile;
  stage: StageId | null;
  subjects: readonly SubjectId[];
  breakDue: boolean;
  /** Chests in this round (fixed for the round). */
  count: number;
  seed: number;
  /** Practice topics (challenge type ids), ADR-0011. */
  topics?: readonly string[];
  onStars: (stars: number) => void;
  onChallengeResult: (typeId: string, level: number, outcome: ChallengeOutcome) => void;
  onChooseReward: (itemId: string | null) => void;
  onHome: () => void;
}

export interface ChestFlow {
  chests: readonly ChestContent[];
  states: readonly ChestState[];
  /** Open chest i: shows the challenge dialog. */
  open: (index: number) => void;
  /** Dialogs to render on top of the activity (challenge, reward picker, break). */
  overlays: ReactNode;
  /** A dialog is open: pause the activity. */
  busy: boolean;
  starsEarned: number;
}

/** Plans a round's chests like a maze does (ADR-0009 selection + skill model). */
function planRound(o: ChestFlowOptions): ChestContent[] {
  const only = new URLSearchParams(window.location.search).get('challenge');
  const selected = selectChallengeTypes({
    types: getWorld('forest').chests.challenges.map(getChallengeType),
    disabled: o.profile.disabledChallenges,
    subjects: o.subjects,
    stage: o.stage,
    only,
    topics: o.topics,
  });
  const rng = createRng(o.seed ^ 0x2545f491);
  return planChests(rng, selected, o.profile.skills, o.count).map((p) => ({
    challenge: p.type.generate({ rng, level: p.level }),
    tier: p.tier,
    stars: p.stars,
  }));
}

/**
 * The shared part of every activity (ADR-0010): what happens after a chest was found.
 * Remount the activity (React `key`) for a new round so chests are planned again.
 */
export function useChestFlow(o: ChestFlowOptions): ChestFlow {
  const [chests] = useState(() => planRound(o));
  const [states, setStates] = useState<ChestState[]>(() => chests.map(() => 'closed'));
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [visit, setVisit] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);

  const offer = useMemo(
    () => rewardOffer(rewardCatalog, o.profile.inventory, createRng(o.profile.inventory.length * 7919 + o.profile.stars)),
    [o.profile.inventory, o.profile.stars],
  );
  const showPicker = o.profile.pendingRewards > 0 && openIndex === null;
  const showBreak = o.breakDue && openIndex === null;
  useEffect(() => {
    if (showBreak) speech().speak(de.breakTime.speak);
  }, [showBreak]);

  const setState = (i: number, s: ChestState) => setStates((prev) => prev.map((x, j) => (j === i ? s : x)));
  const chest = openIndex === null ? null : chests[openIndex]!;

  const overlays = (
    <>
      {chest && openIndex !== null && (
        <ChallengeDialog
          key={`${openIndex}-${visit}`}
          chest={chest}
          onSolved={(stars, outcome) => {
            setState(openIndex, 'solved');
            setStarsEarned((s) => s + stars);
            o.onChallengeResult(chest.challenge.typeId, chest.challenge.level, outcome);
            o.onStars(stars);
            setOpenIndex(null);
          }}
          onSkip={() => {
            setState(openIndex, 'skipped');
            o.onChallengeResult(chest.challenge.typeId, chest.challenge.level, { kind: 'skipped' });
            setOpenIndex(null);
          }}
        />
      )}
      {showPicker && <RewardPicker offer={offer} onChoose={o.onChooseReward} />}
      {showBreak && (
        <div className="overlay break-overlay" role="dialog" aria-modal data-testid="break">
          <div className="dialog">
            <div className="dialog-icon" aria-hidden>
              🦉💤
            </div>
            <h2>{de.breakTime.title}</h2>
            <p>{de.breakTime.text}</p>
            <button className="button primary" aria-label={de.game.home} onClick={o.onHome}>
              🏠
            </button>
          </div>
        </div>
      )}
    </>
  );

  return {
    chests,
    states,
    open: (i) => {
      if (states[i] === 'solved') return;
      setVisit((v) => v + 1);
      setOpenIndex(i);
    },
    overlays,
    busy: openIndex !== null || showPicker || showBreak,
    starsEarned,
  };
}
