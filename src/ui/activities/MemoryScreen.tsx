import { useEffect, useRef, useState } from 'react';
import { playPling, playSuccess, playFanfare } from '../../audio/sfx';
import { speech } from '../../audio/speech';
import { de } from '../../content/de/strings';
import { WORDS } from '../../content/de/words';
import { createMemory, flip, hideOpen, isDone, memoryLayout, type MemoryCard, type MemoryState } from '../../core/activities/memory';
import type { SubjectId } from '../../core/challenges/types';
import type { StageId } from '../../core/learner/stage';
import type { Profile } from '../../core/profile/profile';
import { createRng, randomSeed } from '../../core/rng';
import type { ChallengeOutcome } from '../../core/skills/skillModel';
import { progressFor } from '../../modules/activities';
import { StarJar } from '../rewards/StarJar';
import { useChestFlow } from './chestFlow';
import { ChestFace } from './ChestFace';

interface Props {
  profile: Profile;
  stage: StageId | null;
  subjects: readonly SubjectId[];
  breakDue: boolean;
  onHome: () => void;
  onStars: (stars: number) => void;
  onChallengeResult: (typeId: string, level: number, outcome: ChallengeOutcome) => void;
  onChooseReward: (itemId: string | null) => void;
  onRoundCompleted: () => void;
}

/** How long two different cards stay visible before they turn back (a look, not a timer). */
const MISMATCH_LOOK_MS = 1300;
/** Short pause so the child sees the chest pair before the question opens. */
const CHEST_OPEN_DELAY_MS = 600;

const PICTURES = WORDS.map((w) => ({ emoji: w.emoji, label: w.word }));

/** ?seed=N makes the deck reproducible (tests, bug reports). */
function seedFromUrl(): number | null {
  const v = new URLSearchParams(window.location.search).get('seed');
  return v && /^\d+$/.test(v) ? Number(v) : null;
}

/** Memory activity (ADR-0010, M14b). A new round remounts `MemoryRound`. */
export function MemoryScreen(props: Props) {
  const [round, setRound] = useState(0);
  return <MemoryRound key={round} {...props} round={round} onAgain={() => setRound((r) => r + 1)} />;
}

function MemoryRound({ profile, stage, subjects, breakDue, onHome, onStars, onChallengeResult, onChooseReward, onRoundCompleted, round, onAgain }: Props & { round: number; onAgain: () => void }) {
  const layout = memoryLayout(stage);
  const [seed] = useState(() => {
    const forced = seedFromUrl();
    return forced !== null ? forced + round : randomSeed();
  });
  const flow = useChestFlow({
    profile,
    stage,
    subjects,
    breakDue,
    count: layout.chests,
    seed,
    onStars,
    onChallengeResult,
    onChooseReward,
    onHome,
  });
  const [game, setGame] = useState<MemoryState>(() =>
    createMemory(createRng(seed), PICTURES, (layout.cols * layout.rows) / 2, layout.chests),
  );
  const [newGame, setNewGame] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    speech().speak(de.activities.intros.memory ?? '');
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      speech().stop();
    };
  }, []);

  const done = isDone(game);
  const tap = (card: MemoryCard) => {
    if (flow.busy) return;
    // A matched chest that was skipped can be opened again.
    if (game.matched.includes(card.id)) {
      if (card.face.kind === 'chest' && flow.states[card.face.chest] === 'skipped') flow.open(card.face.chest);
      return;
    }
    if (timer.current !== null) window.clearTimeout(timer.current);
    const { state, event } = flip(game, card.id);
    setGame(state);
    if (event.kind === 'first' || event.kind === 'mismatch') {
      speech().speak(event.card.face.kind === 'chest' ? de.activities.chest : event.card.face.picture.label);
    }
    if (event.kind === 'mismatch') {
      timer.current = window.setTimeout(() => setGame((g) => hideOpen(g)), MISMATCH_LOOK_MS);
    }
    if (event.kind === 'match') {
      if (event.chest !== null) {
        playPling();
        const chest = event.chest;
        timer.current = window.setTimeout(() => flow.open(chest), CHEST_OPEN_DELAY_MS);
      } else {
        playSuccess();
        speech().speak(de.activities.pair);
      }
      if (isDone(state)) {
        // Count the round now; the end dialog shows once no question is open any more.
        setNewGame(progressFor(profile, stage).unlocked.length < progressFor({ ...profile, activityRounds: { ...profile.activityRounds, memory: (profile.activityRounds.memory ?? 0) + 1 } }, stage).unlocked.length);
        onRoundCompleted();
      }
    }
  };

  const showEnd = done && !flow.busy && flow.states.every((s) => s !== 'closed');
  const endShown = useRef(false);
  useEffect(() => {
    if (showEnd && !endShown.current) {
      endShown.current = true;
      playFanfare();
      speech().speak(newGame ? de.activities.speakUnlocked : de.activities.doneSpeak);
    }
  }, [showEnd, newGame]);

  return (
    <main className="screen memory-screen" data-testid="memory">
      <div className="hud">
        <button className="round-button" aria-label={de.game.home} onClick={onHome}>
          🏠
        </button>
        <button className="guide-bubble" onClick={() => speech().speak(de.activities.intros.memory ?? '')}>
          <span aria-hidden>{de.guideIcons.olli}</span> {de.activities.names.memory}
        </button>
        <div className="hud-right">
          <StarJar jar={profile.jar} />
        </div>
      </div>

      <div
        className="memory-grid"
        // As wide as the screen allows while all rows still fit in the height.
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
          width: `min(96vw, ${layout.cols * 130}px, calc((100dvh - 120px) * ${layout.cols / layout.rows}))`,
        }}
        data-testid="memory-grid"
      >
        {game.cards.map((card) => {
          const matched = game.matched.includes(card.id);
          const up = matched || game.open.includes(card.id);
          const chestState = card.face.kind === 'chest' ? flow.states[card.face.chest] : undefined;
          return (
            <button
              key={card.id}
              className={`memory-card ${up ? 'up' : ''} ${matched ? 'matched' : ''} ${chestState === 'skipped' ? 'skipped' : ''}`}
              data-card-id={card.id}
              data-pair={card.pairId}
              data-kind={card.face.kind}
              aria-label={up ? (card.face.kind === 'chest' ? de.activities.chest : card.face.picture.label) : de.activities.cardBack}
              onClick={() => tap(card)}
            >
              <span className="memory-card-inner">
                <span className="memory-back" aria-hidden>
                  🌿
                </span>
                <span className="memory-front" aria-hidden>
                  {card.face.kind === 'chest' ? (
                    <ChestFace tier={flow.chests[card.face.chest]!.tier} emblem={card.face.emblem} />
                  ) : (
                    card.face.picture.emoji
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {flow.overlays}

      {showEnd && (
        <div className="overlay" role="dialog" aria-modal data-testid="memory-done">
          <div className="dialog">
            <div className="dialog-icon" aria-hidden>
              🃏🎉
            </div>
            <h2>{de.activities.doneTitle}</h2>
            {newGame && (
              <p className="new-world" data-testid="new-activity">
                🎁 {de.activities.unlocked}
              </p>
            )}
            <p className="stars-won">⭐ {de.game.goalStars(flow.starsEarned)}</p>
            <div className="button-row">
              <button className="button secondary" aria-label={de.game.home} onClick={onHome}>
                🏠
              </button>
              <button className="button primary" onClick={onAgain}>
                {de.activities.again}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
