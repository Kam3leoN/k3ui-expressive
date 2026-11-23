import { html, nothing, render, type TemplateResult } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';
import { Pomodoro } from '../lucid/pomodoro.js';
import { Countdown } from '../lucid/countdown.js';
import { Stopwatch } from '../lucid/stopwatch.js';
import { pageTitleRow } from '../demo-chrome.js';

/** Timers showcase — Pomodoro · Countdown · Stopwatch. */
const PAGE_STACK = 'k3ui' as const;

const t = (key: string) => i18n.t(key);

function msIcon(name: string, filled = false): TemplateResult {
  return html`
    <span
      class="ms notranslate ${filled ? 'ms-fill' : ''}"
      translate="no"
      lang="zxx"
      data-k3-icon=${name}
      aria-hidden="true"
    ></span>
  `;
}

export function mountPomodoro(host: HTMLElement): () => void {
  let pomodoro: Pomodoro | undefined;
  let countdown: Countdown | undefined;
  let stopwatch: Stopwatch | undefined;
  /** Docs embed already shows the page title + blurb in `.section-head`. */
  const showTitle = !host.closest('.showcase-doc');

  const readCustomFields = (): { focus: number; short: number; rounds: number } => {
    const num = (sel: string, fallback: number): number => {
      const el = host.querySelector(sel) as (HTMLElement & { value?: number }) | null;
      const n = Number(el?.value);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };
    return {
      focus: num('[data-custom-focus]', 1),
      short: num('[data-custom-pause]', 1),
      rounds: num('[data-custom-rounds]', 1),
    };
  };

  const applyCustomFromFields = (): void => {
    if (!pomodoro?.idle) return;
    const { focus, short, rounds } = readCustomFields();
    pomodoro.setCustom(focus, short, rounds);
  };

  const onCustomFieldChange = (): void => {
    if (!pomodoro?.idle) return;
    applyCustomFromFields();
    const presets = host.querySelector<HTMLElement>('[data-presets]');
    for (const btn of presets?.querySelectorAll('k3-button[value]') ?? []) {
      const el = btn as HTMLElement & { selected?: boolean };
      el.selected = el.getAttribute('value') === 'custom';
    }
  };

  const applyCountdownCustom = (): void => {
    if (!countdown?.idle) return;
    const el = host.querySelector('[data-cd-custom-min]') as
      | (HTMLElement & { value?: number })
      | null;
    const n = Number(el?.value);
    countdown.setCustom(Number.isFinite(n) && n > 0 ? n : 1);
  };

  const onCountdownCustomChange = (): void => {
    if (!countdown?.idle) return;
    applyCountdownCustom();
    const presets = host.querySelector<HTMLElement>('[data-cd-presets]');
    for (const btn of presets?.querySelectorAll('k3-button[value]') ?? []) {
      const el = btn as HTMLElement & { selected?: boolean };
      el.selected = el.getAttribute('value') === 'custom';
    }
  };

  const syncCustomPanel = (
    panelSel: string,
    open: boolean,
    idle: boolean,
  ): void => {
    const panel = host.querySelector<HTMLElement>(panelSel);
    if (!panel) return;
    panel.hidden = !open;
    panel.toggleAttribute('hidden', !open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    for (const counter of panel.querySelectorAll('k3-counter')) {
      (counter as HTMLElement & { disabled?: boolean }).disabled = !idle;
    }
  };

  const syncPresetChrome = (): void => {
    if (!pomodoro) return;
    const presets = host.querySelector<HTMLElement>('[data-presets]');
    for (const btn of presets?.querySelectorAll('k3-button[value]') ?? []) {
      const el = btn as HTMLElement & { selected?: boolean; disabled?: boolean };
      el.selected = el.getAttribute('value') === pomodoro.presetKey;
      el.disabled = !pomodoro.idle;
    }
    syncCustomPanel('[data-pomo-custom]', pomodoro.presetKey === 'custom', pomodoro.idle);
  };

  const syncCountdownChrome = (): void => {
    if (!countdown) return;
    const presets = host.querySelector<HTMLElement>('[data-cd-presets]');
    for (const btn of presets?.querySelectorAll('k3-button[value]') ?? []) {
      const el = btn as HTMLElement & { selected?: boolean; disabled?: boolean };
      el.selected = el.getAttribute('value') === countdown.presetKey;
      el.disabled = !countdown.idle;
    }
    syncCustomPanel('[data-cd-custom]', countdown.presetKey === 'custom', countdown.idle);
    const counter = host.querySelector('[data-cd-custom-min]') as
      | (HTMLElement & { value?: number })
      | null;
    if (counter && countdown.presetKey === 'custom') {
      counter.value = countdown.customMinutes;
    }
  };

  const paint = (): void => {
    pomodoro = undefined;
    countdown = undefined;
    stopwatch = undefined;

    render(
      html`
        <section
          class="page page--pomodoro"
          aria-labelledby=${showTitle ? 'pomodoro-title' : nothing}
          aria-label=${showTitle ? nothing : t('showcase.pomodoro.title')}
        >
          ${showTitle
            ? html`
                ${pageTitleRow('showcase.pomodoro.title', PAGE_STACK, 'pomodoro-title')}
                <p class="page-lead">${t('showcase.pomodoro.lead')}</p>
              `
            : null}

          <div class="widget-grid k3-layout-grid k3-demo-cols-3">
            <article class="widget-card widget-card--timer">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.pomodoro.cardTitle')}</h2>
                <p class="widget-card__hint">${t('showcase.pomodoro.hint')}</p>
              </header>
              <div class="widget-card__body">
                <div class="pomodoro" data-pomodoro>
                  <p class="pomodoro__title" data-pomo-title>${t('showcase.pomodoro.cardTitle')}</p>
                  <div class="pomodoro__dial">
                    <svg class="pomodoro__shape" viewBox="0 0 100 100" aria-hidden="true">
                      <path></path>
                    </svg>
                    <svg class="wavy-progress" viewBox="0 0 200 200" aria-hidden="true">
                      <path class="wavy-progress__track"></path>
                      <path class="wavy-progress__active"></path>
                    </svg>
                    <span class="pomodoro__time" role="timer" data-pomo-time>25:00</span>
                  </div>
                  <div class="pomodoro__dots" role="img" data-pomo-dots></div>
                  <div class="pomodoro__actions">
                    <k3-icon-button
                      class="pomodoro-side-btn"
                      variant="standard"
                      size="md"
                      width="narrow"
                      shape="round"
                      data-pomo-stop
                      label=${t('showcase.pomodoro.stop')}
                      title=${t('showcase.pomodoro.stop')}
                      @k3-click=${() => pomodoro?.stop()}
                    >
                      ${msIcon('stop', true)}
                    </k3-icon-button>
                    <button
                      type="button"
                      class="pomodoro-fab"
                      data-pomo-toggle
                      aria-label=${t('showcase.pomodoro.start')}
                    >
                      <span data-icon="play">${msIcon('play_arrow', true)}</span>
                      <span data-icon="pause" hidden>${msIcon('pause', true)}</span>
                    </button>
                    <k3-icon-button
                      class="pomodoro-side-btn"
                      variant="standard"
                      size="md"
                      width="narrow"
                      shape="round"
                      data-pomo-skip
                      label=${t('showcase.pomodoro.skip')}
                      title=${t('showcase.pomodoro.skip')}
                      @k3-click=${() => pomodoro?.skip()}
                    >
                      ${msIcon('skip_next', true)}
                    </k3-icon-button>
                  </div>
                  <p class="pomodoro__today" data-pomo-today></p>
                  <p class="sr-only" aria-live="polite" data-pomo-status></p>
                </div>
              </div>
              <k3-button-group
                class="preset-group"
                variant="connected"
                shape="round"
                selection="single"
                size="sm"
                sync
                required
                label=${t('showcase.pomodoro.presets')}
                data-presets
                @k3-change=${(e: CustomEvent<{ values?: string[] }>) => {
                  const key = e.detail?.values?.[0];
                  if (!key || !pomodoro?.idle) return;
                  if (key === 'custom') {
                    applyCustomFromFields();
                    return;
                  }
                  pomodoro.usePreset(key);
                }}
              >
                <k3-button
                  variant="tonal"
                  value="classic"
                  selected
                  title=${t('showcase.pomodoro.preset.classic')}
                  >25</k3-button
                >
                <k3-button variant="tonal" value="deep" title=${t('showcase.pomodoro.preset.deep')}
                  >50</k3-button
                >
                <k3-button variant="tonal" value="long" title=${t('showcase.pomodoro.preset.long')}
                  >90</k3-button
                >
                <k3-button
                  variant="tonal"
                  value="custom"
                  title=${t('showcase.pomodoro.preset.custom')}
                  >${t('showcase.pomodoro.preset.custom')}</k3-button
                >
              </k3-button-group>

              <div
                class="pomodoro-custom"
                data-pomo-custom
                hidden
                aria-hidden="true"
              >
                <p class="pomodoro-custom__label">${t('showcase.pomodoro.custom.label')}</p>
                <div class="pomodoro-custom__fields">
                  <div class="pomodoro-custom__row">
                    <p class="pomodoro-custom__name">
                      ${t('showcase.pomodoro.custom.focus')}
                      <span class="pomodoro-custom__unit"
                        >${t('showcase.pomodoro.custom.min')}</span
                      >
                    </p>
                    <k3-counter
                      class="pomodoro-custom__counter"
                      size="lg"
                      value="1"
                      min="1"
                      max="180"
                      step="1"
                      data-custom-focus
                      @k3-change=${() => onCustomFieldChange()}
                    ></k3-counter>
                  </div>
                  <div class="pomodoro-custom__row">
                    <p class="pomodoro-custom__name">
                      ${t('showcase.pomodoro.custom.pause')}
                      <span class="pomodoro-custom__unit"
                        >${t('showcase.pomodoro.custom.min')}</span
                      >
                    </p>
                    <k3-counter
                      class="pomodoro-custom__counter"
                      size="lg"
                      value="1"
                      min="1"
                      max="60"
                      step="1"
                      data-custom-pause
                      @k3-change=${() => onCustomFieldChange()}
                    ></k3-counter>
                  </div>
                  <div class="pomodoro-custom__row">
                    <p class="pomodoro-custom__name">${t('showcase.pomodoro.custom.rounds')}</p>
                    <k3-counter
                      class="pomodoro-custom__counter"
                      size="lg"
                      value="1"
                      min="1"
                      max="12"
                      step="1"
                      data-custom-rounds
                      @k3-change=${() => onCustomFieldChange()}
                    ></k3-counter>
                  </div>
                </div>
              </div>
            </article>

            <article class="widget-card widget-card--timer">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.countdown.title')}</h2>
                <p class="widget-card__hint">${t('showcase.countdown.hint')}</p>
              </header>
              <div class="widget-card__body">
                <div class="digit-timer countdown" data-countdown>
                  <p
                    class="digit-timer__title"
                    data-cd-title
                    data-done=${t('showcase.countdown.done')}
                  >
                    ${t('showcase.countdown.title')}
                  </p>
                  <span class="digit-timer__time" role="timer" data-cd-time>5:00</span>
                  <div class="pomodoro__actions">
                    <k3-icon-button
                      class="pomodoro-side-btn"
                      variant="standard"
                      size="md"
                      width="narrow"
                      shape="round"
                      data-cd-stop
                      label=${t('showcase.countdown.reset')}
                      title=${t('showcase.countdown.reset')}
                      @k3-click=${() => countdown?.reset()}
                    >
                      ${msIcon('stop', true)}
                    </k3-icon-button>
                    <button
                      type="button"
                      class="pomodoro-fab countdown-fab"
                      data-cd-toggle
                      aria-label=${t('showcase.countdown.start')}
                      data-play-label=${t('showcase.countdown.start')}
                      data-pause-label=${t('showcase.countdown.pause')}
                    >
                      <span data-icon="play">${msIcon('play_arrow', true)}</span>
                      <span data-icon="pause" hidden>${msIcon('pause', true)}</span>
                    </button>
                    <span class="pomodoro__actions-spacer" aria-hidden="true"></span>
                  </div>
                  <p class="sr-only" aria-live="polite" data-cd-status></p>
                </div>
              </div>
              <k3-button-group
                class="preset-group"
                variant="connected"
                shape="round"
                selection="single"
                size="sm"
                sync
                required
                label=${t('showcase.countdown.presets')}
                data-cd-presets
                @k3-change=${(e: CustomEvent<{ values?: string[] }>) => {
                  const key = e.detail?.values?.[0];
                  if (!key || !countdown?.idle) return;
                  if (key === 'custom') {
                    applyCountdownCustom();
                    return;
                  }
                  countdown.usePreset(key);
                }}
              >
                <k3-button variant="tonal" value="5m" selected>5:00</k3-button>
                <k3-button variant="tonal" value="10m">10:00</k3-button>
                <k3-button variant="tonal" value="15m">15:00</k3-button>
                <k3-button
                  variant="tonal"
                  value="custom"
                  title=${t('showcase.countdown.preset.custom')}
                  >${t('showcase.countdown.preset.custom')}</k3-button
                >
              </k3-button-group>

              <div
                class="pomodoro-custom countdown-custom"
                data-cd-custom
                hidden
                aria-hidden="true"
              >
                <p class="pomodoro-custom__label">${t('showcase.countdown.custom.label')}</p>
                <div class="pomodoro-custom__fields">
                  <div class="pomodoro-custom__row">
                    <p class="pomodoro-custom__name">
                      ${t('showcase.countdown.custom.duration')}
                      <span class="pomodoro-custom__unit"
                        >${t('showcase.pomodoro.custom.min')}</span
                      >
                    </p>
                    <k3-counter
                      class="pomodoro-custom__counter"
                      size="lg"
                      value="1"
                      min="1"
                      max="180"
                      step="1"
                      data-cd-custom-min
                      @k3-change=${() => onCountdownCustomChange()}
                    ></k3-counter>
                  </div>
                </div>
              </div>
            </article>

            <article class="widget-card widget-card--timer">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.stopwatch.title')}</h2>
                <p class="widget-card__hint">${t('showcase.stopwatch.hint')}</p>
              </header>
              <div class="widget-card__body">
                <div class="digit-timer stopwatch" data-stopwatch>
                  <p class="digit-timer__title" data-sw-title>${t('showcase.stopwatch.title')}</p>
                  <span class="digit-timer__time" role="timer" data-sw-time>0:00.0</span>
                  <div class="pomodoro__actions">
                    <k3-icon-button
                      class="pomodoro-side-btn"
                      variant="standard"
                      size="md"
                      width="narrow"
                      shape="round"
                      data-sw-stop
                      label=${t('showcase.stopwatch.reset')}
                      title=${t('showcase.stopwatch.reset')}
                      @k3-click=${() => stopwatch?.reset()}
                    >
                      ${msIcon('stop', true)}
                    </k3-icon-button>
                    <button
                      type="button"
                      class="pomodoro-fab stopwatch-fab"
                      data-sw-toggle
                      aria-label=${t('showcase.stopwatch.start')}
                      data-play-label=${t('showcase.stopwatch.start')}
                      data-pause-label=${t('showcase.stopwatch.pause')}
                    >
                      <span data-icon="play">${msIcon('play_arrow', true)}</span>
                      <span data-icon="pause" hidden>${msIcon('pause', true)}</span>
                    </button>
                    <span class="pomodoro__actions-spacer" aria-hidden="true"></span>
                  </div>
                  <p class="sr-only" aria-live="polite" data-sw-status></p>
                </div>
              </div>
            </article>
          </div>
        </section>
      `,
      host,
    );

    const pomoRoot = host.querySelector<HTMLElement>('[data-pomodoro]');
    if (pomoRoot) {
      pomodoro = new Pomodoro(pomoRoot);
      pomoRoot.addEventListener('pomodorochange', syncPresetChrome);
      syncPresetChrome();
    }

    const cdRoot = host.querySelector<HTMLElement>('[data-countdown]');
    if (cdRoot) {
      countdown = new Countdown(cdRoot);
      cdRoot.addEventListener('countdownchange', syncCountdownChrome);
      syncCountdownChrome();
    }

    const swRoot = host.querySelector<HTMLElement>('[data-stopwatch]');
    if (swRoot) {
      stopwatch = new Stopwatch(swRoot);
    }
  };

  paint();
  const onLocale = (): void => paint();
  document.addEventListener('k3-locale-change', onLocale);

  return () => {
    document.removeEventListener('k3-locale-change', onLocale);
    pomodoro = undefined;
    countdown = undefined;
    stopwatch = undefined;
    render(null, host);
  };
}
