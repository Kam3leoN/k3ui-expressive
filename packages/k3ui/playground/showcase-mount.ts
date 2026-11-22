/**
 * Docs Showcase — rail parent between Styles and Sponsors.
 * Hub (`#/showcase`) = overview nav cards · children = live pricing / login / dialer.
 */
import { html, render, type TemplateResult } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';
import en from '../apps/showcase/src/i18n/en.json';
import fr from '../apps/showcase/src/i18n/fr.json';
import {
  demoBanner,
  isDemoBannerSkipped,
} from '../apps/showcase/src/demo-chrome.js';
import { mountDialer } from '../apps/showcase/src/pages/dialer.js';
import { mountPricing } from '../apps/showcase/src/pages/pricing.js';
import { mountLogin } from '../apps/showcase/src/pages/login.js';
import '../apps/showcase/src/pages.css';

export type ShowcasePageId =
  | 'showcase'
  | 'showcase-pricing'
  | 'showcase-login'
  | 'showcase-dialer';

const SHOWCASE_TAGS = [
  'k3-button',
  'k3-button-group',
  'k3-text-field',
  'k3-checkbox',
  'k3-chip',
  'k3-switch',
  'k3-banner',
  'k3-icon-button',
  'k3-accordion',
  'k3-expansion-panel',
  'k3-divider',
  'k3-dialog',
  'k3-snackbar',
  'k3-list',
  'k3-list-item',
] as const;

let catalogsReady = false;
let unmountLive: (() => void) | null = null;
let localeBound = false;

function t(key: string): string {
  return i18n.t(key);
}

function ensureCatalogs(): void {
  if (catalogsReady) return;
  i18n.extend({ en, fr });
  catalogsReady = true;
}

export function isShowcasePage(id: string): id is ShowcasePageId {
  return (
    id === 'showcase' ||
    id === 'showcase-pricing' ||
    id === 'showcase-login' ||
    id === 'showcase-dialer'
  );
}

export function showcaseRequiredTags(): readonly string[] {
  return SHOWCASE_TAGS;
}

interface HubCard {
  id: 'pricing' | 'login' | 'dialer';
  href: string;
  featured?: boolean;
  titleKey: string;
  tagKey: string;
  /** k3-* tags used on that live page — shown as chips. */
  components: readonly string[];
}

const HUB_CARDS: readonly HubCard[] = [
  {
    id: 'pricing',
    href: '#/showcase-pricing',
    featured: true,
    titleKey: 'doc.showcase.card.pricing.title',
    tagKey: 'doc.showcase.card.pricing.tag',
    components: [
      'k3-button',
      'k3-button-group',
      'k3-divider',
      'k3-switch',
      'k3-accordion',
      'k3-expansion-panel',
    ],
  },
  {
    id: 'login',
    href: '#/showcase-login',
    titleKey: 'doc.showcase.card.login.title',
    tagKey: 'doc.showcase.card.login.tag',
    components: [
      'k3-text-field',
      'k3-checkbox',
      'k3-button',
      'k3-button-group',
      'k3-dialog',
    ],
  },
  {
    id: 'dialer',
    href: '#/showcase-dialer',
    titleKey: 'doc.showcase.card.dialer.title',
    tagKey: 'doc.showcase.card.dialer.tag',
    components: ['k3-chip', 'k3-icon-button', 'k3-snackbar', 'k3-list', 'shape'],
  },
];

function hubCard(card: HubCard): TemplateResult {
  return html`
    <article
      class="showcase-nav-card ${card.featured ? 'showcase-nav-card--featured' : ''}"
    >
      <h2 class="showcase-nav-card__title">${t(card.titleKey)}</h2>
      <p class="showcase-nav-card__tag">${t(card.tagKey)}</p>
      <a class="showcase-nav-card__cta" href=${card.href}>
        <k3-button
          variant=${card.featured ? 'elevated' : 'filled'}
          size="md"
          >${t('doc.showcase.card.cta')}</k3-button
        >
      </a>
      <p class="showcase-nav-card__includes">${t('doc.showcase.card.includes')}</p>
      <div class="showcase-nav-card__components" role="list">
        ${card.components.map((tag) => {
          const label = tag.replace(/^k3-/, '');
          /* Featured (primary) → tonal chips · others (filled btn) → primary chips */
          const tone = card.featured ? 'tonal' : 'primary';
          return html`
            <k3-chip
              role="listitem"
              class="showcase-nav-card__comp showcase-nav-card__comp--${tone} notranslate"
              translate="no"
              lang="zxx"
              >${label}</k3-chip
            >
          `;
        })}
      </div>
    </article>
  `;
}

const DEMO_BANNER_HOST_ID = 'showcase-demo-banner-host';

/**
 * Fixed k3-banner must sit as a body sibling *before* `.app` — otherwise the
 * shell stacking contexts (app bar z=20, rail z=30) paint over the strip.
 */
function ensureDemoBannerHost(): HTMLElement {
  let host = document.getElementById(DEMO_BANNER_HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = DEMO_BANNER_HOST_ID;
    const app = document.querySelector('.app');
    if (app?.parentNode) app.parentNode.insertBefore(host, app);
    else document.body.prepend(host);
  }
  return host;
}

function mountDemoBannerChrome(): void {
  if (isDemoBannerSkipped()) {
    unmountDemoBannerChrome();
    return;
  }
  render(
    demoBanner(() => unmountDemoBannerChrome()),
    ensureDemoBannerHost(),
  );
}

function unmountDemoBannerChrome(): void {
  const host = document.getElementById(DEMO_BANNER_HOST_ID);
  if (!host) return;
  render(null, host);
  host.remove();
}

function mountHub(root: HTMLElement): void {
  unmountLive?.();
  unmountLive = null;
  unmountDemoBannerChrome();
  render(
    html`
      <div class="showcase-hub">
        <div class="showcase-hub__grid k3-layout-grid k3-demo-cols-3">
          ${HUB_CARDS.map((c) => hubCard(c))}
        </div>
      </div>
    `,
    root,
  );
}

function mountLivePage(root: HTMLElement, which: 'pricing' | 'login' | 'dialer'): void {
  mountDemoBannerChrome();
  render(
    html`
      <div class="showcase-doc">
        <div class="showcase-doc__toolbar">
          <a href="#/showcase" class="showcase-doc__back">
            <k3-button variant="text" size="sm">
              <span
                class="ms notranslate"
                translate="no"
                lang="zxx"
                data-k3-icon="arrow_back"
                aria-hidden="true"
              ></span>
              ${t('doc.showcase.back')}
            </k3-button>
          </a>
        </div>
        <div id="showcase-live" class="showcase-live"></div>
      </div>
    `,
    root,
  );
  const host = root.querySelector('#showcase-live') as HTMLElement;
  unmountLive?.();
  unmountLive =
    which === 'login'
      ? mountLogin(host)
      : which === 'dialer'
        ? mountDialer(host)
        : mountPricing(host);
}

/** Mount hub or live child into the matching page root. */
export function mountShowcaseDoc(pageId: string = 'showcase'): void {
  ensureCatalogs();
  const id = isShowcasePage(pageId) ? pageId : 'showcase';
  const rootId =
    id === 'showcase-pricing'
      ? 'showcase-pricing-root'
      : id === 'showcase-login'
        ? 'showcase-login-root'
        : id === 'showcase-dialer'
          ? 'showcase-dialer-root'
          : 'showcase-root';
  const root = document.getElementById(rootId);
  if (!root) return;

  if (id === 'showcase-pricing') mountLivePage(root, 'pricing');
  else if (id === 'showcase-login') mountLivePage(root, 'login');
  else if (id === 'showcase-dialer') mountLivePage(root, 'dialer');
  else mountHub(root);

  if (!localeBound) {
    localeBound = true;
    document.addEventListener('k3-locale-change', () => {
      const active = document.querySelector<HTMLElement>(
        '.comp-page.is-active[data-page^="showcase"]',
      );
      if (!active) return;
      mountShowcaseDoc(active.dataset.page ?? 'showcase');
    });
  }
}

export function unmountShowcaseDoc(): void {
  unmountLive?.();
  unmountLive = null;
  unmountDemoBannerChrome();
  for (const id of [
    'showcase-root',
    'showcase-pricing-root',
    'showcase-login-root',
    'showcase-dialer-root',
  ]) {
    const root = document.getElementById(id);
    if (root) render(null, root);
  }
}
