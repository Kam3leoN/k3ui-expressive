/* Critical CSS stays in the entry → emitted as the render-blocking stylesheet. */
import '../src/fonts/fonts-ui.css';
import './icons.css';
import '../src/styles/k3ui.scss';
/* Companion UX FOUC placeholders (charts, sticky audio) — sibling package. */
import '../../k3ux/src/styles/k3ux.scss';
/* Holo foils (GPL-3.0 add-on) load with the Card holographic page — app.ts */

/*
 * k3ux peer-imports `k3ui` (aliased to src/index). Mark MANUAL before the app
 * chunk loads so index autoBootstrap does not race the playground init().
 */
(window as Window & { K3UI_MANUAL?: boolean }).K3UI_MANUAL = true;

/*
 * First paint is the boot loader (html[data-k3-booting]). Start the app right
 * after that frame so modules load under the veil — never wait for hero LCP.
 */
let started = false;
const start = (): void => {
  if (started) return;
  started = true;
  void import('./app.js');
};
if (document.visibilityState === 'hidden') {
  start();
} else {
  requestAnimationFrame(() => setTimeout(start, 0));
}
