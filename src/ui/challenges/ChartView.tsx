import { CHART_FRUITS, type ChartData } from '../../modules/challenges/math-chart';
import type { ChallengeViewProps } from './types';

/** Pictogram (one fruit per child) or a bar chart with a 0–10 scale; answers as cards. */
export function ChartView({ data, solved, answers }: ChallengeViewProps<ChartData>) {
  return (
    <div className="rhyme-wrap" data-testid="task-area">
      <div className={`task-area chart-area ${data.style}`} aria-hidden>
        {data.style === 'bars' && (
          <div className="chart-scale">
            {[10, 8, 6, 4, 2, 0].map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>
        )}
        {CHART_FRUITS.map((f) => {
          const v = data.values[f.id];
          const marked = f.id === data.a || f.id === data.b;
          return (
            <div key={f.id} className={`chart-col ${marked && solved ? 'marked' : ''}`}>
              {data.style === 'pictogram' ? (
                <div className="chart-stack">
                  {Array.from({ length: v }, (_, i) => (
                    <span key={i}>{f.emoji}</span>
                  ))}
                </div>
              ) : (
                <div className="chart-bar-wrap">
                  <div className="chart-bar" style={{ height: `${v * 10}%` }} />
                </div>
              )}
              <span className="chart-label">{f.emoji}</span>
            </div>
          );
        })}
      </div>
      <div className="picture-choices word-cards">
        {data.options.map((label, i) => {
          const choiceId = `c${i}`;
          const wrong = answers?.wrongChoiceIds.includes(choiceId);
          const correct = solved && answers?.correctChoiceId === choiceId;
          return (
            <div key={i} className={`picture-choice ${wrong ? 'wrong' : ''} ${correct ? 'correct' : ''}`}>
              <button className="picture-button word-button" disabled={solved || wrong} aria-label={label} onClick={() => answers?.onChoose(choiceId)}>
                {label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
