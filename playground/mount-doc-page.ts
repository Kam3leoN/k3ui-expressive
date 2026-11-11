/**
 * Single mount point for component doc chrome — Usage + narrative sections + API tables.
 * @see .cursor/rules/doc-page-template.mdc
 */
import { DOC_SECTIONS, isDocNa, type DocSections } from './doc-sections.js';
import {
  createDocTable,
  docTablesForPage,
  isDocTableNa,
  type DocTableSection,
} from './doc-tables.js';
import { createUsageSection } from './mount-usage.js';
import { USAGE_BY_PAGE } from './usage-snippets.js';

/** Fixed h2 order (subset allowed). Titles via i18n keys. */
export const DOC_SECTION_ORDER = [
  'examples',
  'states',
  'versions',
  'usage',
  'theming',
  'keyboard',
  'focus',
  'motion',
  'a11y',
  'specs',
  'properties',
  'methods',
  'events',
  'slots',
  'css-parts',
  'options',
  'init',
] as const;

export type DocSectionId = (typeof DOC_SECTION_ORDER)[number];

const SECTION_I18N: Partial<Record<DocSectionId, { key: string; en: string }>> = {
  examples: { key: 'doc.section.examples', en: 'Examples' },
  states: { key: 'doc.section.states', en: 'States' },
  versions: { key: 'doc.section.versions', en: 'Versions' },
  usage: { key: 'doc.usage.title', en: 'Usage' },
  theming: { key: 'doc.section.theming', en: 'Theming' },
  keyboard: { key: 'doc.section.keyboard', en: 'Keyboard' },
  focus: { key: 'doc.section.focus', en: 'Focus' },
  motion: { key: 'doc.section.motion', en: 'Motion' },
  a11y: { key: 'doc.section.a11y', en: 'Accessibility' },
};

function heading(id: DocSectionId): HTMLHeadingElement {
  const h2 = document.createElement('h2');
  const meta = SECTION_I18N[id];
  if (meta) {
    h2.dataset.i18n = meta.key;
    h2.textContent = meta.en;
  } else {
    h2.textContent = id;
  }
  return h2;
}

function proseSection(
  id: 'focus' | 'a11y' | 'versions',
  value: DocSections[typeof id],
): HTMLElement | null {
  if (isDocNa(value)) return null;
  const section = document.createElement('section');
  section.className = `doc-narrative doc-narrative--${id}`;
  section.append(heading(id));
  const p = document.createElement('p');
  if (value.startsWith('doc.')) {
    p.dataset.i18n = value;
    p.textContent = value;
  } else {
    p.textContent = value;
  }
  section.append(p);
  return section;
}

function tableSection(
  id: 'theming' | 'keyboard' | 'motion',
  rows: DocSections[typeof id],
  columns: string,
  title: string,
): HTMLElement | null {
  if (isDocNa(rows) || !rows.length) return null;
  const sec: DocTableSection = { id, title, columns, rows };
  return createDocTable(sec);
}

/**
 * Mount Usage + DOC_SECTIONS narrative + API tables for a component page.
 * Replaces prior `mountDocTables` + `mountUsageIfNeeded` pair.
 */
export function mountDocPage(page: HTMLElement, pageId: string): void {
  page.querySelector('.doc-tables')?.remove();
  page.querySelectorAll('.doc-narrative, .doc-usage[data-auto-mount]').forEach((n) => n.remove());

  const sections = DOC_SECTIONS[pageId];
  const frag = document.createDocumentFragment();

  /* Usage — after demos, before Specs (template order) */
  if (!page.querySelector('.doc-usage')) {
    const snip = USAGE_BY_PAGE[pageId];
    if (snip) {
      const usage = createUsageSection(snip);
      usage.dataset.autoMount = '';
      frag.append(usage);
    }
  }

  const host = document.createElement('div');
  host.className = 'doc-tables';

  if (sections) {
    const theming = tableSection(
      'theming',
      sections.theming,
      'Token, Default, Description',
      'Theming',
    );
    const keyboard = tableSection('keyboard', sections.keyboard, 'Key, Action', 'Keyboard');
    const focus = proseSection('focus', sections.focus);
    const motion = tableSection(
      'motion',
      sections.motion,
      'Interaction, Effect, Reduced motion',
      'Motion',
    );
    const a11y = proseSection('a11y', sections.a11y);
    const versions = proseSection('versions', sections.versions);
    for (const el of [theming, keyboard, focus, motion, a11y, versions]) {
      if (el) host.append(el);
    }
  }

  for (const s of docTablesForPage(pageId)) {
    if (s.id === 'theming' || s.id === 'keyboard' || s.id === 'motion') {
      if (host.querySelector(`[data-doc-table="${s.id}"]`)) continue;
    }
    host.append(createDocTable(s));
  }

  if (host.childElementCount) frag.append(host);
  if (frag.childNodes.length) page.appendChild(frag);
}

export { isDocTableNa };
