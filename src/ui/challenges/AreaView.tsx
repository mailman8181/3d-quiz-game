import type { AreaData } from '../../modules/challenges/math-area';
import type { ChallengeViewProps } from './types';

/** Squared paper with the figure; solved: area numbers in the cells, or the border drawn bold. */
export function AreaView({ data, hint, solved }: ChallengeViewProps<AreaData>) {
  const filled = new Set(data.cells);
  let counter = 0;
  return (
    <div className="task-area area-area" data-testid="task-area">
      <div className={`area-grid ask-${data.ask} ${solved || hint ? 'show' : ''}`} style={{ gridTemplateColumns: `repeat(${data.cols}, 1fr)` }} aria-hidden>
        {Array.from({ length: data.rows }, (_, y) =>
          Array.from({ length: data.cols }, (_, x) => {
            const on = filled.has(`${x},${y}`);
            const edge = (dx: number, dy: number) => on && !filled.has(`${x + dx},${y + dy}`);
            const cls = [
              'area-cell',
              on ? 'on' : '',
              edge(0, -1) ? 'bt' : '',
              edge(1, 0) ? 'br' : '',
              edge(0, 1) ? 'bb' : '',
              edge(-1, 0) ? 'bl' : '',
            ].join(' ');
            return (
              <span key={`${x},${y}`} className={cls}>
                {on && data.ask === 'area' && (solved || hint) ? ++counter : ''}
              </span>
            );
          }),
        )}
      </div>
    </div>
  );
}
