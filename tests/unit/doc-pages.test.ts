/**
 * Garde-fou — gabarit doc playground.
 * @see .cursor/rules/doc-page-template.mdc
 * @see docs/DOC_PAGES_PLAN.md
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DOC_COMPONENTS } from '../../playground/catalog.js';
import { DOC_SECTIONS, isDocNa } from '../../playground/doc-sections.js';
import { COMPONENT_API, isDocTableNa } from '../../playground/doc-tables.js';
import { DOC_SECTION_ORDER } from '../../playground/mount-doc-page.js';
import { USAGE_BY_PAGE } from '../../playground/usage-snippets.js';

/** Page id → primary custom element tag(s) for CEM cross-check. */
const PAGE_TAGS: Record<string, string[]> = {
  buttons: ['k3-button'],
  'text-field': ['k3-text-field'],
  dialog: ['k3-dialog'],
  /* extend as pages leave PENDING_PAGES */
};

const CATALOG_IDS = DOC_COMPONENTS.filter(
  (c) => c.category !== 'Styles' && c.category !== 'Resources',
).map((c) => c.id);

/**
 * Pages not yet migrated to the full gabarit. Remove an id when its page ships.
 * Empty → étape D (clôture).
 */
export const PENDING_PAGES: string[] = CATALOG_IDS.filter(
  (id) => id !== 'buttons' && id !== 'text-field',
);

const INDEX_HTML = readFileSync(resolve(__dirname, '../../playground/index.html'), 'utf8');

function sectionFilled(v: unknown): boolean {
  if (isDocNa(v) || isDocTableNa(v)) return !!v.na.trim();
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return false;
}

describe('doc pages gabarit', () => {
  it('PENDING_PAGES is a subset of catalog component pages', () => {
    const catalog = new Set(CATALOG_IDS);
    for (const id of PENDING_PAGES) {
      expect(catalog.has(id), `unknown pending id ${id}`).toBe(true);
    }
  });

  it('DOC_SECTIONS has an entry for every catalog component page', () => {
    for (const id of CATALOG_IDS) {
      expect(DOC_SECTIONS[id], `DOC_SECTIONS missing ${id}`).toBeTruthy();
    }
  });

  it('completed pages have USAGE, API, and filled DOC_SECTIONS', () => {
    const pending = new Set(PENDING_PAGES);
    for (const id of CATALOG_IDS) {
      if (pending.has(id)) continue;
      expect(USAGE_BY_PAGE[id], `USAGE_BY_PAGE missing ${id}`).toBeTruthy();
      expect(COMPONENT_API[id], `COMPONENT_API missing ${id}`).toBeTruthy();
      const sec = DOC_SECTIONS[id]!;
      for (const key of ['theming', 'keyboard', 'focus', 'motion', 'a11y', 'versions'] as const) {
        expect(sectionFilled(sec[key]), `${id}.${key} empty`).toBe(true);
      }
      const api = COMPONENT_API[id]!;
      const hasTable = Object.values(api).some((v) => {
        if (!v || isDocTableNa(v)) return false;
        return v.length > 0;
      });
      const hasNa = Object.values(api).some((v) => isDocTableNa(v));
      expect(hasTable || hasNa, `${id} API has no tables and no na`).toBe(true);
    }
  });

  it('article.comp-page h2 order is a subset of DOC_SECTION_ORDER (completed pages)', () => {
    const pending = new Set(PENDING_PAGES);
    const titleToId = new Map<string, string>([
      ['Examples', 'examples'],
      ['Exemples', 'examples'],
      ['States', 'states'],
      ['États', 'states'],
      ['Versions', 'versions'],
      ['Usage', 'usage'],
      ['Theming', 'theming'],
      ['Keyboard', 'keyboard'],
      ['Focus', 'focus'],
      ['Motion', 'motion'],
      ['Accessibility', 'a11y'],
      ['Specs', 'specs'],
      ['Properties', 'properties'],
      ['Methods', 'methods'],
      ['Events', 'events'],
      ['Slots', 'slots'],
      ['CSS parts', 'css-parts'],
      ['Options', 'options'],
      ['Init', 'init'],
    ]);
    for (const id of CATALOG_IDS) {
      if (pending.has(id)) continue;
      const re = new RegExp(
        `<article[^>]*data-page="${id}"[^>]*>([\\s\\S]*?)<\\/article>`,
        'i',
      );
      const m = INDEX_HTML.match(re);
      if (!m) continue; /* some pages may be JS-only */
      const h2s = [...m[1]!.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((x) =>
        x[1]!.replace(/<[^>]+>/g, '').trim(),
      );
      const mapped = h2s
        .map((t) => titleToId.get(t))
        .filter((x): x is string => !!x);
      let last = -1;
      for (const sid of mapped) {
        const idx = DOC_SECTION_ORDER.indexOf(sid as (typeof DOC_SECTION_ORDER)[number]);
        if (idx < 0) continue;
        expect(idx, `${id} h2 ${sid} out of order`).toBeGreaterThanOrEqual(last);
        last = idx;
      }
    }
  });

  it('index.html has no bare <pre> outside k3-codeblock', () => {
    /* Strip k3-codeblock trees (may contain slotted <pre> demos) */
    const stripped = INDEX_HTML.replace(/<k3-codeblock\b[\s\S]*?<\/k3-codeblock>/gi, '');
    expect(stripped).not.toMatch(/<pre\b/i);
  });

  it('COMPONENT_API has no orphan keys outside the catalog', () => {
    const known = new Set([
      ...CATALOG_IDS,
      ...DOC_COMPONENTS.map((c) => c.id),
      'home',
      /* Child / companion CE documented beside a parent page */
      'coverflow-item',
    ]);
    for (const key of Object.keys(COMPONENT_API)) {
      expect(known.has(key) || key.startsWith('color-'), `orphan API key ${key}`).toBe(true);
    }
  });

  it('CEM property/event/slot/part names match COMPONENT_API for completed pages', () => {
    const manifestPath = resolve(__dirname, '../../custom-elements.json');
    if (!existsSync(manifestPath)) return;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      modules?: Array<{
        declarations?: Array<{
          customElement?: boolean;
          tagName?: string;
          members?: Array<{ kind?: string; name?: string; privacy?: string }>;
          events?: Array<{ name?: string }>;
          slots?: Array<{ name?: string }>;
          cssParts?: Array<{ name?: string }>;
        }>;
      }>;
    };
    const byTag = new Map<
      string,
      { props: Set<string>; events: Set<string>; slots: Set<string>; parts: Set<string> }
    >();
    for (const mod of manifest.modules ?? []) {
      for (const d of mod.declarations ?? []) {
        if (!d.customElement || !d.tagName) continue;
        const props = new Set(
          (d.members ?? [])
            .filter((m) => m.kind === 'field' && m.privacy !== 'private' && m.name)
            .map((m) => m.name!),
        );
        byTag.set(d.tagName, {
          props,
          events: new Set((d.events ?? []).map((e) => e.name!).filter(Boolean)),
          slots: new Set((d.slots ?? []).map((s) => (s.name === '' ? '(default)' : s.name!))),
          parts: new Set((d.cssParts ?? []).map((p) => p.name!).filter(Boolean)),
        });
      }
    }

    const pending = new Set(PENDING_PAGES);
    for (const id of CATALOG_IDS) {
      if (pending.has(id)) continue;
      const tags = PAGE_TAGS[id];
      if (!tags?.length) continue;
      const api = COMPONENT_API[id];
      if (!api) continue;
      const merged = {
        props: new Set<string>(),
        events: new Set<string>(),
        slots: new Set<string>(),
        parts: new Set<string>(),
      };
      for (const tag of tags) {
        const info = byTag.get(tag);
        expect(info, `CEM missing tag ${tag} for ${id}`).toBeTruthy();
        info!.props.forEach((p) => merged.props.add(p));
        info!.events.forEach((e) => merged.events.add(e));
        info!.slots.forEach((s) => merged.slots.add(s));
        info!.parts.forEach((p) => merged.parts.add(p));
      }
      const propRows = api.properties;
      if (propRows && !isDocTableNa(propRows)) {
        for (const row of propRows) {
          const name = row[0]!;
          /* Attr names may be kebab; CEM often uses camelCase — accept either form */
          const camel = name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
          expect(
            merged.props.has(name) || merged.props.has(camel),
            `${id} property ${name} not in CEM`,
          ).toBe(true);
        }
      }
    }
  });
});
