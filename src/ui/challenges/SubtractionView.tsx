import type { SubtractionData } from '../../modules/challenges/math-subtraction';
import { objectIcons } from './objectIcons';
import type { ChallengeViewProps } from './types';

/** a − b = ?; pictures show a objects with the last b crossed out. */
export function SubtractionView({ data, hint, solved }: ChallengeViewProps<SubtractionData>) {
  // Objects only up to 20; beyond that the equation alone (counting 80 apples helps nobody).
  const pictures = (data.showPictures || hint || solved) && data.a <= 20;
  const size = data.a <= 10 ? 30 : 22;
  return (
    <div className="task-area addition-area" data-testid="task-area">
      <div className="equation">
        <span>{data.a}</span>
        <span className="op">−</span>
        <span>{data.b}</span>
        <span className="op">=</span>
        <span className={`result ${solved ? 'solved' : ''}`}>{solved ? data.difference : '?'}</span>
      </div>
      {pictures && (
        <div className="picture-row">
          {Array.from({ length: data.a }, (_, i) => {
            const gone = i >= data.difference;
            const remaining = i < data.difference;
            return (
              <span key={i} className={`task-object inline ${gone ? 'crossed' : ''}`} style={{ fontSize: size }}>
                {objectIcons[data.object]}
                {(hint || solved) && remaining && (
                  <span className="count-badge" style={{ animationDelay: `${i * 0.2}s` }}>
                    {i + 1}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
