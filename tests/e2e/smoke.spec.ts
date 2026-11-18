import { expect, test } from '@playwright/test';

type Saved = { name: string; text: string };

test('the match plays, and batches save one file after another', async ({ page }) => {
  // Stand in for the system file picker (a test can't tap a real one) and keep what gets written.
  await page.addInitScript(() => {
    const w = window as unknown as { __saved: Saved[]; showSaveFilePicker: unknown };
    w.__saved = [];
    w.showSaveFilePicker = async (opts: { suggestedName: string }) => ({
      createWritable: async () => {
        let buf = '';
        return {
          write: async (d: string) => {
            buf += d;
          },
          close: async () => {
            w.__saved.push({ name: opts.suggestedName, text: buf });
          },
        };
      },
    });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('GL Driver') && errors.push(m.text()));
  await page.goto('/');
  await expect(page.getByTestId('board')).toBeVisible();
  await expect(page.getByTestId('graphic')).toBeVisible();

  // The 3D board loads, then speed up and wait for darts to land in it.
  await expect(page.getByTestId('board')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  await page.getByRole('button', { name: '4×' }).click();
  await expect(page.getByTestId('board')).toHaveAttribute('data-darts', /[1-3]/, { timeout: 15_000 });
  // Every camera can be picked.
  for (const cam of ['Straight on', 'Angled', 'Side', 'Low', 'High', 'Oche', 'Dynamic']) await page.getByRole('button', { name: cam, exact: true }).click();
  await page.getByRole('button', { name: 'Black', exact: true }).click();
  await page.getByRole('button', { name: 'Silver', exact: true }).click();

  // Stats: beside the board when wide, behind the Stats button when narrow.
  const wide = (page.viewportSize()?.width ?? 0) >= 700;
  if (!wide) await page.getByRole('button', { name: 'Stats' }).click();
  await expect(page.getByTestId('stats')).toBeVisible();

  // Run a small batch with everything random, then save three files in a row.
  await page.getByRole('button', { name: 'Simulate' }).click();
  await page.getByRole('button', { name: 'All random' }).first().click();
  await page.getByRole('button', { name: 'All random' }).first().click();
  await page.locator('#count').fill('40');
  await page.locator('#perleg').check();
  await page.getByRole('button', { name: /^Run 40 matches/ }).click();
  await expect(page.getByTestId('batch-done')).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Save matches CSV' }).click();
  await expect(page.getByTestId('save-note')).toHaveText('Saved.');
  await page.getByRole('button', { name: 'Save legs CSV' }).click();
  await page.getByRole('button', { name: 'Save matches CSV' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __saved: Saved[] }).__saved.length)).toBe(3);
  const saved = await page.evaluate(() => (window as unknown as { __saved: Saved[] }).__saved);
  expect(saved[0].name).toMatch(/^darts-matches-40-\d+\.csv$/);
  expect(saved[1].name).toMatch(/^darts-legs-40-\d+\.csv$/);
  const csv = saved[0].text.trim().split('\n');
  expect(csv[0].startsWith('version,match,batch_seed,match_seed')).toBe(true);
  expect(csv.length).toBe(41);
  expect(saved[2].text).toBe(saved[0].text);

  // Replay one row from it.
  await page.locator('#replay').fill(csv[5]);
  await page.getByRole('button', { name: 'Watch this match' }).click();
  await expect(page.getByTestId('graphic')).toBeVisible();
  await expect(page.getByTestId('sim-panel')).toBeHidden();
  expect(errors).toEqual([]);
});
