import { describe, it, expect } from 'vitest';
import { init, i18n } from '../../src/index.js';
import type { K3DocNav } from '../../src/components/navigation/doc-nav.js';

describe('k3-doc-nav', () => {
  it('renders previous and next cards with doc-nav.* i18n keys', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-doc-nav'], locale: 'en', theme: { mode: 'light' } });

    const el = document.createElement('k3-doc-nav') as K3DocNav;
    el.previousHref = '#a';
    el.previousTitle = 'Switch: Overview';
    el.nextHref = '#b';
    el.nextTitle = 'Tabs: Specs';
    document.body.appendChild(el);
    await el.updateComplete;

    const prev = el.shadowRoot!.querySelector('.previous')!;
    const next = el.shadowRoot!.querySelector('.next')!;
    expect(prev.getAttribute('href')).toBe('#a');
    expect(next.getAttribute('href')).toBe('#b');
    expect(prev.textContent).toContain(i18n.t('doc-nav.previous'));
    expect(prev.textContent).toContain('Switch: Overview');
    expect(next.textContent).toContain(i18n.t('doc-nav.next'));
    expect(next.textContent).toContain('Tabs: Specs');
    expect(el.shadowRoot!.querySelector('nav')!.getAttribute('aria-label')).toBe(
      i18n.t('doc-nav.label'),
    );
    el.remove();
  });

  it('uses French doc-nav.* strings', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-doc-nav'], locale: 'fr', theme: { mode: 'light' } });

    const el = document.createElement('k3-doc-nav') as K3DocNav;
    el.previousHref = '#a';
    el.previousTitle = 'Cartes';
    el.nextHref = '#b';
    el.nextTitle = 'Listes';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.shadowRoot!.textContent).toContain('Précédent');
    expect(el.shadowRoot!.textContent).toContain('À suivre');

    el.remove();
  });
});
