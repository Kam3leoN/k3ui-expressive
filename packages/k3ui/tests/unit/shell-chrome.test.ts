import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mountShellChrome } from '../../playground/shell-chrome.js';

describe('shell chrome (Poster clock + hero accent)', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('index.html ships shell clock + static expressive hero accent', () => {
    const html = readFileSync(resolve(__dirname, '../../playground/index.html'), 'utf8');
    const hero = html.slice(
      html.indexOf('id="home-hero-title"'),
      html.indexOf('</h1>', html.indexOf('id="home-hero-title"')) + 5,
    );
    expect(html).toContain('id="shell-poster-clock"');
    expect(html).toContain('data-clock-hours');
    expect(hero).toContain('class="hero-title__accent"');
    expect(hero).toContain('>expressive</span>');
    expect(hero).not.toContain('data-words=');
    expect(hero).not.toContain('Material You');
    expect(hero).not.toContain('word-cycle__pill');
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

  it('mountShellChrome starts the clock; static accent needs no word cycle', () => {
    document.body.innerHTML = `
      <figure class="poster-clock" id="shell-poster-clock">
        <time data-clock-time>
          <span data-clock-hours></span>
          <span data-clock-minutes></span>
        </time>
        <figcaption data-clock-date></figcaption>
      </figure>
      <h1 id="home-hero-title">
        <span class="hero-title__accent">expressive</span>
      </h1>
    `;
    expect(() => mountShellChrome()).not.toThrow();
    expect(document.querySelector('[data-clock-hours]')?.textContent?.length).toBeGreaterThan(0);
    expect(document.querySelector('#home-hero-title .hero-title__accent')?.textContent).toBe(
      'expressive',
    );
    expect(document.querySelector('.word-cycle__word')).toBeNull();
  });
});
