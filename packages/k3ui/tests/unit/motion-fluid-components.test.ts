import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  enterDialogMotion,
  enterScaleY,
  enterSheetBottom,
  enterSheetSide,
} from '../../src/motion/enter.js';
import { snackbarStyles } from '../../src/components/feedback/snackbar.styles.js';

function cssText(result: { cssText?: string } | Array<{ cssText?: string }>): string {
  if (Array.isArray(result)) return result.map((s) => s.cssText ?? '').join('\n');
  return result.cssText ?? String(result);
}

describe('fluid motion on overlay / chrome components', () => {
  it('snackbar springs use scheme-aware aliases + fluid gooey open/close', () => {
    const text = cssText(snackbarStyles as unknown as { cssText?: string });
    expect(text).toContain('--k3-sys-motion-easing-spatial-fast');
    expect(text).toContain('--k3-sys-motion-duration-spatial-fast');
    expect(text).not.toMatch(/linear\(0,\s*0\.0564/);
    expect(text).toContain('k3-snackbar-fluid-in');
    expect(text).toContain('k3-snackbar-fluid-out');
    expect(text).toContain("data-k3-motion='fluid'");
    expect(text).toContain('scale(1.1, 0.5)');
    expect(text).toContain('scale(1.14, 0.68)');
  });

  it('dialog / sheet ship fluid jelly; menus keep scaleY for all schemes', () => {
    const dialog = cssText(enterDialogMotion('.panel.basic', '.panel.basic.open'));
    expect(dialog).toContain('k3-dialog-enter-fluid');
    expect(dialog).toContain("data-k3-motion='fluid'");

    const menu = cssText(enterScaleY('.panel', '.panel.open'));
    /* Menus: scaleY spring for all schemes — no fluid droplet open/close. */
    expect(menu).toContain('k3-enter-scale-y');
    expect(menu).not.toContain('k3-enter-scale-y-fluid');
    expect(menu).not.toContain("data-k3-motion='fluid'");
    expect(menu).toContain('scaleY(0.8)');
    /* Exit pairs with host data-closing while .open stays until waitForMotion. */
    expect(menu).toContain(':host([data-closing]) .panel.open');

    const flyout = cssText(
      enterScaleY('.flyout', ':host([submenu-open]) .flyout[data-placed]'),
    );
    expect(flyout).toContain('k3-enter-scale-y');
    expect(flyout).not.toContain('k3-enter-scale-y-fluid');
    expect(flyout).toContain(':host([data-closing]) .flyout[data-placed]');
    expect(flyout).not.toContain("data-k3-motion='fluid'");

    const bottom = cssText(enterSheetBottom('.sheet.bottom'));
    expect(bottom).toContain("data-k3-motion='fluid'");
    expect(bottom).toContain('scale(1.04, 0.72)');

    const side = cssText(enterSheetSide('.sheet.side'));
    expect(side).toContain('scale(0.72, 1.04)');
  });

  it('tooltip and nav-rail prefer scheme aliases over expressive hardcodes', () => {
    const tip = readFileSync(
      resolve(__dirname, '../../src/components/feedback/tooltip.ts'),
      'utf8',
    );
    expect(tip).toContain('--k3-sys-motion-easing-spatial-fast');
    expect(tip).not.toContain('emphasized-decelerate');

    const rail = readFileSync(
      resolve(__dirname, '../../src/components/navigation/nav-rail.styles.ts'),
      'utf8',
    );
    expect(rail).toMatch(/--k3-nav-rail-ease:[\s\S]*?--k3-sys-motion-easing-spatial/);
    expect(rail).toContain('k3-nav-rail-fluid-in');
    expect(rail).toContain('k3-nav-rail-fluid-out');
    expect(rail).toContain("data-k3-motion='fluid'");
    /* Full-flight morph (not 1-frame data-expanding) */
    expect(rail).toContain("data-morphing='in'");
    expect(rail).toContain("data-morphing='out'");
    /* Collapse must settle at identity — ending at scale(0.9) snapped on clear */
    expect(rail).toContain('k3-nav-rail-fluid-out');
    expect(rail).not.toContain('scale(0.9, 1.03)');
    expect(rail).toMatch(/100%\s*\{\s*transform:\s*scale\(1,\s*1\)/);
    /* Spatialized jellies .xr-shell only — never both (double-scale) */
    expect(rail).toContain("fab-placement='spatialized'][data-morphing='in']");
    expect(rail).toContain('.xr-shell');

    const navItem = readFileSync(
      resolve(__dirname, '../../src/components/navigation/nav-item.ts'),
      'utf8',
    );
    expect(navItem).toContain('scale(0.5, 1.12)');
    expect(navItem).toContain("data-k3-motion='fluid'");
  });

  it('button keeps FluidPressController and scheme-aware label morph', () => {
    const btn = readFileSync(
      resolve(__dirname, '../../src/components/actions/button.ts'),
      'utf8',
    );
    expect(btn).toContain('FluidPressController');
    expect(btn).toContain('--k3-sys-motion-easing-spatial-fast');
    expect(btn).not.toContain('easing-expressive-spatial');
  });

  it('menu / flyout hide keep surface until exit via data-closing', () => {
    const menu = readFileSync(
      resolve(__dirname, '../../src/components/containment/menu.ts'),
      'utf8',
    );
    expect(menu).toContain("setAttribute('data-closing'");
    expect(menu).toContain('waitForMotion(panel)');
    expect(menu).toMatch(/data-closing[\s\S]*?this\.open = false/);

    const item = readFileSync(
      resolve(__dirname, '../../src/components/containment/menu-item.ts'),
      'utf8',
    );
    expect(item).toContain("setAttribute('data-closing'");
    expect(item).toContain('clearFlyoutPlace(flyout)');
    expect(item).toContain("removeAttribute('data-closing')");
  });
});
