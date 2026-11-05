import { test, expect, type Page } from '@playwright/test';

/** `id` (or tag) of the focused host › tag of the deep focused element. */
async function focusPath(page: Page): Promise<string> {
  return page.evaluate(() => {
    let a: Element | null = document.activeElement;
    const host = a;
    while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
    return `${host?.id || host?.localName} > ${a?.localName}`;
  });
}

/** Closed overlays stay in the DOM (motion), inert and out of the a11y tree. */
async function expectClosed(page: Page, id: string, role: 'dialog' | 'alertdialog'): Promise<void> {
  await expect.poll(() => page.evaluate((i) => (document.getElementById(i) as HTMLElement & { open: boolean }).open, id)).toBe(false);
  await expect(page.locator(`#${id}`).getByRole(role, { includeHidden: true })).toHaveAttribute('inert', '');
}

async function openPage(page: Page, route: string, tag: string): Promise<void> {
  await page.goto(`/#/${route}`);
  await page.waitForFunction((t) => !!customElements.get(t) && !!window.K3UI, tag);
}

test.describe('k3-dialog keyboard & ARIA', () => {
  test('focus enters, Tab cycles inside, Escape closes and restores focus', async ({ page }) => {
    await openPage(page, 'dialog', 'k3-dialog');
    await page.locator('#btn-dialog').click();
    const panel = page.locator('#dlg').getByRole('alertdialog');
    await expect(panel).toBeVisible();
    /* Accessible name comes from the headline slot */
    await expect(panel).toHaveAccessibleName(/.+/);
    await expect.poll(() => focusPath(page)).toBe('dlg-cancel > button');

    const seen = new Set<string>();
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      seen.add(await focusPath(page));
    }
    expect([...seen].sort()).toEqual(['dlg-cancel > button', 'dlg-ok > button']);

    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    expect(['dlg-cancel > button', 'dlg-ok > button']).toContain(await focusPath(page));

    await page.keyboard.press('Escape');
    await expectClosed(page, 'dlg', 'alertdialog');
    await expect.poll(() => focusPath(page)).toBe('btn-dialog > button');
  });

  test('controls of a closed dialog are not in the tab order', async ({ page }) => {
    await openPage(page, 'dialog', 'k3-dialog');
    await page.locator('#btn-dialog-fs').focus();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      const inClosedDialog = await page.evaluate(() => {
        const fs = document.querySelector('#dlg-fs');
        let a: Element | null = document.activeElement;
        while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
        return !!(fs && a && (fs.contains(a) || fs.shadowRoot?.contains(a)));
      });
      expect(inClosedDialog).toBe(false);
    }
  });
});

test.describe('k3-sheet (modal) keyboard', () => {
  test('focus enters the sheet and returns to the trigger on Escape', async ({ page }) => {
    await openPage(page, 'sheet', 'k3-sheet');
    await page.locator('#btn-sheet-side').click();
    const panel = page.locator('#sheet-side').getByRole('dialog');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAccessibleName('Side sheet');
    await expect
      .poll(() => page.evaluate(() => {
        let a: Element | null = document.activeElement;
        while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
        const sheet = document.querySelector('#sheet-side')!;
        return sheet.contains(a) || !!sheet.shadowRoot?.contains(a);
      }))
      .toBe(true);
    await page.keyboard.press('Escape');
    await expectClosed(page, 'sheet-side', 'dialog');
    await expect.poll(() => focusPath(page)).toBe('btn-sheet-side > button');
  });
});

test('one Escape closes only the top-most modal', async ({ page }) => {
  await openPage(page, 'dialog', 'k3-dialog');
  await page.locator('#btn-dialog').click();
  await expect(page.locator('#dlg').getByRole('alertdialog')).toBeVisible();
  /* A second modal on top (e.g. a confirm opened from the dialog) */
  await page.evaluate(async () => {
    const top = document.createElement('k3-dialog') as HTMLElement & { show(): Promise<boolean> };
    top.id = 'dlg-top';
    top.innerHTML = '<span slot="headline">Top</span><k3-button slot="actions" id="top-ok">OK</k3-button>';
    document.body.append(top);
    await top.show();
  });
  await expect(page.locator('#dlg-top').getByRole('alertdialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expectClosed(page, 'dlg-top', 'alertdialog');
  await expect(page.locator('#dlg').getByRole('alertdialog')).not.toHaveAttribute('inert', '');
  expect(await page.evaluate(() => (document.getElementById('dlg') as HTMLElement & { open: boolean }).open)).toBe(true);
  await page.keyboard.press('Escape');
  await expectClosed(page, 'dlg', 'alertdialog');
});
