import { spawnSync } from 'node:child_process';
import { HAS_K3UX, K3UX_ROOT } from './k3ux-sibling.mjs';

if (HAS_K3UX) {
  const r = spawnSync('npm', ['--prefix', K3UX_ROOT, 'run', 'build:lazy'], {
    stdio: 'inherit',
    shell: true,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
} else {
  console.warn('[build:playground] ../k3ux not found — skipping k3ux lazy build (k3ui pack only).');
}