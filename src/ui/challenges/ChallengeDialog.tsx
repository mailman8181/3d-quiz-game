import { useEffect, useState } from 'react';
import { playSuccess, playTryAgain } from '../../audio/sfx';
import { speech } from '../../audio/speech';
import { Confetti } from '../Confetti';
import { speechText } from '../../content/de/speech';
import { de } from '../../content/de/strings';
import { initialAttempt, submitAnswer, type AttemptFeedback, type AttemptState } from '../../core/challenges/attempt';
import type { Chest } from '../../core/session/mazeSession';
import type { ChallengeOutcome } from '../../core/skills/skillModel';
import { challengeViews } from '.';

const TIER_ICONS = { bronze: '🥉', silver: '🥈', gold: '🥇' } as const;

interface Props {
  chest: Chest;
  onSolved: (stars: number, outcome: ChallengeOutcome) => void;
  onSkip: () => void;
}

/** Full-screen challenge for one chest: task, number buttons, hints, skip with confirmation. */
export function ChallengeDialog({ chest, onSolved, onSkip }: Props) {
  const { challenge } = chest;
  const [attempt, setAttempt] = useState<AttemptState>(initialAttempt);
  const [feedback, setFeedback] = useState<AttemptFeedback | null>(null);
  const [confirmSkip, setConfirmSkip] = useState(false);
  // Random praise word, picked once per dialog (shown after a correct answer).
  const [praise] = useState(() => de.challenge.praise[Math.floor(Math.random() * de.challenge.praise.length)]!);
  const entry = challengeViews[challenge.typeId];
  const View = entry?.View;

  const sayPrompt = () => speech().speak(speechText(challenge.prompt));
  useEffect(() => {
    speech().speak(speechText(challenge.prompt));
  }, [challenge]);

  const choose = (choiceId: string) => {
    const result = submitAnswer(challenge, attempt, choiceId, chest.stars);
    setAttempt(result.state);
    setFeedback(result.feedback);
    if (result.feedback === 'correct') {
      // A cheerful jingle + confetti instead of always the same spoken sentence.
      speech().stop();
      playSuccess();
    } else if (result.feedback === 'reveal') {
      speech().speak(speechText(challenge.explanation));
    } else {
      playTryAgain();
      speech().speak(speechText({ key: `feedback.${result.feedback}` }));
    }
  };

  const finished = attempt.finished;
  const correctChoice = challenge.choices.find((c) => c.id === challenge.correctChoiceId);
  const correctValue = correctChoice?.label ?? correctChoice?.value;

  return (
    <div className="overlay challenge-overlay" role="dialog" aria-modal data-testid="challenge">
      <div className={`dialog challenge-dialog tier-${chest.tier}`} data-tier={chest.tier} data-type={challenge.typeId}>
        <span className="tier-badge" aria-hidden>
          {TIER_ICONS[chest.tier]}
        </span>
        <button className="prompt" onClick={sayPrompt} aria-label={de.challenge.listen}>
          <span aria-hidden>🔊</span> {speechText(challenge.promptDisplay ?? challenge.prompt)}
        </button>

        {View && (
          <View
            data={challenge.data}
            hint={feedback === 'hint' || feedback === 'reveal'}
            solved={finished}
            answers={
              entry.ownsChoices
                ? {
                    choices: challenge.choices,
                    wrongChoiceIds: attempt.wrongChoiceIds,
                    correctChoiceId: challenge.correctChoiceId,
                    onChoose: choose,
                  }
                : undefined
            }
          />
        )}

        {!finished && !entry?.ownsChoices && (
          <div className="choice-buttons">
            {challenge.choices.map((c) => {
              const wrong = attempt.wrongChoiceIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  // Labels longer than a number ("3 €", "sicher") get a wider button.
                  className={`number-button ${String(c.label ?? c.value).length > 2 ? 'wide' : ''} ${wrong ? 'wrong' : ''}`}
                  disabled={wrong}
                  onClick={() => choose(c.id)}
                >
                  {c.label ?? c.value}
                </button>
              );
            })}
          </div>
        )}

        {feedback && !finished && (
          <p className={`feedback ${feedback}`} aria-live="polite">
            {speechText({ key: `feedback.${feedback}` })}
          </p>
        )}

        {finished && feedback === 'correct' && <Confetti />}

        {finished && (
          <div className="result-box" aria-live="polite">
            {feedback === 'reveal' ? (
              <p className="feedback reveal">{speechText(challenge.explanation)}</p>
            ) : (
              <p className="feedback correct praise" data-testid="praise">
                {praise} {!entry?.ownsChoices && <strong>{correctValue}</strong>}
              </p>
            )}
            <p className="stars-won">⭐ {de.challenge.starsWon(attempt.stars)}</p>
            <button
              className="button primary"
              onClick={() =>
                onSolved(
                  attempt.stars,
                  feedback === 'reveal' ? { kind: 'revealed' } : { kind: 'solved', wrongTries: attempt.wrongChoiceIds.length },
                )
              }
            >
              {de.challenge.continue}
            </button>
          </div>
        )}

        {!finished && (
          <button
            className="skip-button"
            onClick={() => {
              setConfirmSkip(true);
              speech().speak(speechText({ key: 'feedback.skipQuestion' }));
            }}
          >
            {de.challenge.skip}
          </button>
        )}
      </div>

      {confirmSkip && (
        <div className="overlay confirm-overlay" role="alertdialog" aria-modal>
          <div className="dialog">
            <p className="confirm-question">{de.challenge.skipQuestion}</p>
            <div className="button-row">
              <button className="button big-icon secondary" aria-label={de.challenge.skipNo} onClick={() => setConfirmSkip(false)}>
                ✗
              </button>
              <button className="button big-icon primary" aria-label={de.challenge.skipYes} onClick={onSkip}>
                ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
