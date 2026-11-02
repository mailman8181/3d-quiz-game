import { speech } from '../../audio/speech';
import { de } from '../../content/de/strings';
import type { QuizData, QuizOption } from '../../modules/challenges/knowledge/common';
import type { ChallengeViewProps } from './types';

const SHAPE_PATHS: Record<NonNullable<QuizOption['shape']>, string> = {
  circle: 'M50 8 a42 42 0 1 0 0.01 0z',
  triangle: 'M50 8 L92 88 L8 88 Z',
  square: 'M12 12 H88 V88 H12 Z',
  star: 'M50 6 L61 38 L95 38 L67 58 L78 92 L50 71 L22 92 L33 58 L5 38 L39 38 Z',
  heart: 'M50 88 C10 60 5 35 25 20 C38 10 50 20 50 30 C50 20 62 10 75 20 C95 35 90 60 50 88 Z',
};

function Shape({ color, shape }: { color: string; shape: NonNullable<QuizOption['shape']> }) {
  return (
    <svg viewBox="0 0 100 100" className="quiz-shape" aria-hidden>
      <path d={SHAPE_PATHS[shape]} fill={color} stroke="#2b2233" strokeWidth="5" strokeLinejoin="round" />
    </svg>
  );
}

/** Picture + answer cards for the "Wissen" challenges; every card can be heard (🔊). */
export function KnowledgeView({ data, hint, solved, answers }: ChallengeViewProps<QuizData>) {
  const showLabels = data.labels === 'always' || (data.labels === 'hint' && (hint || solved));
  const wordCards = data.options.every((o) => !o.emoji && !o.color);
  return (
    <div className="rhyme-wrap" data-testid="task-area">
      {data.picture && (
        // Several emoji (🌹🌹🌹, 🔥 + 🛡️) are drawn smaller so they fit on one line.
        <div className={`task-area quiz-picture ${[...data.picture].length > 2 ? 'multi' : ''}`} aria-hidden>
          {data.picture}
        </div>
      )}
      {data.text && <p className="quiz-text">{data.text}</p>}
      <div className={`picture-choices ${wordCards ? 'word-cards' : ''}`}>
        {data.options.map((o, i) => {
          const choiceId = `c${i}`;
          const wrong = answers?.wrongChoiceIds.includes(choiceId);
          const correct = solved && answers?.correctChoiceId === choiceId;
          return (
            <div key={i} className={`picture-choice ${wrong ? 'wrong' : ''} ${correct ? 'correct' : ''}`}>
              <button
                className={`picture-button ${wordCards ? 'word-button' : ''}`}
                disabled={solved || wrong}
                aria-label={o.label}
                onClick={() => answers?.onChoose(choiceId)}
              >
                {o.color && o.shape ? <Shape color={o.color} shape={o.shape} /> : o.emoji ? (
                  <span aria-hidden style={o.size ? { fontSize: `${o.size * 1.15}em`, lineHeight: 1 } : undefined}>
                    {o.emoji}
                  </span>
                ) : (
                  <>
                    {o.label}
                    {o.dots !== undefined && (
                      <span className="pair-dots" aria-hidden>
                        {Array.from({ length: o.dots }, (_, d) => (
                          <span key={d} className="pair-dot" />
                        ))}
                      </span>
                    )}
                  </>
                )}
              </button>
              {data.speakOptions && (
                <button
                  className="say-word"
                  aria-label={`${de.challenge.listen}: ${o.label}`}
                  onClick={() => speech().speak(o.label)}
                >
                  🔊
                </button>
              )}
              {showLabels && !wordCards && <span className="word-caption">{o.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
