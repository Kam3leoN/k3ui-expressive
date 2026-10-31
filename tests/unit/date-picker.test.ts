import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import type { K3DatePicker } from '../../src/components/pickers/date-picker.js';

describe('k3-date-picker', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-date-picker', 'k3-calendar', 'k3-button'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  function createPicker(attrs: Record<string, string> = {}): K3DatePicker {
    const el = document.createElement('k3-date-picker') as K3DatePicker;
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    host.appendChild(el);
    return el;
  }

  it('opens and closes via show/hide', async () => {
    const el = createPicker({ variant: 'modal' });
    await el.updateComplete;
    expect(el.open).toBe(false);
    expect(await el.show()).toBe(true);
    expect(el.open).toBe(true);
    expect(await el.hide(false)).toBe(true);
    expect(el.open).toBe(false);
  });

  it('disabled blocks show()', async () => {
    const el = createPicker({ disabled: '' });
    await el.updateComplete;
    expect(await el.show()).toBe(false);
    expect(el.open).toBe(false);
  });

  it('emits k3-change on confirm with value', async () => {
    const el = createPicker({ variant: 'modal', value: '2026-04-15' });
    await el.updateComplete;
    const changes: unknown[] = [];
    el.addEventListener('k3-change', ((e: CustomEvent) => void changes.push(e.detail)) as unknown as EventListener);
    await el.show();
    await el.hide(true);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ value: '2026-04-15' });
  });

  it('renders calendar grid in month view', async () => {
    const el = createPicker({ variant: 'modal', value: '2026-06-01' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const cal = el.shadowRoot?.querySelector('k3-calendar');
    expect(cal).toBeTruthy();
    await (cal as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    const grid = cal?.shadowRoot?.querySelector('[role="grid"]');
    expect(grid).toBeTruthy();
    const cells = cal?.shadowRoot?.querySelectorAll('[role="gridcell"]');
    expect(cells && cells.length).toBeGreaterThan(20);
    await el.hide(false);
  });

  it('requires both ends for short-range confirm', async () => {
    const el = createPicker({ variant: 'modal', range: '' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const ok = el.shadowRoot?.querySelectorAll('k3-button');
    const confirm = ok?.[ok.length - 1] as HTMLElement & { disabled: boolean };
    expect(confirm?.disabled).toBe(true);
    await el.hide(false);
  });

  it('enables OK after start date when dual Start/End fields', async () => {
    const start = document.createElement('input');
    start.id = 'dp-ok-s';
    const end = document.createElement('input');
    end.id = 'dp-ok-e';
    host.append(start, end);
    const el = createPicker({
      variant: 'modal',
      range: '',
      months: '1',
      'for-start': 'dp-ok-s',
      'for-end': 'dp-ok-e',
    });
    await el.updateComplete;
    await el.show(null, 'start');
    await el.updateComplete;
    let confirm = [...(el.shadowRoot?.querySelectorAll('k3-button') ?? [])].at(
      -1,
    ) as HTMLElement & { disabled: boolean };
    expect(confirm?.disabled).toBe(true);
    const cal = el.shadowRoot?.querySelector('k3-calendar') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await cal.updateComplete;
    const day = cal.shadowRoot?.querySelector(
      'button.cell:not([disabled]):not(.outside)',
    ) as HTMLButtonElement | null;
    expect(day).toBeTruthy();
    day!.click();
    await cal.updateComplete;
    await el.updateComplete;
    confirm = [...(el.shadowRoot?.querySelectorAll('k3-button') ?? [])].at(-1) as HTMLElement & {
      disabled: boolean;
    };
    expect(confirm?.disabled).toBe(false);
    await el.hide(true);
    expect(start.value).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('short range uses 2 side-by-side months and one wide field', async () => {
    const field = document.createElement('textarea');
    field.id = 'dp-wide';
    host.append(field);
    const el = createPicker({
      variant: 'modal',
      range: '',
      months: '2',
      for: 'dp-wide',
      'start-at': '2027-01-01',
      'range-start': '2027-01-01',
      'range-end': '2027-02-15',
    });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const cal = el.shadowRoot?.querySelector('k3-calendar') as
      | (HTMLElement & { updateComplete: Promise<unknown>; months: number })
      | null;
    expect(cal).toBeTruthy();
    await cal!.updateComplete;
    expect(cal!.months).toBe(2);
    expect(cal!.shadowRoot?.querySelector('.months-row')).toBeTruthy();
    expect(cal!.shadowRoot?.querySelectorAll('.month-pane').length).toBe(2);
    await el.hide(true);
    expect(field.value).toContain('2027-01-01');
    expect(field.value).toContain('2027-02-15');
    expect(field.value).toMatch(/\n/);
    expect(field.value).toMatch(/From|Du/);
    expect(field.value).toMatch(/To|Au/);
  });

  it('dual start/end fields store one ISO date each', async () => {
    const start = document.createElement('input');
    start.id = 'dp-one-s';
    start.value = 'Du : 2026-01-01\nAu : 2026-06-01'; /* polluted — must sanitize */
    const end = document.createElement('input');
    end.id = 'dp-one-e';
    end.value = '2026-12-31 – extra';
    host.append(start, end);
    const el = createPicker({
      variant: 'modal',
      range: '',
      months: '1',
      'for-start': 'dp-one-s',
      'for-end': 'dp-one-e',
    });
    await el.updateComplete;
    await el.show(null, 'start');
    await el.hide(true);
    expect(start.value).toBe('2026-01-01');
    expect(end.value).toBe('2026-12-31');
    expect(start.value).not.toMatch(/\n|–|Au/);
  });

  it('long range uses 1 month and dual fields with selection edge', async () => {
    const start = document.createElement('input');
    start.id = 'dp-start-t';
    const end = document.createElement('input');
    end.id = 'dp-end-t';
    host.append(start, end);
    const el = createPicker({
      variant: 'modal',
      range: '',
      months: '1',
      'for-start': 'dp-start-t',
      'for-end': 'dp-end-t',
      'range-start': '2026-10-21',
      'range-end': '2027-09-26',
    });
    await el.updateComplete;
    await el.show(null, 'end');
    await el.updateComplete;
    const cal = el.shadowRoot?.querySelector('k3-calendar') as
      | (HTMLElement & { updateComplete: Promise<unknown>; months: number; selectionTarget: string })
      | null;
    expect(cal).toBeTruthy();
    await cal!.updateComplete;
    expect(cal!.months).toBe(1);
    expect(cal!.selectionTarget).toBe('end');
    expect(cal!.shadowRoot?.querySelector('.months-row')).toBeFalsy();
    await el.hide(true);
    expect(start.value).toBe('2026-10-21');
    expect(end.value).toBe('2027-09-26');
  });

  it('shows two-line Du/Au supporting with years when range crosses years', async () => {
    const el = createPicker({
      variant: 'modal',
      range: '',
      'range-start': '2026-10-21',
      'range-end': '2027-09-26',
    });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const lines = el.shadowRoot?.querySelectorAll('.supporting .range-line');
    expect(lines?.length).toBe(2);
    expect(lines?.[0]?.textContent).toMatch(/2026/);
    expect(lines?.[1]?.textContent).toMatch(/2027/);
    await el.hide(false);
  });
});
