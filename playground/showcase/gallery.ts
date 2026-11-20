/**
 * Home component gallery — Matraic M3E-style live previews in accordion categories.
 * @see https://matraic.github.io/m3e/getting-started/overview.html#gallery-intro
 */
import {
  catalogEntryMatches,
  componentsByCategory,
  type DocComponent,
} from '../catalog.js';
import { ms } from './ms.js';
import { SHOWCASE_PREVIEWS, fallbackPreview, type ShowcasePreview } from './previews.js';

/** Category title + supporting line (i18n keys under playground.gallery.cat.*). */
export const GALLERY_CATEGORY_META: Record<string, { titleKey: string; blurbKey: string }> = {
  Buttons: {
    titleKey: 'playground.gallery.cat.buttons',
    blurbKey: 'playground.gallery.cat.buttons.blurb',
  },
  Actions: {
    titleKey: 'playground.gallery.cat.actions',
    blurbKey: 'playground.gallery.cat.actions.blurb',
  },
  Inputs: {
    titleKey: 'playground.gallery.cat.inputs',
    blurbKey: 'playground.gallery.cat.inputs.blurb',
  },
  Feedback: {
    titleKey: 'playground.gallery.cat.feedback',
    blurbKey: 'playground.gallery.cat.feedback.blurb',
  },
  Charts: {
    titleKey: 'playground.gallery.cat.charts',
    blurbKey: 'playground.gallery.cat.charts.blurb',
  },
  Animation: {
    titleKey: 'playground.gallery.cat.animation',
    blurbKey: 'playground.gallery.cat.animation.blurb',
  },
  Containment: {
    titleKey: 'playground.gallery.cat.containment',
    blurbKey: 'playground.gallery.cat.containment.blurb',
  },
  Navigation: {
    titleKey: 'playground.gallery.cat.navigation',
    blurbKey: 'playground.gallery.cat.navigation.blurb',
  },
  Resources: {
    titleKey: 'playground.gallery.cat.resources',
    blurbKey: 'playground.gallery.cat.resources.blurb',
  },
};

/** Home gallery — hide Styles + Interaction (Utilities); still in the nav rail. */
export const GALLERY_EXCLUDED_CATEGORIES = new Set(['Styles', 'Utilities']);

export function previewFor(id: string): ShowcasePreview {
  return SHOWCASE_PREVIEWS[id] ?? fallbackPreview();
}

/** Unique `k3-*` tags referenced in a markup string. */
export function tagsInHtml(html: string): string[] {
  const found = new Set<string>();
  for (const m of html.matchAll(/<\/?(k3-[\w-]+)/g)) {
    found.add(m[1]!);
  }
  return [...found];
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function galleryItemHtml(c: DocComponent, t: (key: string) => string): string {
  const preview = previewFor(c.id);
  const demoClass = ['gallery-demo', preview.demoClass].filter(Boolean).join(' ');
  const wide = preview.wide ? ' gallery-item--wide' : '';
  const title = t(c.titleKey);
  return `<article class="gallery-item${wide}" data-gallery-id="${escapeAttr(c.id)}">
  <div class="${demoClass}">${preview.html}</div>
  <a class="gallery-item__link" href="#/${escapeAttr(c.id)}">
    <span class="gallery-item__label">${escapeAttr(title)}</span>
    ${ms('arrow_forward')}
  </a>
</article>`;
}

/**
 * Full gallery markup (heading is outside `#catalog-grid` in index.html).
 * Categories live in `k3-accordion` (exclusive — opening one closes the others).
 * First matching category starts open.
 */
export function showcaseGalleryHtml(
  t: (key: string) => string,
  filter = '',
  emptyHint = '',
): string {
  const q = filter.trim();
  const blocks: string[] = [];
  let opened = false;

  for (const [cat, comps] of componentsByCategory()) {
    if (GALLERY_EXCLUDED_CATEGORIES.has(cat)) continue;
    const visible = q ? comps.filter((c) => catalogEntryMatches(c, cat, q, t)) : comps;
    if (!visible.length) continue;

    const meta = GALLERY_CATEGORY_META[cat];
    const title = meta ? t(meta.titleKey) : cat;
    const blurb = meta ? t(meta.blurbKey) : '';
    const open = !opened;
    opened = true;

    blocks.push(`<k3-expansion-panel class="gallery-category" toggle-position="end"${open ? ' open' : ''}>
  <span slot="header">${escapeAttr(title)}</span>
  ${blurb ? `<span slot="supporting">${escapeAttr(blurb)}</span>` : ''}
  <div class="gallery-grid k3-layout-grid" slot="content">
    ${visible.map((c) => galleryItemHtml(c, t)).join('\n    ')}
  </div>
</k3-expansion-panel>`);
  }

  if (!blocks.length) return `<p class="hint">${escapeAttr(emptyHint)}</p>`;
  return `<k3-accordion class="gallery-accordion">${blocks.join('\n')}</k3-accordion>`;
}

/** Collect every k3 tag used by the current gallery (for lazy register). */
export function showcaseTagsInHtml(html: string): string[] {
  return tagsInHtml(html);
}

type GalleryFabHost = HTMLElement & { open?: boolean };

const GALLERY_FAB_SEL = 'k3-fab-dial, k3-fab-rail, k3-fab-menu';

/**
 * Only one gallery FAB overlay open at a time (dial / rail / menu are
 * separate exclusive groups in the components — cross-close here).
 */
export function wireGalleryFabExclusive(root: ParentNode): void {
  const hosts = (): GalleryFabHost[] =>
    [...root.querySelectorAll<GalleryFabHost>(GALLERY_FAB_SEL)];

  const closeOthers = (except: Element): void => {
    for (const el of hosts()) {
      if (el === except || !el.open) continue;
      el.open = false;
    }
  };

  for (const el of hosts()) {
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.attributeName !== 'open') continue;
        if (el.hasAttribute('open')) closeOthers(el);
      }
    });
    mo.observe(el, { attributes: true, attributeFilter: ['open'] });
  }
}

/** Wire snackbar / dialog / tap demos after the gallery is injected. */
export function wireShowcaseInteractions(root: ParentNode): void {
  const snackBtn = root.querySelector<HTMLElement>('[data-gallery-snack]');
  const snack = root.querySelector('#gallery-snack') as (HTMLElement & { show?: () => Promise<boolean> }) | null;
  snackBtn?.addEventListener('click', () => {
    void snack?.show?.();
  });

  const dlgBtn = root.querySelector<HTMLElement>('[data-gallery-dialog]');
  const dlg = root.querySelector('#gallery-dialog') as (HTMLElement & { show?: () => Promise<boolean>; open?: boolean }) | null;
  dlgBtn?.addEventListener('click', () => {
    if (dlg && 'open' in dlg) dlg.open = true;
    else void dlg?.show?.();
  });
  root.querySelectorAll<HTMLElement>('[data-gallery-dialog-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (dlg && 'open' in dlg) dlg.open = false;
    });
  });

  let taps = 0;
  const tapBtn = root.querySelector<HTMLElement>('[data-gallery-tap]');
  const tapOut = root.querySelector<HTMLElement>('[data-gallery-tap-result]');
  tapBtn?.addEventListener('click', () => {
    taps += 1;
    if (tapOut) tapOut.textContent = `Taps: ${taps}`;
  });

  const sheetBtn = root.querySelector<HTMLElement>('[data-gallery-sheet]');
  const sheet = root.querySelector('#gallery-sheet') as
    | (HTMLElement & { show?: () => Promise<boolean>; open?: boolean; hide?: () => Promise<boolean> })
    | null;
  sheetBtn?.addEventListener('click', () => {
    void sheet?.show?.();
  });
  root.querySelectorAll<HTMLElement>('[data-gallery-sheet-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (sheet && 'open' in sheet) sheet.open = false;
      else void sheet?.hide?.();
    });
  });

  wireGalleryFabExclusive(root);
}