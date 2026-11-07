import { speech } from '../../audio/speech';
import { de } from '../../content/de/strings';
import type { SolidsData } from '../../modules/challenges/math-solids';
import type { ChallengeViewProps } from './types';

const S = { stroke: '#2b2233', strokeWidth: 4, strokeLinejoin: 'round' as const };

/** Simple oblique drawings with hidden edges dashed, like in school books. */
function SolidSvg({ id }: { id: SolidsData['solid'] }) {
  const dashed = { ...S, strokeDasharray: '6 5', fill: 'none' };
  return (
    <svg viewBox="0 0 160 140" className="solid-svg" aria-hidden>
      {id === 'cube' && (
        <>
          <path d="M30 50 H100 V120 H30 Z" fill="#ffd93d" {...S} />
          <path d="M30 50 L60 20 H130 L100 50 Z" fill="#ffe98a" {...S} />
          <path d="M100 50 L130 20 V90 L100 120 Z" fill="#e6bf2a" {...S} />
          <path d="M30 120 L60 90 H130 M60 90 V20" {...dashed} />
        </>
      )}
      {id === 'cuboid' && (
        <>
          <path d="M15 60 H115 V115 H15 Z" fill="#7ec8ff" {...S} />
          <path d="M15 60 L45 35 H145 L115 60 Z" fill="#b5e0ff" {...S} />
          <path d="M115 60 L145 35 V90 L115 115 Z" fill="#4fa8e6" {...S} />
          <path d="M15 115 L45 90 H145 M45 90 V35" {...dashed} />
        </>
      )}
      {id === 'sphere' && (
        <>
          <circle cx="80" cy="70" r="55" fill="#ff8fa3" {...S} />
          <ellipse cx="80" cy="70" rx="55" ry="16" fill="none" {...S} strokeWidth={2} />
        </>
      )}
      {id === 'cylinder' && (
        <>
          <path d="M35 30 V110 A45 14 0 0 0 125 110 V30" fill="#8fd16a" {...S} />
          <ellipse cx="80" cy="30" rx="45" ry="14" fill="#b6e69a" {...S} />
          <path d="M35 110 A45 14 0 0 1 125 110" {...dashed} />
        </>
      )}
      {id === 'pyramid' && (
        <>
          <path d="M20 115 L95 115 L80 20 Z" fill="#ffb36b" {...S} />
          <path d="M95 115 L140 90 L80 20 Z" fill="#e8913e" {...S} />
          <path d="M20 115 L65 90 L140 90 M65 90 L80 20" {...dashed} />
        </>
      )}
      {id === 'cone' && (
        <>
          <path d="M35 110 L80 15 L125 110" fill="#c5a3ff" {...S} />
          <path d="M35 110 A45 14 0 0 0 125 110" fill="#c5a3ff" {...S} />
          <path d="M35 110 A45 14 0 0 1 125 110" {...dashed} />
        </>
      )}
    </svg>
  );
}

export function SolidsView({ data, solved, answers }: ChallengeViewProps<SolidsData>) {
  return (
    <div className="rhyme-wrap" data-testid="task-area">
      <div className="task-area solid-area">
        <SolidSvg id={data.solid} />
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
              {data.ask === 'name' && (
                <button className="say-word" aria-label={`${de.challenge.listen}: ${label}`} onClick={() => speech().speak(label)}>
                  🔊
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
