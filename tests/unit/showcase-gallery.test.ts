import { describe, expect, it } from 'vitest';
import {
  GALLERY_EXCLUDED_CATEGORIES,
  showcaseGalleryHtml,
  showcaseTagsInHtml,
  tagsInHtml,
  previewFor,
  wireGalleryFabExclusive,
  wireShowcaseInteractions,
} from '../../playground/showcase/gallery.js';
import { SHOWCASE_PREVIEWS } from '../../playground/showcase/previews.js';
import { setDocProduct } from '../../playground/catalog.js';

const t = (key: string): string => key;

describe('showcase gallery', () => {
  it('ships live previews for core Actions / Buttons ids', () => {
    for (const id of ['buttons', 'buttons-group', 'fab', 'fab-menu', 'buttons-icon'] as const) {
      expect(SHOWCASE_PREVIEWS[id]?.html).toMatch(/k3-/);
      expect(previewFor(id).html).toContain('k3-');
    }
  });

  it('autocomplete preview uses options JSON (ANANAS · BANANE · CASSIS)', () => {
    const html = SHOWCASE_PREVIEWS.autocomplete!.html;
    expect(html).toContain('options=');
    expect(html).toContain('ANANAS');
    expect(html).toContain('BANANE');
    expect(html).toContain('CASSIS');
    expect(html).not.toContain('k3-menu-item');
  });

  it('smart button swaps light_off / lightbulb; shape-chip has filled star', () => {
    const smart = SHOWCASE_PREVIEWS['buttons-smart']!.html;
    expect(smart).toContain('data-k3-icon="light_off"');
    expect(smart).toContain('data-k3-icon="lightbulb"');
    expect(smart).toContain('gallery-smart-icon--off');
    expect(smart).toContain('gallery-smart-icon--on');
    const chip = SHOWCASE_PREVIEWS['shape-chip']!.html;
    expect(chip).toContain('data-k3-icon="star"');
    expect(chip).toContain('slot="icon"');
    expect(chip).toContain('data-k3-fill="1"');
  });

  it('date and time pickers are live selectors with calendar_today / schedule', () => {
    const date = SHOWCASE_PREVIEWS['date-picker']!.html;
    expect(date).toContain('k3-date-picker');
    expect(date).toContain('k3-date-picker-toggle');
    expect(date).toContain('data-k3-icon="calendar_today"');
    expect(date).not.toContain('calendar_month');
    expect(SHOWCASE_PREVIEWS['date-picker']!.demoClass).toContain('gallery-demo--fill');
    const time = SHOWCASE_PREVIEWS['time-picker']!.html;
    expect(time).toContain('k3-time-picker');
    expect(time).toContain('k3-time-picker-toggle');
    expect(time).toContain('data-k3-icon="schedule"');
  });

  it('FAB previews use slot=icon, real dial/rail, menu opens upward', () => {
    expect(SHOWCASE_PREVIEWS.fab!.html).toContain('slot="icon"');
    expect(SHOWCASE_PREVIEWS.fab!.html).toContain('data-k3-icon="add"');
    expect(SHOWCASE_PREVIEWS['fab-dial']!.html).toContain('k3-fab-dial');
    expect(SHOWCASE_PREVIEWS['fab-dial']!.html).toContain('k3-fab-dial-item');
    expect(SHOWCASE_PREVIEWS['fab-rail']!.html).toContain('k3-fab-rail');
    expect(SHOWCASE_PREVIEWS['fab-rail']!.html).toContain('k3-fab-rail-item');
    /* bottom-end → menu prefers ABOVE when there is room */
    expect(SHOWCASE_PREVIEWS['fab-menu']!.html).toContain('placement="bottom-end"');
    expect(SHOWCASE_PREVIEWS['fab-menu']!.html).toContain('data-k3-fab-menu-clip');
  });

  it('extracts k3 tags from preview markup', () => {
    expect(tagsInHtml('<k3-button></k3-button><k3-fab></k3-fab>').sort()).toEqual([
      'k3-button',
      'k3-fab',
    ]);
  });

  it('builds accordion gallery with first category open', () => {
    setDocProduct('k3ui');
    const html = showcaseGalleryHtml(t, '', 'empty');
    expect(html).toContain('gallery-category');
    expect(html).toContain('<k3-accordion class="gallery-accordion">');
    expect(html).toContain('k3-expansion-panel');
    expect(html).toContain(' open');
    expect(html).toContain('gallery-item');
    expect(html).toContain('href="#/buttons"');
    expect(showcaseTagsInHtml(html)).toContain('k3-accordion');
    expect(showcaseTagsInHtml(html)).toContain('k3-expansion-panel');
    expect(showcaseTagsInHtml(html)).toContain('k3-button');
  });

  it('omits Styles and Interaction (Utilities) from the home gallery', () => {
    expect(GALLERY_EXCLUDED_CATEGORIES.has('Styles')).toBe(true);
    expect(GALLERY_EXCLUDED_CATEGORIES.has('Utilities')).toBe(true);
    setDocProduct('k3ui');
    const html = showcaseGalleryHtml(t, '', 'empty');
    expect(html).not.toContain('playground.gallery.cat.styles');
    expect(html).not.toContain('playground.gallery.cat.utilities');
    expect(html).toContain('playground.gallery.cat.actions');
    expect(html).toContain('playground.gallery.cat.containment');
  });

  it('loading preview shows plain and contained (with bg)', () => {
    const html = SHOWCASE_PREVIEWS.loading!.html;
    expect(html).toContain('<k3-loading-indicator>');
    expect(html).toContain('<k3-loading-indicator contained>');
  });

  it('badge preview includes NEW label on an icon', () => {
    const html = SHOWCASE_PREVIEWS.badge!.html;
    expect(html).toContain('value="NEW"');
    expect(html).toContain('data-k3-icon="notifications"');
  });

  it('avatar preview includes initials and image src', () => {
    const html = SHOWCASE_PREVIEWS.avatar!.html;
    expect(html).toContain('initials="AB"');
    expect(html).toContain('src="https://api.dicebear.com/');
    expect(html).toContain('name="Ada Lovelace"');
  });

  it('tree preview uses label attrs and nested items', () => {
    const html = SHOWCASE_PREVIEWS.tree!.html;
    expect(html).toContain('label="Projects"');
    expect(html).toContain('label="Design"');
    expect(html).toContain('expanded');
    expect(html).toContain('selection="single"');
  });

  it('breadcrumb preview uses items JSON (not slotted children)', () => {
    const html = SHOWCASE_PREVIEWS.breadcrumb!.html;
    expect(html).toContain('items=');
    expect(html).toContain('"text":"Home"');
    expect(html).toContain('"current":true');
    expect(html).not.toMatch(/<k3-breadcrumb>\s*<a /);
  });

  it('prev-next uses previous/next href+title; scroll-to-top is demo-visible', () => {
    const nav = SHOWCASE_PREVIEWS['prev-next']!.html;
    expect(nav).toContain('previous-href=');
    expect(nav).toContain('previous-title=');
    expect(nav).toContain('next-href=');
    expect(nav).toContain('next-title=');
    expect(nav).not.toContain('slot="prev"');
    const stt = SHOWCASE_PREVIEWS['scroll-to-top']!.html;
    expect(stt).toContain('data-visible');
    expect(stt).toContain('threshold="-1"');
    expect(SHOWCASE_PREVIEWS['scroll-to-top']!.demoClass).toContain('gallery-demo--scroll-top');
  });

  it('card has media banner; menu uses trigger slot; sheet is wired', () => {
    expect(SHOWCASE_PREVIEWS.card!.html).toContain('slot="media"');
    expect(SHOWCASE_PREVIEWS.card!.html).toContain('gallery-card-banner');
    expect(SHOWCASE_PREVIEWS.banner!.html).toContain('position="static"');
    expect(SHOWCASE_PREVIEWS.menu!.html).toContain('slot="trigger"');
    expect(SHOWCASE_PREVIEWS.menu!.html).toContain('k3-menu-item');
    expect(SHOWCASE_PREVIEWS.sheet!.html).toContain('k3-sheet');
    expect(SHOWCASE_PREVIEWS.sheet!.html).toContain('data-gallery-sheet');
    expect(SHOWCASE_PREVIEWS.list!.html).toContain('slot="headline"');
    expect(SHOWCASE_PREVIEWS.list!.html).toContain('variant="standard"');
  });

  it('opens only the first matching category when filtering (exclusive)', () => {
    setDocProduct('k3ui');
    const html = showcaseGalleryHtml(t, 'fab', 'empty');
    const opens = html.match(/gallery-category[^>]* open/g) ?? [];
    expect(opens.length).toBe(1);
    expect(html).toContain('data-gallery-id="fab"');
    expect(html).toContain('<k3-accordion class="gallery-accordion">');
  });

  it('closes other gallery FAB overlays when one opens', async () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <k3-fab-dial id="d1"></k3-fab-dial>
      <k3-fab-rail id="r1" open></k3-fab-rail>
      <k3-fab-menu id="m1"></k3-fab-menu>`;
    const dial = root.querySelector('#d1') as HTMLElement & { open: boolean };
    const rail = root.querySelector('#r1') as HTMLElement & { open: boolean };
    const menu = root.querySelector('#m1') as HTMLElement & { open: boolean };
    dial.open = false;
    rail.open = true;
    menu.open = false;
    wireGalleryFabExclusive(root);
    dial.setAttribute('open', '');
    dial.open = true;
    await Promise.resolve();
    expect(rail.open).toBe(false);
    expect(menu.open).toBe(false);
    expect(dial.hasAttribute('open')).toBe(true);
  });

  it('wires snackbar show on data-gallery-snack click', async () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <button type="button" data-gallery-snack>Show</button>
      <k3-snackbar id="gallery-snack"></k3-snackbar>`;
    let shown = false;
    const snack = root.querySelector('#gallery-snack') as HTMLElement & { show: () => Promise<boolean> };
    snack.show = async () => {
      shown = true;
      return true;
    };
    wireShowcaseInteractions(root);
    root.querySelector<HTMLButtonElement>('[data-gallery-snack]')!.click();
    await Promise.resolve();
    expect(shown).toBe(true);
  });

  it('wires sheet show on data-gallery-sheet click', async () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <button type="button" data-gallery-sheet>Open</button>
      <k3-sheet id="gallery-sheet"></k3-sheet>`;
    let shown = false;
    const sheet = root.querySelector('#gallery-sheet') as HTMLElement & { show: () => Promise<boolean> };
    sheet.show = async () => {
      shown = true;
      return true;
    };
    wireShowcaseInteractions(root);
    root.querySelector<HTMLButtonElement>('[data-gallery-sheet]')!.click();
    await Promise.resolve();
    expect(shown).toBe(true);
  });
});
