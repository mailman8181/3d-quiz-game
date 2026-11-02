import type { AdditionData } from '../../modules/challenges/math-addition';
import { objectIcons } from './objectIcons';
import type { ChallengeViewProps } from './types';

export function AdditionView({ data, hint, solved }: ChallengeViewProps<AdditionData>) {
  // Objects only up to 20; beyond that the equation alone (counting 80 apples helps nobody).
  const pictures = (data.showPictures || hint || solved) && data.a <= 20;
  const icon = objectIcons[data.object];
  const size = data.sum <= 10 ? 30 : 22;
  const group = (n: number, offset: number) => (
    <span className="object-group">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="task-object inline" style={{ fontSize: size }}>
          {icon}
          {(hint || solved) && (
            <span className="count-badge" style={{ animationDelay: `${(offset + i) * 0.2}s` }}>
              {offset + i + 1}
            </span>
          )}
        </span>
      ))}
    </span>
  );
  return (
    <div className="task-area addition-area" data-testid="task-area">
      <div className="equation" aria-live="polite">
        <span>{data.a}</span>
        <span className="op">+</span>
        <span>{data.b}</span>
        <span className="op">=</span>
        <span className={`result ${solved ? 'solved' : ''}`}>{solved ? data.sum : '?'}</span>
      </div>
      {pictures && (
        <div className="picture-row">
          {group(data.a, 0)}
          <span className="op small">+</span>
          {group(data.b, data.a)}
        </div>
      )}
    </div>
  );
}
