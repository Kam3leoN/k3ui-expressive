import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/components/animation/halftone.js';
import type { K3Halftone } from '../../src/components/animation/halftone.js';

describe('k3-halftone', () => {
  let el: K3Halftone;

  beforeEach(async () => {
    el = document.createElement('k3-halftone') as K3Halftone;
    el.innerHTML = '<div class="swatch">Halftone</div>';
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  it('registers and renders a screen layer', () => {
    expect(customElements.get('k3-halftone')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('.screen')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('slot')).toBeTruthy();
  });

  it('reflects animated and tone', async () => {
    el.animated = true;
    el.tone = 'light';
    el.size = 12;
    el.intensity = 0.4;
    await el.updateComplete;
    expect(el.hasAttribute('animated')).toBe(true);
    expect(el.getAttribute('tone')).toBe('light');
    const screen = el.shadowRoot?.querySelector('.screen') as HTMLElement;
    expect(screen?.style.getPropertyValue('--k3-halftone-cell')).toBe('12px');
    expect(screen?.style.getPropertyValue('--k3-halftone-opacity')).toBe('0.4');
  });
});
