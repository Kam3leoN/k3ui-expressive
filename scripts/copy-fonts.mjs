/**
 * Copy self-hosted font faces next to the lib build (not inlined in k3ui.css).
 * Consumers: import 'k3ui/fonts-ui.css' or 'k3ui/fonts.css'.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src', 'fonts');
const dest = path.join(root, 'dist', 'fonts');

function copyRecursive(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, ent.name);
    const d = path.join(to, ent.name);
    if (ent.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(src)) {
  console.error(`Missing ${src}`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
copyRecursive(src, dest);
console.log(`Fonts copied → dist/fonts`);
