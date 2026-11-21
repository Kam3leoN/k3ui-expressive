import { describe, expect, it } from 'vitest';
import {
  resolveStatusVariant,
  STATUS_VARIANT_ICONS,
  type K3Status,
} from '../../src/components/feedback/status.js';
import { statusStyles } from '../../src/components/feedback/status.styles.js';
import '../../src/components/feedback/status.js';
import icons from '../../playground/icons.json';

describe('resolveStatusVariant', () => {
  it('maps booleans', () => {
    expect(resolveStatusVariant(true)).toBe('success');
    expect(resolveStatusVariant(false)).toBe('error');
    expect(resolveStatusVariant('true')).toBe('success');
    expect(resolveStatusVariant('false')).toBe('error');
  });

  it('keeps named variants', () => {
    expect(resolveStatusVariant('warning')).toBe('warning');
    expect(resolveStatusVariant('info')).toBe('info');
    expect(resolveStatusVariant('neutral')).toBe('neutral');
  });

  it('falls back to neutral', () => {
    expect(resolveStatusVariant(null)).toBe('neutral');
    expect(resolveStatusVariant('nope')).toBe('neutral');
  });
});

describe('k3-status', () => {
  async function mount(attrs: Record<string, string> = {}): Promise<K3Status> {
    const el = document.createElement('k3-status') as K3Status;
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    document.body.append(el);
    await customElements.whenDefined('k3-status');
    await el.updateComplete;
    return el;
  }

  it('renders boolean status with icon and label', async () => {
    const el = await mount({ status: 'true', value: '67.7%' });
    expect(el.getAttribute('data-variant')).toBe('success');
    expect(el.getAttribute('data-icon')).toBe('leading');
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-label')).toContain('67.7%');
    expect(el.shadowRoot?.querySelector('.icon')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('.label')?.textContent).toContain('67.7%');
    el.remove();
  });

  it('hides icon when show-icon=false', async () => {
    const el = await mount({ status: 'error', value: 'X', 'show-icon': 'false' });
    expect(el.getAttribute('data-icon')).toBe('none');
    expect(el.shadowRoot?.querySelector('.icon')).toBeNull();
    el.remove();
  });

  it('places trailing icon and applies color tokens', async () => {
    const el = await mount({
      status: 'info',
      value: 'v2',
      position: 'trailing',
      color: '#0ea5e9',
    });
    expect(el.getAttribute('data-icon')).toBe('trailing');
    expect(el.style.getPropertyValue('--k3-status-color')).toBe('#0ea5e9');
    el.remove();
  });

  it('sets dir=rtl when rtl attribute is present', async () => {
    const el = await mount({ status: 'false', value: '32%', rtl: '' });
    expect(el.getAttribute('dir')).toBe('rtl');
    el.remove();
  });

  it('ships Matraic tokens on inner .chip (immune to document * reset)', () => {
    const cssText = String(statusStyles);
    expect(cssText).toContain('--k3-status-height: 1.75rem');
    expect(cssText).toContain('--k3-status-icon-size: 2.25rem');
    expect(cssText).toContain('--k3-status-gap: 0.625rem');
    expect(cssText).toContain('width: max-content');
    expect(cssText).toContain('.chip');
    expect(cssText).toContain('padding-inline-start: calc(var(--_half) + var(--k3-status-gap))');
    expect(cssText).toContain('inset-inline-start: calc(var(--_half) * -1)');
    expect(cssText).toContain('inset-inline-end: calc(var(--_half) * -1)');
  });

  it('keeps label clear of leading and trailing icons including rtl', async () => {
    const leading = await mount({ status: 'true', value: '67.7%' });
    expect(leading.getAttribute('data-icon')).toBe('leading');
    expect(leading.shadowRoot?.querySelector('.label')?.textContent).toContain('67.7%');

    const trailing = await mount({
      status: 'true',
      value: '67.7%',
      position: 'trailing',
    });
    expect(trailing.getAttribute('data-icon')).toBe('trailing');

    const rtl = await mount({ status: 'false', value: '32.3%', rtl: '' });
    expect(rtl.getAttribute('dir')).toBe('rtl');
    expect(rtl.getAttribute('data-icon')).toBe('leading');

    leading.remove();
    trailing.remove();
    rtl.remove();
  });

  it('renders Material Symbol ligatures that are in the playground subset', async () => {
    const subset = new Set(icons as string[]);
    for (const [variant, name] of Object.entries(STATUS_VARIANT_ICONS)) {
      expect(subset.has(name), `missing ligature ${name} for ${variant}`).toBe(true);
    }

    const el = await mount({ status: 'success', value: 'OK' });
    const glyph = el.shadowRoot?.querySelector('.glyph');
    expect(glyph?.getAttribute('data-k3-icon')).toBe('check');
    expect(glyph?.getAttribute('translate')).toBe('no');
    expect(glyph?.classList.contains('notranslate')).toBe(true);

    const err = await mount({ status: 'false', value: 'X' });
    expect(err.shadowRoot?.querySelector('.glyph')?.getAttribute('data-k3-icon')).toBe(
      'close',
    );

    const custom = await mount({ status: 'info', value: 'v1', icon: 'info' });
    expect(custom.shadowRoot?.querySelector('.glyph')?.getAttribute('data-k3-icon')).toBe(
      'info',
    );

    el.remove();
    err.remove();
    custom.remove();
  });

  it('exposes disabled state', async () => {
    const el = await mount({ status: 'warning', value: 'Wait', disabled: '' });
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('aria-label')?.toLowerCase()).toContain('disabled');
    el.remove();
  });
});

