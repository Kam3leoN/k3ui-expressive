import { html, render } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';
import { demoBanner } from './demo-chrome.js';
import { mountDialer } from './pages/dialer.js';
import { mountPricing } from './pages/pricing.js';
import { mountLogin } from './pages/login.js';

export type Route = 'pricing' | 'login' | 'dialer';

const t = (key: string) => i18n.t(key);

export function parseRoute(hash = location.hash): Route {
  const raw = (hash.replace(/^#\/?/, '') || 'pricing').split('?')[0];
  if (raw === 'login') return 'login';
  if (raw === 'dialer') return 'dialer';
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
