import { html, nothing, render, type TemplateResult } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';
import { Pomodoro } from '../lucid/pomodoro.js';
import { pageTitleRow } from '../demo-chrome.js';

/** Lucid Pomodoro — separate from the clocks page. */
const PAGE_STACK = 'k3ui' as const;

const t = (key: string) => i18n.t(key);

function msIcon(name: string): TemplateResult {
  return html`
    <span
      class="ms notranslate"
      translate="no"
      lang="zxx"
      data-k3-icon=${name}
      aria-hidden="true"
    ></span>
  `;
}

export function mountPomodoro(host: HTMLElement): () => void {
  let pomodoro: Pomodoro | undefined;
  /** Docs embed already shows the page title + blurb in `.section-head`. */
  const showTitle = !host.closest('.showcase-doc');

  const paint = (): void => {
    pomodoro = undefined;

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

          <div class="widget-grid k3-layout-grid k3-demo-cols-2">
            <article class="widget-card widget-card--pomodoro">
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
                    <button
                      type="button"
                      class="plain-icon-button"
                      data-pomo-stop
                      aria-label=${t('showcase.pomodoro.stop')}
                      title=${t('showcase.pomodoro.stop')}
                    >
                      ${msIcon('stop')}
                    </button>
                    <button
                      type="button"
                      class="pomodoro-fab"
                      data-pomo-toggle
                      aria-label=${t('showcase.pomodoro.start')}
                    >
                      <span data-icon="play">${msIcon('play_arrow')}</span>
                      <span data-icon="pause" hidden>${msIcon('pause')}</span>
                    </button>
                    <button
                      type="button"
                      class="plain-icon-button"
                      data-pomo-skip
                      aria-label=${t('showcase.pomodoro.skip')}
                      title=${t('showcase.pomodoro.skip')}
                    >
                      ${msIcon('skip_next')}
                    </button>
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
                  if (key && pomodoro?.idle) pomodoro.usePreset(key);
                }}
              >
                <k3-button
                  variant="tonal"
                  value="classic"
                  selected
                  title=${t('showcase.pomodoro.preset.classic')}
                  >25 / 5</k3-button
                >
                <k3-button variant="tonal" value="deep" title=${t('showcase.pomodoro.preset.deep')}
                  >50 / 10</k3-button
                >
                <k3-button
                  variant="tonal"
                  value="sprint"
                  title=${t('showcase.pomodoro.preset.sprint')}
                  >15 / 3</k3-button
                >
                <k3-button variant="tonal" value="long" title=${t('showcase.pomodoro.preset.long')}
                  >90 / 20</k3-button
                >
              </k3-button-group>
            </article>
          </div>
        </section>
      `,
      host,
    );

    const pomoRoot = host.querySelector<HTMLElement>('[data-pomodoro]');
    if (pomoRoot) {
      pomodoro = new Pomodoro(pomoRoot);
      const presets = host.querySelector<HTMLElement>('[data-presets]');
      const syncPresets = (): void => {
        if (!presets || !pomodoro) return;
        for (const btn of presets.querySelectorAll('k3-button[value]')) {
          const el = btn as HTMLElement & { selected?: boolean; disabled?: boolean };
          el.selected = el.getAttribute('value') === pomodoro.presetKey;
          el.disabled = !pomodoro.idle;
        }
      };
      pomoRoot.addEventListener('pomodorochange', syncPresets);
      syncPresets();
    }
  };

  paint();
  const onLocale = (): void => paint();
  document.addEventListener('k3-locale-change', onLocale);

  return () => {
    document.removeEventListener('k3-locale-change', onLocale);
    pomodoro = undefined;
    render(null, host);
  };
}
