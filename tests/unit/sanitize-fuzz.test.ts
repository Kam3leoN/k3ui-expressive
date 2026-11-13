import { describe, expect, it } from 'vitest';
import { sanitizeHTML, sanitizeHTMLDetailed } from '../../src/core/sanitize.js';
import { sanitizeSVG } from '../../src/core/sanitize.js';

/** Deterministic PRNG — same seed → same corpus across runs. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const TAGS = [
  'div',
  'span',
  'p',
  'a',
  'img',
  'script',
  'iframe',
  'svg',
  'math',
  'style',
  'k3-button',
  'table',
  'td',
  'strong',
  'em',
  'ul',
  'li',
];
const ATTRS = [
  'href',
  'src',
  'onclick',
  'onerror',
  'onload',
  'style',
  'id',
  'name',
  'srcdoc',
  'formaction',
  'title',
  'alt',
  'target',
];
const URLS = [
  'https://example.com',
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  ' data:text/html,<script>1</script>',
  'mailto:a@b.c',
  '/rel#x',
  'vbscript:msgbox(1)',
];

function fuzzHtml(rand: () => number, depth = 0): string {
  if (depth > 4 || rand() < 0.2) return `t${(rand() * 1e4) | 0}`;
  const tag = TAGS[(rand() * TAGS.length) | 0]!;
  const nAttrs = (rand() * 3) | 0;
  let open = `<${tag}`;
  for (let i = 0; i < nAttrs; i++) {
    const a = ATTRS[(rand() * ATTRS.length) | 0]!;
    const v = a === 'href' || a === 'src' || a === 'formaction' ? URLS[(rand() * URLS.length) | 0]! : `v${(rand() * 99) | 0}`;
    open += ` ${a}="${v}"`;
  }
  open += '>';
  const kids = 1 + ((rand() * 3) | 0);
  let body = '';
  for (let i = 0; i < kids; i++) body += fuzzHtml(rand, depth + 1);
  return `${open}${body}</${tag}>`;
}

function assertSafe(root: ParentNode): void {
  for (const el of Array.from((root as ParentNode & { querySelectorAll: (s: string) => NodeListOf<Element> }).querySelectorAll?.('*') ?? [])) {
    for (const attr of Array.from(el.attributes)) {
      expect(attr.name.startsWith('on'), `${el.localName}[${attr.name}]`).toBe(false);
      expect(['style', 'id', 'name', 'srcdoc', 'formaction']).not.toContain(attr.name);
    }
  }
  expect(
    (root as Element).querySelector?.('script, iframe, object, embed, svg, math, template, form, input'),
  ).toBeFalsy();
}

describe('sanitizeHTML fuzzing', () => {
  it('never throws and never leaves active XSS sinks (200 payloads)', () => {
    const rand = mulberry32(0x4b335549 ^ 0x20261106);
    for (let i = 0; i < 200; i++) {
      const raw = fuzzHtml(rand);
      expect(() => {
        const frag = sanitizeHTML(raw);
        const box = document.createElement('div');
        box.append(frag);
        assertSafe(box);
      }).not.toThrow();
    }
  });

  it('respects maxLength / maxNodes without throwing', () => {
    const huge = `<p>${'x'.repeat(10_000)}</p>`.repeat(50);
    const { removed } = sanitizeHTMLDetailed(huge, { maxLength: 2_000, maxNodes: 20 });
    expect(removed.length).toBeGreaterThan(0);
  });
});

describe('sanitizeSVG fuzzing', () => {
  it('rejects or strips hostile SVG markup without throwing', () => {
    const payloads = [
      '<svg onload="alert(1)"><circle r="1"/></svg>',
      '<svg><script>alert(1)</script></svg>',
      '<svg><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><img src=x onerror=alert(1)></body></foreignObject></svg>',
      '<svg><use href="javascript:alert(1)"/></svg>',
      '<svg><image href="javascript:alert(1)"/></svg>',
      '<not-svg><circle/></not-svg>',
      '',
      '<svg>' + '<g>'.repeat(40) + '</g>'.repeat(40) + '</svg>',
    ];
    for (const p of payloads) {
      expect(() => sanitizeSVG(p)).not.toThrow();
      const out = sanitizeSVG(p);
      if (out) {
        expect(out.querySelector('script, foreignObject, use, image')).toBeNull();
        for (const el of Array.from(out.querySelectorAll('*'))) {
          for (const attr of Array.from(el.attributes)) {
            expect(attr.name.startsWith('on')).toBe(false);
          }
        }
      }
    }
  });
});
