/**
 * Vertical pill / narrow digital clock (world-clock style): place · stacked
 * hours/minutes · short date. MIT Lucid-inspired layout on M3 tokens.
 *
 * <figure class="pill-clock" data-pill-clock>
 *   <p class="pill-clock__place" data-pill-place></p>
 *   <time class="pill-clock__time" data-pill-time>
 *     <span class="pill-clock__row" data-pill-hours></span>
 *     <span class="pill-clock__row" data-pill-minutes></span>
 *   </time>
 *   <p class="pill-clock__date" data-pill-date></p>
 * </figure>
 */
export interface PillClockOptions {
  locale?: string;
  hour12?: boolean;
  /** Override the top label (default: city from IANA time zone). */
  place?: string;
  now?: () => Date;
}

export class PillClock {
  private readonly time: HTMLTimeElement;
  private readonly hours: HTMLElement;
  private readonly minutes: HTMLElement;
  private readonly date: HTMLElement;
  private readonly place: HTMLElement;
  private readonly hour12: boolean;
  private readonly dateFormat: Intl.DateTimeFormat;
  private readonly labelFormat: Intl.DateTimeFormat;
  private readonly now: () => Date;
  private timer: number | undefined;

  constructor(
    private readonly root: HTMLElement,
    options: PillClockOptions = {},
  ) {
    const q = <T extends HTMLElement>(sel: string): T => {
      const el = root.querySelector<T>(sel);
      if (!el) throw new Error(`PillClock: missing ${sel}`);
      return el;
    };
    this.time = q<HTMLTimeElement>('[data-pill-time]');
    this.hours = q('[data-pill-hours]');
    this.minutes = q('[data-pill-minutes]');
    this.date = q('[data-pill-date]');
    this.place = q('[data-pill-place]');
    this.now = options.now ?? (() => new Date());

    const locale = options.locale;
    const cycle = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
    }).resolvedOptions().hourCycle;
    this.hour12 = options.hour12 ?? (cycle === 'h11' || cycle === 'h12');
    this.dateFormat = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
    });
    this.labelFormat = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: this.hour12,
    });

    this.place.textContent =
      options.place ??
      (Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop() ??
        '').replace(/_/g, ' ');

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

    this.hours.textContent = hh;
    this.minutes.textContent = mm;
    this.time.dateTime = `${String(d.getHours()).padStart(2, '0')}:${mm}`;
    this.date.textContent = this.dateFormat.format(d).replace(',', '');
    this.root.setAttribute(
      'aria-label',
      `${this.place.textContent}, ${this.labelFormat.format(d)}`,
    );

    const wait = 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 20;
    this.timer = window.setTimeout(() => this.tick(), wait);
  }
}
