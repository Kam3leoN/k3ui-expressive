/**
 * Guard for trimmed builds (custom packs): a k3 element that exists in K3UI
 * but was left out of this file can never upgrade. Instead of a silent blank
 * spot, say so — once per tag:
 *
 * - `console.error` with the link that rebuilds the pack (current selection
 *   + what is missing, pre-checked);
 * - a `k3-missing-component` event on `document` (`detail`: tag, missing,
 *   rebuildUrl) for error trackers;
 * - on development hosts, a banner on the page and an outline on the
 *   elements. Visitors of a production site never see it unless
 *   `init({ missingComponents: 'overlay' })` asks for it.
 */
import { debug } from '../debug/logger.js';

/** Where packs are built — query `components` + hash `#/pack`. */
export const PACK_BUILDER_URL = 'https://k3ui-expressive.vercel.app/';

export type MissingComponentsMode = 'auto' | 'overlay' | 'console' | 'silent';

/** What a pack records about itself (`globalThis.K3UI_PACK`, written by the builders). */
export interface PackInfo {
  name?: string;
  version?: string;
  /** Every element the file holds (selection + dependencies). */
  components: readonly string[];
  /** Builder page of the release that made the pack. */
  builder?: string;
}

export interface MissingComponentDetail {
  tag: string;
  /** Every missing tag seen so far. */
  missing: string[];
  rebuildUrl: string;
}

declare global {
  // eslint-disable-next-line no-var
  var K3UI_PACK: PackInfo | undefined;
}

const TAG = /^k3-[a-z0-9-]+$/;
const missing = new Set<string>();
let mode: MissingComponentsMode = 'auto';
let banner: HTMLElement | null = null;
let outline: HTMLStyleElement | null = null;
let dismissed = false;

/** Pack description, when this build is one (validated — it is a page global). */
export function packInfo(): PackInfo | null {
  const info = globalThis.K3UI_PACK;
  if (!info || typeof info !== 'object' || !Array.isArray(info.components)) return null;
  return info;
}

/** `false` when a pack is loaded and `tag` is not part of it. */
export function inPack(tag: string): boolean {
  const info = packInfo();
  return !info || info.components.includes(tag);
}

export function setMissingComponentsMode(next: MissingComponentsMode): void {
  mode = next;
  if (resolveMode() === 'overlay') render();
  else unmount();
}

/** localhost, loopback, private LAN, `*.local` / `*.test`, `file:` — a developer is looking. */
export function isDevHost(loc: Pick<Location, 'hostname' | 'protocol'> | undefined = globalThis.location): boolean {
  if (!loc) return false;
  if (loc.protocol === 'file:') return true;
  const host = loc.hostname.replace(/^\[|\]$/g, '');
  return (
    host === 'localhost' ||
    host === '::1' ||
    /\.(localhost|local|test)$/.test(host) ||
    /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
  );
}

function resolveMode(): Exclude<MissingComponentsMode, 'auto'> {
  if (mode !== 'auto') return mode;
  return isDevHost() ? 'overlay' : 'console';
}

/** Builder link with the pack's components and the missing ones selected. */
export function rebuildUrl(extra: Iterable<string> = missing): string {
  const info = packInfo();
  const base = typeof info?.builder === 'string' && /^https?:\/\//.test(info.builder) ? info.builder : PACK_BUILDER_URL;
  const tags = [...new Set([...(info?.components ?? []), ...extra])]
    .filter((t) => typeof t === 'string' && TAG.test(t))
    .map((t) => t.slice(3));
  const root = base.split('#')[0] ?? base;
  const url = new URL(root, 'https://k3ui-expressive.vercel.app/');
  if (tags.length) url.searchParams.set('components', tags.join(' '));
  url.hash = '#/pack';
  return url.href.replace(/%20/g, '+');
}

export function missingComponents(): string[] {
  return [...missing];
}

/** Record `tag` as used-but-absent and tell the developer (once per tag). */
export function reportMissing(tag: string): void {
  if (!TAG.test(tag) || missing.has(tag)) return;
  missing.add(tag);
  const url = rebuildUrl();
  const active = resolveMode();
  if (active !== 'silent') {
    const pack = packInfo()?.name ?? 'this K3UI build';
    console.error(
      `[k3ui] <${tag}> is used on this page but is not included in ${pack}. ` +
        `Rebuild your pack with it: ${url}`,
    );
  }
  debug.warn('registry', `missing component: ${tag}`);
  if (typeof document === 'undefined') return;
  document.dispatchEvent(
    new CustomEvent<MissingComponentDetail>('k3-missing-component', {
      detail: { tag, missing: [...missing], rebuildUrl: url },
    }),
  );
  if (active === 'overlay') render();
}

function unmount(): void {
  banner?.remove();
  outline?.remove();
  banner = null;
  outline = null;
}

/* Plain DOM + inline styles: the banner must work when almost nothing is loaded. */
function render(): void {
  if (typeof document === 'undefined' || !missing.size || dismissed) return;
  const tags = [...missing];

  outline ??= document.createElement('style');
  outline.dataset.k3Missing = '';
  outline.textContent = `${tags.map((t) => `${t}:not(:defined)`).join(',')}{outline:2px dashed #b3261e;outline-offset:2px;min-block-size:1.5rem;min-inline-size:1.5rem;display:inline-block}`;
  if (!outline.isConnected) document.head.append(outline);

  if (!banner) {
    banner = document.createElement('div');
    banner.dataset.k3Missing = '';
    banner.setAttribute('role', 'alert');
    banner.style.cssText =
      'position:fixed;inset-inline:12px;inset-block-end:12px;z-index:2147483000;display:flex;flex-wrap:wrap;' +
      'align-items:center;gap:8px 16px;padding:12px 16px;border-radius:12px;font:500 14px/1.4 system-ui,sans-serif;' +
      'background:#410e0b;color:#fff;box-shadow:0 4px 16px rgb(0 0 0 / .35)';
  }
  const text = document.createElement('span');
  text.style.cssText = 'flex:1 1 16rem';
  const strong = document.createElement('strong');
  strong.textContent = 'K3UI — ';
  text.append(
    strong,
    tags.length === 1 ? 'Component missing from your pack: ' : 'Components missing from your pack: ',
    tags.map((t) => `<${t}>`).join(', '),
  );
  const link = document.createElement('a');
  link.href = rebuildUrl();
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'Rebuild the pack';
  link.style.cssText = 'color:#ffb4ab;font-weight:700;text-decoration:underline';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '✕';
  close.setAttribute('aria-label', 'Dismiss');
  close.style.cssText = 'all:unset;cursor:pointer;padding:4px 8px;border-radius:8px;color:#fff';
  close.addEventListener('click', () => {
    dismissed = true;
    unmount();
  });
  banner.replaceChildren(text, link, close);
  const mount = (): void => {
    if (banner && !banner.isConnected) document.body.append(banner);
  };
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });
}

/** Test helper — forget what was reported. */
export function resetMissingComponents(): void {
  missing.clear();
  dismissed = false;
  mode = 'auto';
  unmount();
}
