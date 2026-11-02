import { expect, test } from '@playwright/test';
import { challengeTypes } from '../../src/modules/challenges';
import { profileFixture, seedSave, SAVE_VERSION } from './helpers';

const KEYS: Record<string, string> = { U: 'ArrowUp', R: 'ArrowRight', D: 'ArrowDown', L: 'ArrowLeft' };
test.describe.configure({ timeout: 120_000 });

test('the child picks today\'s subjects; chests only contain those', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'walking to a chest is slow; one viewport is enough');
  await seedSave(page, {
    version: SAVE_VERSION,
    activeProfileId: null,
    settings: { speech: true, sessionMinutes: 0, sfx: true },
    profiles: [profileFixture({ pendingRewards: 0 })],
  });
  await page.goto('./?seed=11');
  await page.getByRole('button', { name: /Testkind/ }).click();
  const chips = page.getByTestId('subjects');
  await expect(chips.getByRole('button', { name: 'Mathe' })).toHaveAttribute('aria-pressed', 'true');
  await chips.getByRole('button', { name: 'Mathe' }).click();
  await chips.getByRole('button', { name: 'Deutsch' }).click();
  // The last subject stays on.
  await chips.getByRole('button', { name: 'Wissen' }).click();
  await expect(chips.getByRole('button', { name: 'Wissen' })).toHaveAttribute('aria-pressed', 'true');
  await expect(chips.getByRole('button', { name: 'Mathe' })).toHaveAttribute('aria-pressed', 'false');

  await page.getByRole('button', { name: 'Zauberwald', exact: true }).click();
  const canvas = page.getByTestId('game-canvas');
  const route = (await canvas.getAttribute('data-test-route-chest'))!;
  for (const step of route) {
    const before = await canvas.getAttribute('data-avatar-tile');
    await page.keyboard.press(KEYS[step]!);
    await expect(canvas).not.toHaveAttribute('data-avatar-tile', before!, { timeout: 15_000 });
  }
  await expect(page.getByTestId('challenge').locator('[data-type]')).toHaveAttribute('data-type', /^knowledge\./);
});

test('subjects the parents switched off completely are not offered', async ({ page }) => {
  await seedSave(page, {
    version: SAVE_VERSION,
    activeProfileId: null,
    settings: { speech: true, sessionMinutes: 0, sfx: true },
    profiles: [
      profileFixture({
        pendingRewards: 0,
        disabledChallenges: challengeTypes.filter((t) => t.subject === 'german').map((t) => t.id),
      }),
    ],
  });
  await page.getByRole('button', { name: /Testkind/ }).click();
  const chips = page.getByTestId('subjects');
  await expect(chips.getByRole('button', { name: 'Mathe' })).toBeVisible();
  await expect(chips.getByRole('button', { name: 'Deutsch' })).toHaveCount(0);
});
