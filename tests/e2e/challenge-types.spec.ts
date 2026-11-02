import { expect, test } from '@playwright/test';
import { startNewProfile } from './helpers';

const KEYS: Record<string, string> = { U: 'ArrowUp', R: 'ArrowRight', D: 'ArrowDown', L: 'ArrowLeft' };
test.describe.configure({ timeout: 120_000 });

for (const type of [
  'math.find-number',
  'math.subtraction',
  'math.compare',
  'math.pattern',
  'german.initial-sound',
  'german.syllables',
  'german.rhyme',
  'german.read-word',
  'knowledge.animal-name',
  'knowledge.animal-baby',
  'knowledge.colors',
  'knowledge.seasons',
  'knowledge.odd-one-out',
  // Preschool pack (M13b): one per new view, plus a quiz type.
  'math.dice',
  'math.neighbors',
  'math.position',
  'knowledge.habitat',
  // Grade 1–2 math pack (M13c)
  'math.number-bonds',
  'math.money',
  'math.clock',
  'math.symmetry',
  // Grade 1–2 German pack (M13d): all quiz cards; two representatives.
  'german.article',
  'german.riddle',
]) {
  test(`${type}: open a chest and answer until finished`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'one viewport is enough per type');
    await page.goto(`./?seed=11&challenge=${type}`);
    await startNewProfile(page);
    const canvas = page.getByTestId('game-canvas');
    const route = (await canvas.getAttribute('data-test-route-chest'))!;
    for (const step of route) {
      const before = await canvas.getAttribute('data-avatar-tile');
      await page.keyboard.press(KEYS[step]!);
      await expect(canvas).not.toHaveAttribute('data-avatar-tile', before!, { timeout: 15_000 });
    }
    const challenge = page.getByTestId('challenge');
    await expect(challenge).toBeVisible();
    await expect(challenge.getByTestId('task-area')).toBeVisible();
    const next = challenge.getByRole('button', { name: 'Weiter' });
    for (let i = 0; i < 4 && !(await next.isVisible()); i++) {
      await challenge.locator('.number-button:not([disabled]), .compare-side:not([disabled]), .picture-button:not([disabled])').first().click();
    }
    await next.click();
    await expect(challenge).toBeHidden();
  });
}
