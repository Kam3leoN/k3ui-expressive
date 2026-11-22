import { describe, it, expect } from 'vitest';
import { init } from '../../src/index.js';
import type { K3Tabs } from '../../src/components/navigation/tabs.js';

describe('k3-tabs', () => {
  it('supports primary (icons) and secondary variants', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-tabs'], theme: { mode: 'light' } });

    const primary = document.createElement('k3-tabs') as K3Tabs;
    primary.variant = 'primary';
    primary.labels = 'Flights,Trips';
    primary.icons = 'flight,luggage';
    document.body.appendChild(primary);
    await primary.updateComplete;

    expect(primary.getAttribute('variant')).toBe('primary');
    expect(primary.shadowRoot!.querySelectorAll('.icon').length).toBe(2);
    expect(primary.shadowRoot!.querySelector('.icon')!.getAttribute('data-k3-icon')).toBe(
      'flight',
    );

    const secondary = document.createElement('k3-tabs') as K3Tabs;
    secondary.variant = 'secondary';
    secondary.labels = 'Overview,Specs';
    document.body.appendChild(secondary);
    await secondary.updateComplete;
    expect(secondary.shadowRoot!.querySelectorAll('.icon').length).toBe(0);

    primary.remove();
    secondary.remove();
  });
});
