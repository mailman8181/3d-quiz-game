import { useEffect, useRef, useState } from 'react';
import { playFanfare, playPling } from '../../audio/sfx';
import { speech } from '../../audio/speech';
import { de } from '../../content/de/strings';
import {
  CHEST_EMBLEMS,
} from '../../core/activities/memory';
import {
  createCourse,
  HIGH_CHEST_Y,
  initialJump,
  jumpLayout,
  step,
  type Course,
  type JumpInput,
  type JumpState,
} from '../../core/activities/jump';
import type { SubjectId } from '../../core/challenges/types';
import type { StageId } from '../../core/learner/stage';
import type { Profile } from '../../core/profile/profile';
import { createRng, randomSeed } from '../../core/rng';
import type { ChallengeOutcome } from '../../core/skills/skillModel';
import { progressFor } from '../../modules/activities';
import { animalIcons } from '../animalIcons';
import { StarJar } from '../rewards/StarJar';
import { useChestFlow, type ChestFlow } from './chestFlow';
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

/** World units visible across the screen (portrait phones see about 5). */
const VISIBLE_UNITS = 5.5;
/** Background decoration (no collision): trees and clouds every few units. */
const DECOR = Array.from({ length: 30 }, (_, i) => ({ x: i * 2.7 + 0.6, icon: i % 3 === 0 ? '🌲' : '🌳', cloud: i % 2 === 0 }));
const OBSTACLE_ICONS: Record<string, string> = { log: '🪵', stone: '🪨', mushroom: '🍄' };

function seedFromUrl(): number | null {
  const v = new URLSearchParams(window.location.search).get('seed');
  return v && /^\d+$/.test(v) ? Number(v) : null;
}

/** Hüpf-Abenteuer (M14c, ADR-0010). A new round remounts `JumpRound`. */
export function JumpScreen(props: Props) {
  const [round, setRound] = useState(0);
  return <JumpRound key={round} {...props} round={round} onAgain={() => setRound((r) => r + 1)} />;
}

function JumpRound({
  profile,
  stage,
  subjects,
  breakDue,
  onHome,
  onStars,
  onChallengeResult,
  onChooseReward,
  onRoundCompleted,
  round,
  onAgain,
}: Props & { round: number; onAgain: () => void }) {
  const layout = jumpLayout(stage);
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
  const [course] = useState<Course>(() =>
    createCourse(
      createRng(seed),
      layout.chests,
      layout.obstacles,
      flow.chests.map((c) => c.tier === 'gold'),
    ),
  );
  const [view, setView] = useState<JumpState>(initialJump);
  const [stumbling, setStumbling] = useState(false);
  const [newGame, setNewGame] = useState(false);

  // The game loop reads the latest values through refs (it runs outside React renders).
  const input = useRef<JumpInput>({ left: false, right: false, jump: false });
  const state = useRef<JumpState>(initialJump());
  const flowRef = useRef<ChestFlow>(flow);
  const profileRef = useRef(profile);
  const callbacks = useRef({ onRoundCompleted });
  useEffect(() => {
    flowRef.current = flow;
    profileRef.current = profile;
    callbacks.current = { onRoundCompleted };
  });

  useEffect(() => {
    speech().speak(de.activities.intros.jump ?? '');
    let raf = 0;
    let last = performance.now();
    let stumbleTimer = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!flowRef.current.busy && !state.current.done) {
        const r = step(course, state.current, input.current, dt);
        input.current.jump = false; // a tap is one hop
        state.current = r.state;
        for (const ev of r.events) {
          if (ev.kind === 'chest' && flowRef.current.states[ev.index] !== 'solved') {
            playPling();
            input.current = { left: false, right: false, jump: false };
            flowRef.current.open(ev.index);
          } else if (ev.kind === 'stumble') {
            speech().speak(de.activities.jump.stumble);
            setStumbling(true);
            window.clearTimeout(stumbleTimer);
            stumbleTimer = window.setTimeout(() => setStumbling(false), 900);
          } else if (ev.kind === 'goal') {
            input.current = { left: false, right: false, jump: false };
            const p = profileRef.current;
            const after = { ...p, activityRounds: { ...p.activityRounds, jump: (p.activityRounds.jump ?? 0) + 1 } };
            setNewGame(progressFor(p, stage).unlocked.length < progressFor(after, stage).unlocked.length);
            callbacks.current.onRoundCompleted();
          }
        }
        setView(r.state);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const keys: Record<string, keyof JumpInput> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', ' ': 'jump' };
    const down = (e: KeyboardEvent) => {
      const k = keys[e.key];
      if (!k) return;
      e.preventDefault();
      input.current[k] = true;
    };
    const up = (e: KeyboardEvent) => {
      const k = keys[e.key];
      if (k && k !== 'jump') input.current[k] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(stumbleTimer);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      speech().stop();
    };
  }, [course, stage]);

  const showEnd = view.done && !flow.busy;
  const endShown = useRef(false);
  useEffect(() => {
    if (showEnd && !endShown.current) {
      endShown.current = true;
      playFanfare();
      speech().speak(newGame ? de.activities.speakUnlocked : de.activities.jump.goalSpeak);
    }
  }, [showEnd, newGame]);

  // Hold-to-walk buttons (pointer events cover touch and mouse).
  const hold = (key: 'left' | 'right') => ({
    onPointerDown: (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      input.current[key] = true;
    },
    onPointerUp: () => (input.current[key] = false),
    onPointerCancel: () => (input.current[key] = false),
    onPointerLeave: () => (input.current[key] = false),
  });

  // Camera: keep the avatar at about a third of the screen.
  const camera = Math.max(0, Math.min(course.length - VISIBLE_UNITS, view.x - VISIBLE_UNITS / 3));
  // One world unit: the screen width / VISIBLE_UNITS, but never so big that jumps leave the sky.
  const u = `min(calc(100vw / ${VISIBLE_UNITS}), 11dvh)`;
  const at = (x: number, y: number) => ({
    left: `calc(${u} * ${x - camera})`,
    bottom: `calc(var(--ground) + ${u} * ${y})`,
  });

  return (
    <main className="screen jump-screen" data-testid="jump" data-avatar-x={view.x.toFixed(1)}>
      <div className="hud">
        <button className="round-button" aria-label={de.game.home} onClick={onHome}>
          🏠
        </button>
        <button className="guide-bubble" onClick={() => speech().speak(de.activities.intros.jump ?? '')}>
          <span aria-hidden>{de.guideIcons.rick}</span> {de.activities.names.jump}
        </button>
        <div className="hud-right">
          <StarJar jar={profile.jar} />
        </div>
      </div>

      <div className="jump-scene" style={{ ['--u' as string]: u }}>
        <div className="jump-ground" />
        {DECOR.filter((d) => d.x < course.length).map((d, i) => (
          <span key={`d${i}`} className="jump-decor" aria-hidden style={at(d.x, 0)}>
            {d.icon}
          </span>
        ))}
        {DECOR.filter((d) => d.cloud && d.x < course.length).map((d, i) => (
          <span key={`c${i}`} className="jump-sky" aria-hidden style={at(d.x + 1, 3.6 + (i % 2) * 0.6)}>
            ☁️
          </span>
        ))}
        {course.obstacles.map((o, i) => (
          <span
            key={i}
            className="jump-obstacle"
            aria-hidden
            style={{ ...at(o.x, 0), width: `calc(${u} * ${o.width})`, height: `calc(${u} * ${o.height})` }}
          >
            {OBSTACLE_ICONS[o.kind]}
          </span>
        ))}
        {course.chests.map((c) => {
          const st = flow.states[c.index];
          const chest = flow.chests[c.index]!;
          return (
            <button
              key={c.index}
              className={`jump-chest ${st ?? 'closed'} ${c.y >= HIGH_CHEST_Y ? 'high' : ''}`}
              data-chest-index={c.index}
              data-chest-x={c.x}
              data-chest-high={c.y >= HIGH_CHEST_Y}
              aria-label={de.activities.chest}
              // Tapping a high chest explains what to do (pre-readers).
              onClick={() => c.y >= HIGH_CHEST_Y && speech().speak(de.activities.jump.highChest)}
              style={{ ...at(c.x, c.y), width: `calc(${u} * 0.9)` }}
            >
              {c.y >= HIGH_CHEST_Y && <span className="jump-cloud" aria-hidden>☁️</span>}
              {st === 'solved' ? <span aria-hidden>✨</span> : <ChestFace tier={chest.tier} emblem={CHEST_EMBLEMS[c.index % CHEST_EMBLEMS.length]!} />}
            </button>
          );
        })}
        <span className="jump-goal" aria-hidden style={at(course.goalX, 0)}>
          🚩
        </span>
        <span
          className={`jump-avatar ${stumbling ? 'stumble' : ''}`}
          aria-hidden
          style={{ ...at(view.x, view.y), background: profile.avatar.color, width: `calc(${u} * 0.8)`, height: `calc(${u} * 0.8)` }}
        >
          {animalIcons[profile.avatar.animal]}
          {stumbling && <span className="jump-stars">💫</span>}
        </span>
      </div>

      <div className="jump-controls">
        <button className="jump-button" aria-label={de.activities.jump.left} data-testid="jump-left" {...hold('left')}>
          ⬅️
        </button>
        <button
          className="jump-button hop"
          aria-label={de.activities.jump.hop}
          data-testid="jump-hop"
          onPointerDown={() => (input.current.jump = true)}
        >
          ⬆️
        </button>
        <button className="jump-button" aria-label={de.activities.jump.right} data-testid="jump-right" {...hold('right')}>
          ➡️
        </button>
      </div>

      {flow.overlays}

      {showEnd && (
        <div className="overlay" role="dialog" aria-modal data-testid="jump-done">
          <div className="dialog">
            <div className="dialog-icon" aria-hidden>
              🚩🎉
            </div>
            <h2>{de.activities.jump.goalTitle}</h2>
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
