import { useEffect, useRef, useState } from 'react';
import { playFanfare, playPling } from '../../audio/sfx';
import { speech } from '../../audio/speech';
import { de } from '../../content/de/strings';
import { createCourse, initialJump, jumpLayout, step, type Course, type JumpInput, type JumpState } from '../../core/activities/jump';
import type { SubjectId } from '../../core/challenges/types';
import type { StageId } from '../../core/learner/stage';
import type { Profile } from '../../core/profile/profile';
import { createRng, randomSeed } from '../../core/rng';
import type { ChallengeOutcome } from '../../core/skills/skillModel';
import type { LostAnimal } from '../../core/profile/lostAnimals';
import { progressFor } from '../../modules/activities';
import { JumpView } from '../../render/JumpView';
import { StarJar } from '../rewards/StarJar';
import { useChestFlow, type ChestFlow } from './chestFlow';

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
  const [done, setDone] = useState(false);
  const [newGame, setNewGame] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<JumpView | null>(null);

  // The game loop reads the latest values through refs (it runs outside React renders).
  const input = useRef<JumpInput>({ left: false, right: false, jump: false });
  const state = useRef<JumpState>(initialJump(course));
  const flowRef = useRef<ChestFlow>(flow);
  const profileRef = useRef(profile);
  const callbacks = useRef({ onRoundCompleted });
  useEffect(() => {
    flowRef.current = flow;
    profileRef.current = profile;
    callbacks.current = { onRoundCompleted };
  });

  // The 3D view (ADR-0018): built once per round; the loop below feeds it the logic state.
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;
    const p = profileRef.current;
    const view = new JumpView({
      container,
      course,
      avatar: p.avatar,
      equipped: p.equipped,
      pet: (p.pet as LostAnimal | null) ?? null,
      chestTiers: flowRef.current.chests.map((c) => c.tier),
      onTapBlock: () => speech().speak(de.activities.jump.highChest),
    });
    view.sync(state.current, 0);
    viewRef.current = view;
    return () => {
      view.dispose();
      viewRef.current = null;
    };
  }, [course]);
  useEffect(() => {
    viewRef.current?.setChestStates(flow.states);
  }, [flow.states]);

  useEffect(() => {
    speech().speak(de.activities.intros.jump ?? '');
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!flowRef.current.busy && !state.current.done) {
        const dir = (input.current.right ? 1 : 0) - (input.current.left ? 1 : 0);
        const r = step(course, state.current, input.current, dt);
        input.current.jump = false; // a tap is one hop
        state.current = r.state;
        viewRef.current?.sync(r.state, dir);
        viewRef.current?.handleEvents(r.events);
        // Test hook / debugging: the avatar's position (no React render per frame).
        mainRef.current?.setAttribute('data-avatar-x', r.state.x.toFixed(1));
        for (const ev of r.events) {
          if (ev.kind === 'chest' && flowRef.current.states[ev.index] !== 'solved') {
            playPling();
            input.current = { left: false, right: false, jump: false };
            flowRef.current.open(ev.index);
          } else if (ev.kind === 'stumble') {
            speech().speak(de.activities.jump.stumble);
          } else if (ev.kind === 'stomp') {
            playPling();
          } else if (ev.kind === 'goal') {
            input.current = { left: false, right: false, jump: false };
            const p = profileRef.current;
            const after = { ...p, activityRounds: { ...p.activityRounds, jump: (p.activityRounds.jump ?? 0) + 1 } };
            setNewGame(progressFor(p, stage).unlocked.length < progressFor(after, stage).unlocked.length);
            callbacks.current.onRoundCompleted();
            setDone(true);
          }
        }
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
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      speech().stop();
    };
  }, [course, stage]);

  const showEnd = done && !flow.busy;
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

  return (
    <main className="screen jump-screen" data-testid="jump" data-avatar-x="1.0" ref={mainRef}>
      <div className="jump-canvas" ref={canvasRef} data-testid="jump-canvas" />
      {/* Test hooks: one marker per chest (the chests themselves are drawn in 3D). */}
      <div hidden>
        {course.chests.map((c) => (
          <span key={c.index} data-chest-index={c.index} data-chest-x={c.x} data-chest-high={c.inBlock} data-chest-state={flow.states[c.index]} />
        ))}
      </div>
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
