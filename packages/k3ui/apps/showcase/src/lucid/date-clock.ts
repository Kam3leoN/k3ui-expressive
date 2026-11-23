/**
 * Landscape date clock — large 12h/24h time + period + single-line date
 * ("Lundi, 23 Novembre" / "Monday, 23 November").
 * MIT Lucid-inspired layout on M3 tonal tokens.
 *
 * <figure class="date-clock" data-date-clock role="img">
 *   <time class="date-clock__time" data-date-time>
 *     <span class="date-clock__digits" data-date-digits></span>
 *     <span class="date-clock__period" data-date-period></span>
 *   </time>
 *   <p class="date-clock__date" data-date-label></p>
 * </figure>
 */
export interface DateClockOptions {
  locale?: string;
  hour12?: boolean;
  now?: () => Date;
}

function capitalize(s: string, locale?: string): string {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
}

/** Build "Lundi, 23 Novembre" — weekday + day + month, each title-cased. */
export function formatDateClockLabel(d: Date, locale?: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).formatToParts(d);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  return `${capitalize(weekday, locale)}, ${day} ${capitalize(month, locale)}`.trim();
}

export class DateClock {
  private readonly time: HTMLTimeElement;
  private readonly digits: HTMLElement;
  private readonly period: HTMLElement;
  private readonly date: HTMLElement;
  private readonly hour12: boolean;
  private readonly locale: string | undefined;
  private readonly labelFormat: Intl.DateTimeFormat;
  private readonly periodFormat: Intl.DateTimeFormat | null;
  private readonly now: () => Date;
  private timer: number | undefined;

  constructor(
    private readonly root: HTMLElement,
    options: DateClockOptions = {},
  ) {
    const q = <T extends HTMLElement>(sel: string): T => {
      const el = root.querySelector<T>(sel);
      if (!el) throw new Error(`DateClock: missing ${sel}`);
      return el;
    };
    this.time = q<HTMLTimeElement>('[data-date-time]');
    this.digits = q('[data-date-digits]');
    this.period = q('[data-date-period]');
    this.date = q('[data-date-label]');
    this.now = options.now ?? (() => new Date());
    this.locale = options.locale;

    const cycle = new Intl.DateTimeFormat(options.locale, {
      hour: 'numeric',
    }).resolvedOptions().hourCycle;
    this.hour12 = options.hour12 ?? (cycle === 'h11' || cycle === 'h12');

    this.labelFormat = new Intl.DateTimeFormat(options.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: this.hour12,
    });
    this.periodFormat = this.hour12
      ? new Intl.DateTimeFormat(options.locale, { hour: 'numeric', hour12: true })
      : null;

    document.addEventListener(
      'visibilitychange',
      () => !document.hidden && this.tick(),
    );
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
    let h = d.getHours();
    if (this.hour12) h = h % 12 || 12;
    const hh = this.hour12 ? String(h) : String(h).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    this.digits.textContent = `${hh}:${mm}`;
    this.time.dateTime = `${String(d.getHours()).padStart(2, '0')}:${mm}`;

    if (this.periodFormat) {
      const parts = this.periodFormat.formatToParts(d);
      const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
      this.period.textContent = dayPeriod;
      this.period.hidden = !dayPeriod;
    } else {
      this.period.textContent = '';
      this.period.hidden = true;
    }

    this.date.textContent = formatDateClockLabel(d, this.locale);
    this.root.setAttribute('aria-label', this.labelFormat.format(d));

    const wait = 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 20;
    this.timer = window.setTimeout(() => this.tick(), wait);
  }
}
