import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('the match plays, and a batch downloads as CSV', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await expect(page.getByTestId('board')).toBeVisible();
  await expect(page.getByTestId('graphic')).toBeVisible();

  // Speed up and wait for darts to land.
  await page.getByRole('button', { name: '4×' }).click();
  await expect(page.locator('.d-flight').first()).toBeVisible({ timeout: 10_000 });

  // Stats: beside the board when wide, behind the Stats button when narrow.
  const wide = (page.viewportSize()?.width ?? 0) >= 700;
  if (!wide) await page.getByRole('button', { name: 'Stats' }).click();
  await expect(page.getByTestId('stats')).toBeVisible();

  // Run a small batch with everything random and download it.
  await page.getByRole('button', { name: 'Simulate' }).click();
  await page.getByRole('button', { name: 'All random' }).first().click();
  await page.getByRole('button', { name: 'All random' }).first().click();
  await page.locator('#count').fill('40');
  await page.locator('#perleg').check();
  await page.getByRole('button', { name: /^Run 40 matches/ }).click();
  await expect(page.getByTestId('batch-done')).toBeVisible({ timeout: 30_000 });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download matches CSV' }).click()]);
  const csv = readFileSync(await dl.path(), 'utf8').trim().split('\n');
  expect(csv[0].startsWith('version,match,batch_seed,match_seed')).toBe(true);
  expect(csv.length).toBe(41);

  // Replay one row from it.
  await page.locator('#replay').fill(csv[5]);
  await page.getByRole('button', { name: 'Watch this match' }).click();
  await expect(page.getByTestId('graphic')).toBeVisible();
  await expect(page.getByTestId('sim-panel')).toBeHidden();
  expect(errors).toEqual([]);
});
