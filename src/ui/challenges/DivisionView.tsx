import type { DivisionData } from '../../modules/challenges/math-division';
import type { ChallengeViewProps } from './types';

/** "a : b = ?"; pictures (or the hint) share a dots into b groups. */
export function DivisionView({ data, hint, solved }: ChallengeViewProps<DivisionData>) {
  const groups = (data.pictures || hint || solved) && data.remainder === 0 && data.a <= 50;
  const result = data.remainder > 0 ? `${data.quotient} R ${data.remainder}` : data.quotient;
  return (
    <div className="task-area times-area" data-testid="task-area">
      <div className="double-label">
        {data.a} : {data.b} = {solved ? result : '?'}
      </div>
      {groups && (
        <div className="times-groups" aria-hidden>
          {Array.from({ length: data.b }, (_, g) => (
            <span key={g} className="times-group">
              {Array.from({ length: data.quotient }, (_, i) => (
                <span key={i} className="unit-dot filled" />
              ))}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
