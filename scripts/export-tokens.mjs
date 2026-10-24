import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('D:/K3ui');
const tokensDir = path.join(root, 'src/tokens');
const out = path.join(root, 'dist/tokens.json');

const files = ['_color.scss', '_type.scss', '_shape.scss', '_motion.scss'];
const vars = {};

for (const file of files) {
  const src = fs.readFileSync(path.join(tokensDir, file), 'utf8');
  for (const m of src.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    vars[`--${m[1]}`] = m[2].trim();
  }
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(
  out,
  JSON.stringify(
    {
      name: 'k3ui',
      version: JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version,
      tokens: vars,
    },
    null,
    2,
  ),
);
console.log(`Wrote ${Object.keys(vars).length} tokens → dist/tokens.json`);
