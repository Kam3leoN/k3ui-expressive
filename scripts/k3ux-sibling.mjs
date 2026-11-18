import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Monorepo root (k3ui package). */
export const K3UI_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Optional companion checkout: sibling `../k3ux` of the k3ui repo. */
export const K3UX_ROOT = resolve(K3UI_ROOT, '../k3ux');

export const HAS_K3UX = existsSync(K3UX_ROOT);

export const K3UX_SRC = resolve(K3UX_ROOT, 'src');
export const K3UX_LAZY_DIST = resolve(K3UX_ROOT, 'dist/lazy');
export const K3UX_CSS = resolve(K3UX_ROOT, 'dist/k3ux.css');
export const K3UX_HOLO_SCSS = resolve(K3UX_ROOT, 'addons/holo-effects/holo-effects.scss');
export const K3UX_STYLES_SCSS = resolve(K3UX_SRC, 'styles/k3ux.scss');