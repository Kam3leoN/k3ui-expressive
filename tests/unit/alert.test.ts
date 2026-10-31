import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import type { K3Alert } from '../../src/components/feedback/alert.js';

describe('k3-alert', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-alert'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  async function mount(html: string): Promise<K3Alert> {
    host.innerHTML = html;
    const el = host.querySelector('k3-alert') as K3Alert;
    await el.updateComplete;
    return el;
  }

  it('defaults to secondary · rounded', async () => {
    const el = await mount(`<k3-alert>Body</k3-alert>`);
    expect(el.variant).toBe('secondary');
    expect(el.shape).toBe('rounded');
    expect(el.getAttribute('variant')).toBe('secondary');
  });

  it('applies variant and shape attrs', async () => {
    const el = await mount(
      `<k3-alert variant="error" shape="square" label="Fail">Oops</k3-alert>`,
    );
    expect(el.variant).toBe('error');
    expect(el.shape).toBe('square');
    const aside = el.shadowRoot!.querySelector('aside.base')!;
    expect(aside.getAttribute('role')).toBe('alert');
  });

  it('uses status role for non-critical variants', async () => {
    const el = await mount(`<k3-alert variant="info" label="Info">Hi</k3-alert>`);
    const aside = el.shadowRoot!.querySelector('aside.base')!;
    expect(aside.getAttribute('role')).toBe('status');
  });

  it('renders default filled icon for variant', async () => {
    const el = await mount(`<k3-alert variant="success" label="Ok">Done</k3-alert>`);
    const icon = el.shadowRoot!.querySelector('.icon') as HTMLElement;
    expect(icon.getAttribute('data-k3-icon')).toBe('check_circle');
    expect(icon.hidden).toBe(false);
  });

  it('hides icon when hide-icon', async () => {
    const el = await mount(`<k3-alert hide-icon label="Title">Body</k3-alert>`);
    const icon = el.shadowRoot!.querySelector('.icon') as HTMLElement;
    expect(icon.hidden).toBe(true);
  });

  it('dismissible close emits k3-dismiss and hides', async () => {
    const el = await mount(`<k3-alert dismissible label="Tip">Body</k3-alert>`);
    const onDismiss = vi.fn();
    el.addEventListener('k3-dismiss', onDismiss as EventListener);
    const btn = el.shadowRoot!.querySelector('button.dismiss') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    await el.updateComplete;
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(el.hidden).toBe(true);
  });

  it('falls back invalid variant to secondary', async () => {
    const el = await mount(`<k3-alert variant="nope">Body</k3-alert>`);
    expect(el.variant).toBe('secondary');
  });
});
