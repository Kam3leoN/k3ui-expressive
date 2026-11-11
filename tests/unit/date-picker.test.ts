import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import type { K3DatePicker } from '../../src/components/pickers/date-picker.js';

describe('k3-date-picker', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-date-picker', 'k3-calendar', 'k3-button', 'k3-text-field'],
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

  it('requires both ends for range confirm', async () => {
    const el = createPicker({ variant: 'modal', range: '' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const ok = el.shadowRoot?.querySelectorAll('k3-button');
    const confirm = ok?.[ok.length - 1] as HTMLElement & { disabled: boolean };
    expect(confirm?.disabled).toBe(true);
    await el.hide(false);
  });

  it('range forces modal even when variant=docked', async () => {
    const el = createPicker({ variant: 'docked', range: '' });
    await el.updateComplete;
    expect(el.getAttribute('data-resolved-variant')).toBe('modal');
    expect(el.getAttribute('aria-modal')).toBe('true');
    await el.show();
    await el.updateComplete;
    expect(el.getAttribute('data-resolved-variant')).toBe('modal');
    expect(el.getAttribute('aria-modal')).toBe('true');
    const scrim = el.shadowRoot?.querySelector('.scrim') as HTMLElement;
    expect(scrim).toBeTruthy();
    expect(getComputedStyle(scrim).display).not.toBe('none');
    await el.hide(false);
  });

  it('single date respects modal variant', async () => {
    const el = createPicker({ variant: 'modal' });
    await el.updateComplete;
    expect(el.getAttribute('aria-modal')).toBe('true');
    expect(el.getAttribute('data-resolved-variant')).toBe('modal');
    await el.show();
    await el.updateComplete;
    expect(el.getAttribute('aria-modal')).toBe('true');
    await el.hide(false);
  });

  it('single date respects docked variant (aria-modal false)', async () => {
    const el = createPicker({ variant: 'docked' });
    await el.updateComplete;
    expect(el.getAttribute('data-resolved-variant')).toBe('docked');
    expect(el.getAttribute('aria-modal')).toBe('false');
  });

  it('range uses scroll layout (Noph continuous months)', async () => {
    const el = createPicker({
      range: '',
      'start-at': '2027-01-01',
      'range-start': '2027-01-01',
      'range-end': '2027-02-15',
    });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    /* Edge-sticky k3-scroll on dialog — not a nested UA bar in the calendar */
    expect(el.shadowRoot?.querySelector('.surface-scroll.k3-scroll')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('.surface-head')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('.surface-foot')).toBeTruthy();
    const cal = el.shadowRoot?.querySelector('k3-calendar') as
      | (HTMLElement & { updateComplete: Promise<unknown>; layout: string })
      | null;
    expect(cal).toBeTruthy();
    await cal!.updateComplete;
    expect(cal!.shadowRoot?.querySelector('.months-scroll')).toBeTruthy();
    expect(cal!.shadowRoot?.querySelector('.months-scroll.k3-scroll')).toBeFalsy();
    expect(cal!.shadowRoot?.querySelector('.months-row')).toBeFalsy();
    await el.hide(false);
  });

  it('one-field range writes compact start – end on confirm', async () => {
    const field = document.createElement('input');
    field.id = 'dp-wide';
    host.append(field);
    const el = createPicker({
      range: '',
      for: 'dp-wide',
      'range-start': '2027-01-01',
      'range-end': '2027-02-15',
    });
    await el.updateComplete;
    await el.show();
    await el.hide(true);
    expect(field.value).toBe('2027-01-01 - 2027-02-15');
  });

  it('modal shows calendar ↔ input mode toggle', async () => {
    const el = createPicker({ variant: 'modal', value: '2026-08-17' });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const toggle = el.shadowRoot?.querySelector('.ms-btn') as HTMLButtonElement | null;
    expect(toggle).toBeTruthy();
    expect(toggle!.querySelector('[data-k3-icon="edit_calendar"]')).toBeTruthy();
    toggle!.click();
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('.input-host')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('k3-calendar')).toBeFalsy();
    expect(el.shadowRoot?.querySelector('[data-k3-icon="calendar_today"]')).toBeTruthy();
    await el.hide(false);
  });

  it('range modal uses compact one-line headline', async () => {
    const el = createPicker({
      range: '',
      'range-start': '2026-12-22',
      'range-end': '2027-01-16',
    });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const supporting = el.shadowRoot?.querySelector('.supporting');
    expect(supporting?.textContent).toMatch(/–/);
    expect(supporting?.querySelector('.range-line')).toBeNull();
    await el.hide(false);
  });

  it('two-field range stores one ISO date each', async () => {
    const start = document.createElement('input');
    start.id = 'dp-one-s';
    start.value = 'Du : 2026-01-01\nAu : 2026-06-01'; /* polluted — must sanitize */
    const end = document.createElement('input');
    end.id = 'dp-one-e';
    end.value = '2026-12-31 – extra';
    host.append(start, end);
    const el = createPicker({
      range: '',
      'for-start': 'dp-one-s',
      'for-end': 'dp-one-e',
    });
    await el.updateComplete;
    await el.show();
    await el.hide(true);
    expect(start.value).toBe('2026-01-01');
    expect(end.value).toBe('2026-12-31');
    expect(start.value).not.toMatch(/\n|–|Au/);
  });

  it('two-field range keeps OK disabled until both ends are set', async () => {
    const start = document.createElement('input');
    start.id = 'dp-ok-s';
    const end = document.createElement('input');
    end.id = 'dp-ok-e';
    host.append(start, end);
    const el = createPicker({
      range: '',
      'for-start': 'dp-ok-s',
      'for-end': 'dp-ok-e',
    });
    await el.updateComplete;
    await el.show();
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
    /* First tap = start only — still need end (Noph) */
    expect(confirm?.disabled).toBe(true);
    await el.hide(false);
  });

  it('shows years in compact range headline when span crosses years', async () => {
    const el = createPicker({
      range: '',
      'range-start': '2026-10-21',
      'range-end': '2027-09-26',
    });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const supporting = el.shadowRoot?.querySelector('.supporting');
    expect(supporting?.textContent).toMatch(/2026/);
    expect(supporting?.textContent).toMatch(/2027/);
    await el.hide(false);
  });

  it(
    'range end tap does not re-seed calendar startAt (no month jump)',
    async () => {
      /* Modal + dual calendar update is heavier under full-suite load */
      const el = createPicker({
        range: '',
        'start-at': '2026-12-01',
      });
      await el.updateComplete;
      await el.show();
      await el.updateComplete;
      const cal = el.shadowRoot?.querySelector('k3-calendar') as HTMLElement & {
        updateComplete: Promise<unknown>;
        startAt: string;
        rangeStart: string;
        rangeEnd: string;
        shadowRoot: ShadowRoot | null;
      };
      await cal.updateComplete;
      const seeded = cal.startAt;
      expect(seeded).toMatch(/2026-12/);
      const ymsBefore = [
        ...(cal.shadowRoot?.querySelectorAll<HTMLElement>('.month-pane') ?? []),
      ].map((p) => p.dataset.ym);

      const clickInPane = (ym: string, index: number) => {
        const pane = cal.shadowRoot?.querySelector(`.month-pane[data-ym="${ym}"]`);
        const btns = [
          ...(pane?.querySelectorAll<HTMLButtonElement>('button.cell:not([disabled])') ?? []),
        ];
        expect(btns.length).toBeGreaterThan(index);
        btns[index]!.click();
      };

      clickInPane('2026-12', 0);
      await cal.updateComplete;
      await el.updateComplete;
      expect(cal.startAt).toBe(seeded);

      clickInPane('2027-01', 10);
      await cal.updateComplete;
      await el.updateComplete;
      expect(cal.rangeEnd).toMatch(/^2027-01-/);
      expect(cal.startAt).toBe(seeded);
      const ymsAfter = [
        ...(cal.shadowRoot?.querySelectorAll<HTMLElement>('.month-pane') ?? []),
      ].map((p) => p.dataset.ym);
      expect(ymsAfter).toEqual(ymsBefore);
      await el.hide(false);
    },
    15_000,
  );

  it('shows 4-digit years in range headline for same-year spans', async () => {
    const el = createPicker({
      range: '',
      'range-start': '2026-11-24',
      'range-end': '2026-11-27',
    });
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const supporting = el.shadowRoot?.querySelector('.supporting');
    const text = supporting?.textContent ?? '';
    expect(text.match(/2026/g)?.length).toBeGreaterThanOrEqual(1);
    expect(text).toMatch(/24/);
    expect(text).toMatch(/27/);
    await el.hide(false);
  });

  it('modal closes on scrim click', async () => {
    const el = createPicker({ variant: 'modal' });
    await el.updateComplete;
    expect(await el.show()).toBe(true);
    await el.updateComplete;
    await Promise.resolve();
    await Promise.resolve();
    const scrim = el.shadowRoot?.querySelector('.scrim') as HTMLElement;
    expect(scrim).toBeTruthy();
    expect(getComputedStyle(scrim).display).not.toBe('none');
    scrim.click();
    await new Promise((r) => setTimeout(r, 500));
    expect(el.open).toBe(false);
  });
});
