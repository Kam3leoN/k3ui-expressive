import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import type { K3Calendar } from '../../src/components/pickers/calendar.js';

describe('k3-calendar header + year slide', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-calendar'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  function createCal(attrs: Record<string, string> = {}): K3Calendar {
    const el = document.createElement('k3-calendar') as K3Calendar;
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    host.appendChild(el);
    return el;
  }

  it('splits month (left) and year (right) in the header', async () => {
    const el = createCal({ value: '2026-11-11' });
    await el.updateComplete;
    const root = el.shadowRoot!;
    const monthBtn = root.querySelector('.period--month .period-btn') as HTMLButtonElement;
    const yearBtn = root.querySelector('.period--year .period-btn') as HTMLButtonElement;
    expect(monthBtn).toBeTruthy();
    expect(yearBtn).toBeTruthy();
    expect(monthBtn.getAttribute('aria-expanded')).toBe('false');
    expect(yearBtn.getAttribute('aria-expanded')).toBe('false');
    expect(yearBtn.textContent).toContain('2026');
  });

  it('opens month menu as a fixed column grid (12 cells)', async () => {
    const el = createCal({ value: '2026-08-01' });
    await el.updateComplete;
    const root = el.shadowRoot!;
    (root.querySelector('.period--month .period-btn') as HTMLButtonElement).click();
    await el.updateComplete;
    const monthGrid = root.querySelector('.grid.year');
    expect(monthGrid).toBeTruthy();
    expect(root.querySelectorAll('.grid.year [role="gridcell"]').length).toBe(12);
    expect(root.querySelector('.years-scroll')).toBeNull();
  });

  it('opens year menu as a sliding scroll grid (not a page of 18)', async () => {
    const el = createCal({
      value: '2026-08-01',
      'min-date': '2020-01-01',
      'max-date': '2030-12-31',
    });
    await el.updateComplete;
    const root = el.shadowRoot!;
    (root.querySelector('.period--year .period-btn') as HTMLButtonElement).click();
    await el.updateComplete;
    const scroll = root.querySelector('.years-scroll.k3-scroll');
    expect(scroll).toBeTruthy();
    const cells = root.querySelectorAll('.grid.multi-year [role="gridcell"]');
    expect(cells.length).toBe(11); /* 2020…2030 */
    expect(root.querySelector('.grid.year')).toBeNull();
  });

  it('animates value change when a day is selected', async () => {
    const el = createCal({ value: '2026-06-01' });
    await el.updateComplete;
    const root = el.shadowRoot!;
    const day = [...root.querySelectorAll<HTMLButtonElement>('.grid.month .cell')].find(
      (b) => b.getAttribute('aria-pressed') !== 'true' && !b.disabled && b.textContent?.trim() === '15',
    );
    expect(day).toBeTruthy();
    day!.click();
    await el.updateComplete;
    const selected = root.querySelector('.grid.month .cell[aria-pressed="true"]');
    expect(selected?.getAttribute('data-value-anim')).toBeTruthy();
  });

  it('range scroll keeps month list stable when picking the end date', async () => {
    const el = createCal({
      range: '',
      'start-at': '2026-12-01',
      'scroll-months': '6',
    });
    await el.updateComplete;
    const root = el.shadowRoot!;
    const paneYms = () =>
      [...root.querySelectorAll<HTMLElement>('.month-pane')].map((p) => p.dataset.ym);
    const before = paneYms();
    expect(before[0]).toBe('2026-11'); /* anchor = active - 1 */
    expect(before).toContain('2026-12');
    expect(before).toContain('2027-01');

    const clickInPane = (ym: string, index: number) => {
      const pane = root.querySelector(`.month-pane[data-ym="${ym}"]`);
      const btns = [...(pane?.querySelectorAll<HTMLButtonElement>('button.cell:not([disabled])') ?? [])];
      expect(btns.length).toBeGreaterThan(index);
      btns[index]!.click();
      return btns[index]!.textContent?.replace(/\s+/g, '') ?? '';
    };

    const startDay = clickInPane('2026-12', 0);
    await el.updateComplete;
    expect(el.rangeStart).toBe(`2026-12-${startDay.padStart(2, '0')}`);
    expect(paneYms()).toEqual(before);

    const endDay = clickInPane('2027-01', 10);
    await el.updateComplete;
    expect(el.rangeEnd).toBe(`2027-01-${endDay.padStart(2, '0')}`);
    /* Same panes — no rebuild / jump back to top */
    expect(paneYms()).toEqual(before);
  });
});
