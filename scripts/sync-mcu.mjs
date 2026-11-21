#!/usr/bin/env node
/**
 * Vendor @material/material-color-utilities from GitHub typescript/
 * (npm 0.4.0 lacks Spec 2026 + SchemeCmf).
 *
 * Usage: node scripts/sync-mcu.mjs [commitSha]
 */
import { execSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = join(ROOT, 'vendor', 'material-color-utilities');
const REPO = 'https://github.com/material-foundation/material-color-utilities.git';
const COMMIT = process.argv[2] || 'dca2d34221e4a56f90e05ef3223481183ebd1d5d';

const tmp = mkdtempSync(join(tmpdir(), 'mcu-sync-'));
console.log(`[sync-mcu] clone ${COMMIT} → ${tmp}`);

function shouldCopy(absPath) {
  const n = absPath.replace(/\\/g, '/');
  if (n.includes('/node_modules/') || n.endsWith('/node_modules')) return false;
  if (n.includes('_test.')) return false;
  if (n.endsWith('.ts') && !n.endsWith('.d.ts')) return false;
  return true;
}

function copyTree(src, dest) {
  const st = statSync(src);
  if (st.isDirectory()) {
    mkdirSync(dest, { recursive: true });
    for (const name of readdirSync(src)) {
      copyTree(join(src, name), join(dest, name));
    }
    return;
  }
  if (!shouldCopy(src)) return;
  mkdirSync(resolve(dest, '..'), { recursive: true });
  cpSync(src, dest);
}

try {
  execSync(`git clone --filter=blob:none --sparse ${REPO} mcu`, {
    cwd: tmp,
    stdio: 'inherit',
  });
  const repoDir = join(tmp, 'mcu');
  execSync('git sparse-checkout set typescript', { cwd: repoDir, stdio: 'inherit' });
  execSync(`git fetch --depth 1 origin ${COMMIT}`, { cwd: repoDir, stdio: 'inherit' });
  execSync(`git checkout ${COMMIT}`, { cwd: repoDir, stdio: 'inherit' });

  const tsDir = join(repoDir, 'typescript');
  if (!existsSync(join(tsDir, 'package.json'))) {
    throw new Error('typescript/package.json missing after sparse checkout');
  }

  console.log('[sync-mcu] npm install + tsc');
  execSync('npm install --ignore-scripts --no-audit --no-fund', {
    cwd: tsDir,
    stdio: 'inherit',
  });
  execSync('npx tsc --pretty', { cwd: tsDir, stdio: 'inherit' });

  const spec = readFileSync(join(tsDir, 'dynamiccolor', 'color_spec.d.ts'), 'utf8');
  if (!spec.includes("'2026'")) {
    throw new Error('Built MCU does not export SpecVersion 2026');
  }
  if (!existsSync(join(tsDir, 'scheme', 'scheme_cmf.js'))) {
    throw new Error('scheme_cmf.js missing after build');
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const pkg = JSON.parse(readFileSync(join(tsDir, 'package.json'), 'utf8'));
  pkg.version = `${pkg.version}-git.${COMMIT.slice(0, 7)}`;
  pkg._mcuCommit = COMMIT;
  delete pkg.scripts;
  delete pkg.devDependencies;
  delete pkg.wireit;
  writeFileSync(join(OUT, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);

  for (const name of readdirSync(tsDir)) {
    if (name === 'node_modules' || name === 'package.json' || name === '.wireit') continue;
    if (name.endsWith('.ts') && !name.endsWith('.d.ts')) continue;
    copyTree(join(tsDir, name), join(OUT, name));
  }

  writeFileSync(join(OUT, 'MCU_COMMIT'), `${COMMIT}\nsynced ${new Date().toISOString()}\n`);
  console.log(`[sync-mcu] vendored → ${OUT}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
