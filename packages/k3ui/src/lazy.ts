/*
 * On-demand entry (`k3ui/lazy` → dist/lazy/k3ui.js + one chunk per component).
 *
 * Same API as `k3ui` minus the exports that embed component code (shapes,
 * `K3Coverflow`, snackbar constants — import those from `k3ui/components/*`).
 * `init()` defaults to `components: 'auto'`: only the k3 elements found in the
 * page are fetched, now and whenever new ones are added to the DOM.
 */
import { setDefaultComponents } from './bootstrap/init.js';
import { bootstrapGlobal } from './base.js';

export * from './base.js';

setDefaultComponents('auto');
bootstrapGlobal();
