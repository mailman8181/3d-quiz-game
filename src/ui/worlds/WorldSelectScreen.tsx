import { useEffect } from 'react';
import { playPling } from '../../audio/sfx';
import { speech } from '../../audio/speech';
import { de } from '../../content/de/strings';
import type { SubjectId } from '../../core/challenges/types';
import type { Profile } from '../../core/profile/profile';
import { currentLevel } from '../../core/progress/levels';
import { isUnlocked, mazesUntilUnlock } from '../../core/progress/worlds';
import { worlds } from '../../modules/worlds';
import type { ActivityProgress } from '../../core/progress/activities';
import { alwaysOpenActivities } from '../../modules/activities';

interface Props {
  profile: Profile;
  /** Subjects parents allow and the child's current choice (owner decision 2c). */
  allowed: readonly SubjectId[];
  chosen: readonly SubjectId[];
  onToggleSubject: (subject: SubjectId) => void;
  onChoose: (worldId: string) => void;
  /** Unlocked activities and the way to the next one (ADR-0010). */
  activities: ActivityProgress;
  onActivity: (id: string) => void;
  onTreehouse: () => void;
  onBack: () => void;
}

/** "Wohin geht die Reise?" — big world cards; locked worlds say how many mazes are missing. */
export function WorldSelectScreen({ profile, allowed, chosen, onToggleSubject, onChoose, activities, onActivity, onTreehouse, onBack }: Props) {
  useEffect(() => {
    speech().speak(de.worldSelect.speak);
  }, []);

  return (
    <main className="screen menu-screen world-screen" data-testid="world-select">
      <h1 className="title">{de.worldSelect.title}</h1>
      {allowed.length > 1 && (
        <section className="subject-chips" aria-label={de.subjects.today} data-testid="subjects">
          <span className="subject-today">{de.subjects.today}</span>
          {allowed.map((s) => {
            const on = chosen.includes(s);
            return (
              <button
                key={s}
                className={`subject-chip ${on ? 'on' : ''}`}
                aria-pressed={on}
                aria-label={de.subjects.names[s]}
                onClick={() => {
                  if (on && chosen.length === 1) {
                    speech().speak(de.subjects.keepOne);
                    return;
                  }
                  playPling();
                  speech().speak(de.subjects.names[s] ?? '');
                  onToggleSubject(s);
                }}
              >
                <span aria-hidden>{de.subjects.icons[s]}</span> {de.subjects.names[s]}
              </button>
            );
          })}
        </section>
      )}
      <div className="world-grid">
        {worlds.map((w) => {
          const open = isUnlocked(w.unlock, profile.levels);
          const missing = mazesUntilUnlock(w.unlock, profile.levels);
          const name = de.worlds[w.id]?.name ?? w.id;
          return (
            <button
              key={w.id}
              className={`card world-card ${open ? '' : 'locked'}`}
              style={{ background: open ? w.colors.card : undefined }}
              aria-label={open ? name : `${name}: ${de.worldSelect.locked(missing)}`}
              onClick={() => {
                if (!open) {
                  speech().speak(de.worldSelect.speakLocked);
                  return;
                }
                playPling();
                const intro = de.guideIntro[w.guide];
                if (intro) speech().speak(intro);
                onChoose(w.id);
              }}
            >
              <span className="world-icon" aria-hidden>
                {open ? de.worlds[w.id]?.icon : '🔒'}
              </span>
              <span className="world-name">{name}</span>
              <span className="world-guide" aria-hidden>
                {de.guideIcons[w.guide]}
              </span>
              {open ? (
                <span className="profile-level">{de.levels.badge(currentLevel(profile.levels[w.id]))}</span>
              ) : (
                <span className="world-locked">{de.worldSelect.locked(missing)}</span>
              )}
            </button>
          );
        })}
        {[...alwaysOpenActivities(), ...activities.unlocked].map((id) => (
          <button
            key={id}
            className="card world-card activity-card"
            data-activity={id}
            aria-label={de.activities.names[id] ?? id}
            onClick={() => {
              playPling();
              onActivity(id);
            }}
          >
            <span className="world-icon" aria-hidden>
              {de.activities.icons[id]}
            </span>
            <span className="world-name">{de.activities.names[id] ?? id}</span>
          </button>
        ))}
        {activities.missing !== null && (
          <button
            className="card world-card locked mystery-card"
            data-testid="mystery-card"
            aria-label={`${de.activities.mysteryTitle}: ${de.activities.mysteryMissing(activities.missing, activities.mazesNeeded)}`}
            onClick={() => speech().speak(de.activities.speakMystery)}
          >
            <span className="world-icon" aria-hidden>
              ❓
            </span>
            <span className="world-name">{de.activities.mysteryTitle}</span>
            <span className="world-locked">{de.activities.mysteryMissing(activities.missing, activities.mazesNeeded)}</span>
          </button>
        )}
        <button className="card world-card treehouse-card" aria-label={de.treehouse.title} onClick={onTreehouse}>
          <span className="world-icon" aria-hidden>
            🌳🏠
          </span>
          <span className="world-name">{de.treehouse.title}</span>
        </button>
      </div>
      <button className="button secondary" onClick={onBack}>
        🏠
      </button>
    </main>
  );
}
