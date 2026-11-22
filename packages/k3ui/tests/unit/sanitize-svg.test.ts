import { describe, expect, it } from 'vitest';
import { sanitizeSVG } from '../../src/core/sanitize.js';

const FORBIDDEN_TAGS = 'script, style, foreignObject, foreignobject, use, image, a, animate, set, iframe, img';

/** Every attribute left must be inert — no handler, style, link or remote paint. */
function assertInert(svg: Element): void {
  expect(svg.querySelector(FORBIDDEN_TAGS)).toBeNull();
  for (const el of [svg, ...svg.querySelectorAll('*')]) {
    expect(el.namespaceURI).toBe('http://www.w3.org/2000/svg');
    for (const attr of Array.from(el.attributes)) {
      expect(attr.name.toLowerCase().startsWith('on'), `${el.localName}[${attr.name}]`).toBe(false);
      expect(['style', 'href', 'xlink:href', 'src']).not.toContain(attr.name.toLowerCase());
      expect(attr.value).not.toMatch(/javascript:|expression\(|url\((?!#)/i);
    }
  }
}

const PAYLOADS = [
  '<svg onload=alert(1)><path d="M0 0h24v24H0z"/></svg>',
  '<svg><script>alert(1)</script><path d="M0 0"/></svg>',
  '<svg><foreignObject><img src=x onerror=alert(1)></foreignObject></svg>',
  '<svg><a href="javascript:alert(1)"><circle r="4"/></a></svg>',
  '<svg><use href="data:image/svg+xml,<svg id=x onload=alert(1)>#x"/></svg>',
  '<svg><image href="x" onerror="alert(1)"/></svg>',
  '<svg><animate attributeName="href" values="javascript:alert(1)"/><set attributeName="onmouseover" to="alert(1)"/></svg>',
  '<svg><style>@import url(//evil)</style><rect style="fill:url(//evil)" width="2"/></svg>',
  '<svg><path fill="url(https://evil/x.svg#p)" d="M0 0"/></svg>',
  '<svg><g transform="translate(1 1) url(x)"><path d="M0 0"/></g></svg>',
  '<svg><title><img src=x onerror=alert(1)></title></svg>',
  '<svg><desc></desc><p><style><img src=x onerror=alert(1)></style></p></svg>',
];

describe('sanitizeSVG', () => {
  it.each(PAYLOADS)('neutralises %s', (payload) => {
    const svg = sanitizeSVG(payload);
    expect(svg).not.toBeNull();
    assertInert(svg!);
  });

  it('keeps an ordinary icon intact (case-sensitive SVG names)', () => {
    const svg = sanitizeSVG(
      '<svg viewBox="0 0 24 24" width="24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12 2 2 22h20z"/></svg>',
    )!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.querySelector('path')!.getAttribute('d')).toBe('M12 2 2 22h20z');
    expect(svg.querySelector('path')!.getAttribute('fill-rule')).toBe('evenodd');
  });

  it('drops ids (DOM clobbering) unless allowIds — then keeps local url(#id) refs', () => {
    const markup =
      '<svg><defs><linearGradient id="g"><stop offset="0" stop-color="#f00"/></linearGradient></defs><rect id="location" fill="url(#g)" width="4" height="4"/></svg>';
    const strict = sanitizeSVG(markup)!;
    expect(strict.querySelector('[id]')).toBeNull();
    expect(strict.querySelector('rect')!.hasAttribute('fill')).toBe(false);

    const scoped = sanitizeSVG(markup, { allowIds: true })!;
    expect(scoped.querySelector('linearGradient')!.id).toBe('g');
    expect(scoped.querySelector('rect')!.getAttribute('fill')).toBe('url(#g)');
  });

  it('returns null without an <svg> and caps oversized input', () => {
    expect(sanitizeSVG('<b>no svg</b>')).toBeNull();
    expect(sanitizeSVG('')).toBeNull();
    const huge = `<svg>${'<path d="M0 0"/>'.repeat(5000)}</svg>`;
    const svg = sanitizeSVG(huge, { maxNodes: 50 })!;
    expect(svg.querySelectorAll('path').length).toBeLessThanOrEqual(50);
  });
});
