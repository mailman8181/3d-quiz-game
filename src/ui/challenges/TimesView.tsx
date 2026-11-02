import type { TimesData } from '../../modules/challenges/math-times';
import type { ChallengeViewProps } from './types';

/** "a · b"; pictures (or the hint) show a groups of b dots. */
export function TimesView({ data, hint, solved }: ChallengeViewProps<TimesData>) {
  const groups = (data.pictures || hint || solved) && data.a * data.b <= 50;
  return (
    <div className="task-area times-area" data-testid="task-area">
      <div className="double-label">
        {data.a} · {data.b} = {solved ? data.a * data.b : '?'}
      </div>
      {groups && (
        <div className="times-groups" aria-hidden>
          {Array.from({ length: data.a }, (_, g) => (
            <span key={g} className="times-group">
              {Array.from({ length: data.b }, (_, i) => (
                <span key={i} className="unit-dot filled" />
              ))}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
