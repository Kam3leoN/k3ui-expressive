import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');

describe('home thoughtful section', () => {
  it('ships three feature cards and a settings banner on home', () => {
    const html = fs.readFileSync(path.join(root, 'playground/index.html'), 'utf8');
    expect(html).toContain('id="home-thoughtful"');
    expect(html).toContain('home-thoughtful__cards k3-layout-grid k3-demo-cols-3');
    expect(html.match(/class="home-thoughtful-card"/g)?.length).toBe(3);
    expect(html).toContain('id="home-thoughtful-settings"');
    expect(html).toContain('data-nav="color-roles"');
    expect(html).toContain('data-nav="quick-start"');
    expect(html).toContain('data-k3-icon="palette"');
    expect(html).toContain('data-k3-icon="accessibility"');
    expect(html).toContain('data-k3-icon="code"');
    expect(html).toContain('data-k3-icon="settings"');
    expect(html).toContain('data-k3-icon="arrow_forward"');
  });

  it('uses layout-grid helpers and M3 surface tokens in CSS', () => {
    const css = fs.readFileSync(path.join(root, 'playground/playground.css'), 'utf8');
    expect(css).toContain('.home-thoughtful');
    expect(css).toContain('.home-thoughtful-card');
    expect(css).toContain('--k3-sys-color-primary-container');
    expect(css).toContain('--k3-sys-color-secondary-container');
    expect(css).toContain('.home-thoughtful__banner');
    /* Uniform list rhythm; Explore CTAs pinned to card bottom */
    expect(css).toMatch(
      /\.home-thoughtful-card__list\s*\{[^}]*flex:\s*none/,
    );
    expect(css).toMatch(
      /\.home-thoughtful-card__link\s*\{[^}]*margin-block-start:\s*auto/,
    );
  });

  it('exposes EN/FR i18n keys for the thoughtful block', () => {
    const en = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/en.json'), 'utf8')) as Record<
      string,
      string
    >;
    const fr = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/fr.json'), 'utf8')) as Record<
      string,
      string
    >;
    const keys = [
      'playground.home.thoughtful.eyebrow',
      'playground.home.thoughtful.title',
      'playground.home.thoughtful.lead',
      'playground.home.thoughtful.yours.title',
      'playground.home.thoughtful.people.title',
      'playground.home.thoughtful.build.title',
      'playground.home.thoughtful.banner.title',
      'playground.home.thoughtful.banner.cta',
    ];
    for (const key of keys) {
      expect(en[key], key).toBeTruthy();
      expect(fr[key], key).toBeTruthy();
      expect(fr[key]).not.toBe(en[key]);
    }
  });

  it('wires the banner settings button in app.ts', () => {
    const app = fs.readFileSync(path.join(root, 'playground/app.ts'), 'utf8');
    expect(app).toContain("getElementById('home-thoughtful-settings')");
  });
});
