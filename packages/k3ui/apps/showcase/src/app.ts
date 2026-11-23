import { html, render } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';
import { demoBanner } from './demo-chrome.js';
import { mountDialer } from './pages/dialer.js';
import { mountPricing } from './pages/pricing.js';
import { mountLogin } from './pages/login.js';
import { mountClocks } from './pages/clocks.js';
import { mountPomodoro } from './pages/pomodoro.js';
import { mountCalendar } from './pages/calendar.js';
import { mountTodo } from './pages/todo.js';
import { mountAlarms } from './pages/alarms.js';

export type Route =
  | 'pricing'
  | 'login'
  | 'dialer'
  | 'clocks'
  | 'pomodoro'
  | 'calendar'
  | 'todo'
  | 'alarms';

const t = (key: string) => i18n.t(key);

export function parseRoute(hash = location.hash): Route {
  const raw = (hash.replace(/^#\/?/, '') || 'pricing').split('?')[0];
  if (raw === 'login') return 'login';
  if (raw === 'dialer') return 'dialer';
  if (raw === 'clocks' || raw === 'widgets') return 'clocks';
  if (raw === 'pomodoro') return 'pomodoro';
  if (raw === 'calendar') return 'calendar';
  if (raw === 'todo') return 'todo';
  if (raw === 'alarms') return 'alarms';
  return 'pricing';
}

export function mountApp(root: HTMLElement): () => void {
  let unmountPage: (() => void) | null = null;

  const paint = (): void => {
    const route = parseRoute();

    render(
      html`
        ${demoBanner(() => paint())}
        <header class="shell-top">
          <p class="shell-brand">${t('showcase.brand')}</p>
          <nav class="shell-nav" aria-label=${t('showcase.brand')}>
            <a href="#/pricing" aria-current=${route === 'pricing' ? 'page' : undefined}>
              <k3-button
                variant=${route === 'pricing' ? 'filled' : 'text'}
                size="sm"
                ?selected=${route === 'pricing'}
                >${t('showcase.nav.pricing')}</k3-button
              >
            </a>
            <a href="#/login" aria-current=${route === 'login' ? 'page' : undefined}>
              <k3-button
                variant=${route === 'login' ? 'filled' : 'text'}
                size="sm"
                ?selected=${route === 'login'}
                >${t('showcase.nav.login')}</k3-button
              >
            </a>
            <a href="#/dialer" aria-current=${route === 'dialer' ? 'page' : undefined}>
              <k3-button
                variant=${route === 'dialer' ? 'filled' : 'text'}
                size="sm"
                ?selected=${route === 'dialer'}
                >${t('showcase.nav.dialer')}</k3-button
              >
            </a>
            <a href="#/clocks" aria-current=${route === 'clocks' ? 'page' : undefined}>
              <k3-button
                variant=${route === 'clocks' ? 'filled' : 'text'}
                size="sm"
                ?selected=${route === 'clocks'}
                >${t('showcase.nav.clocks')}</k3-button
              >
            </a>
            <a href="#/pomodoro" aria-current=${route === 'pomodoro' ? 'page' : undefined}>
              <k3-button
                variant=${route === 'pomodoro' ? 'filled' : 'text'}
                size="sm"
                ?selected=${route === 'pomodoro'}
                >${t('showcase.nav.pomodoro')}</k3-button
              >
            </a>
            <a href="#/calendar" aria-current=${route === 'calendar' ? 'page' : undefined}>
              <k3-button
                variant=${route === 'calendar' ? 'filled' : 'text'}
                size="sm"
                ?selected=${route === 'calendar'}
                >${t('showcase.nav.calendar')}</k3-button
              >
            </a>
            <a href="#/todo" aria-current=${route === 'todo' ? 'page' : undefined}>
              <k3-button
                variant=${route === 'todo' ? 'filled' : 'text'}
                size="sm"
                ?selected=${route === 'todo'}
                >${t('showcase.nav.todo')}</k3-button
              >
            </a>
            <a href="#/alarms" aria-current=${route === 'alarms' ? 'page' : undefined}>
              <k3-button
                variant=${route === 'alarms' ? 'filled' : 'text'}
                size="sm"
                ?selected=${route === 'alarms'}
                >${t('showcase.nav.alarms')}</k3-button
              >
            </a>
            <k3-button-group
              variant="connected"
              shape="round"
              selection="single"
              size="sm"
              sync
              required
              label="Locale"
              @k3-change=${(e: CustomEvent<{ values?: string[] }>) => {
                const next = e.detail?.values?.[0];
                if (next === 'en' || next === 'fr') i18n.setLocale(next);
              }}
            >
              <k3-button variant="tonal" value="fr" ?selected=${i18n.locale === 'fr'}
                >FR</k3-button
              >
              <k3-button variant="tonal" value="en" ?selected=${i18n.locale === 'en'}
                >EN</k3-button
              >
            </k3-button-group>
          </nav>
        </header>
        <div class="shell-scroll k3-scroll">
          <main class="shell-main k3-container">
            <div id="page-host"></div>
          </main>
        </div>
      `,
      root,
    );

    const host = root.querySelector('#page-host') as HTMLElement;
    unmountPage?.();
    unmountPage =
      route === 'login'
        ? mountLogin(host)
        : route === 'dialer'
          ? mountDialer(host)
          : route === 'clocks'
            ? mountClocks(host)
            : route === 'pomodoro'
              ? mountPomodoro(host)
              : route === 'calendar'
                ? mountCalendar(host)
                : route === 'todo'
                  ? mountTodo(host)
                  : route === 'alarms'
                    ? mountAlarms(host)
                    : mountPricing(host);
  };

  const onHash = (): void => paint();
  const onLocale = (): void => paint();

  paint();
  window.addEventListener('hashchange', onHash);
  document.addEventListener('k3-locale-change', onLocale);

  return () => {
    window.removeEventListener('hashchange', onHash);
    document.removeEventListener('k3-locale-change', onLocale);
    unmountPage?.();
    render(null, root);
  };
}
