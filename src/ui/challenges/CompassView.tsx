import { speech } from '../../audio/speech';
import { DIRECTION_NAMES, MAP_PLACES } from '../../content/de/wissen4';
import { de } from '../../content/de/strings';
import type { CompassData } from '../../modules/challenges/wissen4';
import type { ChallengeViewProps } from './types';

/** 3×3 map: the school in the middle, four places around it, a compass rose in the corner. */
export function CompassView({ data, solved, answers }: ChallengeViewProps<CompassData>) {
  const at = (d: keyof CompassData['places']) => MAP_PLACES.find((p) => p.id === data.places[d])!;
  const cell = (d: keyof CompassData['places'] | null, extra = '') => {
    const p = d ? at(d) : null;
    return (
      <span className={`map-cell ${extra} ${solved && d === data.dir ? 'marked' : ''}`}>
        {p?.emoji}
      </span>
    );
  };
  return (
    <div className="rhyme-wrap" data-testid="task-area">
      <div className="task-area map-area" aria-hidden>
        <div className="map-grid">
          <span className="map-cell compass">
            <span className="compass-n">{DIRECTION_NAMES.north.short}</span>
            🧭
          </span>
          {cell('north')}
          <span className="map-cell" />
          {cell('west')}
          <span className="map-cell school">🏫</span>
          {cell('east')}
          <span className="map-cell" />
          {cell('south')}
          <span className="map-cell" />
        </div>
      </div>
      <div className={`picture-choices ${data.ask === 'direction' ? 'word-cards' : ''}`}>
        {data.options.map((o, i) => {
          const choiceId = `c${i}`;
          const wrong = answers?.wrongChoiceIds.includes(choiceId);
          const correct = solved && answers?.correctChoiceId === choiceId;
          return (
            <div key={i} className={`picture-choice ${wrong ? 'wrong' : ''} ${correct ? 'correct' : ''}`}>
              <button
                className={`picture-button ${data.ask === 'direction' ? 'word-button' : ''}`}
                disabled={solved || wrong}
                aria-label={o.label}
                onClick={() => answers?.onChoose(choiceId)}
              >
                {o.emoji ? <span aria-hidden>{o.emoji}</span> : o.label}
              </button>
              <button className="say-word" aria-label={`${de.challenge.listen}: ${o.label}`} onClick={() => speech().speak(o.label)}>
                🔊
              </button>
              {o.emoji && <span className="word-caption">{o.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
