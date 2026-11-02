import type { NumberBondsData } from '../../modules/challenges/math-number-bonds';
import type { ChallengeViewProps } from './types';

/** House with the total on the roof and two rooms; dots under the roof on low levels. */
export function NumberBondsView({ data, hint, solved }: ChallengeViewProps<NumberBondsData>) {
  const answer = data.total - data.known;
  const gap = <span className={`bond-room gap ${solved ? 'solved' : ''}`}>{solved ? answer : '?'}</span>;
  const known = <span className="bond-room">{data.known}</span>;
  const showDots = data.dots && (hint || solved || data.total <= 6);
  return (
    <div className="task-area bonds-area" data-testid="task-area">
      <div className="bond-house">
        <div className="bond-roof">{data.total}</div>
        <div className="bond-rooms">
          {data.missing === 'left' ? gap : known}
          {data.missing === 'left' ? known : gap}
        </div>
      </div>
      {showDots && (
        <div className="bond-dots" aria-hidden>
          {Array.from({ length: data.total }, (_, i) => (
            <span
              key={i}
              className={`unit-dot filled ${
                (data.missing === 'left' ? i >= answer : i < data.known) ? 'known' : solved || hint ? 'missing' : 'open'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
