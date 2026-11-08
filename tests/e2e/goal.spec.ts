import { expect, type Locator, type Page, test } from '@playwright/test';
import { startNewProfile } from './helpers';

const KEYS: Record<string, string> = { U: 'ArrowUp', R: 'ArrowRight', D: 'ArrowDown', L: 'ArrowLeft' };

// The full walk is long with software WebGL; one viewport is enough.
test.describe.configure({ timeout: 240_000 });

/** Walks the level-1 route of ?seed=3 (skipping chests) up to, but not onto, the goal tile. */
async function walkToGoal(page: Page): Promise<{ canvas: Locator; last: string }> {
  await page.goto('./?seed=3');
  await startNewProfile(page);
  const canvas = page.getByTestId('game-canvas');
  await expect(canvas).toHaveAttribute('data-test-route-goal', /^[URDL]+$/);
  const route = (await canvas.getAttribute('data-test-route-goal'))!;
  const challenge = page.getByTestId('challenge');

  for (const step of route.slice(0, -1)) {
    if (await challenge.isVisible()) {
      await challenge.getByRole('button', { name: 'Überspringen' }).click();
      await page.getByRole('button', { name: 'Ja, überspringen' }).click();
      await expect(challenge).toBeHidden();
    }
    const before = await canvas.getAttribute('data-avatar-tile');
    await page.keyboard.press(KEYS[step]!);
    await expect(canvas).not.toHaveAttribute('data-avatar-tile', before!, { timeout: 15_000 });
  }
  return { canvas, last: KEYS[route.at(-1)!]! };
}

test('walk through the whole maze, skipping chests, and rescue the chick', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'long walk runs on desktop only');
  const { canvas, last } = await walkToGoal(page);
  await page.keyboard.press(last);

  // Cut-scene first (ADR-0017): avatar and chick cheer, then the dialog (~4 s, wall clock).
  await expect(canvas).toHaveAttribute('data-rescue-scene', 'playing', { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Juhu!' })).toBeHidden();
  await expect(canvas).toHaveAttribute('data-rescue-scene', 'done', { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Juhu!' })).toBeVisible();
  await expect(page.getByText('Du hast das Küken gefunden!')).toBeVisible();
  await expect(page.getByText('Level 1 geschafft!')).toBeVisible();
  await page.getByRole('button', { name: 'Weiter zu Level 2' }).click();
  await expect(page.getByTestId('level')).toHaveText('Level 2');
  await expect(page.getByRole('heading', { name: 'Juhu!' })).toBeHidden();
  await expect(canvas).toHaveAttribute('data-avatar-tile', '1,1');
  // The chick is rescued; the next maze hides the piglet.
  await expect(page.getByRole('button', { name: /Finde das verirrte Ferkel/ })).toBeVisible();
});

test('a tap skips the rescue cut-scene', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'long walk runs on desktop only');
  const { canvas, last } = await walkToGoal(page);
  await page.keyboard.press(last);
  await expect(canvas).toHaveAttribute('data-rescue-scene', 'playing', { timeout: 15_000 });
  await canvas.click();
  await expect(canvas).toHaveAttribute('data-rescue-scene', 'done', { timeout: 2_000 });
  await expect(page.getByRole('heading', { name: 'Juhu!' })).toBeVisible();
  await expect(page.getByText('Du hast das Küken gefunden!')).toBeVisible();
});
