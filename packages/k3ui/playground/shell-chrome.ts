/**
 * Persistent shell chrome from lucid-clock-m3: Poster clock under the app bar,
 * and the home hero word-cycle title.
 */
import { PosterClock } from './poster-clock.js';
import { WordCycle } from './word-cycle.js';

let clock: PosterClock | undefined;
let cycle: WordCycle | undefined;

/** Mount once after shell DOM is ready. */
export function mountShellChrome(): void {
  const clockRoot = document.getElementById('shell-poster-clock');
  if (clockRoot && !clock) {
    const locale =
      document.documentElement.lang ||
      document.documentElement.getAttribute('data-k3-locale') ||
      undefined;
    clock = new PosterClock(clockRoot, { locale: locale || undefined });
    clock.start();
  }

  const pill = document.querySelector<HTMLElement>(
    '#home-hero-title .word-cycle__pill, #home-hero-title .hero-title__accent',
  );
  if (pill?.dataset.words && !cycle) {
    cycle = new WordCycle(pill);
    cycle.autoplay();
  }
}

/** Refresh clock locale when the playground language changes. */
export function remountShellPosterClock(locale?: string): void {
  const clockRoot = document.getElementById('shell-poster-clock');
  if (!clockRoot) return;
  clock?.stop();
  clock = new PosterClock(clockRoot, { locale });
  clock.start();
}
