import type { ChestTier } from '../../core/skills/skillModel';

/** A chest in its tier colour with an emblem; shared by activities (memory, jump). */
export function ChestFace({ tier, emblem }: { tier: ChestTier; emblem: string }) {
  return (
    <span className={`memory-chest tier-${tier}`} aria-hidden>
      <span className="memory-chest-lid" />
      <span className="memory-chest-body">{emblem}</span>
    </span>
  );
}
