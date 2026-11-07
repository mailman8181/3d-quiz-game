import type { Page } from '@playwright/test';

/** Writes a save document straight into IndexedDB (idb-keyval layout), then reloads. */
export async function seedSave(page: Page, doc: unknown): Promise<void> {
  await page.goto('./');
  await page.evaluate(async (save) => {
    const key = `save:${new URL(document.baseURI).pathname}`;
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('keyval-store');
      open.onupgradeneeded = () => open.result.createObjectStore('keyval');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const tx = open.result.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(save, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });
  }, doc);
  await page.reload();
}

/** Current save version for seeded documents. */
export const SAVE_VERSION = 10;

export function profileFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    name: 'Testkind',
    avatar: { animal: 'cat', color: '#f6c453' },
    createdAt: 0,
    stars: 10,
    mazesCompleted: 0,
    jar: 0,
    pendingRewards: 1,
    inventory: [],
    equipped: {},
    rescued: [],
    pet: null,
    skills: {},
    disabledChallenges: [],
    levels: {},
    treehouse: {},
    // Stage question already answered/skipped, so tests land on the hub (ADR-0009).
    learner: null,
    stageAsked: true,
    activityRounds: {},
    ...overrides,
  };
}

/** Taps "Los geht's!" on the create screen and skips the stage question (no stage = all levels). */
export async function startNewProfile(page: Page): Promise<void> {
  await page.getByRole('button', { name: "Los geht's!" }).click();
  await page.getByTestId('stage-screen').getByRole('button', { name: 'Später' }).click();
}
