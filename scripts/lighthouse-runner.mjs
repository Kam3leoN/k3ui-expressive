/**
 * Lighthouse (Chromium) runner shared by `npm run lighthouse` and the
 * playground dev / preview server (`/__k3-lighthouse/*`, live audits).
 *
 * Lighthouse is not a dependency of K3UI: it is taken from the project when
 * installed, from `LIGHTHOUSE_BIN` (path to `lighthouse/cli/index.js`), or
 * fetched once by `npm exec`. Chrome / Chromium is found by chrome-launcher;
 * `CHROME_PATH` points it at a given binary.
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { CATEGORIES, FORM_FACTORS, LIGHTHOUSE_VERSION, summarize } from './lighthouse-summary.mjs';

export { CATEGORIES, FORM_FACTORS, LIGHTHOUSE_VERSION, summarize };

/** How to start the Lighthouse CLI: [command, leading args]. */
function lighthouseCommand() {
  if (process.env.LIGHTHOUSE_BIN) return [process.execPath, [process.env.LIGHTHOUSE_BIN]];
  try {
    const require = createRequire(path.join(process.cwd(), 'package.json'));
    return [process.execPath, [require.resolve('lighthouse/cli/index.js')]];
  } catch {
    /* not installed in the project */
  }
  const pkg = `--package=lighthouse@${LIGHTHOUSE_VERSION}`;
  if (process.env.npm_execpath) {
    return [process.execPath, [process.env.npm_execpath, 'exec', '--yes', pkg, '--', 'lighthouse']];
  }
  return [process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', pkg, '--', 'lighthouse']];
}

/**
 * Audit `url` with Lighthouse in headless Chromium.
 * @param {string} url
 * @param {'desktop' | 'mobile'} formFactor
 * @returns {Promise<{ summary: ReturnType<typeof summarize>, html: string, lhr: object }>}
 */
export async function runLighthouse(url, formFactor = 'desktop') {
  if (!FORM_FACTORS.includes(formFactor)) throw new Error(`unknown form factor "${formFactor}"`);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'k3-lighthouse-'));
  const out = path.join(dir, 'report');
  const [cmd, lead] = lighthouseCommand();
  const args = [
    ...lead,
    url,
    '--output=json',
    '--output=html',
    `--output-path=${out}`,
    `--only-categories=${CATEGORIES.join(',')}`,
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
    '--quiet',
    /* Lighthouse 12: mobile is the default form factor; desktop has a preset */
    ...(formFactor === 'desktop' ? ['--preset=desktop'] : []),
  ];
  try {
    await new Promise((resolve, reject) => {
      /* npx.cmd needs a shell on Windows — quote the arguments for it */
      const shell = cmd.endsWith('.cmd');
      const child = spawn(cmd, shell ? args.map((a) => `"${a}"`) : args, { stdio: ['ignore', 'ignore', 'pipe'], shell });
      let err = '';
      child.stderr.on('data', (d) => {
        err = (err + d).slice(-4000);
      });
      child.on('error', reject);
      child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`lighthouse exited with ${code}\n${err}`))));
    });
    const lhr = JSON.parse(await fs.readFile(`${out}.report.json`, 'utf8'));
    const html = await fs.readFile(`${out}.report.html`, 'utf8');
    return { summary: summarize(lhr), html, lhr };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
