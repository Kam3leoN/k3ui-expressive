/* Critical CSS stays in the entry → emitted as the render-blocking stylesheet. */
import '../src/fonts/fonts-ui.css';
import './icons.css';
import '../src/styles/k3ui.scss';
/* Holo foils (GPL-3.0 add-on) load with the Card holographic page — app.ts */

/*
 * Paint the static page first, then boot the app. The hero and catalog intro are
 * final HTML (default locale prerendered at build), so LCP never waits for the
 * app bundle, which is requested right after that first frame.
 */
let started = false;
const start = (): void => {
  if (started) return;
  started = true;
  void import('./app.js');
};
const lcpObservable =
  typeof PerformanceObserver === 'function' &&
  PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint');
if (document.visibilityState === 'hidden') {
  start();
} else if (lcpObservable) {
  /* Request the app once the static page has actually painted its largest
     element — its download never competes with the first frame. */
  new PerformanceObserver((_list, observer) => {
    observer.disconnect();
    setTimeout(start, 0);
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  setTimeout(start, 3000); /* safety net — e.g. a page without contentful paint */
} else {
  requestAnimationFrame(() => setTimeout(start, 0));
}
