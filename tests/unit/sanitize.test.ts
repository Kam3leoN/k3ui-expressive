import { describe, expect, it } from 'vitest';
import { sanitizeHTML, sanitizeHTMLDetailed } from '../../src/core/sanitize.js';

const render = (html: string, options?: Parameters<typeof sanitizeHTML>[1]): HTMLElement => {
  const box = document.createElement('div');
  box.append(sanitizeHTML(html, options));
  return box;
};

/** No element may carry an event handler, a style, an id/name or a dangerous URL. */
const assertInert = (box: HTMLElement): void => {
  for (const el of Array.from(box.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      expect(attr.name.startsWith('on'), `${el.localName}[${attr.name}]`).toBe(false);
      expect(['style', 'id', 'name', 'srcdoc', 'formaction', 'xlink:href']).not.toContain(attr.name);
      if (attr.name === 'href' || attr.name === 'src') {
        expect(attr.value.replace(/[\s\u0000-\u001f]/g, '')).not.toMatch(/^(javascript|vbscript|data:text|data:image\/svg)/i);
      }
    }
  }
  expect(box.querySelector('script, style, iframe, object, embed, svg, math, template, form, input, link, meta, base, noscript')).toBeNull();
};

const PAYLOADS = [
  '<img src=x onerror=alert(1)>',
  '<a href="javascript:alert(1)">x</a>',
  '<a href=" jav&#x09;ascript:alert(1)">tab entity</a>',
  '<a href="JaVaScRiPt:alert(1)">case</a>',
  '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">entities</a>',
  '<a href="vbscript:msgbox(1)">vb</a>',
  '<a href="data:text/html,<script>alert(1)</script>">data</a>',
  '<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+">',
  '<svg onload=alert(1)><circle/></svg>',
  '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
  '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  '<object data="javascript:alert(1)"></object><embed src="javascript:alert(1)">',
  '<form action="javascript:alert(1)"><button formaction="javascript:alert(1)">go</button></form>',
  '<div style="background:url(javascript:alert(1))">styled</div>',
  '<p id="cookie" name="location">clobber</p>',
  '<meta http-equiv="refresh" content="0;url=javascript:alert(1)"><link rel=import href=x><base href="javascript:/">',
  '<template><img src=x onerror=alert(1)></template>',
  '<details open ontoggle=alert(1)>t</details>',
  '<span onmouseover="alert(1)">hover</span>',
];

describe('sanitizeHTML — XSS guard rails', () => {
  it.each(PAYLOADS)('neutralizes %s', (payload) => {
    assertInert(render(payload));
  });

  it('drops scripts with their content, keeps the surrounding text', () => {
    const box = render('a<script>alert(1)</script>b');
    expect(box.textContent).toBe('ab');
  });

  it('keeps allowed formatting and safe links', () => {
    const box = render('<strong>Hi</strong> <em>there</em> <a href="https://example.com/x?y=1" title="t">link</a> <a href="/docs#a">rel</a> <a href="mailto:a@b.c">mail</a>');
    expect(box.querySelector('strong')?.textContent).toBe('Hi');
    expect(box.querySelectorAll('a[href]').length).toBe(3);
    expect(box.querySelector('a')?.getAttribute('title')).toBe('t');
  });

  it('forces rel="noopener noreferrer" on target=_blank', () => {
    const a = render('<a href="https://example.com" target="_blank" rel="nofollow">x</a>').querySelector('a')!;
    expect(a.getAttribute('rel')?.split(' ').sort()).toEqual(['nofollow', 'noopener', 'noreferrer']);
  });

  it('keeps raster data images, refuses svg data images', () => {
    expect(render('<img src="data:image/png;base64,iVBORw0KGgo=" alt="p">').querySelector('img')?.getAttribute('src')).toMatch(/^data:image\/png/);
    expect(render('<img src="data:image/svg+xml;base64,AAAA">').querySelector('img')?.hasAttribute('src')).toBe(false);
  });

  it('never instantiates custom elements (text is kept)', () => {
    const box = render('<k3-dialog open>Inside</k3-dialog>');
    expect(box.querySelector('k3-dialog')).toBeNull();
    expect(box.textContent).toBe('Inside');
  });

  it('drops comments and reports what was removed', () => {
    const { fragment, removed } = sanitizeHTMLDetailed('<!-- x --><b onclick="x()">b</b><script>1</script>');
    const box = document.createElement('div');
    box.append(fragment);
    expect(box.innerHTML).toBe('<b>b</b>');
    expect(removed).toEqual(expect.arrayContaining(['comment', 'attr:onclick', 'tag:script']));
  });

  it('honours allowLinks / allowImages and the size limits', () => {
    expect(render('<a href="https://x.y">t</a><img src="/a.png">', { allowLinks: false, allowImages: false }).innerHTML).toBe('t');
    const deep = '<span>'.repeat(40) + 'x' + '</span>'.repeat(40);
    expect(render(deep, { maxDepth: 5 }).querySelectorAll('span').length).toBeLessThanOrEqual(5);
    const many = '<b>x</b>'.repeat(50);
    expect(render(many, { maxNodes: 10 }).querySelectorAll('b').length).toBeLessThanOrEqual(10);
    expect(sanitizeHTMLDetailed('x'.repeat(20), { maxLength: 5 }).removed).toContain('limit:length');
  });
});
