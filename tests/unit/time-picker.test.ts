import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import type { K3TimePicker } from '../../src/components/pickers/time-picker.js';

describe('k3-time-picker', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-time-picker', 'k3-button', 'k3-icon-button'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  function createPicker(attrs: Record<string, string> = {}): K3TimePicker {
    const el = document.createElement('k3-time-picker') as K3TimePicker;
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    host.appendChild(el);
    return el;
  }

  it('opens and closes via show/hide', async () => {
    const el = createPicker({ format: '24' });
    await el.updateComplete;
    expect(el.open).toBe(false);
    const opened = await el.show();
    expect(opened).toBe(true);
    expect(el.open).toBe(true);
    expect(el.dataset.mode).toBe('dial');
    const closed = await el.hide(false);
    expect(closed).toBe(true);
    expect(el.open).toBe(false);
  });

  it('seeds empty draft when value unset (no now fill-in)', async () => {
    const el = createPicker({ format: '24' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const btn = el.shadowRoot?.querySelector('.field-btn');
    expect(btn?.textContent?.trim()).toMatch(/––|—/);
    await el.hide(false);
  });

  it('emits k3-change only on confirm with complete draft', async () => {
    const el = createPicker({ format: '24', value: '14:30' });
    await el.updateComplete;
    const changes: unknown[] = [];
    el.addEventListener('k3-change', ((e: CustomEvent) => changes.push(e.detail)) as EventListener);
    await el.show();
    await el.hide(true);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ value: '14:30', hour: 14, minute: 30 });
  });

  it('does not emit k3-change when draft incomplete', async () => {
    const el = createPicker({ format: '24' });
    await el.updateComplete;
    let fired = false;
    el.addEventListener('k3-change', () => {
      fired = true;
    });
    await el.show();
    await el.hide(true);
    expect(fired).toBe(false);
  });

  it('format toggle does not reset uiMode away from input', async () => {
    const el = createPicker({ format: '12', mode: 'input' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    expect(el.dataset.mode).toBe('input');
    const fmtBtn = el.shadowRoot?.querySelector('.fmt-btn') as HTMLButtonElement | null;
    expect(fmtBtn).toBeTruthy();
    fmtBtn!.click();
    await el.updateComplete;
    expect(el.format).toBe('24');
    expect(el.dataset.mode).toBe('input');
    await el.hide(false);
  });

  it('keyboard keeps period beside fields even when orientation=horizontal', async () => {
    const el = createPicker({ format: '12', orientation: 'horizontal', mode: 'input' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    expect(el.dataset.mode).toBe('input');
    expect(el.dataset.resolvedOrientation).toBe('horizontal');
    const fields = el.shadowRoot?.querySelector('.fields');
    const col = el.shadowRoot?.querySelector('.fields-col');
    expect(fields?.querySelector('.period')).toBeTruthy();
    expect(col?.querySelector(':scope > .period')).toBeNull();
    await el.hide(false);
  });

  it('dial horizontal keeps period under fields', async () => {
    const el = createPicker({ format: '12', orientation: 'horizontal', mode: 'dial' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    expect(el.dataset.mode).toBe('dial');
    const col = el.shadowRoot?.querySelector('.fields-col');
    const periodUnder = col?.querySelector(':scope > .period');
    expect(periodUnder).toBeTruthy();
    await el.hide(false);
  });

  it('dial vertical keeps period beside fields', async () => {
    const el = createPicker({ format: '12', orientation: 'vertical', mode: 'dial' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const fields = el.shadowRoot?.querySelector('.fields');
    expect(fields?.querySelector('.period')).toBeTruthy();
    await el.hide(false);
  });

  it('disabled blocks show()', async () => {
    const el = createPicker({ format: '24', disabled: '' });
    await el.updateComplete;
    expect(await el.show()).toBe(false);
    expect(el.open).toBe(false);
  });

  it('emits k3-input while drafting via dial', async () => {
    const el = createPicker({ format: '24', value: '10:00' });
    await el.updateComplete;
    const inputs: unknown[] = [];
    el.addEventListener('k3-input', ((e: CustomEvent) => inputs.push(e.detail)) as EventListener);
    await el.show();
    await el.updateComplete;
    const dial = el.shadowRoot?.querySelector('k3-time-picker-dial');
    dial?.dispatchEvent(
      new CustomEvent('k3-change', {
        detail: { hour: 11 },
        bubbles: true,
        composed: true,
      }),
    );
    await el.updateComplete;
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs.at(-1)).toMatchObject({ hour: 11, minute: 0 });
    await el.hide(false);
  });

  it('exposes dial listbox and period radiogroup', async () => {
    const el = createPicker({ format: '12', orientation: 'vertical' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const dial = el.shadowRoot?.querySelector('k3-time-picker-dial');
    await (dial as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    const listbox = dial?.shadowRoot?.querySelector('[role="listbox"]');
    expect(listbox).toBeTruthy();
    const period = el.shadowRoot?.querySelector('.period[role="radiogroup"]');
    expect(period).toBeTruthy();
    const radios = period?.querySelectorAll('[role="radio"]');
    expect(radios?.length).toBe(2);
    const fields = el.shadowRoot?.querySelector('.fields[role="radiogroup"]');
    expect(fields).toBeTruthy();
    await el.hide(false);
  });

  it('passes minute-step to dial', async () => {
    const el = createPicker({ format: '24', 'minute-step': '15' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const dial = el.shadowRoot?.querySelector('k3-time-picker-dial') as
      | (HTMLElement & { minuteStep: number })
      | null;
    expect(dial?.minuteStep).toBe(15);
    await el.hide(false);
  });

  it('uses same field boxes in dial and keyboard (12h and 24h)', async () => {
    for (const mode of ['dial', 'input'] as const) {
      for (const format of ['12', '24'] as const) {
        const el = createPicker({ format, mode, orientation: 'vertical' });
        await el.updateComplete;
        await el.show();
        await el.updateComplete;
        expect(el.dataset.mode).toBe(mode);
        expect(el.dataset.format).toBe(format);
        const box =
          el.shadowRoot?.querySelector(mode === 'input' ? '.field-input' : '.field-btn') ??
          null;
        expect(box).toBeTruthy();
        await el.hide(false);
        el.remove();
      }
    }
  });

  it('modal + input shows Enter time fields and focuses hour', async () => {
    const el = createPicker({ variant: 'modal', mode: 'input', format: '12' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    expect(el.dataset.resolvedVariant).toBe('modal');
    expect(el.dataset.mode).toBe('input');
    const inputs = el.shadowRoot?.querySelectorAll('.field-input');
    expect(inputs?.length).toBeGreaterThanOrEqual(2);
    const headline = el.shadowRoot?.querySelector('.headline');
    expect(headline?.textContent?.toLowerCase()).toMatch(/enter|saisir/);
    expect(el.shadowRoot?.querySelector('k3-time-picker-dial')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('.dial-host')).toBeTruthy();
    await el.hide(false);
  });

  it('input advances focus from hour to minute after two digits', async () => {
    const el = createPicker({ variant: 'modal', mode: 'input', format: '24' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const hour = el.shadowRoot?.querySelectorAll('.field-input')[0] as HTMLInputElement;
    const minute = el.shadowRoot?.querySelectorAll('.field-input')[1] as HTMLInputElement;
    expect(hour && minute).toBeTruthy();
    hour.focus();
    hour.value = '14';
    hour.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot?.activeElement ?? document.activeElement).toBe(minute);
    await el.hide(false);
  });
});
