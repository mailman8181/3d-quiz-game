import { useEffect, useRef, useState } from 'react';
import { playFanfare, playPling } from '../../audio/sfx';
import { speech } from '../../audio/speech';
import { de } from '../../content/de/strings';
import { nextStone, practiceLength, practiceTopics } from '../../core/activities/practice';
import type { SubjectId } from '../../core/challenges/types';
import type { StageId } from '../../core/learner/stage';
import type { Profile } from '../../core/profile/profile';
import { randomSeed } from '../../core/rng';
import type { ChallengeOutcome } from '../../core/skills/skillModel';
import { challengeTypes } from '../../modules/challenges';
import { animalIcons } from '../animalIcons';
import { StarJar } from '../rewards/StarJar';
import { useChestFlow } from './chestFlow';

interface Props {
  profile: Profile;
  stage: StageId | null;
  /** Subjects parents allow. */
  allowed: readonly SubjectId[];
  /** Today's subjects from the hub chips (preselection for "Alles gemischt"). */
  subjects: readonly SubjectId[];
  breakDue: boolean;
  onHome: () => void;
  onStars: (stars: number) => void;
  onChallengeResult: (typeId: string, level: number, outcome: ChallengeOutcome) => void;
  onChooseReward: (itemId: string | null) => void;
  onRoundCompleted: () => void;
}

interface Choice {
  /** Subjects for this round ("Alles gemischt" = today's subjects). */
  subjects: SubjectId[];
  /** One challenge type id, or null for everything in the subjects. */
  topic: string | null;
}

/** Pause before the next question opens by itself; tapping the next stone opens it at once. */
const NEXT_QUESTION_MS = 900;
const TIER_FLOWER: Record<string, string> = { bronze: '#d08a4c', silver: '#9fb3c8', gold: '#ffd24a' };

function seedFromUrl(): number | null {
  const v = new URLSearchParams(window.location.search).get('seed');
  return v && /^\d+$/.test(v) ? Number(v) : null;
}

/** Rätselpfad (M14d, ADR-0011): pick what to practise, then a path of questions. */
export function PracticeScreen(props: Props) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [round, setRound] = useState(0);
  if (!choice) return <PracticePicker {...props} onStart={(c) => setChoice(c)} />;
  return (
    <PracticeRound
      key={round}
      {...props}
      choice={choice}
      round={round}
      onAgain={() => setRound((r) => r + 1)}
      onOther={() => {
        setChoice(null);
        setRound((r) => r + 1);
      }}
    />
  );
}

function PracticePicker({ profile, stage, allowed, subjects, onHome, onStart }: Props & { onStart: (c: Choice) => void }) {
  const [subject, setSubject] = useState<SubjectId | 'mixed'>('mixed');
  const [topic, setTopic] = useState<string | null>(null);
  useEffect(() => {
    speech().speak(de.practice.choose);
  }, []);
  const groups = practiceTopics(challengeTypes, profile.disabledChallenges, stage, allowed);
  const group = subject === 'mixed' ? null : groups.find((g) => g.subject === subject);
  const mixedSubjects = subjects.length > 0 ? [...subjects] : [...allowed];

  return (
    <main className="screen menu-screen practice-picker" data-testid="practice-picker">
      <h1 className="title" onClick={() => speech().speak(de.practice.choose)}>
        {de.practice.title}
      </h1>
      <div className="practice-subjects">
        {(['mixed', ...groups.map((g) => g.subject)] as const).map((s) => {
          const name = s === 'mixed' ? de.practice.mixed : de.subjects.names[s]!;
          return (
            <button
              key={s}
              className={`subject-chip ${subject === s ? 'on' : ''}`}
              aria-pressed={subject === s}
              data-subject={s}
              onClick={() => {
                playPling();
                speech().speak(name);
                setSubject(s);
                setTopic(null);
              }}
            >
              <span aria-hidden>{s === 'mixed' ? '🎲' : de.subjects.icons[s]}</span> {name}
            </button>
          );
        })}
      </div>
      {group && (
        <div className="practice-topics">
          <button
            className={`card topic-tile ${topic === null ? 'on' : ''}`}
            data-topic="all"
            onClick={() => {
              speech().speak(de.practice.allOf(de.subjects.names[group.subject]!));
              setTopic(null);
            }}
          >
            <span aria-hidden>{de.subjects.icons[group.subject]}</span>
            <small>{de.practice.allOf(de.subjects.names[group.subject]!)}</small>
          </button>
          {group.typeIds.map((id) => {
            const t = de.practice.topics[id] ?? { icon: '❔', name: id };
            return (
              <button
                key={id}
                className={`card topic-tile ${topic === id ? 'on' : ''}`}
                data-topic={id}
                onClick={() => {
                  speech().speak(t.name);
                  setTopic(id);
                }}
              >
                <span aria-hidden>{t.icon}</span>
                <small>{t.name}</small>
              </button>
            );
          })}
        </div>
      )}
      <div className="button-row">
        <button className="button secondary" aria-label={de.game.home} onClick={onHome}>
          🏠
        </button>
        <button
          className="button primary"
          data-testid="practice-start"
          onClick={() => onStart({ subjects: subject === 'mixed' ? mixedSubjects : [subject], topic })}
        >
          ▶ {de.practice.start}
        </button>
      </div>
    </main>
  );
}

function PracticeRound({
  profile,
  stage,
  breakDue,
  onHome,
  onStars,
  onChallengeResult,
  onChooseReward,
  onRoundCompleted,
  choice,
  round,
  onAgain,
  onOther,
}: Props & { choice: Choice; round: number; onAgain: () => void; onOther: () => void }) {
  const count = practiceLength(stage);
  const [seed] = useState(() => {
    const forced = seedFromUrl();
    return forced !== null ? forced + round : randomSeed();
  });
  const flow = useChestFlow({
    profile,
    stage,
    subjects: choice.subjects,
    topics: choice.topic ? [choice.topic] : undefined,
    breakDue,
    count,
    seed,
    onStars,
    onChallengeResult,
    onChooseReward,
    onHome,
  });
  const next = nextStone(flow.states);
  const done = next === null;
  const visited = flow.states.filter((s) => s !== 'closed').length;

  // The next question opens by itself after a short pause (or at once when its stone is tapped).
  const flowRef = useRef(flow);
  useEffect(() => {
    flowRef.current = flow;
  });
  useEffect(() => {
    if (flow.busy || next === null) return;
    const t = window.setTimeout(() => flowRef.current.open(next), round === 0 && visited === 0 ? 1600 : NEXT_QUESTION_MS);
    return () => window.clearTimeout(t);
  }, [flow.busy, next, round, visited]);

  useEffect(() => {
    speech().speak(de.activities.intros.practice ?? '');
    return () => speech().stop();
  }, []);

  // Cheer once at half the path; count the round once at the end.
  const cheered = useRef(false);
  const counted = useRef(false);
  const callbacks = useRef({ onRoundCompleted });
  useEffect(() => {
    callbacks.current = { onRoundCompleted };
  });
  useEffect(() => {
    if (!cheered.current && !flow.busy && visited >= Math.ceil(count / 2) && visited < count) {
      cheered.current = true;
      speech().speak(de.practice.halfway);
    }
    if (!counted.current && done && !flow.busy) {
      counted.current = true;
      callbacks.current.onRoundCompleted();
      playFanfare();
      speech().speak(de.practice.doneSpeak);
    }
  }, [visited, done, flow.busy, count]);

  const tapStone = (i: number) => {
    if (flow.busy) return;
    const s = flow.states[i];
    if (s === 'skipped') {
      speech().speak(de.practice.retry);
      flow.open(i);
    } else if (i === next) flow.open(i);
  };

  return (
    <main className="screen menu-screen practice-screen" data-testid="practice">
      <div className="hud">
        <button className="round-button" aria-label={de.game.home} onClick={onHome}>
          🏠
        </button>
        <button className="guide-bubble" onClick={() => speech().speak(de.activities.intros.practice ?? '')}>
          <span aria-hidden>{choice.topic ? de.practice.topics[choice.topic]?.icon : '🎲'}</span>{' '}
          {choice.topic ? de.practice.topics[choice.topic]?.name : de.activities.names.practice}
        </button>
        <div className="hud-right">
          <StarJar jar={profile.jar} />
        </div>
      </div>

      <div className="practice-path" data-testid="practice-path">
        {flow.states.map((s, i) => {
          const tier = flow.chests[i]!.tier;
          return (
            <button
              key={i}
              className={`stone ${s} ${i === next ? 'current' : ''}`}
              data-stone={i}
              data-state={s}
              aria-label={`${i + 1}`}
              onClick={() => tapStone(i)}
              style={s === 'solved' ? { background: TIER_FLOWER[tier] } : undefined}
            >
              {i === next ? (
                <span className="stone-avatar" style={{ background: profile.avatar.color }} aria-hidden>
                  {animalIcons[profile.avatar.animal]}
                </span>
              ) : s === 'solved' ? (
                <span aria-hidden>🌸</span>
              ) : (
                <span aria-hidden>{s === 'skipped' ? '🪨' : ''}</span>
              )}
            </button>
          );
        })}
        <span className={`stone goal ${done ? 'reached' : ''}`} aria-hidden>
          {done ? <span className="stone-avatar" style={{ background: profile.avatar.color }}>{animalIcons[profile.avatar.animal]}</span> : '🎁'}
        </span>
      </div>

      {flow.overlays}

      {done && !flow.busy && (
        <div className="overlay" role="dialog" aria-modal data-testid="practice-done">
          <div className="dialog">
            <div className="dialog-icon" aria-hidden>
              🎁🎉
            </div>
            <h2>{de.practice.doneTitle}</h2>
            <p className="stars-won">⭐ {de.game.goalStars(flow.starsEarned)}</p>
            <div className="button-row">
              <button className="button secondary" aria-label={de.game.home} onClick={onHome}>
                🏠
              </button>
              <button className="button secondary" onClick={onOther}>
                {de.practice.other}
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
