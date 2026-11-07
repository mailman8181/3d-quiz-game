import { de } from '../../content/de/strings';
import type { MoneyData } from '../../modules/challenges/math-money';
import type { ChallengeViewProps } from './types';

/** Coins (round) and notes (rectangles), labelled with their value. */
export function MoneyView({ data, solved }: ChallengeViewProps<MoneyData>) {
  const label = data.unit === 'cent' ? de.money.cent : data.unit === 'mixed' ? de.money.mixed : de.money.euro;
  // Mixed amounts: each coin keeps its own unit (2 €, 50 ct).
  const coinLabel = (v: number) => (data.unit === 'mixed' ? (v >= 100 ? de.money.euro(v / 100) : de.money.cent(v)) : label(v));
  const total = data.items.reduce((s, x) => s + x, 0);
  return (
    <div className="task-area money-area" data-testid="task-area">
      <div className="money-row" aria-hidden>
        {data.items.map((v, i) => {
          const note = data.unit === 'euro' && v >= 5;
          return (
            <span key={i} className={`${note ? 'note' : 'coin'} ${data.unit === 'mixed' && v < 100 ? 'cent' : data.unit} v${v}`}>
              {coinLabel(v)}
            </span>
          );
        })}
      </div>
      {solved && <div className="big-number solved">{label(total)}</div>}
    </div>
  );
}
