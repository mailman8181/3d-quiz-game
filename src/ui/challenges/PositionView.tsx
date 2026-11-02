import { BOX_EMOJI, POSITION_OBJECTS, POSITION_PHRASES, type Position } from '../../content/de/preschool';
import type { PositionData } from '../../modules/challenges/math-position';
import type { ChallengeViewProps } from './types';

/** A box (two for "zwischen") and the object on, under, beside or between them. */
function Scene({ object, position }: { object: string; position: Position }) {
  return (
    <span className={`position-scene pos-${position}`} aria-hidden>
      <span className="pos-box a">{BOX_EMOJI}</span>
      {position === 'between' && <span className="pos-box b">{BOX_EMOJI}</span>}
      <span className="pos-object">{object}</span>
    </span>
  );
}

export function PositionView({ data, solved, answers }: ChallengeViewProps<PositionData>) {
  const object = POSITION_OBJECTS.find((o) => o.id === data.object)!;
  return (
    <div className="rhyme-wrap" data-testid="task-area">
      <div className="picture-choices">
        {data.scenes.map((position, i) => {
          const choiceId = `c${i}`;
          const wrong = answers?.wrongChoiceIds.includes(choiceId);
          const correct = solved && answers?.correctChoiceId === choiceId;
          return (
            <div key={position} className={`picture-choice ${wrong ? 'wrong' : ''} ${correct ? 'correct' : ''}`}>
              <button
                className="picture-button scene-button"
                disabled={solved || wrong}
                aria-label={`${object.name} ${POSITION_PHRASES[position]}`}
                onClick={() => answers?.onChoose(choiceId)}
              >
                <Scene object={object.emoji} position={position} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
