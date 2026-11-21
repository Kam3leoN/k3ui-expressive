import { html, render } from 'lit';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@k3ui/i18n/index.js';
import en from '../src/i18n/en.json';
import fr from '../src/i18n/fr.json';
import '../src/register.js';
import {
  COMPARE_CATEGORIES,
  filterCompareCategories,
  rowHasDifference,
  resolveCompareCell,
} from '../src/data/comparison.js';
import {
  FAQS,
  PLANS,
  annualSavingsEuros,
  annualSavingsPercent,
  planPrice,
  type Plan,
} from '../src/data/pricing.js';
import { demoBanner, skipDemoBanner } from '../src/demo-chrome.js';
import { mountPricing } from '../src/pages/pricing.js';
import { mountLogin } from '../src/pages/login.js';
import { parseRoute } from '../src/app.js';

describe('showcase pricing data', () => {
  it('exposes four plans and three FAQs', () => {
    expect(PLANS).toHaveLength(4);
    expect(FAQS).toHaveLength(3);
    expect(PLANS.map((p) => p.id)).toEqual(['free', 'essential', 'pro', 'enterprise']);
  });

  it('marks Pro as recommended and computes annual monthly rates', () => {
    const pro = PLANS.find((p) => p.id === 'pro') as Plan;
    expect(pro.recommended).toBe(true);
    expect(planPrice(pro, 'monthly')).toBe(20);
    expect(planPrice(pro, 'annual')).toBe(16);
    expect(annualSavingsPercent(pro)).toBe(20);
    expect(annualSavingsEuros(pro)).toBe(48);
  });

  it('keeps free at zero for both billings', () => {
    const free = PLANS.find((p) => p.id === 'free') as Plan;
    expect(planPrice(free, 'monthly')).toBe(0);
    expect(planPrice(free, 'annual')).toBe(0);
    expect(annualSavingsPercent(free)).toBeNull();
    expect(annualSavingsEuros(free)).toBeNull();
  });
});

describe('showcase comparison matrix', () => {
  it('aligns category columns with the four plans', () => {
    expect(COMPARE_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    for (const cat of COMPARE_CATEGORIES) {
      for (const row of cat.rows) {
        expect(row.values).toHaveLength(4);
      }
    }
  });

  it('filters identical rows when diffs-only is on', () => {
    const comments = COMPARE_CATEGORIES.flatMap((c) => c.rows).find(
      (r) => r.labelKey.endsWith('.comments'),
    );
    expect(comments && rowHasDifference(comments)).toBe(false);
    const sso = COMPARE_CATEGORIES.flatMap((c) => c.rows).find((r) =>
      r.labelKey.endsWith('.sso'),
    );
    expect(sso && rowHasDifference(sso)).toBe(true);

    const filtered = filterCompareCategories(COMPARE_CATEGORIES, true);
    const labels = filtered.flatMap((c) => c.rows.map((r) => r.labelKey));
    expect(labels.some((k) => k.endsWith('.comments'))).toBe(false);
    expect(labels.some((k) => k.endsWith('.sso'))).toBe(true);
    expect(filterCompareCategories(COMPARE_CATEGORIES, false)).toHaveLength(
      COMPARE_CATEGORIES.length,
    );
  });

  it('resolves unlimited tokens via i18n keys', () => {
    expect(resolveCompareCell('@u', (k) => k)).toBe('showcase.pricing.compare.unlimited');
    expect(resolveCompareCell(true, (k) => k)).toBe(true);
    expect(resolveCompareCell('5 Go', (k) => k)).toBe('5 Go');
  });
});

describe('showcase routes', () => {
  it('defaults to pricing and recognizes login / dialer', () => {
    expect(parseRoute('')).toBe('pricing');
    expect(parseRoute('#/')).toBe('pricing');
    expect(parseRoute('#/pricing')).toBe('pricing');
    expect(parseRoute('#/login')).toBe('login');
    expect(parseRoute('#/login?x=1')).toBe('login');
    expect(parseRoute('#/dialer')).toBe('dialer');
  });
});

describe('showcase pages', () => {
  let host: HTMLElement;

  beforeAll(() => {
    i18n.extend({ en, fr });
    i18n.setLocale('fr');
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('registers the k3 tags used by the showcase', () => {
    for (const tag of [
      'k3-button',
      'k3-button-group',
      'k3-text-field',
      'k3-checkbox',
      'k3-chip',
      'k3-switch',
      'k3-banner',
      'k3-snackbar',
      'k3-icon-button',
      'k3-accordion',
      'k3-expansion-panel',
      'k3-divider',
      'k3-list',
      'k3-list-item',
      'k3-dialog',
    ]) {
      expect(customElements.get(tag)).toBeTruthy();
    }
  });

  it('mounts pricing with four plan cards and FAQ panels', async () => {
    const unmount = mountPricing(host);
    await customElements.whenDefined('k3-button-group');
    expect(host.querySelectorAll('.plan-card')).toHaveLength(4);
    expect(host.querySelector('.plan-card--featured')).toBeTruthy();
    expect(host.querySelector('.pricing-trust')).toBeTruthy();
    expect(
      host.querySelector('.plan-card--featured .plan-card__save')?.textContent,
    ).toMatch(/48/);
    expect(host.querySelectorAll('k3-expansion-panel')).toHaveLength(3);
    expect(host.querySelector('#pricing-title')?.textContent).toMatch(/tarifs/i);
    expect(host.querySelector('.stack-badge')?.textContent).toMatch(/k3ui/i);
    expect(host.querySelector('#comparison')).toBeNull();
    unmount();
    expect(host.querySelector('.page--pricing')).toBeNull();
  });

  it('pins a fixed primary k3-banner above all content', async () => {
    sessionStorage.removeItem('k3ui-showcase-demo-banner-skipped');
    render(demoBanner(), host);
    await customElements.whenDefined('k3-banner');
    await customElements.whenDefined('k3-icon-button');
    const banner = host.querySelector('k3-banner.demo-banner') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.getAttribute('position')).toBe('fixed');
    expect(banner.getAttribute('variant')).toBe('primary');
    expect(banner.textContent).toMatch(/démo|demo/i);
    const closeBtn = banner.querySelector('k3-icon-button[slot="action"]');
    expect(closeBtn).toBeTruthy();
    expect(closeBtn?.querySelector('[data-k3-icon="close"]')).toBeTruthy();
    render(null, host);
  });

  it('hides the demo banner after skip', () => {
    skipDemoBanner();
    render(html`${demoBanner()}`, host);
    expect(host.querySelector('k3-banner.demo-banner')).toBeNull();
    sessionStorage.removeItem('k3ui-showcase-demo-banner-skipped');
    render(null, host);
  });

  it('opens the feature comparison and filters differences', async () => {
    const unmount = mountPricing(host);
    await customElements.whenDefined('k3-button');
    const toggle = host.querySelector('.pricing-compare k3-button') as HTMLElement;
    expect(toggle).toBeTruthy();
    toggle.dispatchEvent(
      new CustomEvent('k3-click', { detail: { source: 'user' }, bubbles: true, composed: true }),
    );
    await customElements.whenDefined('k3-switch');
    expect(host.querySelector('#comparison')).toBeTruthy();
    expect(host.querySelector('.compare__title')?.textContent).toMatch(/fonctionnalités/i);
    const before = host.querySelectorAll('.compare-row').length;
    expect(before).toBeGreaterThan(8);

    const sw = host.querySelector('k3-switch.compare__diffs') as HTMLElement;
    expect(sw).toBeTruthy();
    sw.dispatchEvent(
      new CustomEvent('k3-change', { detail: { selected: true }, bubbles: true, composed: true }),
    );
    const after = host.querySelectorAll('.compare-row').length;
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThan(0);
    expect(host.querySelectorAll('.compare-matrix__plan--featured')).toHaveLength(1);
    unmount();
  });

  it('mounts login with dialog, account bar, and brand social buttons', async () => {
    const unmount = mountLogin(host);
    await customElements.whenDefined('k3-text-field');
    await customElements.whenDefined('k3-dialog');
    /* Dialog form + inline card form */
    expect(host.querySelectorAll('k3-text-field')).toHaveLength(4);
    expect(host.querySelectorAll('k3-checkbox')).toHaveLength(2);
    expect(host.querySelector('k3-dialog.login-dialog')).toBeTruthy();
    expect(host.querySelector('.login-account-bar')).toBeTruthy();
    expect(host.querySelector('.login-card')).toBeTruthy();
    expect(host.querySelector('k3-button-group.login-social')).toBeTruthy();
    expect(host.querySelectorAll('.login-social .login-social__btn').length).toBe(
      6,
    ); /* dialog + inline card */
    expect(host.querySelectorAll('svg.login-brand').length).toBeGreaterThanOrEqual(4);
    expect(host.querySelector('#login-title')?.textContent).toMatch(/connexion/i);
    expect(host.querySelector('.stack-badge')?.textContent).toMatch(/k3ui/i);
    unmount();
  });

  it('switches pricing copy when locale changes after remount', () => {
    i18n.setLocale('en');
    sessionStorage.removeItem('k3ui-showcase-demo-banner-skipped');
    const unmount = mountPricing(host);
    expect(host.querySelector('#pricing-title')?.textContent).toMatch(/pricing/i);
    unmount();
    render(demoBanner(), host);
    expect(host.querySelector('k3-banner.demo-banner')?.textContent).toMatch(/reproducible/i);
    render(null, host);
    i18n.setLocale('fr');
  });
});
