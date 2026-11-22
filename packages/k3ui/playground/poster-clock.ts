/**
 * Lucid Poster clock (MIT) — hours over minutes, date; only changed figures roll.
 *
 * @see lucid-clock-m3 / poster-clock.ts
 */
import { afterAnimation, prefersReducedMotion } from './lucid-motion.js';

export interface PosterClockOptions {
  locale?: string;
  hour12?: boolean;
  now?: () => Date;
}

export class PosterClock {
  private readonly time: HTMLTimeElement;
  private readonly hours: HTMLElement;
  private readonly minutes: HTMLElement;
  private readonly date: HTMLElement;
  private readonly hour12: boolean;
  private readonly dateFormat: Intl.DateTimeFormat;
  private readonly labelFormat: Intl.DateTimeFormat;
  private readonly now: () => Date;
  private timer: number | undefined;
  private rendered = false;

  constructor(root: HTMLElement, options: PosterClockOptions = {}) {
    const q = <T extends HTMLElement>(sel: string): T => {
      const el = root.querySelector<T>(sel);
      if (!el) throw new Error(`PosterClock: missing ${sel}`);
      return el;
    };
    this.time = q<HTMLTimeElement>('[data-clock-time]');
    this.hours = q('[data-clock-hours]');
    this.minutes = q('[data-clock-minutes]');
    this.date = q('[data-clock-date]');
    this.now = options.now ?? (() => new Date());

    const locale = options.locale;
    const cycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions()
      .hourCycle;
    this.hour12 = options.hour12 ?? (cycle === 'h11' || cycle === 'h12');
    this.dateFormat = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    this.labelFormat = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: this.hour12,
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.tick();
    });
  }

  start(): void {
    this.tick();
  }

  stop(): void {
    window.clearTimeout(this.timer);
  }

  private tick(): void {
    window.clearTimeout(this.timer);
    const d = this.now();
    this.render(d);
    const wait = 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 20;
    this.timer = window.setTimeout(() => this.tick(), wait);
  }

  private render(d: Date): void {
    let h = d.getHours();
    if (this.hour12) h = h % 12 || 12;
    const hh = this.hour12 ? String(h) : String(h).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    this.setFigures(this.hours, hh);
    this.setFigures(this.minutes, mm);
    this.date.textContent = this.dateFormat.format(d);
    this.time.dateTime = `${String(d.getHours()).padStart(2, '0')}:${mm}`;
    this.time.setAttribute('aria-label', this.labelFormat.format(d));
    this.rendered = true;
  }

  private setFigures(row: HTMLElement, value: string): void {
    while (row.children.length < value.length) {
      const cell = document.createElement('span');
      cell.className = 'poster-clock__digit';
      row.append(cell);
    }
    while (row.children.length > value.length) row.lastElementChild?.remove();

    [...value].forEach((ch, i) => {
      const cell = row.children[i] as HTMLElement;
      const shown = cell.querySelector<HTMLElement>('.poster-clock__glyph:not(.is-leaving)');
      if (shown?.textContent === ch) return;

      const glyph = document.createElement('span');
      glyph.className = 'poster-clock__glyph';
      glyph.textContent = ch;
      const animate = this.rendered && !prefersReducedMotion();

      if (shown) {
        if (animate) {
          shown.classList.add('is-leaving');
          void afterAnimation(shown).then(() => shown.remove());
        } else {
          shown.remove();
        }
      }
      if (animate) glyph.classList.add('is-entering');
      cell.append(glyph);
    });
  }
}
