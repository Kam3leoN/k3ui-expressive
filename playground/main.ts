/* Critical CSS stays in the entry → emitted as the render-blocking stylesheet. */
import '../src/fonts/fonts-ui.css';
import './icons.css';
import '../src/styles/k3ui.scss';
/* Optional holo foils for k3-holo-card (GPL-3.0 add-on, outside k3ui.js) */
import '../addons/holo-effects/holo-effects.scss';

/*
 * Paint the static page first, then boot the app. The hero and catalog intro are
 * final HTML (default locale prerendered at build), so LCP never waits for the
 * app bundle, which is requested right after that first frame.
 */
const start = (): void => {
  void import('./app.js');
};
if (document.visibilityState === 'hidden') start();
else requestAnimationFrame(() => setTimeout(start, 0));
