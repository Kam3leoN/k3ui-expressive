import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/bootstrap/init.js';
import { highlightCode } from '../../src/components/containment/codeblock-highlighter.js';
import type { K3CodeBlock } from '../../src/components/containment/codeblock.js';

describe('codeblock highlighter', () => {
  it('wraps javascript keywords', () => {
    const html = highlightCode('const x = true;', 'javascript');
    expect(html).toContain('token keyword');
    expect(html).toContain('const');
  });

  it('escapes plain text', () => {
    expect(highlightCode('<tag>', 'plain')).toBe('&lt;tag&gt;');
  });
});

describe('k3-codeblock', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await import('../../src/components/containment/codeblock.js');
    await init({ theme: { mode: 'light' } });
    host = document.createElement('div');
    document.body.appendChild(host);
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    host?.remove();
    vi.unstubAllGlobals();
  });

  it('renders code property and copies', async () => {
    host.innerHTML = `<k3-codeblock label="demo" language="javascript" code="const ok = 1;"></k3-codeblock>`;
    const el = host.querySelector('k3-codeblock') as K3CodeBlock;
    await el.updateComplete;
    await el.updateComplete;

    const onCopy = vi.fn();
    el.addEventListener('k3-copy', onCopy as EventListener);

    const btn = el.shadowRoot!.querySelector('[part="copy"]') as HTMLElement;
    expect(btn).toBeTruthy();
    const inner = btn.shadowRoot?.querySelector('button') as HTMLButtonElement | null;
    (inner ?? btn).click();
    await Promise.resolve();
    await el.updateComplete;

    expect(onCopy).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { text: 'const ok = 1;' } }),
    );
  });

  it('reads light DOM pre/code', async () => {
    const el = document.createElement('k3-codeblock') as K3CodeBlock;
    el.setAttribute('label', 'x');
    const pre = document.createElement('pre');
    const src = document.createElement('code');
    src.className = 'language-html';
    src.textContent = '<div></div>';
    pre.appendChild(src);
    el.appendChild(pre);
    host.appendChild(el);
    await el.updateComplete;
    await el.updateComplete;
    const code = el.shadowRoot!.querySelector('code');
    expect(code?.className).toContain('language-html');
    expect(code?.textContent).toContain('<div>');
  });

  it('switches slotted samples via tabs', async () => {
    host.innerHTML = `<k3-codeblock>
      <pre data-label="HTML"><code class="language-html">&lt;b&gt;</code></pre>
      <pre data-label="CSS"><code class="language-css">.a{}</code></pre>
    </k3-codeblock>`;
    const el = host.querySelector('k3-codeblock') as K3CodeBlock;
    await el.updateComplete;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('code')?.textContent).toContain('<b>');
    el.index = 1;
    await el.updateComplete;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('code')?.textContent).toContain('.a{}');
  });

  it('shows Show code chip when collapsible content overflows', async () => {
    const lines = Array.from({ length: 24 }, (_, i) => `line ${i + 1};`).join('\n');
    const el = document.createElement('k3-codeblock') as K3CodeBlock;
    el.collapsible = true;
    el.collapsedHeight = 80;
    el.language = 'javascript';
    el.code = lines;
    host.appendChild(el);
    await el.updateComplete;
    await el.updateComplete;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await el.updateComplete;

    const chip = el.shadowRoot!.querySelector('[part="expand"]') as HTMLElement | null;
    expect(chip).toBeTruthy();
    expect(el.shadowRoot!.querySelector('.panel--collapsed')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('.fade')).toBeTruthy();

    const onExpand = vi.fn();
    el.addEventListener('k3-expand', onExpand as EventListener);
    const btn = chip!.shadowRoot?.querySelector('button') as HTMLButtonElement | null;
    (btn ?? chip)!.click();
    await el.updateComplete;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    expect(el.expanded).toBe(true);
    expect(onExpand).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { expanded: true } }),
    );
    expect(el.shadowRoot!.querySelector('.fade')).toBeNull();
  });
});
