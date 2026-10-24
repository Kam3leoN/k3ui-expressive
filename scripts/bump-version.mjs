import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('D:/K3ui');
const kind = process.argv[2] || 'patch';
const pkgPath = path.join(root, 'package.json');
const verPath = path.join(root, 'src/version.ts');
const changelogPath = path.join(root, 'CHANGELOG.md');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const [maj, min, pat] = pkg.version.split('.').map(Number);
let next = pkg.version;
if (kind === 'major') next = `${maj + 1}.0.0`;
else if (kind === 'minor') next = `${maj}.${min + 1}.0`;
else next = `${maj}.${min}.${pat + 1}`;

pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
fs.writeFileSync(verPath, `/** Semver package version — kept in sync by scripts/bump-version.mjs */\nexport const VERSION = '${next}';\n`);

let log = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '# Changelog\n\n';
const stub = `## [${next}] — ${new Date().toISOString().slice(0, 10)}\n\n### Changed\n\n- Version bump (${kind})\n\n`;
if (!log.includes(`## [${next}]`)) {
  log = log.replace('# Changelog\n\n', `# Changelog\n\n${stub}`);
  fs.writeFileSync(changelogPath, log);
}
console.log(`Bumped version → ${next}`);
