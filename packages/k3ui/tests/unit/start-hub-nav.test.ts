import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { START_HUB_PAGES, NAV_DESTINATIONS } from '../../playground/nav-destinations.js';

describe('Démarrage hub — shell destinations', () => {
  it('keeps primary rail at five destinations without Sponsors orphan', () => {
    expect(NAV_DESTINATIONS).toHaveLength(5);
    expect(NAV_DESTINATIONS.map((d) => d.id)).not.toContain('sponsors');
    expect(START_HUB_PAGES.some((p) => p.id === 'sponsors')).toBe(true);
  });

  it('leads the Démarrage hub with Accueil for bar/rail parity', () => {
    expect(START_HUB_PAGES[0]?.id).toBe('home');
  });

  it('removes #rail-sponsors markup from the playground shell', () => {
    const file = path.resolve(__dirname, '../../playground/index.html');
    const html = fs.readFileSync(file, 'utf8');
    expect(html).not.toMatch(/id=["']rail-sponsors["']/);
    expect(html).toMatch(/id=["']shell-home-fab["']/);
  });

  it('drops .rail-sponsors chrome and styles compact home FAB', () => {
    const file = path.resolve(__dirname, '../../playground/playground.css');
    const text = fs.readFileSync(file, 'utf8');
    expect(text).not.toMatch(/\.rail-sponsors\s*\{/);
    expect(text).toMatch(/k3-fab\.shell-home-fab/);
    expect(text).toMatch(/data-nav='bar'[\s\S]*?shell-home-fab/);
  });
});
