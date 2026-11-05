import { test, expect } from '@playwright/test';

test('playground boots and opens a dialog', async ({ page }) => {
  await page.goto('/#/dialog');
  await page.waitForFunction(() => !!customElements.get('k3-dialog') && !!window.K3UI);
  await expect(page.locator('#page-dialog')).toBeVisible();
  await page.locator('#btn-dialog').click();
  await expect(page.locator('#dlg').getByRole('alertdialog')).toBeVisible();
});
