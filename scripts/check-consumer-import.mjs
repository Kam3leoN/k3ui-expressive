/**
 * Consumer smoke test — run after `npm run build`.
 *
 * Bundles `import 'k3ui/components/<tag>'` for every published component the
 * way an application would (package resolved through node_modules, `exports`
 * map and `sideEffects` honoured — esbuild applies the same tree-shaking rules
 * as Rollup / Vite / webpack), then checks in the metafile that each
 * component's chunk (where `customElements.define` lives) survived.
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
let manifest;
try {
  manifest = JSON.parse(readFileSync(join(root, 'dist/lazy/components.json'), 'utf8'));
} catch {
  console.error('check:consumer — dist/lazy/components.json missing; run `npm run build` first');
  process.exit(1);
}
const pkgName = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name;
const components = Object.entries(manifest.components ?? {});

const app = mkdtempSync(join(tmpdir(), 'k3ui-consumer-'));
mkdirSync(join(app, 'node_modules'), { recursive: true });
/* 'junction' — no admin rights needed on Windows; ignored elsewhere.
   rmSync below removes the link itself, never the package behind it. */
symlinkSync(root, join(app, 'node_modules', pkgName), 'junction');

let failures = [];
let noDefine = false;
try {
  writeFileSync(
    join(app, 'app.js'),
    components.map(([tag]) => `import '${pkgName}/components/${tag}';`).join('\n'),
  );
  const out = await build({
    entryPoints: [join(app, 'app.js')],
    absWorkingDir: app,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    preserveSymlinks: true,
    write: false,
    metafile: true,
    logLevel: 'silent',
  });
  const inputs = Object.values(out.metafile.outputs)[0].inputs;
  const kept = (file) =>
    (inputs[`node_modules/${pkgName}/dist/lazy/${file}`.replace(/\\/g, '/')]?.bytesInOutput ?? 0) > 0;
  failures = components.filter(([, c]) => !kept(c.chunk)).map(([tag, c]) => `${tag} (${c.chunk})`);
  noDefine = !out.outputFiles[0].text.includes('customElements.define');
} finally {
  rmSync(app, { recursive: true, force: true });
}

if (failures.length || noDefine) {
  console.error(
    `check:consumer — ${failures.length}/${components.length} \`import '${pkgName}/components/<tag>'\` ` +
      'lose their custom element (check package.json#sideEffects):',
  );
  if (noDefine) console.error('  (the bundle contains no customElements.define at all)');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(
  `check:consumer — ${components.length}/${components.length} \`import '${pkgName}/components/<tag>'\` keep their element`,
);
