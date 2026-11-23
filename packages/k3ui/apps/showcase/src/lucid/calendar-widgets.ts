/**
 * Calendar widget variants — month · week · today · day-tile · agenda.
 */
import { MaterialShape } from './shapes.js';
import {
  demoReminders,
  forDay,
  hasOn,
  timeText,
  upcoming,
  type Reminder,
  type Upcoming,
} from './calendar-agenda.js';

export type CalendarLocale = string;

function weekdayLetters(mondayFirst: boolean, locale: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(2023, 0, (mondayFirst ? 2 : 1) + i);
    out.push(d.toLocaleDateString(locale, { weekday: 'narrow' }));
  }
  return out;
}

function weekLead(now: Date, mondayFirst: boolean): number {
  return (now.getDay() + (mondayFirst ? 6 : 0)) % 7;
}

/** Month grid — today in a pentagon, reminder dots under marked days. */
export class MonthCalendar {
  private readonly items: Reminder[];
  private year: number;
  private monthIndex: number;
  private readonly mondayFirst: boolean;
  private locale: string;
  private timer = 0;

  constructor(
    private readonly root: HTMLElement,
    opts: { mondayFirst?: boolean; locale?: string; items?: Reminder[] } = {},
  ) {
    this.mondayFirst = opts.mondayFirst ?? true;
    this.locale = opts.locale ?? (document.documentElement.lang || 'en');
    this.items = opts.items ?? demoReminders();
    const now = new Date();
    this.year = now.getFullYear();
    this.monthIndex = now.getMonth();
    this.render();
    this.timer = window.setInterval(() => this.render(), 60_000);
    this.root.addEventListener('click', this.onClick);
  }

  setLocale(locale: string): void {
    this.locale = locale;
    this.render();
  }

  stop(): void {
    clearInterval(this.timer);
    this.root.removeEventListener('click', this.onClick);
  }

  private onClick = (e: Event): void => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-cal-nav]');
    if (!t) return;
    const dir = Number(t.dataset.calNav);
    if (!Number.isFinite(dir)) return;
    if (dir === 0) {
      const n = new Date();
      this.year = n.getFullYear();
      this.monthIndex = n.getMonth();
    } else {
      let m = this.monthIndex + dir;
      let y = this.year;
      if (m < 0) {
        m = 11;
        y -= 1;
      } else if (m > 11) {
        m = 0;
        y += 1;
      }
      this.year = y;
      this.monthIndex = m;
    }
    this.render();
  };

  private cells(): {
    year: number;
    month: number;
    day: number;
    other: boolean;
    today: boolean;
    marked: boolean;
  }[] {
    const now = new Date();
    const lead = (new Date(this.year, this.monthIndex, 1).getDay() + (this.mondayFirst ? 6 : 0)) % 7;
    const out = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(this.year, this.monthIndex, 1 - lead + i);
      out.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
        other: d.getMonth() !== this.monthIndex,
        today:
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate(),
        marked: hasOn(this.items, d.getFullYear(), d.getMonth(), d.getDate()),
      });
    }
    return out;
  }

  private render(): void {
    const label = new Date(this.year, this.monthIndex, 1).toLocaleDateString(this.locale, {
      month: 'long',
    });
    const year = String(this.year);
    const now = new Date();
    const isCurrent =
      this.year === now.getFullYear() && this.monthIndex === now.getMonth();
    const days = weekdayLetters(this.mondayFirst, this.locale);
    const weekend = (i: number) =>
      this.mondayFirst ? i >= 5 : i === 0 || i === 6;

    this.root.innerHTML = `
      <div class="cal-month__head">
        <p class="cal-month__title">
          <span class="cal-month__name">${label}</span>
          <span class="cal-month__year">${year}</span>
        </p>
        <div class="cal-month__nav">
          ${
            isCurrent
              ? ''
              : `<button type="button" class="cal-month__nav-btn" data-cal-nav="0" aria-label="This month">
            <span class="ms notranslate" translate="no" lang="zxx" data-k3-icon="calendar_today" aria-hidden="true"></span>
          </button>`
          }
          <button type="button" class="cal-month__nav-btn" data-cal-nav="-1" aria-label="Previous month">
            <span class="ms notranslate" translate="no" lang="zxx" data-k3-icon="chevron_left" aria-hidden="true"></span>
          </button>
          <button type="button" class="cal-month__nav-btn" data-cal-nav="1" aria-label="Next month">
            <span class="ms notranslate" translate="no" lang="zxx" data-k3-icon="chevron_right" aria-hidden="true"></span>
          </button>
        </div>
      </div>
      <div class="cal-month__weekdays" role="row">
        ${days
          .map(
            (d, i) =>
              `<span class="cal-month__wd${weekend(i) ? ' is-weekend' : ''}" role="columnheader">${d}</span>`,
          )
          .join('')}
      </div>
      <div class="cal-month__grid" role="grid">
        ${this.cells()
          .map((c) => {
            const cls = [
              'cal-month__cell',
              c.other ? 'is-other' : '',
              c.today ? 'is-today' : '',
              c.marked ? 'is-marked' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return `<div class="${cls}" role="gridcell">
              ${
                c.today
                  ? `<svg class="cal-month__pentagon" viewBox="0 0 100 100" aria-hidden="true"><path></path></svg>`
                  : ''
              }
              <span class="cal-month__day">${c.day}</span>
              <span class="cal-month__dot" aria-hidden="true"></span>
            </div>`;
          })
          .join('')}
      </div>
    `;

    const pent = this.root.querySelector<SVGPathElement>('.cal-month__pentagon path');
    if (pent) new MaterialShape(pent, 'pentagon');
  }
}

/** Week strip — seven days, today in a vertical pill. */
export class WeekCalendar {
  private readonly items: Reminder[];
  private readonly mondayFirst: boolean;
  private locale: string;
  private timer = 0;

  constructor(
    private readonly root: HTMLElement,
    opts: { mondayFirst?: boolean; locale?: string; items?: Reminder[] } = {},
  ) {
    this.mondayFirst = opts.mondayFirst ?? true;
    this.locale = opts.locale ?? (document.documentElement.lang || 'en');
    this.items = opts.items ?? demoReminders();
    this.render();
    this.timer = window.setInterval(() => this.render(), 60_000);
  }

  setLocale(locale: string): void {
    this.locale = locale;
    this.render();
  }

  stop(): void {
    clearInterval(this.timer);
  }

  private week(): { d: Date; today: boolean; marked: boolean }[] {
    const now = new Date();
    const lead = weekLead(now, this.mondayFirst);
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - lead + i);
      out.push({
        d,
        today: i === lead,
        marked: hasOn(this.items, d.getFullYear(), d.getMonth(), d.getDate()),
      });
    }
    return out;
  }

  private render(): void {
    const now = new Date();
    const monthLabel = now.toLocaleDateString(this.locale, {
      month: 'long',
      year: 'numeric',
    });
    this.root.innerHTML = `
      <p class="cal-week__month">${monthLabel}</p>
      <div class="cal-week__row" role="list">
        ${this.week()
          .map((c) => {
            const raw = c.d
              .toLocaleDateString(this.locale, { weekday: 'short' })
              .replace(/\./g, '')
              .slice(0, 2)
              .toLocaleLowerCase(this.locale);
            const wd = raw ? raw[0].toLocaleUpperCase(this.locale) + raw.slice(1) : '';
            return `<div class="cal-week__day${c.today ? ' is-today' : ''}${c.marked ? ' is-marked' : ''}" role="listitem">
              <span class="cal-week__wd">${wd}</span>
              <span class="cal-week__num">${c.d.getDate()}</span>
              <span class="cal-week__dot" aria-hidden="true"></span>
            </div>`;
          })
          .join('')}
      </div>
    `;
  }
}

/** Today — enormous date + weekday + month + reminder dots. */
export class TodayCalendar {
  private readonly items: Reminder[];
  private locale: string;
  private timer = 0;

  constructor(
    private readonly root: HTMLElement,
    opts: { locale?: string; items?: Reminder[] } = {},
  ) {
    this.locale = opts.locale ?? (document.documentElement.lang || 'en');
    this.items = opts.items ?? demoReminders();
    this.render();
    this.timer = window.setInterval(() => this.render(), 60_000);
  }

  setLocale(locale: string): void {
    this.locale = locale;
    this.render();
  }

  stop(): void {
    clearInterval(this.timer);
  }

  private render(): void {
    const now = new Date();
    const count = Math.min(
      3,
      forDay(this.items, now.getFullYear(), now.getMonth(), now.getDate()).length,
    );
    const weekdayRaw = now.toLocaleDateString(this.locale, { weekday: 'long' });
    const weekday =
      weekdayRaw.charAt(0).toLocaleUpperCase(this.locale) + weekdayRaw.slice(1);
    const month = now.toLocaleDateString(this.locale, { month: 'long' });
    this.root.innerHTML = `
      <p class="cal-today__weekday">${weekday}</p>
      <p class="cal-today__day">${now.getDate()}</p>
      <div class="cal-today__foot">
        <span class="cal-today__month">${month}</span>
        ${Array.from({ length: count }, () => '<span class="cal-today__dot" aria-hidden="true"></span>').join('')}
      </div>
    `;
  }
}

/** Capitalize a locale date fragment (optional strip of trailing dots). */
function calendarLabel(
  d: Date,
  locale: string,
  opts: Intl.DateTimeFormatOptions,
  stripDot = true,
): string {
  let raw = d.toLocaleDateString(locale, opts).trim();
  if (stripDot) raw = raw.replace(/\.$/u, '');
  if (!raw) return raw;
  return raw.charAt(0).toLocaleUpperCase(locale) + raw.slice(1);
}

/** Short locale label with a trailing period (“Nov.” / “Lun.”). */
function abbrevDot(d: Date, locale: string, opts: Intl.DateTimeFormatOptions): string {
  const raw = d.toLocaleDateString(locale, opts).replace(/\.$/u, '').trim();
  if (!raw) return raw;
  const titled = raw.charAt(0).toLocaleUpperCase(locale) + raw.slice(1);
  return titled.endsWith('.') ? titled : `${titled}.`;
}

function monthAbbrevDot(d: Date, locale: string): string {
  return abbrevDot(d, locale, { month: 'short' });
}

function weekdayAbbrevDot(d: Date, locale: string): string {
  return abbrevDot(d, locale, { weekday: 'short' });
}

/**
 * Day tile — icon-style date (weekday accent · month muted · large day).
 * Optional year under the day (`withYear`) — height balanced top / middle / bottom.
 * Inspired by mobile calendar app glyphs on M3 tokens.
 */
export class DayTileCalendar {
  private locale: string;
  private timer = 0;
  private readonly withYear: boolean;
  private readonly now: () => Date;

  constructor(
    private readonly root: HTMLElement,
    opts: { locale?: string; now?: () => Date; withYear?: boolean } = {},
  ) {
    this.locale = opts.locale ?? (document.documentElement.lang || 'en');
    this.now = opts.now ?? (() => new Date());
    this.withYear = opts.withYear ?? false;
    this.root.classList.toggle('cal-day-tile--year', this.withYear);
    this.render();
    this.timer = window.setInterval(() => this.render(), 60_000);
  }

  setLocale(locale: string): void {
    this.locale = locale;
    this.render();
  }

  stop(): void {
    clearInterval(this.timer);
  }

  private render(): void {
    const d = this.now();
    const weekday = calendarLabel(d, this.locale, {
      weekday: this.withYear ? 'long' : 'short',
    });
    const month = monthAbbrevDot(d, this.locale);
    const day = String(d.getDate());
    const year = String(d.getFullYear());
    const label = d.toLocaleDateString(this.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      ...(this.withYear ? { year: 'numeric' as const } : {}),
    });
    this.root.setAttribute('aria-label', label);
    /* withYear: full weekday on top · day · "Nov. 2026" at bottom */
    const meta = this.withYear
      ? `<p class="cal-day-tile__meta">
          <span class="cal-day-tile__weekday">${weekday}</span>
        </p>`
      : `<p class="cal-day-tile__meta">
          <span class="cal-day-tile__weekday">${weekday}</span>
          <span class="cal-day-tile__month">${month}</span>
        </p>`;
    const foot = this.withYear
      ? `<p class="cal-day-tile__foot">
          <span class="cal-day-tile__month">${month}</span>
          <span class="cal-day-tile__year">${year}</span>
        </p>`
      : '';
    this.root.innerHTML = `
      ${meta}
      <p class="cal-day-tile__day">${day}</p>
      ${foot}
    `;
  }
}

/**
 * Narrow pill calendar — centered stack:
 * Lun.
 * 23
 * Nov.
 * 26
 */
export class PillCalendar {
  private locale: string;
  private timer = 0;
  private readonly now: () => Date;

  constructor(
    private readonly root: HTMLElement,
    opts: { locale?: string; now?: () => Date } = {},
  ) {
    this.locale = opts.locale ?? (document.documentElement.lang || 'en');
    this.now = opts.now ?? (() => new Date());
    this.render();
    this.timer = window.setInterval(() => this.render(), 60_000);
  }

  setLocale(locale: string): void {
    this.locale = locale;
    this.render();
  }

  stop(): void {
    clearInterval(this.timer);
  }

  private render(): void {
    const d = this.now();
    const weekday = weekdayAbbrevDot(d, this.locale);
    const month = monthAbbrevDot(d, this.locale);
    const day = String(d.getDate());
    const year2 = String(d.getFullYear()).slice(-2);
    const label = d.toLocaleDateString(this.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    this.root.setAttribute('aria-label', label);
    this.root.innerHTML = `
      <p class="cal-pill__weekday">${weekday}</p>
      <p class="cal-pill__day">${day}</p>
      <p class="cal-pill__month">${month}</p>
      <p class="cal-pill__year">${year2}</p>
    `;
  }
}

/** Agenda — “Coming up” list of next reminders. */
export class AgendaCalendar {
  private readonly items: Reminder[];
  private locale: string;
  private timer = 0;

  constructor(
    private readonly root: HTMLElement,
    opts: { locale?: string; items?: Reminder[]; emptyLabel?: string; comingLabel?: string } = {},
  ) {
    this.locale = opts.locale ?? (document.documentElement.lang || 'en');
    this.items = opts.items ?? demoReminders();
    this.emptyLabel = opts.emptyLabel ?? 'Nothing coming up';
    this.comingLabel = opts.comingLabel ?? 'Coming up';
    this.render();
    this.timer = window.setInterval(() => this.render(), 60_000);
  }

  private emptyLabel: string;
  private comingLabel: string;

  setLocale(locale: string, labels?: { empty?: string; coming?: string }): void {
    this.locale = locale;
    if (labels?.empty) this.emptyLabel = labels.empty;
    if (labels?.coming) this.comingLabel = labels.coming;
    this.render();
  }

  stop(): void {
    clearInterval(this.timer);
  }

  private render(): void {
    const now = new Date();
    const coming = upcoming(this.items, 4, now);
    const headDate = now.toLocaleDateString(this.locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    const rows =
      coming.length === 0
        ? `<div class="cal-agenda__empty">
            <span class="ms notranslate" translate="no" lang="zxx" data-k3-icon="event" aria-hidden="true"></span>
            <p>${this.emptyLabel}</p>
          </div>`
        : `<ul class="cal-agenda__list">${coming.map((u, i) => this.row(u, i, coming.length, now)).join('')}</ul>`;

    this.root.innerHTML = `
      <div class="cal-agenda__head">
        <p class="cal-agenda__coming">${this.comingLabel}</p>
        <p class="cal-agenda__date">${headDate}</p>
      </div>
      ${rows}
    `;
  }

  private row(u: Upcoming, index: number, total: number, now: Date): string {
    const soon = u.at.getTime() - now.getTime() < 6 * 86400000;
    const top = u.at
      .toLocaleDateString(this.locale, soon ? { weekday: 'short' } : { month: 'short' })
      .toUpperCase();
    const day = String(u.at.getDate());
    const ends =
      index === 0 && total === 1
        ? 'is-only'
        : index === 0
          ? 'is-first'
          : index === total - 1
            ? 'is-last'
            : '';
    return `<li class="cal-agenda__row ${ends}">
      <div class="cal-agenda__when">
        <span class="cal-agenda__when-top">${top}</span>
        <span class="cal-agenda__when-day">${day}</span>
      </div>
      <span class="cal-agenda__name">${u.item.name}</span>
      <span class="cal-agenda__time">${timeText(u.item, this.locale)}</span>
    </li>`;
  }
}
