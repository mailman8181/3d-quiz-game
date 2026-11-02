import type { DoubleHalfData } from '../../modules/challenges/math-double-half';
import type { ChallengeViewProps } from './types';

const Dots = ({ n, className }: { n: number; className: string }) => (
  <span className={`mirror-dots ${className}`}>
    {Array.from({ length: n }, (_, i) => (
      <span key={i} className="unit-dot filled" />
    ))}
  </span>
);

/**
 * Doubling: dots + mirror line + (mirrored dots when solved/hint).
 * Halving: dots split by the mirror line. Without dots: the number and "×2" / "÷2".
 */
export function DoubleHalfView({ data, hint, solved }: ChallengeViewProps<DoubleHalfData>) {
  const show = data.dots || hint || solved;
  const half = data.ask === 'half' ? data.answer : data.n;
  return (
    <div className="task-area double-area" data-testid="task-area">
      <div className="double-label">
        {data.ask === 'double' ? `${data.n} · 2` : `${data.n} : 2`} = {solved ? data.answer : '?'}
      </div>
      {show && data.n <= 20 && (
        <div className="mirror" aria-hidden>
          <Dots n={half} className="left" />
          <span className="mirror-line" />
          {data.ask === 'half' || hint || solved ? <Dots n={half} className="right" /> : <span className="mirror-dots right empty" />}
        </div>
      )}
    </div>
  );
}
