import type { Half, SymmetryData } from '../../modules/challenges/math-symmetry';
import type { ChallengeViewProps } from './types';

const COLOURS = ['transparent', '#ff6b8b', '#3a86ff', '#ffd93d'];

function Grid({ half, className = '' }: { half: Half; className?: string }) {
  return (
    <span className={`sym-grid ${className}`} style={{ gridTemplateColumns: `repeat(${half[0]!.length}, 1fr)` }} aria-hidden>
      {half.flat().map((c, i) => (
        <span key={i} className="sym-cell" style={{ background: COLOURS[c] }} />
      ))}
    </span>
  );
}

/** Left half + mirror axis + empty (or chosen) right half; answers are right halves. */
export function SymmetryView({ data, solved, answers }: ChallengeViewProps<SymmetryData>) {
  const correct = data.options[Number(answers?.correctChoiceId.slice(1) ?? 0)]!;
  return (
    <div className="rhyme-wrap" data-testid="task-area">
      <div className="task-area sym-area">
        <Grid half={data.left} />
        <span className="sym-axis" />
        {solved ? <Grid half={correct} /> : <span className="sym-grid sym-empty" />}
      </div>
      <div className="picture-choices">
        {data.options.map((half, i) => {
          const choiceId = `c${i}`;
          const wrong = answers?.wrongChoiceIds.includes(choiceId);
          const isCorrect = solved && answers?.correctChoiceId === choiceId;
          return (
            <div key={i} className={`picture-choice ${wrong ? 'wrong' : ''} ${isCorrect ? 'correct' : ''}`}>
              <button className="picture-button scene-button" disabled={solved || wrong} aria-label={`${i + 1}`} onClick={() => answers?.onChoose(choiceId)}>
                <Grid half={half} className="small" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
