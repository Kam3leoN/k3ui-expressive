import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import {
  ButtonGroupSpecs,
  ButtonGroupStandardGapDp,
  ButtonGroupConnectedGapDp,
  ButtonGroupConnectedCornerDp,
  ButtonGroupExpandedRatio,
  ButtonGroupConnectedSelectedInnerPercent,
} from '../../src/components/actions/button-group.specs.js';
import {
  isButtonGroupWidthMorphable,
  planPressWidths,
} from '../../src/components/actions/button-group.press.js';
import { devicePixelSnapCss } from '../../src/core/css-length.js';

describe('button-group specs (M3 / Android / Compose)', () => {
  it('matches m3.material.io button-groups/specs tokens', () => {
    /* Standard between-space: XS 18 · S 12 · M/L/XL 8 */
    expect(ButtonGroupStandardGapDp).toEqual({
      xs: 18,
      sm: 12,
      md: 8,
      lg: 8,
      xl: 8,
    });
    expect(ButtonGroupConnectedGapDp).toBe(2);
    /* Round inner / square outer corner table */
    expect(ButtonGroupConnectedCornerDp).toEqual({
      xs: 4,
      sm: 8,
      md: 8,
      lg: 16,
      xl: 20,
    });
    expect(ButtonGroupSpecs.connectedPressedInnerDp).toBe(4);
    expect(ButtonGroupConnectedSelectedInnerPercent).toBe(50);
    expect(ButtonGroupExpandedRatio).toBe(0.15);
    expect(ButtonGroupSpecs.pressReleaseMs).toBe(370);
  });
});

describe('planPressWidths (Compose animateWidth)', () => {
  it('middle press steals equally from both neighbors', () => {
    const plan = planPressWidths({
      restWidths: [80, 80, 80],
      pressedIdx: 1,
      compressionLimits: [16, 16, 16],
    })!;
    const perSide = (80 * ButtonGroupExpandedRatio) / 2;
    expect(plan.widths).toEqual([80 - perSide, 80 + perSide * 2, 80 - perSide]);
    expect(plan.touched.sort()).toEqual([0, 1, 2]);
  });

  it('edge press steals only from the immediate neighbor', () => {
    const plan = planPressWidths({
      restWidths: [80, 80, 80],
      pressedIdx: 0,
      compressionLimits: [16, 16, 16],
    })!;
    const growth = Math.min(80 * ButtonGroupExpandedRatio, 16);
    expect(plan.widths[0]).toBeCloseTo(80 + growth, 5);
    expect(plan.widths[1]).toBeCloseTo(80 - growth, 5);
    expect(plan.widths[2]).toBe(80);
    expect(plan.touched.sort()).toEqual([0, 1]);
  });

  it('zero compressionLimit blocks steal from that neighbor', () => {
    const plan = planPressWidths({
      restWidths: [80, 80, 80],
      pressedIdx: 0,
      compressionLimits: [16, 0, 16],
    })!;
    expect(plan.widths).toEqual([80, 80, 80]);
  });
});

describe('k3-button-group', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-button-group', 'k3-button', 'k3-icon-button'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('single-select uses radiogroup + aria-checked and required lock', async () => {
    host.innerHTML = `
      <k3-button-group selection="single" required label="Period">
        <k3-button value="day" selected>Day</k3-button>
        <k3-button value="week">Week</k3-button>
      </k3-button-group>
    `;
    const el = host.querySelector('k3-button-group') as HTMLElement & {
      updateComplete: Promise<unknown>;
      selectedValues: () => string[];
    };
    await el.updateComplete;
    await Promise.resolve();

    expect(el.getAttribute('role')).toBe('radiogroup');
    expect(el.getAttribute('aria-label')).toBe('Period');

    const [day, week] = [...el.querySelectorAll('k3-button')] as Array<
      HTMLElement & { selected?: boolean }
    >;
    expect(day.hasAttribute('data-radio')).toBe(true);
    expect(day.getAttribute('data-bg')).toBe('first');
    expect(week.getAttribute('data-bg')).toBe('last');

    const dayBtn = day.shadowRoot!.querySelector('button')!;
    expect(dayBtn.getAttribute('role')).toBe('radio');
    expect(dayBtn.getAttribute('aria-checked')).toBe('true');

    week.click();
    await el.updateComplete;
    expect(el.selectedValues()).toEqual(['week']);

    week.click();
    await el.updateComplete;
    expect(el.selectedValues()).toEqual(['week']);
  });

  it('optional single clears on second click', async () => {
    host.innerHTML = `
      <k3-button-group selection="single" label="Mood">
        <k3-button value="reactions">Reactions</k3-button>
        <k3-button value="hand">Hand</k3-button>
      </k3-button-group>
    `;
    const el = host.querySelector('k3-button-group') as HTMLElement & {
      updateComplete: Promise<unknown>;
      selectedValues: () => string[];
    };
    await el.updateComplete;
    await Promise.resolve();

    const reactions = el.querySelector('k3-button[value="reactions"]') as HTMLElement;
    reactions.click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 200));
    expect(el.selectedValues()).toEqual(['reactions']);

    reactions.click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 200));
    expect(el.selectedValues()).toEqual([]);
  });

  it('multi-select toggles and emits values', async () => {
    host.innerHTML = `
      <k3-button-group selection="multi" label="Style">
        <k3-button value="bold" selected>Bold</k3-button>
        <k3-button value="italic">Italic</k3-button>
      </k3-button-group>
    `;
    const el = host.querySelector('k3-button-group') as HTMLElement & {
      updateComplete: Promise<unknown>;
      selectedValues: () => string[];
    };
    await el.updateComplete;
    await Promise.resolve();

    expect(el.getAttribute('role')).toBe('group');
    const italic = el.querySelectorAll('k3-button')[1] as HTMLElement;
    const detail = await new Promise<{ values: string[] }>((resolve) => {
      el.addEventListener(
        'k3-change',
        (e) => resolve((e as CustomEvent).detail as { values: string[] }),
        { once: true },
      );
      italic.click();
    });
    expect(detail.values).toEqual(['bold', 'italic']);
  });

  it('standard press expands by ExpandedRatio, steals only from immediate neighbors', async () => {
    host.innerHTML = `
      <k3-button-group variant="standard" selection="none" label="Actions">
        <k3-button variant="tonal">One</k3-button>
        <k3-button variant="tonal">Two</k3-button>
        <k3-button variant="tonal">Three</k3-button>
      </k3-button-group>
    `;
    const el = host.querySelector('k3-button-group') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    await Promise.resolve();

    const items = [...el.querySelectorAll('k3-button')] as HTMLElement[];
    for (const b of items) {
      Object.defineProperty(b, 'getBoundingClientRect', {
        configurable: true,
        value: () =>
          ({
            width: 80,
            height: 40,
            top: 0,
            left: 0,
            right: 80,
            bottom: 40,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          }) as DOMRect,
      });
    }

    const mid = items[1]!;
    mid.setAttribute('data-pressed', '');
    await Promise.resolve();

    const perSide = (80 * ButtonGroupExpandedRatio) / 2;
    expect(parseFloat(mid.style.width)).toBeCloseTo(80 + perSide * 2, 1);
    expect(parseFloat(items[0]!.style.width)).toBeCloseTo(80 - perSide, 1);
    expect(parseFloat(items[2]!.style.width)).toBeCloseTo(80 - perSide, 1);

    mid.removeAttribute('data-pressed');
    await Promise.resolve();
    expect(parseFloat(mid.style.width)).toBeCloseTo(80, 1);

    await new Promise((r) => setTimeout(r, 600));
    expect(mid.style.width).toBe('');

    const first = items[0]!;
    first.setAttribute('data-pressed', '');
    await Promise.resolve();
    const edgeGrowth = Math.min(80 * ButtonGroupExpandedRatio, 16);
    expect(parseFloat(first.style.width)).toBeCloseTo(80 + edgeGrowth, 1);
    expect(parseFloat(items[1]!.style.width)).toBeCloseTo(80 - edgeGrowth, 1);
    expect(items[2]!.style.width).toBe('');
  });

  it('connected snaps 2dp gap via devicePixelSnapCss', async () => {
    host.innerHTML = `
      <k3-button-group variant="connected" selection="none" label="Extras">
        <k3-button variant="tonal">A</k3-button>
        <k3-button variant="tonal">B</k3-button>
      </k3-button-group>
    `;
    const el = host.querySelector('k3-button-group') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    await Promise.resolve();
    expect(el.style.getPropertyValue('--k3-btn-group-connected-gap')).toBe(
      devicePixelSnapCss(ButtonGroupConnectedGapDp),
    );
  });

  it('connected marks positions, preserves child variant, sets data-connected', async () => {
    host.innerHTML = `
      <k3-button-group variant="connected" size="md" shape="square" sync selection="single">
        <k3-button variant="outlined">A</k3-button>
        <k3-button variant="outlined" selected>B</k3-button>
        <k3-button variant="outlined">C</k3-button>
      </k3-button-group>
    `;
    const el = host.querySelector('k3-button-group') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    await Promise.resolve();

    const items = [...el.querySelectorAll('k3-button')] as Array<
      HTMLElement & { size?: string; shape?: string; variant?: string }
    >;
    expect(items.map((i) => i.getAttribute('data-bg'))).toEqual(['first', 'middle', 'last']);
    expect(items.every((i) => i.size === 'md')).toBe(true);
    expect(items.every((i) => i.shape === 'square')).toBe(true);
    expect(items.every((i) => i.variant === 'outlined')).toBe(true);
    expect(items.every((i) => i.hasAttribute('data-connected'))).toBe(true);
    expect(el.getAttribute('shape')).toBe('square');
  });

  it('connected resolves buttons nested in k3-tooltip wrappers', async () => {
    await import('../../src/components/feedback/tooltip.js');
    host.innerHTML = `
      <k3-button-group variant="connected" selection="single" sync size="sm" label="Extras">
        <k3-tooltip content="Repeat"><k3-button variant="tonal" selected>R</k3-button></k3-tooltip>
        <k3-tooltip content="Shuffle"><k3-button variant="tonal">S</k3-button></k3-tooltip>
        <k3-button variant="tonal">V</k3-button>
      </k3-button-group>
    `;
    const el = host.querySelector('k3-button-group') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    await Promise.resolve();
    const tips = [...el.querySelectorAll(':scope > k3-tooltip')];
    const items = [...el.querySelectorAll('k3-button')];
    expect(items.map((i) => i.getAttribute('data-bg'))).toEqual(['first', 'middle', 'last']);
    expect(tips.map((t) => t.getAttribute('data-bg'))).toEqual(['first', 'middle']);
    expect(items.every((i) => i.hasAttribute('data-connected'))).toBe(true);
    expect(tips.every((t) => t.hasAttribute('data-connected'))).toBe(true);
    expect(tips[0]!.hasAttribute('selected')).toBe(true);
    expect(tips[1]!.hasAttribute('selected')).toBe(false);
  });

  it('connected square uses 4dp facing seams and pronounced first/last outer', async () => {
    host.innerHTML = `
      <k3-button-group variant="connected" shape="square" size="sm" sync selection="single">
        <k3-button variant="tonal">8 oz</k3-button>
        <k3-button variant="tonal" selected>12 oz</k3-button>
        <k3-button variant="tonal">16 oz</k3-button>
      </k3-button-group>
    `;
    const el = host.querySelector('k3-button-group') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    await Promise.resolve();

    const [first, mid, last] = [...el.querySelectorAll('k3-button')] as HTMLElement[];
    expect(first.getAttribute('data-bg')).toBe('first');
    expect(mid.getAttribute('data-bg')).toBe('middle');
    expect(last.getAttribute('data-bg')).toBe('last');
    expect(mid.hasAttribute('selected')).toBe(true);

    /* Square: seams = 4dp (inner-pressed); outer = size corner — never stadium */
    const sheets = (customElements.get('k3-button-group') as CustomElementConstructor & {
      styles?: Array<{ cssText?: string }>;
    }).styles;
    const cssText = (sheets ?? []).map((s) => s.cssText ?? '').join('');
    expect(cssText).toContain("shape='square'");
    expect(cssText).toContain('--k3-btn-group-inner: var(--k3-btn-group-inner-pressed)');
    expect(cssText).toContain('--k3-btn-group-inner-pressed:');
    expect(cssText).not.toMatch(
      /shape='square'\)\s*::slotted\(\[selected\]\)\s*\{[^}]*--k3-btn-rss:\s*var\(--k3-btn-corner\)/,
    );
  });

  it('connected toggle paint rules follow ToggleButtonDefaults', async () => {
    host.innerHTML = `
      <k3-button-group variant="connected" selection="single" label="Align">
        <k3-button variant="tonal">Left</k3-button>
        <k3-button variant="tonal" selected>Center</k3-button>
        <k3-button variant="tonal">Right</k3-button>
      </k3-button-group>
    `;
    const el = host.querySelector('k3-button-group') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    await Promise.resolve();

    const items = [...el.querySelectorAll('k3-button')] as HTMLElement[];
    expect(items[1]!.hasAttribute('selected')).toBe(true);
    expect(items[0]!.hasAttribute('selected')).toBe(false);
    expect(items.every((i) => i.hasAttribute('data-connected'))).toBe(true);

    const sheets = (
      customElements.get('k3-button') as CustomElementConstructor & {
        styles?: Array<{ cssText?: string }>;
      }
    ).styles;
    const cssText = (sheets ?? []).map((s) => s.cssText ?? '').join('');
    expect(cssText).toContain(':host([selected])');
    expect(cssText).toContain(':host([data-bg]:not([selected]))');
    expect(cssText).toContain('--k3-sys-color-primary');
    expect(cssText).toContain('--k3-sys-color-secondary-container');
  });

  it('standard icon-button press does not morph shell width', async () => {
    host.innerHTML = `
      <k3-button-group variant="standard" selection="multi" label="Style">
        <k3-icon-button variant="tonal" selected>B</k3-icon-button>
        <k3-icon-button variant="tonal">I</k3-icon-button>
        <k3-icon-button variant="tonal">U</k3-icon-button>
      </k3-button-group>
    `;
    const el = host.querySelector('k3-button-group') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    await Promise.resolve();

    const items = [...el.querySelectorAll('k3-icon-button')] as HTMLElement[];
    expect(items.every((i) => isButtonGroupWidthMorphable(i) === false)).toBe(true);
    expect(items.every((i) => i.hasAttribute('data-bg'))).toBe(true);

    const mid = items[1]!;
    mid.setAttribute('data-pressed', '');
    await Promise.resolve();
    expect(mid.style.width).toBe('');
    expect(items[0]!.style.width).toBe('');
    expect(items[2]!.style.width).toBe('');
  });
});
