import { html, nothing, type TemplateResult } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';

const t = (key: string) => i18n.t(key);

/** Which packages this live page actually depends on. */
export type ShowcaseStack = 'k3ui' | 'k3ui-k3ux';

const SKIP_KEY = 'k3ui-showcase-demo-banner-skipped';

export function isDemoBannerSkipped(): boolean {
  try {
    return sessionStorage.getItem(SKIP_KEY) === '1';
  } catch {
    return false;
  }
}

export function skipDemoBanner(): void {
  try {
    sessionStorage.setItem(SKIP_KEY, '1');
  } catch {
    /* private mode / blocked storage */
  }
}

function dismissDemoBanner(e: Event): void {
  const btn = e.currentTarget as HTMLElement;
  const banner = btn.closest('k3-banner') as
    | (HTMLElement & { leave?: () => Promise<void> })
    | null;
  skipDemoBanner();
  void banner?.leave?.();
}

/**
 * Fixed strip at the viewport top — before chrome and page content.
 * @param onSkipped — called after leave animation (re-render / unmount host)
 */
export function demoBanner(onSkipped?: () => void): TemplateResult | typeof nothing {
  if (isDemoBannerSkipped()) return nothing;
  return html`
    <k3-banner
      class="demo-banner"
      position="fixed"
      variant="primary"
      style="--k3-banner-z: 50"
      @k3-dismiss=${() => {
        skipDemoBanner();
        onSkipped?.();
      }}
    >
      ${t('showcase.demo.banner')}
      <k3-icon-button
        slot="action"
        variant="standard"
        size="sm"
        label=${t('showcase.demo.banner.dismiss')}
        @k3-click=${dismissDemoBanner}
      >
        <span
          class="ms notranslate"
          translate="no"
          lang="zxx"
          data-k3-icon="close"
          aria-hidden="true"
        ></span>
      </k3-icon-button>
    </k3-banner>
  `;
}

export function stackBadge(stack: ShowcaseStack): TemplateResult {
  const key =
    stack === 'k3ui-k3ux' ? 'showcase.stack.k3ui-k3ux' : 'showcase.stack.k3ui';
  return html`
    <span class="stack-badge stack-badge--${stack}" translate="no">${t(key)}</span>
  `;
}

export function pageTitleRow(
  titleKey: string,
  stack: ShowcaseStack,
  titleId: string,
): TemplateResult {
  return html`
    <div class="page-title-row">
      <h1 id=${titleId} class="page-title">${t(titleKey)}</h1>
      ${stackBadge(stack)}
    </div>
  `;
}
