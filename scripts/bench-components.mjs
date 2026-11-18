/**
 * Component bundle sizes + Playwright Chromium runtime benchmarks.
 * Writes docs/bench/latest.json and prints a markdown table to stdout.
 *
 * Usage:
 *   node scripts/bench-components.mjs
 *   node scripts/bench-components.mjs --bundle-only
 *   node scripts/bench-components.mjs --throttle 4
 */
import esbuild from 'esbuild';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { minifyCssInJs } from './pack-minify.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const benchDir = path.join(root, 'docs/bench');
const bundleDir = path.join(benchDir, 'bundles');
const cssPath = path.join(root, 'dist/k3ui.css');

const PASSES = 7;

/** Primary paths; resolved again at runtime if missing. */
const ENTRY_CANDIDATES = {
  button: ['src/components/actions/button.ts'],
  checkbox: ['src/components/inputs/checkbox.ts'],
  'text-field': ['src/components/inputs/text-field.ts'],
  list: ['src/components/containment/list.ts'],
  dialog: ['src/components/containment/dialog.ts'],
  'date-picker': ['src/components/pickers/date-picker.ts'],
  index: ['src/index.ts'],
};

const COMPONENT_FILE_ALIASES = {
  button: 'button',
  checkbox: 'checkbox',
  'text-field': 'text-field',
  list: 'list',
  dialog: 'dialog',
  'date-picker': 'date-picker',
};

/**
 * Walk src/components for `<name>.ts` when the declared path is absent.
 * @param {string} fileBase e.g. `text-field`
 * @returns {string | undefined} path relative to repo root
 */
function findUnderComponents(fileBase) {
  const base = path.join(root, 'src/components');
  if (!fs.existsSync(base)) return undefined;
  /** @type {string | undefined} */
  let found;
  const walk = (dir) => {
    if (found) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (name === `${fileBase}.ts`) {
        found = path.relative(root, full).replace(/\\/g, '/');
        return;
      }
    }
  };
  walk(base);
  return found;
}

/**
 * @param {string} entryName
 * @returns {{ main: string, extraImports?: string[] }}
 */
function resolveEntry(entryName) {
  const candidates = ENTRY_CANDIDATES[entryName] ?? [];
  let main = candidates.find((rel) => fs.existsSync(path.join(root, rel)));
  if (!main) {
    const alias = COMPONENT_FILE_ALIASES[entryName] ?? entryName;
    main = findUnderComponents(alias);
  }
  if (!main) {
    throw new Error(`No entry file for "${entryName}" under src/components`);
  }
  if (entryName === 'list') {
    const item =
      findUnderComponents('list-item') ?? 'src/components/containment/list-item.ts';
    if (!fs.existsSync(path.join(root, item))) {
      throw new Error('list-item.ts not found for list bench bundle');
    }
    return { main, extraImports: [item] };
  }
  return { main };
}

/** @returns {string} absolute path to a one-off virtual entry file */
function writeVirtualEntry(entryName, { main, extraImports = [] }) {
  const file = path.join(benchDir, `.entry-${entryName}.mjs`);
  const relImport = (relToRoot) => {
    const abs = path.join(root, relToRoot);
    let rel = path.relative(path.dirname(file), abs);
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return rel.replace(/\\/g, '/');
  };
  /*
   * Bare `import './ce.ts'` is dropped when package.json `sideEffects` omits
   * `src/**` (esbuild treats those modules as pure). Keep a live binding so
   * the module evaluates and `customElements.define` runs.
   */
  const lines = [main, ...extraImports].map(
    (rel, i) => `import * as __bench${i} from '${relImport(rel)}';\nglobalThis.__k3BenchKeep${i} = __bench${i};`,
  );
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
  return file;
}

/** Strip `.scss` / `.scss?inline` and the global stylesheet (CSS ships as dist/k3ui.css). */
function scssEmptyPlugin() {
  return {
    name: 'bench-scss-empty',
    setup(build) {
      build.onResolve({ filter: /\.scss([?#].*)?$/ }, (args) => ({
        path: args.path.split(/[?#]/)[0] ?? args.path,
        namespace: 'empty-scss',
      }));
      build.onLoad({ filter: /.*/, namespace: 'empty-scss' }, () => ({
        contents: 'export default "";',
        loader: 'js',
      }));
    },
  };
}

/** Post-process bundled JS — crush Lit css`…` bodies (esbuild leaves them readable). */
function densifyJsPlugin() {
  return {
    name: 'bench-css-template-densify',
    setup(build) {
      build.onEnd((result) => {
        if (result.outputFiles) {
          for (const file of result.outputFiles) {
            const next = minifyCssInJs(file.text);
            file.contents = Buffer.from(next, 'utf8');
          }
        }
      });
    },
  };
}

const ESBUILD_SHARED = {
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  write: false,
  define: {
    __K3UI_LIB__: 'true',
    'import.meta.env': JSON.stringify({ DEV: false }),
  },
  tsconfigRaw: {
    compilerOptions: {
      experimentalDecorators: true,
      useDefineForClassFields: false,
    },
  },
  alias: {
    '@k3ui': path.join(root, 'src'),
  },
  plugins: [scssEmptyPlugin(), densifyJsPlugin()],
};

/**
 * @param {string} entryName
 * @returns {{ minBytes: number, gzip: number, brotli: number, path: string }}
 */
async function buildOneBundle(entryName) {
  const resolved = resolveEntry(entryName);
  const entryAbs = writeVirtualEntry(entryName, resolved);
  const outFile = path.join(bundleDir, `${entryName}.js`);
  const result = await esbuild.build({
    ...ESBUILD_SHARED,
    entryPoints: [entryAbs],
    outfile: outFile,
  });
  const raw = result.outputFiles?.[0]?.text ?? '';
  const code = raw || fs.readFileSync(outFile, 'utf8');
  const final = minifyCssInJs(code);
  fs.writeFileSync(outFile, final);
  const buf = Buffer.from(final, 'utf8');
  const sizes = {
    minBytes: buf.length,
    gzip: zlib.gzipSync(buf).length,
    brotli: zlib.brotliCompressSync(buf).length,
    path: path.relative(root, outFile).replace(/\\/g, '/'),
  };
  console.log(
    `bundle ${entryName}: ${sizes.minBytes} B min, ${sizes.gzip} B gzip, ${sizes.brotli} B brotli`,
  );
  return sizes;
}

function parseArgs(argv) {
  let bundleOnly = false;
  let throttle = 1;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bundle-only') bundleOnly = true;
    else if (a === '--throttle') {
      throttle = Number(argv[++i]);
      if (!Number.isFinite(throttle) || throttle < 1) {
        throw new Error('--throttle needs a number >= 1');
      }
    } else if (a.startsWith('--')) throw new Error(`Unknown option: ${a}`);
  }
  return { bundleOnly, throttle };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Bench HTML + DOM update hooks per entry.
 * @type {Record<string, { count: number, html: (n: number) => string, update: string }>}
 */
const SCENARIOS = {
  button: {
    tag: 'k3-button',
    count: 1000,
    html: (n) =>
      Array.from(
        { length: n },
        () => '<k3-button>Btn</k3-button>',
      ).join(''),
    update: `els.forEach((el) => { el.disabled = !el.disabled; });`,
  },
  checkbox: {
    tag: 'k3-checkbox',
    count: 1000,
    html: (n) =>
      Array.from({ length: n }, (_, i) => `<k3-checkbox name="c${i}"></k3-checkbox>`).join(
        '',
      ),
    update: `els.forEach((el) => { el.checked = !el.checked; });`,
  },
  'text-field': {
    tag: 'k3-text-field',
    count: 300,
    html: (n) =>
      Array.from(
        { length: n },
        (_, i) => `<k3-text-field label="L" value="v${i}"></k3-text-field>`,
      ).join(''),
    update: `els.forEach((el, i) => { el.value = 'u' + i; });`,
  },
  list: {
    tag: 'k3-list',
    count: 500,
    html: (n) => {
      const items = Array.from(
        { length: n },
        (_, i) =>
          `<k3-list-item value="${i}"><span slot="headline">Item ${i}</span></k3-list-item>`,
      ).join('');
      return `<k3-list selection="multiple">${items}</k3-list>`;
    },
    update: `els.forEach((el) => { el.selected = !el.selected; });`,
    /** Update targets list items inside a single list. */
    updateSelector: 'k3-list-item',
  },
  dialog: {
    tag: 'k3-dialog',
    count: 100,
    html: (n) =>
      Array.from({ length: n }, (_, i) => `<k3-dialog>Dialog ${i}</k3-dialog>`).join(''),
    update: `els.forEach((el) => { el.open = !el.open; });`,
  },
  'date-picker': {
    tag: 'k3-date-picker',
    count: 100,
    html: (n) =>
      Array.from(
        { length: n },
        (_, i) => `<k3-date-picker value="2024-01-${String((i % 28) + 1).padStart(2, '0')}"></k3-date-picker>`,
      ).join(''),
    update:
      "els.forEach((el, i) => { el.value = '2024-06-' + String((i % 28) + 1).padStart(2, '0'); });",
  },
  index: {
    tag: 'k3-coverflow',
    count: 20,
    html: (n) =>
      Array.from({ length: n }, (_, i) => `<k3-coverflow label="C${i}"></k3-coverflow>`).join(
        '',
      ),
    update: 'els.forEach((el, i) => { el.index = (el.index ?? 0) + 1 + i; });',
  },
};

/**
 * Minimal static server so Chromium can `import()` ESM bundles over HTTP.
 * @returns {Promise<{ close: () => Promise<void>, baseUrl: string }>}
 */
function startStaticServer() {
  const mime = {
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
  };
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1');
        const rel = decodeURIComponent(url.pathname).replace(/^\//, '');
        const file = path.join(root, rel);
        if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        const ext = path.extname(file);
        res.setHeader('Content-Type', mime[ext] ?? 'application/octet-stream');
        res.end(fs.readFileSync(file));
      } catch (err) {
        res.statusCode = 500;
        res.end(String(err));
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((done) => {
            server.close(() => done());
          }),
      });
    });
  });
}

/**
 * @param {string} entryName
 * @param {string} baseUrl
 * @param {number} throttle
 */
async function measureRuntime(entryName, baseUrl, throttle) {
  const scenario = SCENARIOS[entryName];
  if (!scenario) return null;

  const cssHref = fs.existsSync(cssPath) ? '../../dist/k3ui.css' : null;
  if (!cssHref) {
    console.warn('Warning: dist/k3ui.css missing — runtime CSS skipped');
  }
  const harnessFile = path.join(benchDir, `harness-${entryName}.html`);
  fs.writeFileSync(
    harnessFile,
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
${cssHref ? `<link rel="stylesheet" href="${cssHref}"/>` : ''}
<script type="module" src="./bundles/${entryName}.js"></script>
</head>
<body></body>
</html>
`,
  );
  const harnessUrl = `${baseUrl}/docs/bench/harness-${entryName}.html`;

  const browser = await chromium.launch({
    headless: true,
    args: ['--js-flags=--expose-gc'],
  });

  const passes = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', (err) => console.warn(`[${entryName}] pageerror:`, err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.warn(`[${entryName}] console:`, msg.text());
    });
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    if (throttle > 1) {
      await client.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    }

    for (let pass = 0; pass < PASSES; pass++) {
      await page.goto(harnessUrl, { waitUntil: 'networkidle', timeout: 120_000 });
      await page.waitForFunction(
        (tag) => !!customElements.get(tag),
        scenario.tag,
        { timeout: 120_000 },
      );

      const passResult = await page.evaluate(
        async ({ html, updateSource, updateSelector }) => {
          const root = document.createElement('div');
          root.id = 'bench-root';
          document.body.appendChild(root);

          const allWithUpdate = () =>
            [...root.querySelectorAll('*')].filter(
              (el) => typeof el.updateComplete !== 'undefined',
            );

          const updateTargets = () => {
            const scope = updateSelector
              ? root.querySelectorAll(updateSelector)
              : root.querySelectorAll('*');
            return [...scope].filter(
              (el) => typeof el.updateComplete !== 'undefined',
            );
          };

          const waitFrame = () =>
            new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

          const tRender = performance.now();
          root.innerHTML = html;
          const allEls = allWithUpdate();
          await Promise.all(allEls.map((el) => el.updateComplete));
          await waitFrame();
          const renderMs = performance.now() - tRender;

          const tUpdate = performance.now();
          const els = updateTargets();
          // eslint-disable-next-line no-eval
          const runUpdate = new Function('els', updateSource);
          runUpdate(els);
          await Promise.all(allWithUpdate().map((el) => el.updateComplete));
          await waitFrame();
          const updateMs = performance.now() - tUpdate;

          const tRemove = performance.now();
          root.innerHTML = '';
          await waitFrame();
          const removeMs = performance.now() - tRemove;

          return { renderMs, updateMs, removeMs };
        },
        {
          html: scenario.html(scenario.count),
          updateSource: scenario.update,
          updateSelector: scenario.updateSelector ?? null,
        },
      );

      if (typeof globalThis.gc === 'function') {
        await page.evaluate(() => globalThis.gc());
      } else {
        await page.evaluate(() => {
          if (typeof window.gc === 'function') window.gc();
        });
      }

      const { metrics } = await client.send('Performance.getMetrics');
      const byName = Object.fromEntries(metrics.map((m) => [m.name, m.value]));
      passes.push({
        ...passResult,
        cdp: {
          JSHeapUsedSize: byName.JSHeapUsedSize ?? null,
          Nodes: byName.Nodes ?? null,
          RecalcStyleDuration: byName.RecalcStyleDuration ?? null,
          LayoutDuration: byName.LayoutDuration ?? null,
          ScriptDuration: byName.ScriptDuration ?? null,
        },
      });

      await page.goto('about:blank');
    }
  } finally {
    await browser.close();
  }

  const summarize = (key) => median(passes.map((p) => p[key]));
  const cdpKeys = [
    'JSHeapUsedSize',
    'Nodes',
    'RecalcStyleDuration',
    'LayoutDuration',
    'ScriptDuration',
  ];
  const cdpMedian = Object.fromEntries(
    cdpKeys.map((k) => [k, median(passes.map((p) => p.cdp[k] ?? 0))]),
  );

  return {
    passes: PASSES,
    render: { medianMs: summarize('renderMs') },
    update: { medianMs: summarize('updateMs') },
    remove: { medianMs: summarize('removeMs') },
    cdp: cdpMedian,
  };
}

/**
 * @param {Record<string, unknown>} report
 */
function printMarkdownTable(report) {
  const rows = Object.keys(ENTRY_CANDIDATES);
  console.log('');
  console.log('| Entry | min (B) | gzip | brotli | render ms | update ms | remove ms | heap (B) | nodes |');
  console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const name of rows) {
    const b = report.bundles[name];
    const r = report.runtime?.[name];
    if (!b) continue;
    const heap = r?.cdp?.JSHeapUsedSize;
    const nodes = r?.cdp?.Nodes;
    console.log(
      `| ${name} | ${b.minBytes} | ${b.gzip} | ${b.brotli} | ${
        r ? r.render.medianMs.toFixed(2) : '—'
      } | ${r ? r.update.medianMs.toFixed(2) : '—'} | ${
        r ? r.remove.medianMs.toFixed(2) : '—'
      } | ${heap != null ? Math.round(heap) : '—'} | ${nodes != null ? Math.round(nodes) : '—'} |`,
    );
  }
}

async function main() {
  const { bundleOnly, throttle } = parseArgs(process.argv.slice(2));
  fs.mkdirSync(bundleDir, { recursive: true });

  const resolvedPaths = {};
  for (const name of Object.keys(ENTRY_CANDIDATES)) {
    resolvedPaths[name] = resolveEntry(name);
  }

  const bundles = {};
  for (const name of Object.keys(ENTRY_CANDIDATES)) {
    bundles[name] = await buildOneBundle(name);
  }

  /** @type {Record<string, unknown>} */
  const report = {
    timestamp: new Date().toISOString(),
    throttle,
    entryPaths: Object.fromEntries(
      Object.entries(resolvedPaths).map(([k, v]) => [
        k,
        {
          main: v.main,
          extra: v.extraImports ?? [],
        },
      ]),
    ),
    bundles,
    runtime: {},
  };

  if (!bundleOnly) {
    const server = await startStaticServer();
    try {
      for (const name of Object.keys(ENTRY_CANDIDATES)) {
        console.log(`runtime ${name} (${PASSES} passes, throttle ${throttle})…`);
        report.runtime[name] = await measureRuntime(name, server.baseUrl, throttle);
      }
    } finally {
      await server.close();
    }
  }

  const outJson = path.join(benchDir, 'latest.json');
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${path.relative(root, outJson)}`);
  printMarkdownTable(report);

  console.log('');
  console.log('Resolved component entry paths:');
  for (const [name, v] of Object.entries(resolvedPaths)) {
    const extra = v.extraImports?.length ? ` (+ ${v.extraImports.join(', ')})` : '';
    console.log(`  ${name}: ${v.main}${extra}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});