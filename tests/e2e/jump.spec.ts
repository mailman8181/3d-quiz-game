import { expect, test } from '@playwright/test';
import { profileFixture, seedSave, SAVE_VERSION } from './helpers';

test.describe.configure({ timeout: 150_000 });

const ANSWERS = '.number-button:not([disabled]), .compare-side:not([disabled]), .picture-button:not([disabled])';

test('Hüpf-Abenteuer: walk, stumble over obstacles, answer chests, reach the flag', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'keyboard walking; one viewport is enough');
  // 6 mazes: both activities are unlocked, whatever this child's random order is.
  await seedSave(page, {
    version: SAVE_VERSION,
    activeProfileId: null,
    settings: { speech: true, sessionMinutes: 0, sfx: true },
    profiles: [profileFixture({ pendingRewards: 0, mazesCompleted: 6, levels: { forest: 6 }, learner: { stage: 'kita', schoolYear: 2026, region: 'de-ni' } })],
  });
  await page.getByRole('button', { name: /Testkind/ }).click();
  await page.locator('[data-activity="jump"]').click();
  const scene = page.getByTestId('jump');
  await expect(scene.locator('[data-chest-index]')).toHaveCount(3); // Kita: 3 chests

  // A tap on the hop button is a jump (the avatar leaves the ground and lands again).
  await page.getByTestId('jump-hop').click();

  const challenge = page.getByTestId('challenge');
  const done = page.getByTestId('jump-done');
  let answered = 0;
  await page.keyboard.down('ArrowRight');
  for (let i = 0; i < 400 && !(await done.isVisible()); i++) {
    if (await challenge.isVisible()) {
      await page.keyboard.up('ArrowRight');
      const next = challenge.getByRole('button', { name: 'Weiter' });
      for (let k = 0; k < 4 && !(await next.isVisible()); k++) await challenge.locator(ANSWERS).first().click();
      await next.click();
      await expect(challenge).toBeHidden();
      answered++;
      await page.keyboard.down('ArrowRight');
    }
    await page.waitForTimeout(150);
  }
  await page.keyboard.up('ArrowRight');
  await expect(done).toBeVisible();
  // Ground chests open by walking; gold ones float and need a hop, so at least the others.
  const high = await scene.locator('[data-chest-high="true"]').count();
  expect(answered).toBeGreaterThanOrEqual(3 - high);
  await expect(done).toContainText('Geschafft!');
});
