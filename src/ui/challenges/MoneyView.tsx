import { de } from '../../content/de/strings';
import type { MoneyData } from '../../modules/challenges/math-money';
import type { ChallengeViewProps } from './types';

/** Coins (round) and notes (rectangles), labelled with their value. */
export function MoneyView({ data, solved }: ChallengeViewProps<MoneyData>) {
  const label = data.unit === 'cent' ? de.money.cent : de.money.euro;
  const total = data.items.reduce((s, x) => s + x, 0);
  return (
    <div className="task-area money-area" data-testid="task-area">
      <div className="money-row" aria-hidden>
        {data.items.map((v, i) => {
          const note = data.unit === 'euro' && v >= 5;
          return (
            <span key={i} className={`${note ? 'note' : 'coin'} ${data.unit} v${v}`}>
              {label(v)}
            </span>
          );
        })}
      </div>
      {solved && <div className="big-number solved">{label(total)}</div>}
    </div>
  );
}
