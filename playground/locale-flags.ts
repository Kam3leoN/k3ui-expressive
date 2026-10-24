/**
 * Country flags via `flag-icons` (lipis) — playground only.
 * - `1x1` → icon slots (square + 4dp radius)
 * - `4x3` → wider surfaces elsewhere
 */
/// <reference types="vite/client" />

import en1x1 from 'flag-icons/flags/1x1/gb.svg?raw';
import en4x3 from 'flag-icons/flags/4x3/gb.svg?raw';
import fr1x1 from 'flag-icons/flags/1x1/fr.svg?raw';
import fr4x3 from 'flag-icons/flags/4x3/fr.svg?raw';

export type PlaygroundLocale = 'fr' | 'en';
export type FlagRatio = '1x1' | '4x3';

const FLAG_SVG: Record<FlagRatio, Record<PlaygroundLocale, string>> = {
  '1x1': { fr: fr1x1, en: en1x1 },
  '4x3': { fr: fr4x3, en: en4x3 },
};

export function isPlaygroundLocale(value: string): value is PlaygroundLocale {
  return value === 'fr' || value === 'en';
}

/** Raw SVG markup for a locale + ratio. */
export function localeFlagSvg(
  locale: PlaygroundLocale,
  ratio: FlagRatio = '1x1',
): string {
  return FLAG_SVG[ratio][locale];
}

/** Data-URI (img / CSS background) for a locale + ratio. */
export function localeFlagDataUri(
  locale: PlaygroundLocale,
  ratio: FlagRatio = '1x1',
): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(localeFlagSvg(locale, ratio))}`;
}

/** Paint a host element with an inline SVG flag (slot-safe, no broken `<img>`). */
export function setLocaleFlagEl(
  el: HTMLElement | null,
  locale: PlaygroundLocale,
  ratio: FlagRatio = '1x1',
): void {
  if (!el) return;
  el.classList.add('flag-icon', `flag-icon--${ratio}`);
  el.classList.remove(ratio === '1x1' ? 'flag-icon--4x3' : 'flag-icon--1x1');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('translate', 'no');
  /* Trusted package SVG — inline so slotted styles cannot break URL loads */
  el.innerHTML = localeFlagSvg(locale, ratio);
}

/**
 * Flag hosts — light DOM + items adopted into `k3-split-button` shadow menus
 * (`adoptMenuItems` moves `slot="menu"` out of `document` reach).
 */
function localeFlagHosts(): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const add = (el: HTMLElement): void => {
    if (!seen.has(el)) seen.add(el);
  };
  document.querySelectorAll<HTMLElement>('[data-locale-flag]').forEach(add);
  document.querySelectorAll('k3-split-button').forEach((split) => {
    const menu = split.shadowRoot?.querySelector('k3-menu');
    menu?.querySelectorAll<HTMLElement>('[data-locale-flag]').forEach(add);
  });
  return [...seen];
}

/** Wire menu item flags + leading split icon. */
export function mountLocaleFlags(locale: PlaygroundLocale): void {
  for (const el of localeFlagHosts()) {
    const code = el.getAttribute('data-locale-flag');
    if (!code || !isPlaygroundLocale(code)) continue;
    const ratioAttr = el.getAttribute('data-flag-ratio');
    const ratio: FlagRatio = ratioAttr === '4x3' ? '4x3' : '1x1';
    setLocaleFlagEl(el, code, ratio);
    /* Re-sync menu-item icon slot after SVG paint */
    const item = el.closest('k3-menu-item') as { syncSlots?: () => void } | null;
    item?.syncSlots?.();
  }
  syncLocaleLeadingFlag(locale);
}

/** Update the split-button leading flag to the active locale (1×1 icon). */
export function syncLocaleLeadingFlag(locale: PlaygroundLocale): void {
  setLocaleFlagEl(document.getElementById('locale-menu-flag'), locale, '1x1');
}
