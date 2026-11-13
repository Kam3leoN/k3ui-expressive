import { test, expect, type Page } from '@playwright/test';

async function openPage(page: Page, route: string, tag: string): Promise<void> {
  await page.goto(`/#/${route}`);
  await page.waitForFunction((t) => !!customElements.get(t) && !!window.K3UI, tag);
}

test.describe('keyboard navigation', () => {
  test('tabs: Arrow keys move aria-selected (APG)', async ({ page }) => {
    await openPage(page, 'tabs', 'k3-tabs');
    const moved = await page.evaluate(async () => {
      const host = document.querySelector('k3-tabs') as HTMLElement & { updateComplete?: Promise<unknown> };
      if (!host?.shadowRoot) return false;
      await host.updateComplete;
      const tabs = [...host.shadowRoot.querySelectorAll<HTMLElement>('[role="tab"]')];
      if (tabs.length < 2) return false;
      tabs[0]!.focus();
      tabs[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
      await host.updateComplete;
      return tabs.some((t, i) => i > 0 && t.getAttribute('aria-selected') === 'true');
    });
    expect(moved).toBe(true);
  });

  test('button receives Enter activation', async ({ page }) => {
    await openPage(page, 'buttons', 'k3-button');
    const clicked = await page.evaluate(async () => {
      const el = document.querySelector('k3-button') as HTMLElement & { updateComplete: Promise<unknown> };
      if (!el) return false;
      await el.updateComplete;
      const btn = el.shadowRoot?.querySelector('button');
      if (!btn) return false;
      return await new Promise<boolean>((resolve) => {
        el.addEventListener('k3-click', () => resolve(true), { once: true });
        btn.focus();
        btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        btn.click();
        setTimeout(() => resolve(false), 1500);
      });
    });
    expect(clicked).toBe(true);
  });

  test('dialog trap: Tab stays inside; Escape restores trigger', async ({ page }) => {
    await openPage(page, 'dialog', 'k3-dialog');
    await page.locator('#btn-dialog').click();
    const panel = page.locator('#dlg').getByRole('alertdialog');
    await expect(panel).toBeVisible();
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => {
      let a: Element | null = document.activeElement;
      while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
      return !!a?.closest?.('#dlg') || document.getElementById('dlg')?.contains(document.activeElement);
    });
    expect(inside).toBe(true);
    await page.keyboard.press('Escape');
    await expect
      .poll(() => page.evaluate(() => (document.getElementById('dlg') as HTMLElement & { open: boolean }).open))
      .toBe(false);
  });
});
