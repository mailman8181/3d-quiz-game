import { describe, expect, it } from 'vitest';
import { previewLift } from './AvatarPreview';

describe('avatar preview framing', () => {
  it('keeps the usual framing for avatars up to ~1.39 high', () => {
    expect(previewLift(1.0)).toBe(0);
    expect(previewLift(1.21)).toBe(0); // model cat (ears)
    expect(previewLift(1.39)).toBe(0);
  });

  it('raises the camera just enough for tall avatars (bunny ears with a party hat)', () => {
    expect(previewLift(1.55)).toBeCloseTo(0.16, 5);
    expect(previewLift(1.55) + 1.5).toBeGreaterThanOrEqual(1.55 + 0.05 + 0.06 - 1e-9);
  });
});
