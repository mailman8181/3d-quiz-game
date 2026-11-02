import { speech } from '../../audio/speech';
import { clockLabel, clockSpoken } from '../../content/de/clock';
import { de } from '../../content/de/strings';
import type { ClockData } from '../../modules/challenges/math-clock';
import type { ChallengeViewProps } from './types';

/** Analogue clock face with hour and minute hand; answers as time cards with 🔊. */
export function ClockView({ data, solved, answers }: ChallengeViewProps<ClockData>) {
  const { hour, minute } = data.time;
  const minuteAngle = minute * 6;
  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  return (
    <div className="rhyme-wrap" data-testid="task-area">
      <div className="task-area clock-area">
        <svg viewBox="0 0 200 200" className="clock" aria-hidden>
          <circle cx="100" cy="100" r="92" fill="#fff" stroke="#2b2233" strokeWidth="6" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = ((i + 1) * 30 * Math.PI) / 180;
            return (
              <text key={i} x={100 + 72 * Math.sin(a)} y={100 - 72 * Math.cos(a) + 8} textAnchor="middle" className="clock-num">
                {i + 1}
              </text>
            );
          })}
          <line x1="100" y1="100" x2="100" y2="52" stroke="#2b2233" strokeWidth="9" strokeLinecap="round" transform={`rotate(${hourAngle} 100 100)`} />
          <line x1="100" y1="100" x2="100" y2="24" stroke="#ff6b8b" strokeWidth="5" strokeLinecap="round" transform={`rotate(${minuteAngle} 100 100)`} />
          <circle cx="100" cy="100" r="7" fill="#2b2233" />
        </svg>
      </div>
      <div className="picture-choices word-cards">
        {data.options.map((t, i) => {
          const choiceId = `c${i}`;
          const wrong = answers?.wrongChoiceIds.includes(choiceId);
          const correct = solved && answers?.correctChoiceId === choiceId;
          const spoken = clockSpoken(t.hour, t.minute);
          return (
            <div key={i} className={`picture-choice ${wrong ? 'wrong' : ''} ${correct ? 'correct' : ''}`}>
              <button
                className="picture-button word-button"
                disabled={solved || wrong}
                aria-label={spoken}
                onClick={() => answers?.onChoose(choiceId)}
              >
                {clockLabel(t.hour, t.minute)}
              </button>
              <button className="say-word" aria-label={`${de.challenge.listen}: ${spoken}`} onClick={() => speech().speak(spoken)}>
                🔊
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
