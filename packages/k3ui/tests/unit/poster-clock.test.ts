import { afterEach, describe, expect, it, vi } from 'vitest';
import { PosterClock } from '../../playground/poster-clock.js';

function mountClock(): HTMLElement {
  const root = document.createElement('figure');
  root.className = 'poster-clock';
  root.innerHTML = `
    <time class="poster-clock__time" data-clock-time>
      <span class="poster-clock__row" data-clock-hours aria-hidden="true"></span>
      <span class="poster-clock__row" data-clock-minutes aria-hidden="true"></span>
    </time>
    <figcaption class="poster-clock__date" data-clock-date></figcaption>
  `;
  document.body.append(root);
  return root;
}

describe('PosterClock', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it('renders hours, minutes and a localized date', () => {
    const root = mountClock();
    const clock = new PosterClock(root, {
      locale: 'en-GB',
      hour12: false,
      now: () => new Date(2026, 10, 22, 17, 35, 0),
    });
    clock.start();
    expect(root.querySelector('[data-clock-hours]')?.textContent).toBe('17');
    expect(root.querySelector('[data-clock-minutes]')?.textContent).toBe('35');
    expect(root.querySelector('[data-clock-date]')?.textContent).toMatch(/November|22/);
    expect(root.querySelector('time')?.getAttribute('datetime')).toBe('17:35');
    clock.stop();
  });

  it('rolls only the digit that changes on the next minute', () => {
    vi.useFakeTimers();
    let t = new Date(2026, 10, 22, 9, 59, 50);
    const root = mountClock();
    const clock = new PosterClock(root, {
      locale: 'en-GB',
      hour12: false,
      now: () => t,
    });
    clock.start();
    expect(root.querySelector('[data-clock-minutes]')?.textContent).toBe('59');

    t = new Date(2026, 10, 22, 10, 0, 0);
    vi.advanceTimersByTime(10_100);
    const shown = (sel: string) =>
      [...root.querySelectorAll(`${sel} .poster-clock__glyph:not(.is-leaving)`)]
        .map((g) => g.textContent)
        .join('');
    expect(shown('[data-clock-hours]')).toBe('10');
    expect(shown('[data-clock-minutes]')).toBe('00');
    clock.stop();
  });
});
