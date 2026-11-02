import type { NeighborsData } from '../../modules/challenges/math-neighbors';
import type { ChallengeViewProps } from './types';

/** Number row "4 → ?" or "? → 4"; the gap fills in when solved. */
export function NeighborsView({ data, solved }: ChallengeViewProps<NeighborsData>) {
  const gap = (
    <span className={`number-box gap ${solved ? 'solved' : ''}`}>{solved ? data.answer : '?'}</span>
  );
  const known = <span className="number-box">{data.n}</span>;
  return (
    <div className="task-area neighbors-area" data-testid="task-area">
      {data.ask === 'after' ? known : gap}
      <span className="number-arrow" aria-hidden>
        ➜
      </span>
      {data.ask === 'after' ? gap : known}
    </div>
  );
}
