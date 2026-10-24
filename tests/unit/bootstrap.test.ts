import { describe, it, expect, beforeEach } from 'vitest';
import { init, K3UI } from '../../src/index.js';

describe('K3UI.init', () => {
  beforeEach(() => {
    window.K3UI_MANUAL = true;
  });

  it('is idempotent and registers components', async () => {
    const a = await init({
      locale: 'fr',
      debug: false,
      components: ['k3-button', 'k3-dialog'],
      theme: { seed: '#6750A4', mode: 'light', motion: 'expressive' },
    });
    const b = await init({ locale: 'en' });
    expect(a.version).toBe(K3UI.version);
    expect(b.i18n.locale).toBe('en');
    expect(customElements.get('k3-button')).toBeTruthy();
    expect(customElements.get('k3-dialog')).toBeTruthy();
  });

  it('translates FR/EN', async () => {
    await init({ locale: 'fr', components: [] });
    expect(K3UI.i18n.t('dialog.close')).toBe('Fermer');
    K3UI.i18n.setLocale('en');
    expect(K3UI.i18n.t('dialog.close')).toBe('Close');
  });
});
