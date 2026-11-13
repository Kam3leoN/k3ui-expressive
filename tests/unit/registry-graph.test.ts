import { describe, expect, it } from 'vitest';
import { catalog } from '../../src/registry/catalog.js';
import { COMPONENT_DEPS } from '../../src/registry/deps.js';
import { parseArgs, resolvePack } from '../../scripts/build-pack.mjs';
import { filterCatalog, stripDocLocales } from '../../scripts/build-plugins.mjs';
import { closure, normalizeTag, readCatalog, readDeps } from '../../scripts/registry-graph.mjs';

type Hook = (this: unknown, code: string, id: string) => { code: string } | string | null;
const call = (hook: unknown, ...args: [string, string?]): ReturnType<Hook> =>
  (hook as (...a: unknown[]) => ReturnType<Hook>).call({}, ...args);

describe('registry graph (build scripts)', () => {
  it('reads the same catalog and dependencies as the runtime registry', () => {
    expect(readCatalog().map((c) => c.tag)).toEqual(catalog.map((c) => c.tag));
    expect(readDeps()).toEqual(COMPONENT_DEPS);
  });

  it('resolves dependencies transitively, in catalog order', () => {
    expect(closure(['k3-select'])).toEqual(['k3-text-field', 'k3-select', 'k3-menu', 'k3-menu-item']);
    /* date-picker → button → ripple, icon-button → ripple, calendar… */
    const picker = closure(['date-picker']);
    for (const tag of ['k3-date-picker', 'k3-calendar', 'k3-button', 'k3-ripple', 'k3-text-field']) {
      expect(picker).toContain(tag);
    }
    /* Cycle time-picker ↔ time-picker-toggle terminates */
    expect(closure(['k3-time-picker-toggle'])).toContain('k3-time-picker-dial');
  });

  it('every dependency closure only holds catalog tags', () => {
    const tags = new Set(catalog.map((c) => c.tag));
    for (const { tag } of catalog) {
      for (const dep of closure([tag])) expect(tags.has(dep), `${tag} → ${dep}`).toBe(true);
    }
  });

  it('normalises names and rejects unknown components', () => {
    expect(normalizeTag(' Select ')).toBe('k3-select');
    expect(normalizeTag('k3-dialog')).toBe('k3-dialog');
    expect(() => closure(['nope'])).toThrow('Unknown component: k3-nope');
    expect(() => closure(['__proto__'])).toThrow('Unknown component');
  });
});

describe('custom pack builder', () => {
  it('parses tags, options and comma lists', () => {
    expect(parseArgs(['select,dialog', 'k3-tabs', '--name', 'shop', '--out', 'build'])).toEqual({
      tags: ['k3-select', 'k3-dialog', 'k3-tabs'],
      name: 'shop',
      out: 'build',
      list: false,
    });
    expect(parseArgs(['--list']).list).toBe(true);
  });

  it('rejects unknown options and unsafe pack names', () => {
    expect(() => parseArgs(['--nope'])).toThrow('Unknown option');
    expect(() => parseArgs(['--name'])).toThrow('needs a value');
    expect(() => parseArgs(['select', '--name', '../evil'])).toThrow('Invalid pack name');
  });

  it('reports the children added to a selection', () => {
    const pack = resolvePack(['select', 'k3-select', 'dialog']);
    expect(pack.requested).toEqual(['k3-select', 'k3-dialog']);
    expect(pack.added.sort()).toEqual(['k3-button', 'k3-menu', 'k3-menu-item', 'k3-ripple', 'k3-text-field']);
    expect(pack.tags).toHaveLength(7);
  });

  it('filterCatalog keeps only the selected loaders', () => {
    const plugin = filterCatalog(['k3-select', 'k3-text-field']);
    const out = call(plugin.load, '/repo/src/registry/catalog.ts') as string;
    expect(out.match(/tag: '/g)).toHaveLength(2);
    expect(out).toContain("import('../components/inputs/select.js')");
    expect(out).not.toContain('dialog');
    expect(call(plugin.load, '/repo/src/registry/register.ts')).toBeNull();
    /* Windows paths */
    expect(call(plugin.load, 'D:\\K3ui\\src\\registry\\catalog.ts')).toContain('k3-select');
  });

  it('stripDocLocales drops documentation strings only', () => {
    const plugin = stripDocLocales();
    const json = JSON.stringify({
      'doc.button.title': 'x',
      'playground.search': 'x',
      'doc.colors.group.primary': 'Primary',
      'datepicker.ok': 'OK',
    });
    const out = call(plugin.transform, json, '/repo/src/i18n/locales/fr.json') as { code: string };
    expect(JSON.parse(out.code)).toEqual({ 'doc.colors.group.primary': 'Primary', 'datepicker.ok': 'OK' });
    expect(call(plugin.transform, json, '/repo/package.json')).toBeNull();
  });
});
