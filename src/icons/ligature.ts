/**
 * Material Symbol ligatures vs Chrome / Google Translate.
 *
 * Translate rewrites text nodes (`home` → localized junk) and the icon font
 * no longer matches a glyph. Guard:
 * 1. `translate="no"` + `class="notranslate"` + `lang="zxx"`
 * 2. Move the name to `data-k3-icon` and render via CSS `::before` (no text node)
 */

const SELECTOR = '.ms, .k3-icon, [data-k3-icon]';

/** Seal one ligature host so page translation cannot rewrite the glyph name. */
export function sealIconElement(el: HTMLElement): void {
  el.classList.add('notranslate');
  el.setAttribute('translate', 'no');
  if (!el.getAttribute('lang')) el.setAttribute('lang', 'zxx');

  const fromData = el.getAttribute('data-k3-icon')?.trim();
  const fromText = (el.textContent ?? '').trim();
  const name = fromData || fromText;
  if (!name) return;

  if (!fromData) el.setAttribute('data-k3-icon', name);

  /* Pure text ligature → empty element; glyph comes from ::before */
  const onlyText = [...el.childNodes].every(
    (c) => c.nodeType === Node.TEXT_NODE || c.nodeType === Node.COMMENT_NODE,
  );
  if (onlyText && el.textContent?.trim()) el.textContent = '';
}

/** Protect light-DOM icon hosts under `root` (does not pierce closed shadow). */
export function protectIconLigatures(root: ParentNode = document): number {
  let n = 0;
  const list =
    root instanceof Element || root instanceof Document
      ? root.querySelectorAll(SELECTOR)
      : [];
  list.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    sealIconElement(node);
    n++;
  });
  return n;
}

/** Keep protecting icons added after boot (catalog, nav rebuilds, …). */
export function watchIconLigatures(root: ParentNode = document): MutationObserver | null {
  if (typeof MutationObserver === 'undefined') return null;
  protectIconLigatures(root);
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.matches(SELECTOR)) sealIconElement(node);
          protectIconLigatures(node);
        } else if (node instanceof DocumentFragment) {
          protectIconLigatures(node);
        }
      });
    }
  });
  const target = root instanceof Document ? root.documentElement : (root as Node);
  mo.observe(target, { childList: true, subtree: true });
  return mo;
}
