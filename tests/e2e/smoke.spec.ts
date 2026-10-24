import { test, expect } from '@playwright/test';

test('playground loads and opens dialog', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Playground' })).toBeVisible();
  await page.locator('#btn-dialog').click();
  await expect(page.locator('k3-dialog')).toBeVisible();
});
