/**
 * Live banner on the docs shell — show via button, dismiss (×) or leave page.
 */
import { i18n } from '../src/i18n/index.js';
import type { K3Banner } from '../src/components/feedback/banner.js';

const LIVE_ATTR = 'data-playground-live-banner';

let live: K3Banner | null = null;

function t(key: string, fallback: string): string {
  return i18n.t(key, fallback);
}

/** Prefer the app root so the host spacer pushes rail + content together. */
function mountParent(): HTMLElement | null {
  const app = document.querySelector<HTMLElement>('.app');
  if (app?.parentElement) return app.parentElement;
  return document.querySelector<HTMLElement>('.shell-content') ?? document.body;
}

function showBtn(): (HTMLElement & { disabled?: boolean }) | null {
  return document.getElementById('btn-banner-live') as
    | (HTMLElement & { disabled?: boolean })
    | null;
}

/** Tear down the live banner (animated leave when possible). */
export async function destroyPlaygroundLiveBanner(): Promise<void> {
  const el =
    live ??
    document.querySelector<K3Banner>(`k3-banner[${LIVE_ATTR}]`);
  live = null;
  if (!el || !el.isConnected) {
    syncLiveButton();
    return;
  }
  try {
    await el.leave({ remove: true });
  } catch {
    el.remove();
  }
  syncLiveButton();
}

export function isPlaygroundLiveBannerOpen(): boolean {
  const el =
    live ??
    document.querySelector<K3Banner>(`k3-banner[${LIVE_ATTR}]`);
  return !!(el?.isConnected && !el.hidden);
}

function syncLiveButton(): void {
  const btn = showBtn();
  if (btn) btn.disabled = isPlaygroundLiveBannerOpen();
}

/** Mount a fixed dismissible banner above the whole docs shell (rail + content). */
export async function showPlaygroundLiveBanner(): Promise<void> {
  if (isPlaygroundLiveBannerOpen()) return;
  /* Stale hidden host from a prior dismiss — drop it */
  document.querySelectorAll(`k3-banner[${LIVE_ATTR}]`).forEach((n) => n.remove());
  live = null;

  await customElements.whenDefined('k3-banner');
  const parent = mountParent();
  const app = document.querySelector('.app');
  if (!parent) return;

  const el = document.createElement('k3-banner') as K3Banner;
  el.setAttribute(LIVE_ATTR, '');
  el.variant = 'primary';
  el.position = 'fixed';
  el.dismissible = true;
  el.innerHTML = `<span>${t(
    'doc.banner.demo.promo',
    'Summer sale — 20% off with code K3UI.',
  )}</span>
    <k3-button slot="action" variant="text" size="sm">
      <span>${t('doc.banner.demo.action', 'Shop')}</span>
    </k3-button>`;

  el.addEventListener(
    'k3-dismiss',
    () => {
      if (live === el) live = null;
      /* dismiss()/leave() hides — remove so the button can fire again */
      if (el.isConnected) el.remove();
      syncLiveButton();
    },
    { once: true },
  );

  if (app && app.parentElement === parent) parent.insertBefore(el, app);
  else parent.prepend(el);
  live = el;
  syncLiveButton();
  /* Enter runs from firstUpdated when fixed */
}

/** Static dismissible demos — show Reset after × so the example can reopen. */
function wireStaticDismissReset(bannerId: string, resetId: string): void {
  const banner = document.getElementById(bannerId) as K3Banner | null;
  const reset = document.getElementById(resetId) as
    | (HTMLElement & { hidden: boolean })
    | null;
  if (!banner || !reset) return;

  const sync = (): void => {
    reset.hidden = !banner.hidden;
  };
  sync();

  banner.addEventListener('k3-dismiss', () => {
    window.setTimeout(sync, 0);
  });
  reset.addEventListener('click', () => {
    banner.show();
    sync();
  });
}

export function wireBannerDemo(): void {
  document.getElementById('btn-banner-live')?.addEventListener('click', () => {
    void showPlaygroundLiveBanner();
  });
  wireStaticDismissReset('banner-demo-dismiss', 'btn-banner-demo-reset');
  wireStaticDismissReset('banner-demo-flash', 'btn-banner-flash-reset');
  syncLiveButton();
}
