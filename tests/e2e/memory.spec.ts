import { expect, test } from '@playwright/test';
import { profileFixture, seedSave, SAVE_VERSION } from './helpers';

test.describe.configure({ timeout: 120_000 });

const ANSWERS = '.number-button:not([disabled]), .compare-side:not([disabled]), .picture-button:not([disabled])';
const save = (mazesCompleted: number) => ({
  version: SAVE_VERSION,
  activeProfileId: null,
  settings: { speech: true, sessionMinutes: 0, sfx: true },
  profiles: [
    profileFixture({
      pendingRewards: 0,
      mazesCompleted,
      levels: { forest: mazesCompleted },
      learner: { stage: 'preschool', schoolYear: 2026, region: 'de-ni' },
    }),
  ],
});

test('after 3 mazes exactly one new game is open, the mystery card counts the rest', async ({ page }) => {
  await seedSave(page, save(3));
  await page.getByRole('button', { name: /Testkind/ }).click();
  await expect(page.locator('[data-activity]:not([data-activity="practice"])')).toHaveCount(1);
  await expect(page.getByTestId('mystery-card')).toContainText('Noch 3 Runden');
});

test('before 3 mazes the hub shows a mystery card instead of new games', async ({ page }) => {
  await seedSave(page, save(2));
  await page.getByRole('button', { name: /Testkind/ }).click();
  await expect(page.getByTestId('mystery-card')).toContainText('Noch 1 Labyrinth');
  await expect(page.locator('[data-activity]:not([data-activity="practice"])')).toHaveCount(0);
});

test('memory: find all pairs, chest pairs open questions, the round is counted', async ({ page }) => {
  // 6 mazes: both activities are unlocked, whatever this child's random order is.
  await seedSave(page, save(6));
  await page.getByRole('button', { name: /Testkind/ }).click();
  await page.locator('[data-activity="memory"]').click();
  const grid = page.getByTestId('memory-grid');
  await expect(grid.locator('[data-card-id]')).toHaveCount(12); // Vorschule: 3×4
  await expect(grid.locator('[data-kind="chest"]')).toHaveCount(6);

  // A wrong pair turns back.
  const cards = grid.locator('[data-card-id]');
  const firstPair = await cards.nth(0).getAttribute('data-pair');
  const other = grid.locator(`[data-card-id]:not([data-pair="${firstPair}"])`).first();
  await cards.nth(0).click();
  await other.click();
  await expect(grid.locator('.memory-card.up')).toHaveCount(0, { timeout: 5000 });

  const pairs = [...new Set(await grid.locator('[data-card-id]').evaluateAll((els) => els.map((e) => e.getAttribute('data-pair')!)))];
  for (const pair of pairs) {
    const both = grid.locator(`[data-pair="${pair}"]`);
    const chest = (await both.first().getAttribute('data-kind')) === 'chest';
    await both.nth(0).click();
    await both.nth(1).click();
    if (chest) {
      const challenge = page.getByTestId('challenge');
      await expect(challenge).toBeVisible();
      const next = challenge.getByRole('button', { name: 'Weiter' });
      for (let i = 0; i < 4 && !(await next.isVisible()); i++) await challenge.locator(ANSWERS).first().click();
      await next.click();
      await expect(challenge).toBeHidden();
    }
  }
  const done = page.getByTestId('memory-done');
  await expect(done).toBeVisible();
  await expect(done).toContainText('Alle Paare gefunden!');

  // Back on the hub; all extra games are open, so no mystery card is left.
  await done.getByRole('button', { name: 'Zurück zum Start' }).click();
  await expect(page.getByTestId('mystery-card')).toHaveCount(0);
  await expect(page.locator('[data-activity="memory"]')).toBeVisible();
});
