import { de } from '../../content/de/strings';
import type { PlaceValueData } from '../../modules/challenges/math-place-value';
import type { ChallengeViewProps } from './types';

/** Tens sticks (10 cubes each) and loose ones; asking for tens shows the number instead. */
export function PlaceValueView({ data, solved }: ChallengeViewProps<PlaceValueData>) {
  const tens = Math.floor(data.number / 10);
  const ones = data.number % 10;
  const blocks = (
    <div className="place-blocks" aria-hidden>
      {Array.from({ length: tens }, (_, i) => (
        <span key={`t${i}`} className="ten-stick">
          {Array.from({ length: 10 }, (_, j) => (
            <span key={j} className="cube" />
          ))}
        </span>
      ))}
      <span className="ones">
        {Array.from({ length: ones }, (_, j) => (
          <span key={j} className="cube one" />
        ))}
      </span>
    </div>
  );
  return (
    <div className="task-area place-area" data-testid="task-area">
      {data.ask === 'tens' ? (
        <>
          <div className="big-number">{data.number}</div>
          {solved && blocks}
          {solved && <div className="place-label">{de.placeValue.short(tens, ones)}</div>}
        </>
      ) : (
        <>
          {blocks}
          {solved && <div className="big-number solved">{data.number}</div>}
        </>
      )}
    </div>
  );
}
