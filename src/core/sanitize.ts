/**
 * Allowlist HTML sanitizer — for strings you do not control (CMS, API, users).
 *
 * Guard rails:
 * 1. Parsed in an inert document (DOMParser): no script runs, nothing loads.
 * 2. Rebuilt node by node with `createElement` / `createTextNode` in the live
 *    document — no `innerHTML`, no re-parsing, so no mutation XSS, and nothing
 *    to feed a Trusted Types sink.
 * 3. Tag allowlist. Dangerous elements (script, style, iframe, object, embed,
 *    svg, math, template, form controls…) are dropped *with* their content;
 *    unknown tags and custom elements are unwrapped (their text is kept,
 *    no element is ever upgraded).
 * 4. Attribute allowlist per tag — never `on*`, `style`, `id`, `name`.
 * 5. URLs: control characters / whitespace stripped before the scheme check;
 *    links allow http(s), mailto, tel and relative URLs, images allow http(s),
 *    relative and base64 raster `data:` URLs.
 * 6. `target="_blank"` always gets `rel="noopener noreferrer"`.
 * 7. Limits on input length, node count and depth.
 */

export interface SanitizeOptions {
  /** Keep `<a href>` (default true — otherwise links are unwrapped). */
  allowLinks?: boolean;
  /** Keep `<img>` (default true — otherwise dropped). */
  allowImages?: boolean;
  /** Characters read from the input (default 50 000). */
  maxLength?: number;
  /** Elements + text nodes kept (default 2 000). */
  maxNodes?: number;
  /** Nesting depth kept (default 24). */
  maxDepth?: number;
}

export interface SanitizeResult {
  fragment: DocumentFragment;
  /** What was removed, e.g. `tag:script`, `attr:onerror`, `url:href`. */
  removed: string[];
}

/** Elements dropped together with everything inside them. */
const DROP_WITH_CONTENT = new Set([
  'script', 'style', 'template', 'noscript', 'noembed', 'noframes', 'xmp', 'plaintext',
  'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'portal', 'fencedframe',
  'link', 'meta', 'base', 'title', 'head',
  'form', 'input', 'textarea', 'select', 'option', 'optgroup', 'button', 'datalist', 'output',
  'svg', 'math', 'canvas', 'audio', 'video', 'source', 'track', 'picture', 'map', 'area',
  'dialog', 'slot', 'marquee', 'param',
]);

const GLOBAL_ATTRS = new Set(['title', 'lang', 'dir', 'class', 'translate', 'aria-label', 'aria-hidden']);

/** tag → extra allowed attributes */
const ALLOWED: Readonly<Record<string, readonly string[]>> = {
  a: ['href', 'target', 'rel', 'hreflang'],
  img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
  abbr: [], b: [], bdi: [], bdo: [], br: [], cite: [], code: [], data: ['value'], del: [], dfn: [],
  div: [], em: [], i: [], ins: [], kbd: [], li: [], mark: [], ol: [], p: [], q: [], s: [],
  samp: [], small: [], span: [], strong: [], sub: [], sup: [], time: ['datetime'], u: [],
  ul: [], var: [], wbr: [],
};

const LINK_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const IMAGE_SCHEMES = new Set(['http:', 'https:']);
const SAFE_DATA_IMAGE = /^data:image\/(?:png|gif|jpe?g|webp|avif);base64,[a-z0-9+/=\s]+$/i;
const REL_TOKENS = new Set(['nofollow', 'noopener', 'noreferrer', 'ugc', 'sponsored', 'external']);

/** Characters browsers ignore inside a scheme (tabs, newlines, NUL, other controls, spaces). */
// eslint-disable-next-line no-control-regex
const URL_NOISE = /[\u0000-\u0020\u007f-\u009f\u00a0\u1680\u2000-\u200f\u2028\u2029\u202f\u205f\u3000\ufeff]/g;

function urlIsSafe(raw: string, kind: 'link' | 'image'): boolean {
  const value = raw.replace(URL_NOISE, '');
  if (!value) return false;
  if (kind === 'image' && /^data:/i.test(value)) return SAFE_DATA_IMAGE.test(raw.trim());
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1];
  if (!scheme) return true; /* relative, fragment, query, protocol-relative */
  const allowed = kind === 'link' ? LINK_SCHEMES : IMAGE_SCHEMES;
  return allowed.has(`${scheme.toLowerCase()}:`);
}

function attrValueIsSafe(tag: string, name: string, value: string): string | null {
  switch (name) {
    case 'href':
      return urlIsSafe(value, 'link') ? value.trim() : null;
    case 'src':
      return urlIsSafe(value, 'image') ? value.trim() : null;
    case 'dir':
      return /^(ltr|rtl|auto)$/i.test(value) ? value.toLowerCase() : null;
    case 'translate':
      return /^(yes|no)$/i.test(value) ? value.toLowerCase() : null;
    case 'aria-hidden':
      return /^(true|false)$/i.test(value) ? value.toLowerCase() : null;
    case 'class': {
      const tokens = value.split(/\s+/).filter((t) => /^[A-Za-z_][\w-]{0,63}$/.test(t)).slice(0, 16);
      return tokens.length ? tokens.join(' ') : null;
    }
    case 'width':
    case 'height':
      return /^\d{1,4}$/.test(value.trim()) ? value.trim() : null;
    case 'loading':
      return /^(lazy|eager)$/i.test(value) ? value.toLowerCase() : null;
    case 'decoding':
      return /^(async|sync|auto)$/i.test(value) ? value.toLowerCase() : null;
    case 'target':
      return /^(_blank|_self)$/i.test(value) ? value.toLowerCase() : null;
    case 'rel': {
      const tokens = value.toLowerCase().split(/\s+/).filter((t) => REL_TOKENS.has(t));
      return tokens.length ? [...new Set(tokens)].join(' ') : null;
    }
    case 'hreflang':
      return /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(value) ? value : null;
    case 'datetime':
      return /^[\d:T+.\-Z ]{1,40}$/i.test(value) ? value : null;
    default:
      /* title, lang, aria-label, value: plain text, length-capped */
      if (tag && value.length > 500) return value.slice(0, 500);
      return value;
  }
}

/** Sanitize `html` and report what was removed. */
export function sanitizeHTMLDetailed(html: string, options: SanitizeOptions = {}): SanitizeResult {
  const {
    allowLinks = true,
    allowImages = true,
    maxLength = 50_000,
    maxNodes = 2_000,
    maxDepth = 24,
  } = options;
  const fragment = document.createDocumentFragment();
  const removed: string[] = [];
  const note = (what: string): void => {
    if (!removed.includes(what)) removed.push(what);
  };
  const source = String(html ?? '');
  if (!source) return { fragment, removed };
  if (source.length > maxLength) note('limit:length');
  const doc = new DOMParser().parseFromString(
    `<!doctype html><html><body>${source.slice(0, maxLength)}</body></html>`,
    'text/html',
  );
  let budget = maxNodes;

  const copy = (from: Node, into: Node, depth: number): void => {
    for (const node of Array.from(from.childNodes)) {
      if (budget <= 0) {
        note('limit:nodes');
        return;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        budget--;
        into.appendChild(document.createTextNode(node.nodeValue ?? ''));
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        note(node.nodeType === Node.COMMENT_NODE ? 'comment' : 'node');
        continue;
      }
      const el = node as Element;
      const tag = el.localName;
      if (DROP_WITH_CONTENT.has(tag)) {
        note(`tag:${tag}`);
        continue;
      }
      if (depth >= maxDepth) {
        note('limit:depth');
        continue;
      }
      const allowedHere =
        tag in ALLOWED && !tag.includes('-') && (tag !== 'a' || allowLinks) && (tag !== 'img' || allowImages);
      if (!allowedHere) {
        /* Unknown, custom or disabled element: keep its (sanitized) content, never the element */
        if (tag === 'img') {
          note('tag:img');
          continue;
        }
        note(`tag:${tag}`);
        copy(el, into, depth + 1);
        continue;
      }
      budget--;
      const out = document.createElement(tag);
      const extra = ALLOWED[tag] ?? [];
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        if (!GLOBAL_ATTRS.has(name) && !extra.includes(name)) {
          note(`attr:${name}`);
          continue;
        }
        const value = attrValueIsSafe(tag, name, attr.value);
        if (value == null) {
          note(name === 'href' || name === 'src' ? `url:${name}` : `attr:${name}`);
          continue;
        }
        out.setAttribute(name, value);
      }
      if (tag === 'a' && out.getAttribute('target') === '_blank') {
        const rel = new Set((out.getAttribute('rel') ?? '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        out.setAttribute('rel', [...rel].join(' '));
      }
      if (tag === 'img' && !out.hasAttribute('alt')) out.setAttribute('alt', '');
      into.appendChild(out);
      copy(el, out, depth + 1);
    }
  };

  copy(doc.body, fragment, 0);
  return { fragment, removed };
}

/** Sanitized DocumentFragment, ready to insert (see {@link sanitizeHTMLDetailed}). */
export function sanitizeHTML(html: string, options?: SanitizeOptions): DocumentFragment {
  return sanitizeHTMLDetailed(html, options).fragment;
}
