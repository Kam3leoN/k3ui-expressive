import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@k3ui/i18n/index.js';
import en from '../src/i18n/en.json';
import fr from '../src/i18n/fr.json';
import '../src/register.js';
import { mountClocks } from '../src/pages/clocks.js';
import { mountPomodoro } from '../src/pages/pomodoro.js';
import { parseRoute } from '../src/app.js';
import { HUB_CARDS } from '../../../playground/showcase-mount.js';

describe('showcase clocks / pomodoro routes', () => {
  it('parses #/clocks and #/pomodoro (widgets → clocks)', () => {
    expect(parseRoute('#/clocks')).toBe('clocks');
    expect(parseRoute('#/widgets')).toBe('clocks');
    expect(parseRoute('#/pomodoro')).toBe('pomodoro');
  });

  it('hub splits Horloge and Pomodoro into separate cards', () => {
    const ids = HUB_CARDS.map((c) => c.id);
    expect(ids).toContain('clocks');
    expect(ids).toContain('pomodoro');
    expect(ids).not.toContain('widgets');
    const clocks = HUB_CARDS.find((c) => c.id === 'clocks')!;
    const pomo = HUB_CARDS.find((c) => c.id === 'pomodoro')!;
    expect(clocks.href).toBe('#/showcase-clocks');
    expect(pomo.href).toBe('#/showcase-pomodoro');
    expect(clocks.components).toEqual([
      'analog',
      'digital',
      'shape',
      'pill',
      'numerals',
    ]);
    expect(clocks.components).not.toContain('pomodoro');
    expect(pomo.components).toContain('pomodoro');
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

  it('mounts five clock models without pomodoro', () => {
    const unmount = mountClocks(host);
    expect(host.querySelector('.page-title')).toBeTruthy();
    expect(host.querySelectorAll('.widget-card')).toHaveLength(5);
    expect(host.querySelector('[data-analog]')).toBeTruthy();
    expect(host.querySelector('[data-poster-root]')).toBeTruthy();
    expect(host.querySelector('[data-shape-clock]')).toBeTruthy();
    expect(host.querySelector('[data-pill-clock]')).toBeTruthy();
    expect(host.querySelector('[data-numerals]')).toBeTruthy();
    expect(host.querySelector('[data-pomodoro]')).toBeNull();
    expect(host.querySelector('.analog-clock__dial path')).toBeTruthy();
    expect(host.querySelector('[data-clock-hours] .poster-clock__digit')).toBeTruthy();
    expect(host.querySelector('[data-pill-hours]')?.textContent).toMatch(/\d/);
    expect(host.querySelector('.numerals-clock__numeral')?.textContent).toBe('12');
    expect(host.querySelector('.numerals-clock__hand.is-second')).toBeNull();
    expect(host.querySelector('.numerals-clock__dot')).toBeTruthy();
    expect(host.querySelector('.numerals-clock__date')).toBeNull();
    expect(host.querySelector('.shape-clock__time')?.textContent).toMatch(/\d/);
    unmount();
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

  it('mounts pomodoro alone (no clocks)', () => {
    const unmount = mountPomodoro(host);
    expect(host.querySelector('.page-title')).toBeTruthy();
    expect(host.querySelector('[data-pomodoro]')).toBeTruthy();
    expect(host.querySelector('[data-pomo-toggle]')).toBeTruthy();
    expect(host.querySelector('[data-analog]')).toBeNull();
    expect(host.querySelector('[data-poster-root]')).toBeNull();
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
    expect(live.querySelectorAll('.widget-card')).toHaveLength(5);
    unmountClocks();
    const unmountPomo = mountPomodoro(live);
    expect(live.querySelector('.page-title')).toBeNull();
    expect(live.querySelector('.page-lead')).toBeNull();
    expect(live.querySelector('[data-pomodoro]')).toBeTruthy();
    unmountPomo();
    wrap.remove();
  });
});
