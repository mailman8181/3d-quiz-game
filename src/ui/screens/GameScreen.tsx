import { useEffect, useRef, useState } from 'react';
import { playFanfare, playPling } from '../../audio/sfx';
import { speech } from '../../audio/speech';
import { de } from '../../content/de/strings';
import { generateMaze } from '../../core/maze/generate';
import { findPath } from '../../core/maze/pathfinding';
import type { Tile } from '../../core/maze/types';
import type { Profile } from '../../core/profile/profile';
import { createRng, randomSeed } from '../../core/rng';
import { isLostAnimal, nextLostAnimal, type LostAnimal } from '../../core/profile/lostAnimals';
import { lostAnimalIcons } from '../lostAnimalIcons';
import { StarJar } from '../rewards/StarJar';
import { Wardrobe } from '../rewards/Wardrobe';
import { chestIndex, MazeSession } from '../../core/session/mazeSession';
import { useChestFlow } from '../activities/chestFlow';
import type { SubjectId } from '../../core/challenges/types';
import { currentLevel, levelSpec } from '../../core/progress/levels';
import type { ChallengeOutcome } from '../../core/skills/skillModel';
import type { StageId } from '../../core/learner/stage';
import { getWorld, worlds } from '../../modules/worlds';
import { progressFor } from '../../modules/activities';
import { MazeView } from '../../render/MazeView';

interface Props {
  profile: Profile;
  worldId: string;
  /** Subjects chosen for this session (chests only contain these). */
  subjects: readonly SubjectId[];
  /** Learner stage today (ADR-0009); null = not set, all levels allowed. */
  stage: StageId | null;
  /** Parent-set play time is over: show the break screen (after a running challenge). */
  breakDue: boolean;
  onHome: () => void;
  onStars: (stars: number) => void;
  onMazeCompleted: (worldId: string) => void;
  onChooseReward: (itemId: string | null) => void;
  onToggleEquip: (itemId: string) => void;
  onRescue: (animal: LostAnimal) => void;
  onChallengeResult: (typeId: string, level: number, outcome: ChallengeOutcome) => void;
  onSetPet: (animal: LostAnimal | null) => void;
}

const HINT_STEPS = 6;
const HINT_COOLDOWN_MS = 15_000;

/** Seed can be forced via ?seed=123 (reproducible bug reports / E2E tests). */
function seedFromUrl(): number | null {
  const v = new URLSearchParams(window.location.search).get('seed');
  return v && /^\d+$/.test(v) ? Number(v) : null;
}

/** Arrow-key route as a string of U/R/D/L (test hook only). */
function route(path: Tile[]): string {
  return path
    .slice(1)
    .map((t, i) => {
      const p = path[i]!;
      return t.x > p.x ? 'R' : t.x < p.x ? 'L' : t.y > p.y ? 'D' : 'U';
    })
    .join('');
}

/**
 * The maze activity. Like every activity (ADR-0010) a round is a keyed component, so "next
 * level" remounts it and the shared chest flow plans fresh chests.
 */
export function GameScreen(props: Props) {
  const [round, setRound] = useState(0);
  return <MazeRound key={round} {...props} round={round} onNextRound={() => setRound((r) => r + 1)} />;
}

function MazeRound({
  profile,
  worldId,
  subjects,
  stage,
  breakDue,
  onHome,
  onStars,
  onMazeCompleted,
  onChooseReward,
  onToggleEquip,
  onRescue,
  onSetPet,
  onChallengeResult,
  round,
  onNextRound,
}: Props & { round: number; onNextRound: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<MazeSession | null>(null);
  const viewRef = useRef<MazeView | null>(null);
  const [goalStars, setGoalStars] = useState<number | null>(null);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  // Fixed for the round: seed (?seed=N for tests) and maze size from the child's level.
  const [seed] = useState(() => {
    const forced = seedFromUrl();
    return forced !== null ? forced + round : randomSeed();
  });
  const [spec] = useState(() => levelSpec(currentLevel(profile.levels[worldId])));
  const level = spec.level;
  const flow = useChestFlow({
    profile,
    stage,
    subjects,
    breakDue,
    count: spec.chests,
    seed,
    worldId,
    holdPicker: goalStars !== null || wardrobeOpen,
    onStars,
    onChallengeResult,
    onChooseReward,
    onHome,
    onChestSolved: (i, stars) => sessionRef.current?.solveChest(`chest-${i}`, stars),
    onChestSkipped: (i) => sessionRef.current?.skipChest(`chest-${i}`),
  });
  const flowRef = useRef(flow);
  useEffect(() => {
    flowRef.current = flow;
  });
  const equippedRef = useRef(profile.equipped);
  const rescuedRef = useRef(profile.rescued);
  const levelsRef = useRef(profile.levels);
  useEffect(() => {
    levelsRef.current = profile.levels;
  }, [profile.levels]);
  const [guide, setGuide] = useState<string>('olli');
  const [newWorld, setNewWorld] = useState<string | null>(null);
  // Will finishing this maze unlock a new activity (ADR-0010)? Kept in a ref for the maze events.
  const [newActivity, setNewActivity] = useState(false);
  const unlocksActivity = progressFor(profile, stage, 1).unlocked.length > progressFor(profile, stage).unlocked.length;
  const unlocksActivityRef = useRef(unlocksActivity);
  useEffect(() => {
    unlocksActivityRef.current = unlocksActivity;
  }, [unlocksActivity]);
  const pet = profile.pet && isLostAnimal(profile.pet) ? profile.pet : null;
  const petRef = useRef(pet);
  const [lostAnimal, setLostAnimal] = useState<LostAnimal>('chick');
  const callbacks = useRef({ onMazeCompleted, onRescue });
  useEffect(() => {
    callbacks.current = { onMazeCompleted, onRescue };
  }, [onMazeCompleted, onRescue]);
  useEffect(() => {
    rescuedRef.current = profile.rescued;
  }, [profile.rescued]);
  useEffect(() => {
    petRef.current = pet;
    viewRef.current?.setPet(pet);
  }, [pet]);

  // Outfit changes are applied to the running maze (no rebuild).
  useEffect(() => {
    equippedRef.current = profile.equipped;
    viewRef.current?.setEquipped(profile.equipped);
  }, [profile.equipped]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const world = getWorld(worldId);
    const forced = seedFromUrl();
    const animal = nextLostAnimal(rescuedRef.current, createRng(seed), world.lostAnimals);
    setGuide(world.guide);
    setLostAnimal(animal);
    // Chest contents come from the shared chest flow (ADR-0010); the maze only places them.
    const session = new MazeSession(generateMaze({ cols: spec.cols, rows: spec.rows, braid: world.maze.braid, seed }), {
      chests: flow.chests,
    });
    sessionRef.current = session;
    container.dataset.goalTile = `${session.maze.goal.x},${session.maze.goal.y}`;
    if (forced !== null && session.chests.length > 0) {
      // Route to the nearest chest (no other chest can lie on it).
      const paths = session.chests.map((c) => findPath(session.maze, session.maze.start, c.tile) ?? []);
      const nearest = paths.reduce((a, b) => (b.length < a.length ? b : a));
      container.dataset.testRouteChest = route(nearest);
    }
    if (forced !== null) {
      container.dataset.testRouteGoal = route(findPath(session.maze, session.maze.start, session.maze.goal) ?? []);
    }
    const view = new MazeView({
      container,
      session,
      world,
      avatar: profile.avatar,
      equipped: equippedRef.current,
      lostAnimal: animal,
      pet: petRef.current,
      onEvent: (ev) => {
        if (ev.type === 'chestReached') {
          playPling();
          view.setPaused(true);
          flowRef.current.open(chestIndex(ev.chestId));
        } else if (ev.type === 'goalReached') {
          setGoalStars(session.starsEarned);
          playFanfare();
          // Did this maze unlock another world?
          const finished = (levelsRef.current[world.id] ?? 0) + 1;
          const unlocked = worlds.find((w) => w.unlock?.world === world.id && w.unlock.mazes === finished);
          setNewWorld(unlocked?.id ?? null);
          setNewActivity(unlocksActivityRef.current);
          speech().speak(
            unlocked
              ? de.worldSelect.speakUnlocked
              : unlocksActivityRef.current
                ? de.activities.speakUnlocked
                : de.lostAnimals[animal].speakGoal,
          );
          callbacks.current.onRescue(animal);
          callbacks.current.onMazeCompleted(world.id);
        }
      },
    });
    viewRef.current = view;
    speech().speak(de.lostAnimals[animal].speakStart);
    return () => {
      view.dispose();
      viewRef.current = null;
      sessionRef.current = null;
      speech().stop();
    };
  }, [profile.avatar, worldId, seed, spec, flow.chests]);

  // "Olli zeigt den Weg": short glowing path, then a cool-down so it stays a help, not autopilot.
  const [hintReadyAt, setHintReadyAt] = useState(0);
  const [hintCooling, setHintCooling] = useState(false);
  const showWay = () => {
    const now = performance.now();
    if (now < hintReadyAt) {
      speech().speak(de.wayHint.wait);
      return;
    }
    const tiles = sessionRef.current?.hintPath(HINT_STEPS) ?? [];
    viewRef.current?.showWayHint(tiles);
    speech().speak(de.wayHint.speak);
    setHintReadyAt(now + HINT_COOLDOWN_MS);
    setHintCooling(true);
    window.setTimeout(() => setHintCooling(false), HINT_COOLDOWN_MS);
  };

  // The chest flow shows the question, the reward picker (held back during the goal dialog and
  // the wardrobe) and the break screen; the maze pauses while any dialog is open.
  const blocked = flow.busy || wardrobeOpen || goalStars !== null;
  useEffect(() => {
    viewRef.current?.setPaused(blocked);
  }, [blocked]);

  return (
    <main className="screen game-screen">
      <div className="game-canvas" ref={containerRef} data-testid="game-canvas" />
      <div className="hud">
        <button className="round-button" aria-label={de.game.home} onClick={onHome}>
          🏠
        </button>
        <button className="guide-bubble" onClick={() => speech().speak(de.lostAnimals[lostAnimal].speakStart)}>
          <span className="level-pill" data-testid="level">
            {de.levels.badge(level)}
          </span>
          <span aria-hidden>{de.guideIcons[guide]}</span> {de.lostAnimals[lostAnimal].hint}
        </button>
        <div className="hud-right">
          <StarJar jar={profile.jar} />
          <button className="round-button" aria-label={de.rewards.wardrobe} data-testid="wardrobe-button" onClick={() => setWardrobeOpen(true)}>
            🎒
          </button>
        </div>
      </div>

      <button
        className={`way-hint-button ${hintCooling ? 'cooling' : ''}`}
        aria-label={de.wayHint.button}
        data-testid="way-hint"
        onClick={showWay}
      >
        <span aria-hidden>{de.guideIcons[guide]}</span>
        <span aria-hidden className="way-hint-arrow">
          ➜
        </span>
      </button>

      {flow.overlays}

      {wardrobeOpen && (
        <Wardrobe profile={profile} onToggle={onToggleEquip} onSetPet={onSetPet} onClose={() => setWardrobeOpen(false)} />
      )}

      {goalStars !== null && (
        <div className="overlay" role="dialog" aria-modal>
          <div className="dialog">
            <div className="dialog-icon" aria-hidden>
              {lostAnimalIcons[lostAnimal]}
            </div>
            <h2>{de.game.goalTitle}</h2>
            <p>{de.lostAnimals[lostAnimal].goalText}</p>
            <p className="level-done">🏆 {de.levels.done(level)}</p>
            {newWorld && (
              <p className="new-world" data-testid="new-world">
                {de.worlds[newWorld]?.icon} {de.worldSelect.unlocked}
              </p>
            )}
            {newActivity && (
              <p className="new-world" data-testid="new-activity">
                🎁 {de.activities.unlocked}
              </p>
            )}
            {levelSpec(level + 1).cols * levelSpec(level + 1).rows > levelSpec(level).cols * levelSpec(level).rows && (
              <p className="hint-text">{de.levels.bigger}</p>
            )}
            <p className="stars-won">⭐ {de.game.goalStars(goalStars)}</p>
            <div className="button-row">
              <button className="button secondary" aria-label={de.game.home} onClick={onHome}>
                🏠
              </button>
              <button
                className="button primary"
                onClick={onNextRound}
              >
                {de.levels.next(level + 1)}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
