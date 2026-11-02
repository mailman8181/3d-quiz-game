import type { DiceData } from '../../modules/challenges/math-dice';
import type { ChallengeViewProps } from './types';

/** Pip positions on a 3×3 grid (row-major cells 0..8) for die faces 1–6. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Die({ n }: { n: number }) {
  return (
    <span className="die" aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`pip ${PIPS[n]?.includes(i) ? 'on' : ''}`} />
      ))}
    </span>
  );
}

/** Ten-frame: 2 rows of 5, filled left to right, top row first. */
function TenFrame({ n }: { n: number }) {
  return (
    <span className="ten-frame" aria-hidden>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={`unit-dot ${i < n ? 'filled' : 'empty'}`} />
      ))}
    </span>
  );
}

/** Dice faces or ten-frames; solved shows the total. */
export function DiceView({ data, solved }: ChallengeViewProps<DiceData>) {
  const total = data.groups.reduce((s, n) => s + n, 0);
  return (
    <div className="task-area dice-area" data-testid="task-area">
      <div className="dice-row">
        {data.groups.map((n, i) => (data.frame === 'dice' ? <Die key={i} n={n} /> : <TenFrame key={i} n={n} />))}
      </div>
      {solved && <div className="big-number solved">{total}</div>}
    </div>
  );
}
