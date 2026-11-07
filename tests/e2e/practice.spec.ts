import { expect, test } from '@playwright/test';
import { profileFixture, seedSave, SAVE_VERSION } from './helpers';

test.describe.configure({ timeout: 150_000 });

const ANSWERS = '.number-button:not([disabled]), .compare-side:not([disabled]), .picture-button:not([disabled])';
const save = (overrides: Record<string, unknown> = {}) => ({
  version: SAVE_VERSION,
  activeProfileId: null,
  settings: { speech: true, sessionMinutes: 0, sfx: true },
  profiles: [profileFixture({ pendingRewards: 0, learner: { stage: 'kita', schoolYear: 2026, region: 'de-ni' }, ...overrides })],
});

test('Rätselpfad: open from the start, pick a topic, answer every stone; a skip never blocks the end', async ({ page }) => {
  await seedSave(page, save());
  await page.getByRole('button', { name: /Testkind/ }).click();
  // No maze played yet: the Rätselpfad is open anyway.
  await page.locator('[data-activity="practice"]').click();
  const picker = page.getByTestId('practice-picker');
  await picker.locator('[data-subject="math"]').click();
  await picker.locator('[data-topic="math.count"]').click();
  await page.getByTestId('practice-start').click();

  const path = page.getByTestId('practice-path');
  await expect(path.locator('[data-stone]')).toHaveCount(5); // Kita: 5 questions
  const challenge = page.getByTestId('challenge');
  for (let q = 0; q < 5; q++) {
    await expect(challenge).toBeVisible({ timeout: 10_000 });
    await expect(challenge.locator('[data-type]')).toHaveAttribute('data-type', 'math.count');
    if (q === 1) {
      // Skip the second question: it becomes a pebble that can be tapped later.
      await challenge.getByRole('button', { name: 'Überspringen' }).click();
      await page.getByRole('button', { name: 'Ja, überspringen' }).click();
      await expect(path.locator('[data-stone="1"]')).toHaveAttribute('data-state', 'skipped');
      continue;
    }
    const next = challenge.getByRole('button', { name: 'Weiter' });
    for (let k = 0; k < 4 && !(await next.isVisible()); k++) await challenge.locator(ANSWERS).first().click();
    await next.click();
  }
  const done = page.getByTestId('practice-done');
  await expect(done).toBeVisible();
  await expect(path.locator('[data-stone="1"]')).toHaveAttribute('data-state', 'skipped');

  // "Nochmal" starts a new path with the same topic.
  await done.getByRole('button', { name: 'Nochmal' }).click();
  await expect(path.locator('[data-state="closed"]')).toHaveCount(5);
});

test('topics switched off by parents are not offered', async ({ page }) => {
  await seedSave(page, save({ disabledChallenges: ['math.count'] }));
  await page.getByRole('button', { name: /Testkind/ }).click();
  await page.locator('[data-activity="practice"]').click();
  await page.locator('[data-subject="math"]').click();
  await expect(page.locator('[data-topic="math.compare"]')).toBeVisible();
  await expect(page.locator('[data-topic="math.count"]')).toHaveCount(0);
});
