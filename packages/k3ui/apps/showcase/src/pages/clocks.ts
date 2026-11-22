import { html, nothing, render } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';
import { AnalogClock } from '../lucid/analog-clock.js';
import { PosterClock } from '../lucid/poster-clock.js';
import { ShapeClock } from '../lucid/shape-clock.js';
import { PillClock } from '../lucid/pill-clock.js';
import { NumeralsClock } from '../lucid/numerals-clock.js';
import { pageTitleRow } from '../demo-chrome.js';

/** Lucid clocks — analog · digital · shape · pill · numerals (MIT). */
const PAGE_STACK = 'k3ui' as const;

const t = (key: string) => i18n.t(key);

export function mountClocks(host: HTMLElement): () => void {
  let analog: AnalogClock | undefined;
  let poster: PosterClock | undefined;
  let shape: ShapeClock | undefined;
  let pill: PillClock | undefined;
  let numerals: NumeralsClock | undefined;
  /** Docs embed already shows the page title + blurb in `.section-head`. */
  const showTitle = !host.closest('.showcase-doc');

  const paint = (): void => {
    analog?.stop();
    poster?.stop();
    shape?.stop();
    pill?.stop();
    numerals?.stop();
    analog = undefined;
    poster = undefined;
    shape = undefined;
    pill = undefined;
    numerals = undefined;

    render(
      html`
        <section
          class="page page--clocks"
          aria-labelledby=${showTitle ? 'clocks-title' : nothing}
          aria-label=${showTitle ? nothing : t('showcase.clocks.title')}
        >
          ${showTitle
            ? html`
                ${pageTitleRow('showcase.clocks.title', PAGE_STACK, 'clocks-title')}
                <p class="page-lead">${t('showcase.clocks.lead')}</p>
              `
            : null}

          <div class="widget-grid k3-layout-grid k3-demo-cols-3">
            <article class="widget-card">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.clocks.analog.title')}</h2>
                <p class="widget-card__hint">${t('showcase.clocks.analog.hint')}</p>
              </header>
              <div class="widget-card__body">
                <figure class="analog-clock">
                  <svg
                    viewBox="0 0 200 200"
                    role="img"
                    aria-label=${t('showcase.clocks.analog.aria')}
                    data-analog
                  ></svg>
                </figure>
              </div>
            </article>

            <article class="widget-card">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.clocks.digital.title')}</h2>
                <p class="widget-card__hint">${t('showcase.clocks.digital.hint')}</p>
              </header>
              <div class="widget-card__body">
                <figure class="poster-clock showcase-poster-clock" data-poster-root>
                  <time class="poster-clock__time" data-clock-time>
                    <span class="poster-clock__row" data-clock-hours aria-hidden="true"></span>
                    <span class="poster-clock__row" data-clock-minutes aria-hidden="true"></span>
                  </time>
                  <figcaption class="poster-clock__date" data-clock-date></figcaption>
                </figure>
              </div>
            </article>

            <article class="widget-card">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.clocks.shape.title')}</h2>
                <p class="widget-card__hint">${t('showcase.clocks.shape.hint')}</p>
              </header>
              <div class="widget-card__body">
                <button
                  type="button"
                  class="shape-clock"
                  data-shape-clock
                  aria-label=${t('showcase.clocks.shape.aria')}
                >
                  <svg class="shape-clock__shape" viewBox="0 0 100 100" aria-hidden="true">
                    <path></path>
                  </svg>
                  <span class="shape-clock__copy">
                    <time class="shape-clock__time" data-shape-time></time>
                    <span class="shape-clock__date" data-shape-date></span>
                  </span>
                </button>
              </div>
            </article>
          </div>

          <div class="widget-grid k3-layout-grid k3-demo-cols-2">
            <article class="widget-card">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.clocks.pill.title')}</h2>
                <p class="widget-card__hint">${t('showcase.clocks.pill.hint')}</p>
              </header>
              <div class="widget-card__body">
                <figure class="pill-clock" data-pill-clock role="img">
                  <p class="pill-clock__place" data-pill-place></p>
                  <time class="pill-clock__time" data-pill-time>
                    <span class="pill-clock__row" data-pill-hours></span>
                    <span class="pill-clock__row" data-pill-minutes></span>
                  </time>
                  <p class="pill-clock__date" data-pill-date></p>
                </figure>
              </div>
            </article>

            <article class="widget-card">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.clocks.numerals.title')}</h2>
                <p class="widget-card__hint">${t('showcase.clocks.numerals.hint')}</p>
              </header>
              <div class="widget-card__body">
                <figure class="numerals-clock">
                  <svg
                    viewBox="0 0 200 200"
                    role="img"
                    aria-label=${t('showcase.clocks.numerals.aria')}
                    data-numerals
                  ></svg>
                </figure>
              </div>
            </article>
          </div>
        </section>
      `,
      host,
    );

    const locale = i18n.locale === 'fr' ? 'fr' : 'en';
    const analogSvg = host.querySelector<SVGSVGElement>('[data-analog]');
    const posterRoot = host.querySelector<HTMLElement>('[data-poster-root]');
    const shapeBtn = host.querySelector<HTMLButtonElement>('[data-shape-clock]');
    const pillRoot = host.querySelector<HTMLElement>('[data-pill-clock]');
    const numeralsSvg = host.querySelector<SVGSVGElement>('[data-numerals]');

    if (analogSvg) {
      analog = new AnalogClock(analogSvg, { locale });
      analog.start();
    }
    if (posterRoot) {
      poster = new PosterClock(posterRoot, { locale });
      poster.start();
    }
    if (shapeBtn) {
      shape = new ShapeClock(shapeBtn, { locale });
      shape.start();
    }
    if (pillRoot) {
      pill = new PillClock(pillRoot, { locale });
      pill.start();
    }
    if (numeralsSvg) {
      numerals = new NumeralsClock(numeralsSvg, { locale });
      numerals.start();
    }
  };

  paint();
  const onLocale = (): void => paint();
  document.addEventListener('k3-locale-change', onLocale);

  return () => {
    document.removeEventListener('k3-locale-change', onLocale);
    analog?.stop();
    poster?.stop();
    shape?.stop();
    pill?.stop();
    numerals?.stop();
    render(null, host);
  };
}
