import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@k3ui/i18n/index.js';
import en from '../src/i18n/en.json';
import fr from '../src/i18n/fr.json';
import '../src/register.js';
import { mountClocks } from '../src/pages/clocks.js';
import { mountPomodoro } from '../src/pages/pomodoro.js';
import { mountCalendar } from '../src/pages/calendar.js';
import { mountTodo } from '../src/pages/todo.js';
import { mountAlarms } from '../src/pages/alarms.js';
import { parseRoute } from '../src/app.js';
import { HUB_CARDS } from '../../../playground/showcase-mount.js';

describe('showcase clocks / pomodoro / calendar / todo / alarms routes', () => {
  it('parses #/clocks, #/pomodoro, #/calendar, #/todo, #/alarms (widgets → clocks)', () => {
    expect(parseRoute('#/clocks')).toBe('clocks');
    expect(parseRoute('#/widgets')).toBe('clocks');
    expect(parseRoute('#/pomodoro')).toBe('pomodoro');
    expect(parseRoute('#/calendar')).toBe('calendar');
    expect(parseRoute('#/todo')).toBe('todo');
    expect(parseRoute('#/alarms')).toBe('alarms');
  });

  it('hub splits Horloge, Pomodoro, Calendar, To-do and Alarms into separate cards', () => {
    const ids = HUB_CARDS.map((c) => c.id);
    expect(ids).toContain('clocks');
    expect(ids).toContain('pomodoro');
    expect(ids).toContain('calendar');
    expect(ids).toContain('todo');
    expect(ids).toContain('alarms');
    expect(ids).not.toContain('widgets');
    const clocks = HUB_CARDS.find((c) => c.id === 'clocks')!;
    const pomo = HUB_CARDS.find((c) => c.id === 'pomodoro')!;
    const cal = HUB_CARDS.find((c) => c.id === 'calendar')!;
    const todo = HUB_CARDS.find((c) => c.id === 'todo')!;
    const alarms = HUB_CARDS.find((c) => c.id === 'alarms')!;
    expect(clocks.href).toBe('#/showcase-clocks');
    expect(pomo.href).toBe('#/showcase-pomodoro');
    expect(cal.href).toBe('#/showcase-calendar');
    expect(todo.href).toBe('#/showcase-todo');
    expect(alarms.href).toBe('#/showcase-alarms');
    expect(clocks.components).toEqual([
      'analog',
      'digital',
      'shape',
      'pill',
      'numerals',
      'date',
      'dial',
    ]);
    expect(clocks.components).not.toContain('pomodoro');
    expect(pomo.components).toEqual(['pomodoro', 'countdown', 'stopwatch']);
    expect(cal.components).toEqual([
      'month',
      'week',
      'today',
      'day-tile',
      'year-tile',
      'pill',
      'agenda',
    ]);
    expect(todo.components).toEqual(['list', 'focus']);
    expect(alarms.components).toEqual(['k3-switch', 'days', '12h', '24h']);
  });
});

describe('showcase clocks page', () => {
  let host: HTMLElement;

  beforeAll(() => {
    i18n.extend({ en, fr });
    i18n.setLocale('en');
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('mounts seven clock models without pomodoro', async () => {
    const unmount = mountClocks(host);
    expect(host.querySelector('.page-title')).toBeTruthy();
    expect(host.querySelectorAll('.widget-card')).toHaveLength(7);
    expect(host.querySelector('[data-analog]')).toBeTruthy();
    expect(host.querySelector('[data-poster-root]')).toBeTruthy();
    expect(host.querySelector('[data-shape-clock]')).toBeTruthy();
    expect(host.querySelector('[data-pill-clock]')).toBeTruthy();
    expect(host.querySelector('[data-numerals]')).toBeTruthy();
    expect(host.querySelector('[data-date-clock]')).toBeTruthy();
    expect(host.querySelector('[data-expressive-dial]')).toBeTruthy();
    expect(host.querySelector('[data-pomodoro]')).toBeNull();
    expect(host.querySelector('.analog-clock__dial path')).toBeTruthy();
    expect(host.querySelector('[data-clock-hours] .poster-clock__digit')).toBeTruthy();
    expect(host.querySelector('[data-pill-hours]')?.textContent).toMatch(/\d/);
    expect(host.querySelector('.numerals-clock__numeral')?.textContent).toBe('12');
    expect(host.querySelector('.numerals-clock__hand.is-second')).toBeNull();
    expect(host.querySelector('.numerals-clock__dot')).toBeTruthy();
    expect(host.querySelector('.numerals-clock__date')).toBeNull();
    expect(host.querySelector('.shape-clock__time')?.textContent).toMatch(/\d/);
    expect(host.querySelector('[data-date-digits]')?.textContent).toMatch(/\d+:\d+/);
    expect(host.querySelector('[data-date-label]')?.textContent).toMatch(/,/);
    expect(host.querySelectorAll('.expressive-dial-clock__tick')).toHaveLength(60);
    await vi.waitFor(() => {
      expect(host.querySelector('[data-expressive-dial-time]')?.textContent).toMatch(/\d/);
    });
    expect(host.textContent?.toLowerCase()).not.toContain('lucid');
    unmount();
  });

  it('expressive dial paints time + seconds trail', async () => {
    const { ExpressiveDialClock } = await import('../src/lucid/expressive-dial-clock.js');
    const root = document.createElement('figure');
    root.innerHTML = `
      <svg data-expressive-dial-svg></svg>
      <time data-expressive-dial-time></time>
    `;
    document.body.append(root);
    const fixed = () => new Date(2026, 10, 23, 13, 35, 15);
    const clock = new ExpressiveDialClock(root, { locale: 'en', now: fixed });
    clock.start();
    await vi.waitFor(() => {
      expect(root.querySelector('[data-expressive-dial-time]')?.textContent).toBe('13:35');
    });
    expect(root.querySelectorAll('.expressive-dial-clock__tick')).toHaveLength(60);
    expect(root.querySelector('.expressive-dial-clock__colon')?.textContent).toBe(':');
    expect(root.getAttribute('aria-label')).toMatch(/1/);
    const active = [...root.querySelectorAll<SVGLineElement>('.expressive-dial-clock__tick')].filter(
      (t) => (t.style.getPropertyValue('--k3-dial-tick-mix') || '0%') !== '0%',
    );
    expect(active.length).toBeGreaterThan(10);
    clock.stop();
    root.remove();
  });

  it('date clock formats "Lundi, 23 Novembre" and fits 12h/24h period', async () => {
    const { DateClock, formatDateClockLabel } = await import('../src/lucid/date-clock.js');
    const fixedDay = new Date(2026, 10, 23, 22, 21, 0);
    expect(formatDateClockLabel(fixedDay, 'fr')).toBe('Lundi, 23 Novembre');
    expect(formatDateClockLabel(fixedDay, 'en')).toBe('Monday, 23 November');
    expect(formatDateClockLabel(new Date(2026, 8, 2, 12, 0, 0), 'fr')).toBe(
      'Mercredi, 2 Septembre',
    );

    const root = document.createElement('div');
    root.innerHTML = `
      <time data-date-time>
        <span data-date-digits></span>
        <span data-date-period></span>
      </time>
      <p data-date-label></p>
    `;
    document.body.append(root);

    const fixed = () => fixedDay;
    const h12 = new DateClock(root, { locale: 'en', hour12: true, now: fixed });
    h12.start();
    expect(root.querySelector('[data-date-digits]')?.textContent).toBe('10:21');
    expect(root.querySelector('[data-date-period]')?.textContent?.toLowerCase()).toMatch(/p/);
    expect((root.querySelector('[data-date-period]') as HTMLElement).hidden).toBe(false);
    expect(root.querySelector('[data-date-label]')?.textContent).toBe('Monday, 23 November');
    h12.stop();

    const h24 = new DateClock(root, { locale: 'fr', hour12: false, now: fixed });
    h24.start();
    expect(root.querySelector('[data-date-digits]')?.textContent).toBe('22:21');
    expect((root.querySelector('[data-date-period]') as HTMLElement).hidden).toBe(true);
    expect(root.querySelector('[data-date-label]')?.textContent).toBe('Lundi, 23 Novembre');
    h24.stop();
    root.remove();
  });
});

describe('showcase pomodoro page', () => {
  let host: HTMLElement;

  beforeAll(() => {
    i18n.extend({ en, fr });
    i18n.setLocale('en');
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('mounts pomodoro + countdown + stopwatch (no clocks)', () => {
    const unmount = mountPomodoro(host);
    expect(host.querySelector('.page-title')).toBeTruthy();
    expect(host.querySelectorAll('.widget-card')).toHaveLength(3);
    expect(host.querySelector('[data-pomodoro]')).toBeTruthy();
    expect(host.querySelector('[data-pomo-toggle]')).toBeTruthy();
    expect(host.querySelector('[data-countdown]')).toBeTruthy();
    expect(host.querySelector('[data-cd-toggle]')).toBeTruthy();
    expect(host.querySelector('[data-stopwatch]')).toBeTruthy();
    expect(host.querySelector('[data-sw-toggle]')).toBeTruthy();
    const cdCustom = host.querySelector('[data-cd-custom]') as HTMLElement;
    expect(cdCustom).toBeTruthy();
    expect(cdCustom.hasAttribute('hidden')).toBe(true);
    expect(host.querySelector('[data-cd-custom-min]')?.tagName.toLowerCase()).toBe('k3-counter');
    const custom = host.querySelector('[data-pomo-custom]') as HTMLElement;
    expect(custom).toBeTruthy();
    expect(custom.hasAttribute('hidden')).toBe(true);
    const focus = host.querySelector('[data-custom-focus]') as HTMLElement & { value?: number };
    const pause = host.querySelector('[data-custom-pause]') as HTMLElement & { value?: number };
    const rounds = host.querySelector('[data-custom-rounds]') as HTMLElement & { value?: number };
    expect(focus?.tagName.toLowerCase()).toBe('k3-counter');
    expect(pause?.tagName.toLowerCase()).toBe('k3-counter');
    expect(rounds?.tagName.toLowerCase()).toBe('k3-counter');
    expect(Number(focus.value)).toBe(1);
    expect(Number(pause.value)).toBe(1);
    expect(Number(rounds.value)).toBe(1);
    expect(
      host.querySelectorAll('[data-pomo-custom] k3-counter.pomodoro-custom__counter'),
    ).toHaveLength(3);
    expect(
      host.querySelectorAll('[data-cd-custom] k3-counter.pomodoro-custom__counter'),
    ).toHaveLength(1);
    expect(host.querySelector('.pomodoro-custom__fields')).toBeTruthy();
    expect(host.textContent).toContain('25');
    expect(host.textContent).toContain('50');
    expect(host.textContent).toContain('90');
    expect(host.textContent).not.toContain('15 / 3');

    const group = host.querySelector('[data-presets]');
    group?.dispatchEvent(
      new CustomEvent('k3-change', {
        detail: { values: ['custom'] },
        bubbles: true,
      }),
    );
    expect(custom.hasAttribute('hidden')).toBe(false);
    group?.dispatchEvent(
      new CustomEvent('k3-change', {
        detail: { values: ['classic'] },
        bubbles: true,
      }),
    );
    expect(custom.hasAttribute('hidden')).toBe(true);
    expect(host.querySelector('[data-analog]')).toBeNull();
    expect(host.querySelector('[data-poster-root]')).toBeNull();
    unmount();
  });

  it('countdown + stopwatch stop enable after start and reset on k3-click', async () => {
    const unmount = mountPomodoro(host);
    await customElements.whenDefined('k3-icon-button');

    const cdRoot = host.querySelector<HTMLElement>('[data-countdown]')!;
    const cdToggle = host.querySelector<HTMLButtonElement>('[data-cd-toggle]')!;
    const cdStop = host.querySelector<HTMLElement>('[data-cd-stop]')!;
    expect(cdStop.hasAttribute('data-inactive')).toBe(true);
    expect(cdRoot.dataset.idle).toBe('true');

    cdToggle.click();
    expect(cdRoot.dataset.idle).toBe('false');
    expect(cdRoot.dataset.running).toBe('true');
    expect(cdStop.hasAttribute('data-inactive')).toBe(false);
    expect(cdStop.hasAttribute('disabled')).toBe(false);

    // Real path: inner shadow <button> click → k3-click (must work immediately after start).
    const cdInner = cdStop.shadowRoot?.querySelector('button');
    expect(cdInner).toBeTruthy();
    expect(cdInner!.disabled).toBe(false);
    cdInner!.click();
    expect(cdRoot.dataset.idle).toBe('true');
    expect(cdRoot.dataset.running).toBe('false');
    expect(cdStop.hasAttribute('data-inactive')).toBe(true);

    const swRoot = host.querySelector<HTMLElement>('[data-stopwatch]')!;
    const swToggle = host.querySelector<HTMLButtonElement>('[data-sw-toggle]')!;
    const swStop = host.querySelector<HTMLElement>('[data-sw-stop]')!;
    expect(swStop.hasAttribute('data-inactive')).toBe(true);
    expect(swRoot.dataset.idle).toBe('true');

    swToggle.click();
    expect(swRoot.dataset.idle).toBe('false');
    expect(swRoot.dataset.running).toBe('true');
    expect(swStop.hasAttribute('data-inactive')).toBe(false);
    expect(swStop.hasAttribute('disabled')).toBe(false);

    const swInner = swStop.shadowRoot?.querySelector('button');
    expect(swInner).toBeTruthy();
    expect(swInner!.disabled).toBe(false);
    swInner!.click();
    expect(swRoot.dataset.idle).toBe('true');
    expect(swRoot.dataset.running).toBe('false');
    expect(swStop.hasAttribute('data-inactive')).toBe(true);

    unmount();
  });

  it('skips title + lead when embedded in showcase-doc', () => {
    const wrap = document.createElement('div');
    wrap.className = 'showcase-doc';
    const live = document.createElement('div');
    wrap.append(live);
    document.body.append(wrap);
    const unmountClocks = mountClocks(live);
    expect(live.querySelector('.page-title')).toBeNull();
    expect(live.querySelector('.page-lead')).toBeNull();
    expect(live.querySelectorAll('.widget-card')).toHaveLength(7);
    unmountClocks();
    const unmountPomo = mountPomodoro(live);
    expect(live.querySelector('.page-title')).toBeNull();
    expect(live.querySelector('.page-lead')).toBeNull();
    expect(live.querySelector('[data-pomodoro]')).toBeTruthy();
    unmountPomo();
    wrap.remove();
  });
});

describe('showcase calendar page', () => {
  let host: HTMLElement;

  beforeAll(() => {
    i18n.extend({ en, fr });
    i18n.setLocale('en');
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('mounts month · week · today · day-tile · year-tile · pill · agenda', () => {
    const unmount = mountCalendar(host);
    expect(host.querySelector('.page-title')).toBeTruthy();
    expect(host.querySelectorAll('.widget-card')).toHaveLength(7);
    expect(host.querySelector('[data-cal-month] .cal-month__grid')).toBeTruthy();
    expect(host.querySelector('[data-cal-month] .cal-month__cell.is-today')).toBeTruthy();
    expect(host.querySelector('[data-cal-week] .cal-week__day.is-today')).toBeTruthy();
    expect(host.querySelector('[data-cal-today] .cal-today__day')?.textContent).toMatch(/\d+/);
    expect(host.querySelector('[data-cal-day-tile] .cal-day-tile__day')?.textContent).toMatch(
      /\d+/,
    );
    expect(host.querySelector('[data-cal-day-tile] .cal-day-tile__year')).toBeNull();
    expect(host.querySelector('[data-cal-year-tile] .cal-day-tile__day')?.textContent).toMatch(
      /\d+/,
    );
    expect(host.querySelector('[data-cal-year-tile] .cal-day-tile__foot .cal-day-tile__month')).toBeTruthy();
    expect(host.querySelector('[data-cal-year-tile] .cal-day-tile__year')?.textContent).toMatch(
      /^\d{4}$/,
    );
    expect(host.querySelector('[data-cal-year-tile] .cal-day-tile__meta .cal-day-tile__month')).toBeNull();
    expect(host.querySelector('[data-cal-pill] .cal-pill__day')?.textContent).toMatch(/\d+/);
    expect(host.querySelector('[data-cal-pill] .cal-pill__year')?.textContent).toMatch(/^\d{2}$/);
    expect(host.querySelector('[data-cal-agenda] .cal-agenda__coming')).toBeTruthy();
    expect(host.querySelectorAll('[data-cal-agenda] .cal-agenda__row').length).toBeGreaterThan(0);
    expect(host.textContent?.toLowerCase()).not.toContain('lucid');
    unmount();
  });

  it('pill calendar stacks weekday · day · month · yy centered', async () => {
    const { PillCalendar } = await import('../src/lucid/calendar-widgets.js');
    const root = document.createElement('div');
    document.body.append(root);
    const fixed = () => new Date(2026, 10, 23, 12, 0, 0);
    const fr = new PillCalendar(root, { locale: 'fr', now: fixed });
    expect(root.querySelector('.cal-pill__weekday')?.textContent).toMatch(/^Lun\.$/i);
    expect(root.querySelector('.cal-pill__day')?.textContent).toBe('23');
    expect(root.querySelector('.cal-pill__month')?.textContent).toMatch(/^Nov\.$/i);
    expect(root.querySelector('.cal-pill__year')?.textContent).toBe('26');
    fr.stop();
    root.remove();
  });

  it('day tile formats short weekday · month and large day', async () => {
    const { DayTileCalendar } = await import('../src/lucid/calendar-widgets.js');
    const root = document.createElement('div');
    document.body.append(root);
    const fixed = () => new Date(2026, 10, 22, 12, 0, 0);
    const en = new DayTileCalendar(root, { locale: 'en', now: fixed });
    expect(root.querySelector('.cal-day-tile__weekday')?.textContent).toBe('Sun');
    expect(root.querySelector('.cal-day-tile__month')?.textContent).toBe('Nov.');
    expect(root.querySelector('.cal-day-tile__day')?.textContent).toBe('22');
    expect(root.querySelector('.cal-day-tile__year')).toBeNull();
    en.stop();

    const fr = new DayTileCalendar(root, { locale: 'fr', now: fixed });
    expect(root.querySelector('.cal-day-tile__weekday')?.textContent?.toLowerCase()).toMatch(
      /^dim/,
    );
    expect(root.querySelector('.cal-day-tile__month')?.textContent).toMatch(/^Nov\.$/i);
    expect(root.querySelector('.cal-day-tile__day')?.textContent).toBe('22');
    expect(root.querySelector('.cal-day-tile__weekday')?.textContent?.[0]).toBe(
      root.querySelector('.cal-day-tile__weekday')?.textContent?.[0]?.toLocaleUpperCase('fr'),
    );
    fr.stop();

    const withYear = new DayTileCalendar(root, {
      locale: 'en',
      now: fixed,
      withYear: true,
    });
    expect(root.classList.contains('cal-day-tile--year')).toBe(true);
    expect(root.querySelector('.cal-day-tile__meta .cal-day-tile__weekday')?.textContent).toBe(
      'Sunday',
    );
    expect(root.querySelector('.cal-day-tile__meta .cal-day-tile__month')).toBeNull();
    expect(root.querySelector('.cal-day-tile__foot .cal-day-tile__month')?.textContent).toBe(
      'Nov.',
    );
    expect(root.querySelector('.cal-day-tile__year')?.textContent).toBe('2026');
    withYear.stop();

    const withYearFr = new DayTileCalendar(root, {
      locale: 'fr',
      now: fixed,
      withYear: true,
    });
    expect(
      root.querySelector('.cal-day-tile__meta .cal-day-tile__weekday')?.textContent?.toLowerCase(),
    ).toBe('dimanche');
    expect(root.querySelector('.cal-day-tile__foot .cal-day-tile__month')?.textContent).toMatch(
      /^Nov\.$/i,
    );
    withYearFr.stop();
    root.remove();
  });

  it('Today weekday is capitalized and CSS caps size for Mercredi/Dimanche', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const css = readFileSync(
      resolve(__dirname, '../src/pages.css'),
      'utf8',
    );
    expect(css).toMatch(/\.cal-today__weekday[\s\S]*?clamp\(1\.25rem,\s*12cqw,\s*1\.5rem\)/);
    expect(css).toMatch(/\.cal-today__weekday[\s\S]*?white-space:\s*nowrap/);

    i18n.setLocale('fr');
    const root = document.createElement('div');
    document.body.append(root);
    const { TodayCalendar } = await import('../src/lucid/calendar-widgets.js');
    const cal = new TodayCalendar(root, { locale: 'fr', items: [] });
    const label = root.querySelector('.cal-today__weekday')?.textContent ?? '';
    expect(label.length).toBeGreaterThan(0);
    expect(label[0]).toBe(label[0].toLocaleUpperCase('fr'));
    expect(label.slice(1)).toBe(label.slice(1).toLocaleLowerCase('fr'));
    cal.stop();
    root.remove();
    i18n.setLocale('en');
  });
});

describe('showcase todo page', () => {
  let host: HTMLElement;

  beforeAll(() => {
    i18n.extend({ en, fr });
    i18n.setLocale('en');
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('mounts list · focus cards and toggles a task', () => {
    const unmount = mountTodo(host);
    expect(host.querySelector('.page-title')).toBeTruthy();
    expect(host.querySelectorAll('.widget-card')).toHaveLength(2);
    expect(host.querySelector('[data-todo-list] .todo__list')).toBeTruthy();
    expect(host.querySelector('[data-todo-focus] .todo__focus-task')).toBeTruthy();
    expect(host.querySelector('[data-todo-list] .todo__ring')).toBeTruthy();
    expect(host.querySelectorAll('[data-todo-list] .todo__row').length).toBeGreaterThan(0);
    expect(host.textContent?.toLowerCase()).not.toContain('lucid');

    const openCountBefore = host.querySelectorAll(
      '[data-todo-list] .todo__row:not(.is-done)',
    ).length;
    const open = host.querySelector<HTMLButtonElement>(
      '[data-todo-list] .todo__row:not(.is-done) .todo__check',
    );
    expect(open).toBeTruthy();
    open!.click();
    const openCountAfter = host.querySelectorAll(
      '[data-todo-list] .todo__row:not(.is-done)',
    ).length;
    expect(openCountAfter).toBe(openCountBefore - 1);

    const before = host.querySelector('[data-todo-focus] .todo__focus-task')?.textContent;
    const focusDone = host.querySelector<HTMLButtonElement>(
      '[data-todo-focus] [data-todo-act="toggle"]',
    );
    expect(focusDone).toBeTruthy();
    focusDone!.click();
    const after = host.querySelector('[data-todo-focus] .todo__focus-task')?.textContent;
    expect(after).not.toBe(before);

    expect(host.querySelectorAll('k3-icon-button[data-todo-act="reset"]')).toHaveLength(2);
    expect(host.querySelector('k3-button[data-todo-act="clear"]')).toBeTruthy();
    host.querySelector<HTMLElement>('[data-todo-list] [data-todo-act="reset"]')!.click();
    expect(
      host.querySelectorAll('[data-todo-list] .todo__row:not(.is-done)').length,
    ).toBe(openCountBefore);

    unmount();
  });

  it('hides page chrome inside showcase-doc', () => {
    const wrap = document.createElement('div');
    wrap.className = 'showcase-doc';
    const live = document.createElement('div');
    wrap.append(live);
    document.body.append(wrap);
    const unmount = mountTodo(live);
    expect(live.querySelector('.page-title')).toBeNull();
    expect(live.querySelector('.page-lead')).toBeNull();
    expect(live.querySelector('[data-todo-list]')).toBeTruthy();
    unmount();
    wrap.remove();
  });
});

describe('showcase alarms page', () => {
  let host: HTMLElement;

  beforeAll(() => {
    i18n.extend({ en, fr });
    i18n.setLocale('en');
  });

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('mounts two alarm cards with days + switch', () => {
    const unmount = mountAlarms(host);
    expect(host.querySelector('.page-title')).toBeTruthy();
    expect(host.querySelectorAll('.widget-card')).toHaveLength(2);
    expect(host.querySelectorAll('[data-alarm]')).toHaveLength(2);
    expect(host.querySelectorAll('button.alarm__day')).toHaveLength(14);
    expect(host.querySelectorAll('k3-switch.alarm__switch')).toHaveLength(2);
    expect(host.querySelector('[data-alarm="0"]')?.classList.contains('is-on')).toBe(true);
    expect(host.querySelector('[data-alarm="1"]')?.classList.contains('is-off')).toBe(true);
    expect(host.querySelector('[data-alarm="0"] .alarm__hours')?.textContent).toMatch(/\d/);
    expect(host.querySelector('[data-alarm="0"] .alarm__minutes')?.textContent).toMatch(/\d/);
    expect(host.textContent?.toLowerCase()).not.toContain('lucid');
    unmount();
  });

  it('toggles a weekday and keeps digit size in 12h vs 24h', async () => {
    const { AlarmCard } = await import('../src/lucid/alarm-widgets.js');
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const css = readFileSync(resolve(__dirname, '../src/pages.css'), 'utf8');
    expect(css).toMatch(/\.alarm__hours,\s*\n\.alarm__minutes/);
    expect(css).toMatch(/font-family:\s*'Roboto Flex'/);
    expect(css).toMatch(/\.alarm__hours[\s\S]*?'wght'\s*300/);
    expect(css).toMatch(/\.alarm__minutes[\s\S]*?'wght'\s*700/);
    expect(css).toMatch(/\.alarm__hours[\s\S]*?font-size:\s*clamp\(7\.25rem/);
    expect(css).toMatch(/\.alarm__minutes[\s\S]*?font-size:\s*clamp\(5\.85rem/);
    expect(css).toMatch(/\.alarm__time[\s\S]*?column-gap:\s*var\(--k3-sys-spacing-space50\)/);
    expect(css).toMatch(/\.alarm__period\[hidden\][\s\S]*?visibility:\s*hidden/);
    expect(css).toMatch(/\.alarm__days[\s\S]*?position:\s*absolute/);
    expect(css).toMatch(/\.alarm__switch[\s\S]*?bottom:\s*var\(--k3-sys-spacing-space200\)/);
    expect(css).toMatch(/\.alarm__day[\s\S]*?border-radius:\s*50%/);
    expect(css).toMatch(/\.alarm__day\.is-on[\s\S]*?corner-extra-small/);
    expect(css).toMatch(/\.alarm__day-letter[\s\S]*?font-weight:\s*700/);
    expect(css).toMatch(/\.alarm__day-letter[\s\S]*?label-small-size/);

    const root = document.createElement('div');
    document.body.append(root);
    const card = new AlarmCard(root, {
      locale: 'en',
      hour12: true,
      state: {
        minutes: 7 * 60 + 20,
        enabled: true,
        days: [true, true, true, true, true, false, false],
      },
    });
    expect(root.querySelector('.alarm__period')?.textContent?.toLowerCase()).toMatch(/a|p/);
    expect((root.querySelector('.alarm__period') as HTMLElement).hidden).toBe(false);
    const mon = root.querySelector<HTMLButtonElement>('button.alarm__day[data-alarm-day="0"]');
    expect(mon?.classList.contains('is-on')).toBe(true);
    expect(mon?.getAttribute('aria-pressed')).toBe('true');
    mon!.click();
    expect(
      root.querySelector<HTMLButtonElement>('button.alarm__day[data-alarm-day="0"]')
        ?.classList.contains('is-on'),
    ).toBe(false);
    expect(card.getState().days[0]).toBe(false);
    card.stop();

    const h24 = new AlarmCard(root, {
      locale: 'fr',
      hour12: false,
      state: {
        minutes: 7 * 60 + 20,
        enabled: true,
        days: [true, false, false, false, false, false, false],
      },
    });
    expect(root.querySelector('.alarm__hours')?.textContent).toBe('07');
    expect(root.querySelector('.alarm__minutes')?.textContent).toBe('20');
    expect((root.querySelector('.alarm__period') as HTMLElement).hidden).toBe(true);
    h24.stop();
    root.remove();
  });
});
