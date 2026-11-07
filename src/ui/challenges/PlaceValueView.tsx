import { de } from '../../content/de/strings';
import type { PlaceValueData } from '../../modules/challenges/math-place-value';
import type { ChallengeViewProps } from './types';

/** Tens sticks (10 cubes each) and loose ones; asking for tens shows the number instead. */
export function PlaceValueView({ data, solved }: ChallengeViewProps<PlaceValueData>) {
  if (data.ask === 'place') return <PlaceTable data={data} solved={solved} />;
  const hundreds = Math.floor(data.number / 100);
  const tens = Math.floor(data.number / 10) % 10;
  const ones = data.number % 10;
  const blocks = (
    <div className="place-blocks" aria-hidden>
      {Array.from({ length: hundreds }, (_, i) => (
        <span key={`h${i}`} className="hundred-plate" />
      ))}
      {Array.from({ length: tens }, (_, i) => (
        <span key={`t${i}`} className="ten-stick">
          {Array.from({ length: 10 }, (_, j) => (
            <span key={j} className="cube" />
          ))}
        </span>
      ))}
      <span className="ones">
        {Array.from({ length: ones }, (_, j) => (
          <span key={j} className="cube one" />
        ))}
      </span>
    </div>
  );
  return (
    <div className="task-area place-area" data-testid="task-area">
      {data.ask === 'tens' ? (
        <>
          <div className="big-number">{data.number}</div>
          {solved && blocks}
          {solved && <div className="place-label">{de.placeValue.short(tens, ones)}</div>}
        </>
      ) : (
        <>
          {blocks}
          {solved && <div className="big-number solved">{data.number}</div>}
        </>
      )}
    </div>
  );
}

const PLACES = ['ZT', 'T', 'H', 'Z', 'E'] as const;

/** Grades 3–4: the number big; when solved, a place-value table with the asked column marked. */
function PlaceTable({ data, solved }: { data: PlaceValueData; solved: boolean }) {
  const digits = String(data.number).padStart(5, '0').split('');
  const asked = 4 - (data.place ?? 2);
  return (
    <div className="task-area place-area" data-testid="task-area">
      <div className="big-number">{data.number.toLocaleString('de-DE')}</div>
      <table className={`place-table ${solved ? 'solved' : ''}`} aria-hidden>
        <thead>
          <tr>
            {PLACES.map((p, i) => (
              <th key={p} className={i === asked ? 'asked' : ''}>
                {de.placeValue.columns[p]}
              </th>
            ))}
          </tr>
        </thead>
        {solved && (
          <tbody>
            <tr>
              {digits.map((d, i) => (
                <td key={i} className={i === asked ? 'asked' : ''}>
                  {d}
                </td>
              ))}
            </tr>
          </tbody>
        )}
      </table>
    </div>
  );
}
