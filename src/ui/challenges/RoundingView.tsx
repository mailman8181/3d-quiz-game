import type { RoundingData } from '../../modules/challenges/math-rounding';
import type { ChallengeViewProps } from './types';

/** The number on a line between its two neighbouring tens/hundreds/thousands. */
export function RoundingView({ data, hint, solved }: ChallengeViewProps<RoundingData>) {
  const pos = ((data.n - data.lower) / (data.upper - data.lower)) * 100;
  const fmt = (v: number) => v.toLocaleString('de-DE');
  return (
    <div className="task-area rounding-area" data-testid="task-area">
      <div className="big-number">{fmt(data.n)}</div>
      <div className="number-line" aria-hidden>
        <span className="tick end" style={{ left: '0%' }}>
          {fmt(data.lower)}
        </span>
        {(hint || solved) && (
          <span className="tick middle" style={{ left: '50%' }}>
            {fmt(data.lower + data.to / 2)}
          </span>
        )}
        <span className="tick end" style={{ left: '100%' }}>
          {fmt(data.upper)}
        </span>
        <span className="marker" style={{ left: `${pos}%` }} />
        {solved && <span className={`arrow ${data.answer === data.upper ? 'up' : 'down'}`} style={{ left: `${pos}%` }} />}
      </div>
    </div>
  );
}
