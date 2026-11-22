import { describe, expect, it } from 'vitest';
import { resolveChunk } from '../../playground/pack/bundle.js';
import {
  compactTemplateBody,
  compactTemplatesInJs,
  cssInjectPreamble,
  densifyPackJs,
  embedCssIntoPack,
  looksLikeCssTemplate,
  minifyCss,
  minifyCssInJs,
  minifyCssWithInterpolations,
  packToOneLine,
} from '../../scripts/pack-minify.mjs';
import {
  cliCommand,
  excludedChunks,
  formatHash,
  formatKb,
  isManifest,
  normalizeTag,
  ownSize,
  packHeader,
  packKindLabel,
  parseHash,
  resolveSelection,
  totals,
  type Manifest,
} from '../../playground/pack/model.js';
import { packHeader as cliPackHeader, packKindLabel as cliPackKindLabel } from '../../scripts/build-plugins.mjs';

const component = (group: string, chunk: string, requires: string[] = [], shared: string[] = []) => ({
  file: `components/${chunk}.js`,
  group,
  chunk: `chunks/${chunk}.js`,
  shared,
  deps: requires,
  requires,
  gzip: 0,
});

const manifest: Manifest = {
  version: '1.2.7',
  base: { file: 'k3ui.js', pack: 'pack.js', gzip: 90_000, files: ['chunks/base.js'] },
  components: {
    'k3-button': component('actions', 'button', ['k3-ripple'], ['chunks/kit.js']),
    'k3-ripple': component('actions', 'ripple'),
    'k3-text-field': component('inputs', 'text-field', [], ['chunks/kit.js']),
    'k3-select': component('inputs', 'select', ['k3-text-field', 'k3-menu'], ['chunks/kit.js', 'chunks/menu-edges.js']),
    'k3-menu': component('containment', 'menu', [], ['chunks/menu-edges.js']),
    'k3-dialog': component('containment', 'dialog', ['k3-button', 'k3-ripple']),
  },
  files: {
    'chunks/base.js': { gzip: 90_000, size: 300_000 },
    'chunks/kit.js': { gzip: 3000, size: 9000 },
    'chunks/menu-edges.js': { gzip: 500, size: 1500 },
    'chunks/button.js': { gzip: 4000, size: 12_000 },
    'chunks/ripple.js': { gzip: 2000, size: 6000 },
    'chunks/text-field.js': { gzip: 9000, size: 30_000 },
    'chunks/select.js': { gzip: 3000, size: 10_000 },
    'chunks/menu.js': { gzip: 8000, size: 25_000 },
    'chunks/dialog.js': { gzip: 5000, size: 15_000 },
  },
};

describe('pack builder — selection', () => {
  it('reads and writes the URL hash (Prism style)', () => {
    expect(parseHash('#components=select+dialog', manifest)).toEqual(['k3-select', 'k3-dialog']);
    expect(parseHash('#components=k3-dialog,select%20button', manifest)).toEqual(['k3-button', 'k3-select', 'k3-dialog']);
    expect(parseHash('', manifest)).toEqual([]);
    expect(formatHash(['k3-select', 'k3-dialog'])).toBe('#components=select+dialog');
    expect(formatHash([])).toBe('');
    expect(parseHash(formatHash(['k3-button', 'k3-menu']), manifest)).toEqual(['k3-button', 'k3-menu']);
  });

  it('drops unknown or hostile names from the hash', () => {
    expect(parseHash('#components=select+nope+<script>+__proto__+constructor', manifest)).toEqual(['k3-select']);
    expect(normalizeTag('<img onerror=1>')).toBe('');
    expect(normalizeTag(' Select ')).toBe('k3-select');
  });

  it('adds dependencies and says who needs them', () => {
    const s = resolveSelection(manifest, ['k3-select', 'k3-dialog']);
    expect(s.explicit).toEqual(['k3-select', 'k3-dialog']);
    expect(s.included).toEqual(['k3-button', 'k3-ripple', 'k3-text-field', 'k3-select', 'k3-menu', 'k3-dialog']);
    expect(s.requiredBy.get('k3-text-field')).toEqual(['k3-select']);
    expect(s.requiredBy.get('k3-ripple')).toEqual(['k3-dialog']);
    expect(s.requiredBy.has('k3-select')).toBe(false);
  });

  it('a dependency that is also ticked is not locked; unticking the parent frees the rest', () => {
    const both = resolveSelection(manifest, ['k3-select', 'k3-menu']);
    expect(both.requiredBy.has('k3-menu')).toBe(false);
    expect(both.requiredBy.get('k3-text-field')).toEqual(['k3-select']);
    const after = resolveSelection(manifest, ['k3-menu']);
    expect(after.included).toEqual(['k3-menu']);
  });

  it('builds the CLI command of the same pack', () => {
    expect(cliCommand(['k3-select', 'k3-dialog'])).toBe('npm run build:pack -- select dialog');
  });
});

describe('pack builder — sizes', () => {
  it('counts every file once: base + components + shared = total (raw + gzip)', () => {
    const { included } = resolveSelection(manifest, ['k3-select']);
    const t = totals(manifest, included);
    expect(t.base).toEqual({ raw: 300_000, gzip: 90_000 });
    expect(t.components.gzip).toBe(9000 + 3000 + 8000);
    expect(t.components.raw).toBe(30_000 + 10_000 + 25_000);
    expect(t.shared.gzip).toBe(3000 + 500);
    expect(t.shared.raw).toBe(9000 + 1500);
    expect(t.total.gzip).toBe(t.base.gzip + t.components.gzip + t.shared.gzip);
    expect(t.total.raw).toBe(t.base.raw + t.components.raw + t.shared.raw);
    expect(t.everything.gzip).toBe(90_000 + 31_000 + 3500);
    expect(t.everythingCount).toBe(6);
    expect(t.count).toBe(included.length);
    expect(totals(manifest, []).total.gzip).toBe(90_000);
  });

  it('shows the own chunk on each row', () => {
    expect(ownSize(manifest, 'k3-select')).toBe(3000);
    expect(ownSize(manifest, 'k3-nope')).toBe(0);
    expect(formatKb(94_820, 'en')).toBe('92.6 kB');
    expect(formatKb(462_000, 'en')).toBe('451 kB');
  });

  it('validates the manifest it fetched', () => {
    expect(isManifest(manifest)).toBe(true);
    expect(isManifest(null)).toBe(false);
    expect(isManifest({ version: '1', base: {}, components: {}, files: {} })).toBe(false);
  });
});

describe('pack builder — bundling', () => {
  it('cuts the chunks of the components left out', () => {
    const { included } = resolveSelection(manifest, ['k3-select']);
    expect([...excludedChunks(manifest, included)].sort()).toEqual([
      'chunks/button.js',
      'chunks/dialog.js',
      'chunks/ripple.js',
    ]);
    expect(excludedChunks(manifest, Object.keys(manifest.components)).size).toBe(0);
  });

  it('resolves chunk imports inside the build folder only', () => {
    expect(resolveChunk('pack.js', undefined)).toBe('pack.js');
    expect(resolveChunk('./chunks/base.js', 'pack.js')).toBe('chunks/base.js');
    expect(resolveChunk('./kit.js', 'chunks/select.js')).toBe('chunks/kit.js');
    expect(resolveChunk('../k3ui.js', 'chunks/select.js')).toBe('k3ui.js');
    expect(resolveChunk('../../../../etc/passwd', 'chunks/select.js')).toBe('etc/passwd');
  });

  it('writes the same header as the CLI', () => {
    const info = {
      name: 'k3ui.pack',
      version: '1.2.7',
      components: ['k3-select', 'k3-menu'],
      builder: 'https://k3ui-expressive.vercel.app/',
    };
    expect(packHeader(info)).toEqual(cliPackHeader(info));
    expect(packHeader(info).banner).toContain('components=select+menu');
    expect(packHeader(info).banner).toContain('#/pack');
    expect(packHeader(info).banner).not.toContain('\n');
    expect(packHeader(info).banner).toContain('— pack "');
    expect(packKindLabel('k3ui.full')).toBe('AiO pack');
    expect(packKindLabel('k3ui.custom')).toBe('custom pack');
    expect(packKindLabel('shop')).toBe('pack');
    expect(cliPackKindLabel('k3ui.full')).toBe('AiO pack');
    expect(
      packHeader({ ...info, name: 'k3ui.full' }).banner,
    ).toContain('— AiO pack "k3ui.full"');
    expect(
      packHeader({ ...info, name: 'k3ui.custom' }).banner,
    ).toContain('— custom pack "k3ui.custom"');
  });

  it('minifies CSS and builds a style-inject preamble', () => {
    const raw = `/* theme */
    .k3-surface {
      color: red;
      padding: 8px;
    }`;
    expect(minifyCss(raw)).toBe('.k3-surface{color:red;padding:8px}');
    const inject = cssInjectPreamble('.k3-surface{color:red}');
    expect(inject).toContain('dataset.k3PackCss');
    expect(inject).toContain(JSON.stringify('.k3-surface{color:red}'));
    expect(inject).toMatch(/^!\(function\(\)\{/);
  });

  it('crushes Lit css template literals but leaves html alone', () => {
    const lit = [
      'const Hl = Z`',
      '  .k3-state-layer {',
      '    position: relative;',
      '  }',
      '',
      '  /* Focus carré — invisible */',
      '  .k3-state-layer:focus-visible {',
      '    outline: none;',
      '  }',
      '`;',
      'const t = html`<div class="x">${y}</div>`;',
      'const mixed = Z`.a{color:red}${other}.b{color:blue}`;',
    ].join('\n');
    expect(looksLikeCssTemplate('.k3-state-layer { position: relative; }')).toBe(true);
    expect(looksLikeCssTemplate('<div class="x"></div>')).toBe(false);
    expect(
      looksLikeCssTemplate(' in dark monochrome.\n  static tonePrefersLightForeground(e) { return x; }'),
    ).toBe(false);
    const out = minifyCssInJs(lit);
    expect(out).not.toContain('Focus carré');
    expect(out).toContain('.k3-state-layer{position:relative}');
    expect(out).toContain('.k3-state-layer:focus-visible{outline:none}');
    expect(out).toContain('html`<div class="x">${y}</div>`');
    expect(minifyCssWithInterpolations('.a{color:red}${other}.b{color:blue}')).toBe(
      '.a{color:red}${other}.b{color:blue}',
    );
    expect(out).toContain('.a{color:red}${other}.b{color:blue}');
  });

  it('compacts html templates and yields a one-line pack payload', () => {
    const html = 'const t = html`\n  <div class="x">\n    ${y}\n  </div>\n`;';
    expect(compactTemplateBody('\n  <div class="x">\n    ${y}\n  </div>\n')).toBe(
      '<div class="x">${y}</div>',
    );
    expect(compactTemplatesInJs(html)).toBe('const t = html`<div class="x">${y}</div>`;');
    expect(packToOneLine('a\nb\r\nc')).toBe('abc');
  });

  it('densify + embedCss share the same finalize path as the CLI', () => {
    const js = [
      '/*! K3UI 1.0.0 — pack "t" (1) https://x/#/pack */',
      'const Hl = Z`',
      '  .k3-state-layer { position: relative; }',
      '  /* Focus carré — invisible */',
      '`;',
      'const t = html`\n  <div>${y}</div>\n`;',
    ].join('\n');
    const densified = densifyPackJs(js);
    expect(densified).not.toContain('Focus carré');
    expect(densified).toContain('.k3-state-layer{position:relative}');
    expect(densified).toContain('html`<div>${y}</div>`');
    const out = embedCssIntoPack(densified, '/* x */\n.k3-surface { color: red; }');
    expect(out).not.toContain('\n');
    expect(out).toContain('dataset.k3PackCss');
    expect(out).toContain('.k3-surface{color:red}');
    expect(out.startsWith('/*! K3UI')).toBe(true);
  });

  it('crushes Focus carré out of the real lazy base chunk', async () => {
    const { readFileSync, existsSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const chunk = resolve(process.cwd(), 'dist/lazy/chunks');
    const { readdirSync } = await import('node:fs');
    if (!existsSync(chunk)) return;
    const base = readdirSync(chunk).find((f) => f.startsWith('base-') && f.endsWith('.js'));
    if (!base) return;
    const js = readFileSync(resolve(chunk, base), 'utf8');
    expect(js).toContain('Focus carré');
    const out = minifyCssInJs(js);
    expect(out).not.toContain('Focus carré');
    expect(out).toContain('.k3-state-layer{position:relative;');
    expect(out).not.toMatch(/\.k3-state-layer \{\s*\n/);
  });
});
