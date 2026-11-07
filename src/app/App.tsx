import { useEffect, useMemo, useState } from 'react';
import { setSfxEnabled } from '../audio/sfx';
import { setSpeechEnabled } from '../audio/speech';
import { ParentGate } from '../ui/parents/ParentGate';
import { ParentsArea } from '../ui/parents/ParentsArea';
import { createProfile, type Avatar } from '../core/profile/profile';
import { addProfile, migrateSave, removeProfile, setActiveProfile, updateProfile, updateSettings } from '../core/save/save';
import { MAX_NAME_LENGTH } from '../core/profile/profile';
import { fillJar, toggleEquip } from '../core/rewards/rewards';
import { autoPlace, placeDecor, removeDecor, type TreehouseSpot } from '../core/rewards/treehouse';
import { initialSkill, recordOutcome, type ChallengeOutcome } from '../core/skills/skillModel';
import type { Profile } from '../core/profile/profile';
import { challengeTypes, getChallengeType } from '../modules/challenges';
import { allowedSubjects, sessionSubjects, toggleSubject } from '../core/challenges/subjects';
import { levelWindow, typesForStage } from '../core/challenges/selection';
import { createLearner, currentStage, type StageId } from '../core/learner/stage';
import { StageScreen } from '../ui/screens/StageScreen';
import { MemoryScreen } from '../ui/activities/MemoryScreen';
import { JumpScreen } from '../ui/activities/JumpScreen';
import { progressFor } from '../modules/activities';
import type { SubjectId } from '../core/challenges/types';
import { WorldSelectScreen } from '../ui/worlds/WorldSelectScreen';
import { TreehouseScreen } from '../ui/treehouse/TreehouseScreen';
import { getRewardItem } from '../modules/rewards/catalog';
import { CreateProfileScreen } from '../ui/screens/CreateProfileScreen';
import { GameScreen } from '../ui/screens/GameScreen';
import { ProfileSelectScreen } from '../ui/screens/ProfileSelectScreen';
import { createIdbStore, newId } from './storage';
import { useSave } from './useSave';

type Screen =
  | { name: 'profiles' }
  | { name: 'create' }
  | { name: 'worlds' }
  | { name: 'game'; worldId: string }
  | { name: 'treehouse' }
  | { name: 'parents' }
  | { name: 'activity'; id: string }
  /** One-time "Kindergarten oder Schule?" (ADR-0009), then continue to `next`. */
  | { name: 'stage'; next: 'game' | 'worlds' };

/** A chosen reward goes into the inventory and is worn or placed right away. */
function chooseReward(p: Profile, itemId: string | null): Profile {
  const item = itemId ? getRewardItem(itemId) : undefined;
  return {
    ...p,
    pendingRewards: Math.max(0, p.pendingRewards - 1),
    inventory: item && !p.inventory.includes(item.id) ? [...p.inventory, item.id] : p.inventory,
    // A new item is worn right away (or placed in the tree house) so the child sees it.
    equipped: item && item.slot !== 'decor' ? { ...p.equipped, [item.slot]: item.id } : p.equipped,
    treehouse: item?.slot === 'decor' ? autoPlace(p.treehouse, item.id) : p.treehouse,
  };
}

/** Skill model update for one answered chest, limited to the stage window (ADR-0009). */
function recordChallenge(p: Profile, typeId: string, level: number, outcome: ChallengeOutcome, stage: StageId | null): Profile {
  const type = getChallengeType(typeId);
  const range = levelWindow(type, stage) ?? { startLevel: 1, maxLevel: type.levels };
  const current = p.skills[typeId] ?? initialSkill(range.startLevel);
  return { ...p, skills: { ...p.skills, [typeId]: recordOutcome(current, outcome, level, range.maxLevel) } };
}

export function App() {
  const store = useMemo(() => createIdbStore(), []);
  const { doc, update } = useSave(store);
  const [screen, setScreen] = useState<Screen>({ name: 'profiles' });
  const [gateOpen, setGateOpen] = useState(false);
  // Child's subject choice for this session (null = all that parents allow).
  const [chosenSubjects, setChosenSubjects] = useState<SubjectId[] | null>(null);
  // Play-time limit: counted from the first maze of this app session (memory only).
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const limitMinutes = doc?.settings.sessionMinutes ?? 0;
  const startGame = (worldId = 'forest') => {
    setSessionStart((s) => s ?? Date.now());
    setScreen({ name: 'game', worldId });
  };
  useEffect(() => {
    if (!limitMinutes) return;
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, [limitMinutes]);
  const breakDue = limitMinutes > 0 && sessionStart !== null && now - sessionStart >= limitMinutes * 60_000;
  const speechOn = doc?.settings.speech ?? true;

  useEffect(() => setSpeechEnabled(speechOn), [speechOn]);
  const sfxOn = doc?.settings.sfx ?? true;
  useEffect(() => setSfxEnabled(sfxOn), [sfxOn]);

  if (!doc) return <div className="loading" />;

  if (screen.name === 'parents') {
    return (
      <ParentsArea
        doc={doc}
        onRename={(id, name) =>
          update((d) => updateProfile(d, id, (p) => ({ ...p, name: name.trim().slice(0, MAX_NAME_LENGTH) })))
        }
        onToggleChallenge={(id, typeId, enabled) =>
          update((d) =>
            updateProfile(d, id, (p) => ({
              ...p,
              disabledChallenges: enabled
                ? p.disabledChallenges.filter((t) => t !== typeId)
                : [...new Set([...p.disabledChallenges, typeId])],
            })),
          )
        }
        onStage={(id, stage) =>
          update((d) =>
            updateProfile(d, id, (p) => ({
              ...p,
              learner: stage ? createLearner(stage, new Date()) : null,
              stageAsked: true,
            })),
          )
        }
        onDelete={(id) => update((d) => removeProfile(d, id))}
        onSpeech={(on) => update((d) => updateSettings(d, { speech: on }))}
        onSfx={(on) => update((d) => updateSettings(d, { sfx: on }))}
        onSessionMinutes={(minutes) => update((d) => updateSettings(d, { sessionMinutes: minutes }))}
        onEndBreak={() => {
          setSessionStart(null);
          setNow(Date.now());
        }}
        onImport={(raw) => update(() => migrateSave(raw))}
        onClose={() => setScreen({ name: 'profiles' })}
      />
    );
  }

  const active = doc.profiles.find((p) => p.id === doc.activeProfileId) ?? null;
  const stage: StageId | null = active?.learner ? currentStage(active.learner, new Date(now)) : null;
  const allowed = active ? allowedSubjects(typesForStage(challengeTypes, stage), active.disabledChallenges) : [];

  if (screen.name === 'stage' && active) {
    const answer = (chosen: StageId | null) => {
      update((d) =>
        updateProfile(d, active.id, (p) => ({
          ...p,
          learner: chosen ? createLearner(chosen, new Date()) : p.learner,
          stageAsked: true,
        })),
      );
      if (screen.next === 'game') startGame();
      else setScreen({ name: 'worlds' });
    };
    return <StageScreen onChoose={(s) => answer(s)} onLater={() => answer(null)} />;
  }
  const subjects = sessionSubjects(chosenSubjects, allowed);

  if (screen.name === 'create' || (screen.name === 'profiles' && doc.profiles.length === 0)) {
    return (
      <CreateProfileScreen
        canGoBack={doc.profiles.length > 0}
        onBack={() => setScreen({ name: 'profiles' })}
        onCreate={(name: string, avatar: Avatar) => {
          update((d) => addProfile(d, createProfile({ id: newId(), name, avatar, now: Date.now() })));
          setScreen({ name: 'stage', next: 'game' });
        }}
      />
    );
  }

  if (screen.name === 'worlds' && active) {
    return (
      <WorldSelectScreen
        profile={active}
        allowed={allowed}
        chosen={subjects}
        onToggleSubject={(s) => setChosenSubjects(toggleSubject(subjects, s))}
        onChoose={(worldId) => startGame(worldId)}
        activities={progressFor(active, stage)}
        onActivity={(id) => {
          setSessionStart((s) => s ?? Date.now());
          setScreen({ name: 'activity', id });
        }}
        onTreehouse={() => setScreen({ name: 'treehouse' })}
        onBack={() => setScreen({ name: 'profiles' })}
      />
    );
  }

  if (screen.name === 'treehouse' && active) {
    return (
      <TreehouseScreen
        profile={active}
        onPlace={(spot: TreehouseSpot, itemId) =>
          update((d) =>
            updateProfile(d, active.id, (p) => ({
              ...p,
              treehouse: itemId && p.inventory.includes(itemId) ? placeDecor(p.treehouse, spot, itemId) : removeDecor(p.treehouse, spot),
            })),
          )
        }
        onBack={() => setScreen({ name: 'worlds' })}
      />
    );
  }

  if (screen.name === 'activity' && active) {
    const shared = {
      profile: active,
      stage,
      subjects,
      breakDue,
      onHome: () => setScreen({ name: 'worlds' }),
      onStars: (stars: number) =>
        update((d) => updateProfile(d, active.id, (p) => ({ ...p, stars: p.stars + stars, ...fillJar(p.jar, p.pendingRewards, stars) }))),
      onChallengeResult: (typeId: string, level: number, outcome: ChallengeOutcome) =>
        update((d) => updateProfile(d, active.id, (p) => recordChallenge(p, typeId, level, outcome, stage))),
      onChooseReward: (itemId: string | null) => update((d) => updateProfile(d, active.id, (p) => chooseReward(p, itemId))),
      onRoundCompleted: () =>
        update((d) =>
          updateProfile(d, active.id, (p) => ({
            ...p,
            activityRounds: { ...p.activityRounds, [screen.id]: (p.activityRounds[screen.id] ?? 0) + 1 },
          })),
        ),
    };
    if (screen.id === 'memory') return <MemoryScreen {...shared} />;
    if (screen.id === 'jump') return <JumpScreen {...shared} />;
  }

  if (screen.name === 'game' && active) {
    return (
      <GameScreen
        profile={active}
        worldId={screen.worldId}
        subjects={subjects}
        stage={stage}
        breakDue={breakDue}
        onHome={() => setScreen({ name: 'worlds' })}
        onStars={(stars) =>
          update((d) =>
            updateProfile(d, active.id, (p) => ({ ...p, stars: p.stars + stars, ...fillJar(p.jar, p.pendingRewards, stars) })),
          )
        }
        onChooseReward={(itemId) => update((d) => updateProfile(d, active.id, (p) => chooseReward(p, itemId)))}
        onRescue={(animal) =>
          update((d) =>
            updateProfile(d, active.id, (p) =>
              p.rescued.includes(animal)
                ? p
                : // A newly rescued friend follows the child right away if no pet is chosen.
                  { ...p, rescued: [...p.rescued, animal], pet: p.pet ?? animal },
            ),
          )
        }
        onChallengeResult={(typeId, level, outcome) =>
          update((d) => updateProfile(d, active.id, (p) => recordChallenge(p, typeId, level, outcome, stage)))
        }
        onSetPet={(animal) =>
          update((d) =>
            updateProfile(d, active.id, (p) => (animal === null || p.rescued.includes(animal) ? { ...p, pet: animal } : p)),
          )
        }
        onToggleEquip={(itemId) =>
          update((d) =>
            updateProfile(d, active.id, (p) => {
              const item = getRewardItem(itemId);
              return item && p.inventory.includes(itemId) ? { ...p, equipped: toggleEquip(p.equipped, item) } : p;
            }),
          )
        }
        onMazeCompleted={(worldId) =>
          update((d) =>
            updateProfile(d, active.id, (p) => ({
              ...p,
              mazesCompleted: p.mazesCompleted + 1,
              levels: { ...p.levels, [worldId]: (p.levels[worldId] ?? 0) + 1 },
            })),
          )
        }
      />
    );
  }

  return (
    <>
      <ProfileSelectScreen
      profiles={doc.profiles}
      onSelect={(id) => {
        update((d) => setActiveProfile(d, id));
        setChosenSubjects(null);
        // Hub: worlds (locked ones show what is still to discover) and the tree house.
        // Profiles from before v9 are asked for their stage once (ADR-0009).
        const chosen = doc.profiles.find((p) => p.id === id);
        setScreen(chosen && !chosen.stageAsked ? { name: 'stage', next: 'worlds' } : { name: 'worlds' });
      }}
      onNew={() => setScreen({ name: 'create' })}
      onParents={() => setGateOpen(true)}
      />
      {gateOpen && (
        <ParentGate
          onPass={() => {
            setGateOpen(false);
            setScreen({ name: 'parents' });
          }}
          onCancel={() => setGateOpen(false)}
        />
      )}
    </>
  );
}
