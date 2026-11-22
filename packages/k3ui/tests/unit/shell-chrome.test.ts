import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mountShellChrome } from '../../playground/shell-chrome.js';

describe('shell chrome (Poster clock + hero word-cycle)', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('index.html ships shell clock + hero word-cycle markup', () => {
    const html = readFileSync(resolve(__dirname, '../../playground/index.html'), 'utf8');
    expect(html).toContain('id="shell-poster-clock"');
    expect(html).toContain('data-clock-hours');
    expect(html).toContain('data-words="Expressive Design|Goey Animation|35 Shapes|Material You|Multi Component|100% Gratuit"');
    expect(html).toContain('word-cycle__pill');
  });

  it('playground.css uses Barlow face + Lucid scale for the shell clock', () => {
    const css = readFileSync(resolve(__dirname, '../../playground/playground.css'), 'utf8');
    expect(css).toContain("font-family: 'Barlow'");
    expect(css).toContain("url('./fonts/Barlow-Regular.ttf')");
    expect(css).not.toContain("font-family: 'Lucid Poster'");
    expect(css).toContain('clamp(4rem, 9vw, 7rem)');
    expect(css).toContain('line-height: 0.8');
    expect(css).toMatch(/\.shell-poster-clock \.poster-clock__date\s*\{\s*display:\s*none/);
  });

  it('mountShellChrome starts the clock and word cycle when DOM is present', () => {
    document.body.innerHTML = `
      <figure class="poster-clock" id="shell-poster-clock">
        <time data-clock-time>
          <span data-clock-hours></span>
          <span data-clock-minutes></span>
        </time>
        <figcaption data-clock-date></figcaption>
      </figure>
      <h1 id="home-hero-title">
        <span class="hero-title__accent word-cycle__pill"
          data-words="Expressive Design|100% Gratuit">100% Gratuit</span>
      </h1>
    `;
    expect(() => mountShellChrome()).not.toThrow();
    expect(document.querySelector('[data-clock-hours]')?.textContent?.length).toBeGreaterThan(0);
    expect(
      document.querySelector('#home-hero-title .word-cycle__word:not(.word-cycle__measure)')
        ?.textContent,
    ).toBe('100% Gratuit');
  });
});
