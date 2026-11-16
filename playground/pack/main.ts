/**
 * Standalone entry kept for Vite MPA input — immediately redirects to the
 * shell page (`#/pack`). Prefer opening `/#/pack` directly.
 */
const u = new URL(location.href);
let components = u.searchParams.get('components');
if (!components && /components=/i.test(u.hash)) {
  components = new URLSearchParams(u.hash.replace(/^#/, '')).get('components');
}
const next = new URL('/', u.origin);
if (u.searchParams.get('product') === 'k3ux') next.searchParams.set('product', 'k3ux');
if (components) next.searchParams.set('components', components);
next.hash = '#/pack';
location.replace(next.pathname + next.search + next.hash);
