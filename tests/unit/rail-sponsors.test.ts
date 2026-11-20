import { afterEach, describe, expect, it } from 'vitest';

/** Mirrors playground/app.ts helpers for unit coverage. */
function isSlottedNavItem(el: Element, host: HTMLElement): boolean {
  let n: Element | null = el;
  while (n && n !== host) {
    if (n.hasAttribute('slot')) return true;
    n = n.parentElement;
  }
  return false;
}

function isShellPrimaryNavItem(el: Element, host: HTMLElement): boolean {
  if (el.id === 'rail-sponsors') return false;
  return !isSlottedNavItem(el, host);
}

function pinRailSponsorsAfterPrimary(rail: HTMLElement): void {
  const sponsors = document.getElementById('rail-sponsors');
  if (!sponsors || !rail.contains(sponsors)) return;
  rail.appendChild(sponsors);
}

describe('rail sponsors before trailing divider', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps Sponsors out of catalog primary destinations', () => {
    document.body.innerHTML = `
      <k3-nav-rail id="nav-rail">
        <k3-nav-item id="primary"></k3-nav-item>
        <k3-nav-item id="rail-sponsors" data-nav-aux href="#/sponsors"></k3-nav-item>
        <div slot="trailing" class="rail-foot">
          <k3-chip id="ver">v1</k3-chip>
        </div>
      </k3-nav-rail>`;
    const host = document.getElementById('nav-rail')!;
    const primary = document.getElementById('primary')!;
    const sponsors = document.getElementById('rail-sponsors')!;
    expect(isShellPrimaryNavItem(primary, host)).toBe(true);
    expect(isShellPrimaryNavItem(sponsors, host)).toBe(false);
    expect(isSlottedNavItem(sponsors, host)).toBe(false);
    expect(sponsors.hasAttribute('data-nav-aux')).toBe(true);
  });

  it('pins Sponsors as last default-slot destination (above trailing divider)', () => {
    document.body.innerHTML = `
      <k3-nav-rail id="nav-rail">
        <k3-nav-item id="rail-sponsors" data-nav-aux href="#/sponsors"></k3-nav-item>
        <div slot="trailing" class="rail-foot">
          <k3-chip id="ver">v1</k3-chip>
        </div>
      </k3-nav-rail>`;
    const host = document.getElementById('nav-rail')!;
    const a = document.createElement('k3-nav-item');
    a.id = 'primary-a';
    const b = document.createElement('k3-nav-item');
    b.id = 'primary-b';
    host.appendChild(a);
    host.appendChild(b);
    pinRailSponsorsAfterPrimary(host);

    const sponsors = document.getElementById('rail-sponsors')!;
    expect(sponsors.hasAttribute('slot')).toBe(false);
    const defaultNav = [...host.querySelectorAll(':scope > k3-nav-item')].filter(
      (el) => !el.hasAttribute('slot'),
    );
    expect(defaultNav.map((el) => el.id)).toEqual(['primary-a', 'primary-b', 'rail-sponsors']);
    expect(host.querySelector('[slot="trailing"]')?.classList.contains('rail-foot')).toBe(true);
  });
});
