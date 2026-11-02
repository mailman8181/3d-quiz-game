import type { BallColour, ChanceData } from '../../modules/challenges/math-chance';
import type { ChallengeViewProps } from './types';

const FILL: Record<BallColour, string> = { red: '#ff4d4d', blue: '#3a86ff', yellow: '#ffd93d', green: '#2bb673' };

/** A bag (drawn as a box) with coloured balls; the asked colour as a big ball next to it. */
export function ChanceView({ data }: ChallengeViewProps<ChanceData>) {
  return (
    <div className="task-area chance-area" data-testid="task-area">
      <span className="chance-bag" aria-hidden>
        {data.balls.map((c, i) => (
          <span key={i} className="ball" style={{ background: FILL[c] }} />
        ))}
      </span>
      <span className="chance-arrow" aria-hidden>
        ➜
      </span>
      <span className="ball big" style={{ background: FILL[data.target] }} aria-hidden>
        ?
      </span>
    </div>
  );
}
