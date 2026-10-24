import {
  USAGE_BY_PAGE,
  buildUsageCss,
  buildUsageJs,
  type UsageSnippet,
} from './usage-snippets.js';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function panel(id: 'html' | 'css' | 'js', code: string, hidden: boolean): HTMLPreElement {
  const pre = document.createElement('pre');
  pre.className = 'code-block';
  pre.dataset.codePanel = id;
  pre.tabIndex = 0;
  if (hidden) pre.hidden = true;
  const codeEl = document.createElement('code');
  codeEl.textContent = code;
  pre.append(codeEl);
  return pre;
}

/** Build a Usage section (tabs HTML / CSS / JS + copy). */
export function createUsageSection(snip: UsageSnippet): HTMLElement {
  const section = document.createElement('section');
  section.className = 'doc-usage surface stack gap-md';

  const header = document.createElement('header');
  header.className = 'section-head sub';
  const h2 = document.createElement('h2');
  h2.dataset.i18n = 'doc.usage.title';
  h2.textContent = 'Usage';
  const p = document.createElement('p');
  p.dataset.i18n = 'doc.usage.blurb';
  p.textContent =
    'Copy-paste snippets to drop this component into a project — HTML, optional CSS, and JS init.';
  header.append(h2, p);

  const sample = document.createElement('div');
  sample.className = 'code-sample';

  const toolbar = document.createElement('div');
  toolbar.className = 'code-sample-toolbar';
  const tabs = document.createElement('div');
  tabs.className = 'qs-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'HTML CSS JS');
  for (const [id, label] of [
    ['html', 'HTML'],
    ['css', 'CSS'],
    ['js', 'JS'],
  ] as const) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `qs-tab${id === 'html' ? ' is-active' : ''}`;
    btn.dataset.codeTab = id;
    btn.textContent = label;
    tabs.append(btn);
  }
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'code-copy';
  copy.dataset.i18n = 'doc.usage.copy';
  copy.setAttribute('aria-label', 'Copy code');
  copy.textContent = 'Copy';
  toolbar.append(tabs, copy);

  sample.append(
    toolbar,
    panel('html', snip.html.trim(), false),
    panel('css', buildUsageCss(snip), true),
    panel('js', buildUsageJs(snip), true),
  );
  section.append(header, sample);
  return section;
}

/**
 * Ensure the page has a Usage block before Specs (`.doc-tables`).
 * Skips Styles pages and pages that already authored `.doc-usage`.
 */
export function mountUsageIfNeeded(page: HTMLElement, pageId: string): void {
  if (page.querySelector('.doc-usage')) return;
  const snip = USAGE_BY_PAGE[pageId];
  if (!snip) return;

  const section = createUsageSection(snip);
  const tables = page.querySelector('.doc-tables');
  if (tables) tables.before(section);
  else page.append(section);
}

/** Escape helper exported for tests / diagnostics. */
export { escapeHtml };
