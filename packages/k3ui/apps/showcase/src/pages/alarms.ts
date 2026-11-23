import { html, nothing, render } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';
import {
  AlarmCard,
  demoAlarms,
  type AlarmLabels,
} from '../lucid/alarm-widgets.js';
import { pageTitleRow } from '../demo-chrome.js';

/** Alarms live UI — vertical condensed cards. */
const PAGE_STACK = 'k3ui' as const;

const t = (key: string) => i18n.t(key);

function labelsFromI18n(): Partial<AlarmLabels> {
  return {
    switch: t('showcase.alarms.switch'),
    dayToggle: t('showcase.alarms.dayToggle'),
  };
}

export function mountAlarms(host: HTMLElement): () => void {
  const cards: AlarmCard[] = [];
  const showTitle = !host.closest('.showcase-doc');

  const paint = (): void => {
    while (cards.length) cards.pop()?.stop();

    const labels = labelsFromI18n();
    const seeds = demoAlarms();
    const locale = i18n.locale === 'fr' ? 'fr' : 'en';

    render(
      html`
        <section
          class="page page--alarms"
          aria-labelledby=${showTitle ? 'alarms-title' : nothing}
          aria-label=${showTitle ? nothing : t('showcase.alarms.title')}
        >
          ${showTitle
            ? html`
                ${pageTitleRow('showcase.alarms.title', PAGE_STACK, 'alarms-title')}
                <p class="page-lead">${t('showcase.alarms.lead')}</p>
              `
            : null}

          <div class="widget-grid k3-layout-grid k3-demo-cols-2">
            <article class="widget-card widget-card--alarm">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.alarms.card.morning.title')}</h2>
                <p class="widget-card__hint">${t('showcase.alarms.card.morning.hint')}</p>
              </header>
              <div class="widget-card__body">
                <figure
                  class="alarm"
                  data-alarm="0"
                  role="group"
                  aria-label=${t('showcase.alarms.card.morning.title')}
                ></figure>
              </div>
            </article>

            <article class="widget-card widget-card--alarm">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.alarms.card.weekend.title')}</h2>
                <p class="widget-card__hint">${t('showcase.alarms.card.weekend.hint')}</p>
              </header>
              <div class="widget-card__body">
                <figure
                  class="alarm"
                  data-alarm="1"
                  role="group"
                  aria-label=${t('showcase.alarms.card.weekend.title')}
                ></figure>
              </div>
            </article>
          </div>
        </section>
      `,
      host,
    );

    host.querySelectorAll<HTMLElement>('[data-alarm]').forEach((el) => {
      const i = Number(el.dataset.alarm);
      const seed = seeds[i] ?? seeds[0];
      cards.push(
        new AlarmCard(el, {
          locale,
          labels,
          state: {
            minutes: seed.minutes,
            enabled: seed.enabled,
            days: [...seed.days],
          },
        }),
      );
    });
  };

  paint();
  const onLocale = (): void => paint();
  document.addEventListener('k3-locale-change', onLocale);

  return () => {
    document.removeEventListener('k3-locale-change', onLocale);
    while (cards.length) cards.pop()?.stop();
    render(null, host);
  };
}
