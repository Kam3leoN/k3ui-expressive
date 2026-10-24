import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import type K3MoodCalendar from '../../src/components/pickers/mood-calendar.js';
import type { MoodEntry } from '../../src/components/pickers/mood-calendar.types.js';
import { defaultMoodYears } from '../../src/components/pickers/mood-calendar.types.js';

type MoodCalEl = K3MoodCalendar & {
  _selectYear: (y: number) => void;
  _toggleFilter: (id: string) => void;
  _selectDate: (date: string) => Promise<void>;
  _filter: string | null;
  _selected: string | null;
};

describe('k3-mood-calendar', () => {
  beforeAll(async () => {
    await init({ components: ['k3-mood-calendar', 'k3-button', 'k3-shape-chip', 'k3-dialog'] });
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  async function mount(attrs: Record<string, string> = {}): Promise<MoodCalEl> {
    const el = document.createElement('k3-mood-calendar') as MoodCalEl;
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
  }

  it('defaults to current year + n−1 tabs', async () => {
    const el = await mount({ demo: '' });
    expect(el.years).toEqual(defaultMoodYears());
    expect(el.years).toHaveLength(2);
  });

  it('renders year grid with demo data and xs legend chips', async () => {
    const el = await mount({ demo: '', year: String(new Date().getFullYear()) });
    expect(el.shadowRoot?.querySelector('.year-grid')).toBeTruthy();
    expect(el.shadowRoot?.querySelectorAll('button.day[data-date]').length).toBeGreaterThan(0);
    expect(el.shadowRoot?.querySelector('.stats')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('aside.panel')).toBeFalsy();
    expect(el.shadowRoot?.querySelector('k3-dialog')).toBeTruthy();
    const chip = el.shadowRoot?.querySelector('k3-shape-chip');
    expect(chip?.getAttribute('size')).toBe('xs');
  });

  it('accepts custom entries property', async () => {
    const y = new Date().getFullYear();
    const el = await mount({ year: String(y) });
    el.demo = false;
    el.years = [y];
    el.year = y;
    el.entries = [
      {
        date: `${y}-03-01`,
        mood: 'good',
        icon: 'pets',
        title: `March 1, ${y}`,
        body: 'Custom note',
      },
    ] satisfies MoodEntry[];
    await el.updateComplete;
    expect(
      el.shadowRoot?.querySelector(`button.day[data-date="${y}-03-01"]`),
    ).toBeTruthy();
    expect(el.shadowRoot?.textContent).toContain('Custom note');
  });

  it('toggles legend filter and emits k3-filter-change', async () => {
    const el = await mount({ demo: '' });
    const spy = vi.fn();
    el.addEventListener('k3-filter-change', spy);
    el._toggleFilter('excellent');
    await el.updateComplete;
    expect(el._filter).toBe('excellent');
    expect(spy).toHaveBeenCalled();
    el._toggleFilter('excellent');
    expect(el._filter).toBeNull();
  });

  it('opens dialog when a day is selected', async () => {
    const y = new Date().getFullYear();
    const el = await mount({ year: String(y) });
    el.demo = false;
    el.years = [y];
    el.year = y;
    el.entries = [
      {
        date: `${y}-01-15`,
        mood: 'special',
        icon: 'flare',
        title: 'Jan 15',
        body: 'Modal test',
      },
    ];
    await el.updateComplete;
    const dialog = el.shadowRoot?.querySelector('k3-dialog') as
      | (HTMLElement & { show: () => Promise<boolean> })
      | null;
    expect(dialog).toBeTruthy();
    const showSpy = vi.spyOn(dialog!, 'show').mockResolvedValue(true);
    await el._selectDate(`${y}-01-15`);
    expect(el._selected).toBe(`${y}-01-15`);
    expect(showSpy).toHaveBeenCalled();
    showSpy.mockRestore();
  });

  it('emits k3-year-change when year changes', async () => {
    const [prev, cur] = defaultMoodYears();
    const el = await mount({ demo: '', year: String(prev) });
    el.years = [prev, cur];
    await el.updateComplete;
    const spy = vi.fn();
    el.addEventListener('k3-year-change', spy);
    el._selectYear(cur);
    await el.updateComplete;
    expect(el.year).toBe(cur);
    expect(spy.mock.calls[0]?.[0]?.detail?.year).toBe(cur);
  });
});
