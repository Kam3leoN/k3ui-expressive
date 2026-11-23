import { html, nothing, render } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';
import {
  AgendaCalendar,
  DayTileCalendar,
  MonthCalendar,
  PillCalendar,
  TodayCalendar,
  WeekCalendar,
} from '../lucid/calendar-widgets.js';
import { demoReminders } from '../lucid/calendar-agenda.js';
import { pageTitleRow } from '../demo-chrome.js';

/** Calendar live UI — month · week · today · day-tile · year-tile · pill · agenda. */
const PAGE_STACK = 'k3ui' as const;

const t = (key: string) => i18n.t(key);

export function mountCalendar(host: HTMLElement): () => void {
  let month: MonthCalendar | undefined;
  let week: WeekCalendar | undefined;
  let today: TodayCalendar | undefined;
  let dayTile: DayTileCalendar | undefined;
  let yearTile: DayTileCalendar | undefined;
  let pill: PillCalendar | undefined;
  let agenda: AgendaCalendar | undefined;
  const showTitle = !host.closest('.showcase-doc');

  const paint = (): void => {
    month?.stop();
    week?.stop();
    today?.stop();
    dayTile?.stop();
    yearTile?.stop();
    pill?.stop();
    agenda?.stop();
    month = undefined;
    week = undefined;
    today = undefined;
    dayTile = undefined;
    yearTile = undefined;
    pill = undefined;
    agenda = undefined;

    const locale = i18n.locale || document.documentElement.lang || 'en';
    const items = demoReminders();

    render(
      html`
        <section
          class="page page--calendar"
          aria-labelledby=${showTitle ? 'calendar-title' : nothing}
          aria-label=${showTitle ? nothing : t('showcase.calendar.title')}
        >
          ${showTitle
            ? html`
                ${pageTitleRow('showcase.calendar.title', PAGE_STACK, 'calendar-title')}
                <p class="page-lead">${t('showcase.calendar.lead')}</p>
              `
            : null}

          <div class="widget-grid k3-layout-grid k3-demo-cols-2">
            <article class="widget-card widget-card--calendar">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.calendar.month.title')}</h2>
                <p class="widget-card__hint">${t('showcase.calendar.month.hint')}</p>
              </header>
              <div class="widget-card__body">
                <div
                  class="cal-month"
                  data-cal-month
                  role="group"
                  aria-label=${t('showcase.calendar.month.title')}
                ></div>
              </div>
            </article>

            <article class="widget-card widget-card--calendar">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.calendar.week.title')}</h2>
                <p class="widget-card__hint">${t('showcase.calendar.week.hint')}</p>
              </header>
              <div class="widget-card__body">
                <div
                  class="cal-week"
                  data-cal-week
                  role="group"
                  aria-label=${t('showcase.calendar.week.title')}
                ></div>
              </div>
            </article>

            <article class="widget-card widget-card--calendar">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.calendar.today.title')}</h2>
                <p class="widget-card__hint">${t('showcase.calendar.today.hint')}</p>
              </header>
              <div class="widget-card__body">
                <div
                  class="cal-today"
                  data-cal-today
                  role="group"
                  aria-label=${t('showcase.calendar.today.title')}
                ></div>
              </div>
            </article>

            <article class="widget-card widget-card--calendar">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.calendar.agenda.title')}</h2>
                <p class="widget-card__hint">${t('showcase.calendar.agenda.hint')}</p>
              </header>
              <div class="widget-card__body">
                <div
                  class="cal-agenda"
                  data-cal-agenda
                  role="group"
                  aria-label=${t('showcase.calendar.agenda.title')}
                ></div>
              </div>
            </article>

            <article class="widget-card widget-card--calendar">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.calendar.dayTile.title')}</h2>
                <p class="widget-card__hint">${t('showcase.calendar.dayTile.hint')}</p>
              </header>
              <div class="widget-card__body">
                <div
                  class="cal-day-tile"
                  data-cal-day-tile
                  role="img"
                  aria-label=${t('showcase.calendar.dayTile.aria')}
                ></div>
              </div>
            </article>

            <article class="widget-card widget-card--calendar">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.calendar.yearTile.title')}</h2>
                <p class="widget-card__hint">${t('showcase.calendar.yearTile.hint')}</p>
              </header>
              <div class="widget-card__body">
                <div
                  class="cal-day-tile cal-day-tile--year"
                  data-cal-year-tile
                  role="img"
                  aria-label=${t('showcase.calendar.yearTile.aria')}
                ></div>
              </div>
            </article>

            <article class="widget-card widget-card--calendar">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.calendar.pill.title')}</h2>
                <p class="widget-card__hint">${t('showcase.calendar.pill.hint')}</p>
              </header>
              <div class="widget-card__body">
                <div
                  class="cal-pill"
                  data-cal-pill
                  role="img"
                  aria-label=${t('showcase.calendar.pill.aria')}
                ></div>
              </div>
            </article>
          </div>
        </section>
      `,
      host,
    );

    const monthRoot = host.querySelector<HTMLElement>('[data-cal-month]');
    if (monthRoot) month = new MonthCalendar(monthRoot, { locale, items });

    const weekRoot = host.querySelector<HTMLElement>('[data-cal-week]');
    if (weekRoot) week = new WeekCalendar(weekRoot, { locale, items });

    const todayRoot = host.querySelector<HTMLElement>('[data-cal-today]');
    if (todayRoot) today = new TodayCalendar(todayRoot, { locale, items });

    const dayTileRoot = host.querySelector<HTMLElement>('[data-cal-day-tile]');
    if (dayTileRoot) dayTile = new DayTileCalendar(dayTileRoot, { locale });

    const yearTileRoot = host.querySelector<HTMLElement>('[data-cal-year-tile]');
    if (yearTileRoot) {
      yearTile = new DayTileCalendar(yearTileRoot, { locale, withYear: true });
    }

    const pillRoot = host.querySelector<HTMLElement>('[data-cal-pill]');
    if (pillRoot) pill = new PillCalendar(pillRoot, { locale });

    const agendaRoot = host.querySelector<HTMLElement>('[data-cal-agenda]');
    if (agendaRoot) {
      agenda = new AgendaCalendar(agendaRoot, {
        locale,
        items,
        comingLabel: t('showcase.calendar.agenda.coming'),
        emptyLabel: t('showcase.calendar.agenda.empty'),
      });
    }
  };

  paint();
  const onLocale = (): void => paint();
  document.addEventListener('k3-locale-change', onLocale);

  return () => {
    document.removeEventListener('k3-locale-change', onLocale);
    month?.stop();
    week?.stop();
    today?.stop();
    dayTile?.stop();
    yearTile?.stop();
    pill?.stop();
    agenda?.stop();
    render(null, host);
  };
}
