import { html, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import {
  K3Element,
  emitLifecycle,
  handleFocusNavKey,
  isRtl,
  normalizeLabel,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  ButtonGroupSpecs,
  type ButtonGroupLabels,
  type ButtonGroupOrientation,
  type ButtonGroupSelection,
  type ButtonGroupShape,
  type ButtonGroupSize,
  type ButtonGroupVariant,
} from './button-group.specs.js';
import {
  isButtonGroupWidthMorphable,
  measureGroupPinnedWidthPx,
  planPressWidths,
  readCompressionLimitPx,
} from './button-group.press.js';
import { buttonGroupStyles } from './button-group.styles.js';

export type {
  ButtonGroupLabels,
  ButtonGroupOrientation,
  ButtonGroupSelection,
  ButtonGroupShape,
  ButtonGroupSize,
  ButtonGroupVariant,
} from './button-group.specs.js';
export { ButtonGroupSpecs } from './button-group.specs.js';
export {
  isButtonGroupWidthMorphable,
  planPressWidths,
  readCompressionLimitPx,
} from './button-group.press.js';

type GroupChild = HTMLElement & {
  selected?: boolean;
  variant?: string;
  size?: string;
  shape?: string;
  disabled?: boolean;
  radio?: boolean;
  value?: string;
};

/**
 * Material 3 Expressive button group.
 *
 * Matches Android `MaterialButtonGroup` + Compose `ButtonGroup` /
 * `ButtonGroupDefaults` (standard gap + 15% press expand on `k3-button`;
 * connected 2dp joins, no size morph; icon buttons stay square).
 *
 * @see https://github.com/material-components/material-components-android/blob/master/docs/components/ButtonGroup.md
 * @see https://m3.material.io/components/button-groups/guidelines
 * @see ./button-group.specs.ts
 * @see ./button-group.press.ts
 */
export class K3ButtonGroup extends K3Element {
  static override styles = [hostReset, buttonGroupStyles];

  @property({ reflect: true }) variant: ButtonGroupVariant = 'standard';
  @property({ reflect: true }) selection: ButtonGroupSelection = 'single';
  @property({ reflect: true }) size: ButtonGroupSize = 'sm';
  @property({ reflect: true }) shape: ButtonGroupShape = 'round';
  @property({ reflect: true }) orientation: ButtonGroupOrientation = 'horizontal';
  @property({ reflect: true }) labels: ButtonGroupLabels = 'always';
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true, attribute: 'equal-width' }) equalWidth = false;
  /** Push `size` / `shape` onto children (off by default). */
  @property({ type: Boolean, reflect: true }) sync = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property() label = '';

  private slotObserver?: MutationObserver;
  /** Natural widths before a standard press expand. */
  private restWidths: number[] | null = null;
  /** Indices last touched by press morph (pressed + immediate neighbors). */
  private pressTouched: number[] = [];
  private releaseTimer: ReturnType<typeof setTimeout> | null = null;
  /** Skip observer re-entrancy while we apply selection ourselves. */
  private syncingSelection = false;

  private childrenOf(): GroupChild[] {
    return [...this.querySelectorAll(`:scope > ${ButtonGroupSpecs.childSelector}`)].filter(
      (el): el is GroupChild => el instanceof HTMLElement,
    );
  }

  private selectedChildren(): GroupChild[] {
    return this.childrenOf().filter((el) => !!el.selected || el.hasAttribute('selected'));
  }

  selectedValues(): string[] {
    return this.selectedChildren().map((el) => this.childValue(el));
  }

  private childValue(el: GroupChild): string {
    const v = (el.value ?? el.getAttribute('value') ?? '').trim();
    if (v) return v;
    return normalizeLabel(el.textContent ?? '');
  }

  private isSelected(el: GroupChild): boolean {
    return !!el.selected || el.hasAttribute('selected');
  }

  private groupEl(): HTMLElement | null {
    return this.renderRoot.querySelector('.group');
  }

  private syncPositions(): void {
    const list = this.childrenOf();
    const n = list.length;
    list.forEach((el, i) => {
      let pos = 'middle';
      if (n === 1) pos = 'only';
      else if (i === 0) pos = 'first';
      else if (i === n - 1) pos = 'last';
      el.setAttribute('data-bg', pos);
    });
  }

  /* ── Press morph (standard · k3-button only) ── */

  private setChildWidth(el: HTMLElement, w: number): void {
    const px = `${Math.max(0, w)}px`;
    el.style.width = px;
    el.style.minWidth = px;
    el.style.maxWidth = px;
  }

  private clearChildWidth(el: HTMLElement): void {
    el.style.removeProperty('width');
    el.style.removeProperty('min-width');
    el.style.removeProperty('max-width');
  }

  private clearPressWidths(immediate = true): void {
    if (this.releaseTimer != null) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }
    const list = this.childrenOf();
    const group = this.groupEl();

    if (
      !immediate &&
      this.restWidths &&
      this.restWidths.length === list.length &&
      this.pressTouched.length
    ) {
      for (const i of this.pressTouched) {
        const el = list[i];
        const w = this.restWidths[i];
        if (el && w != null) this.setChildWidth(el, w);
      }
      this.releaseTimer = setTimeout(
        () => this.clearPressWidths(true),
        ButtonGroupSpecs.pressReleaseMs,
      );
      return;
    }

    this.setAttribute('data-press-snap', '');
    for (const el of list) this.clearChildWidth(el);
    group?.style.removeProperty('width');
    void this.offsetWidth;
    this.removeAttribute('data-press-snap');
    this.restWidths = null;
    this.pressTouched = [];
  }

  private pinGroupWidth(rest: readonly number[]): void {
    const group = this.groupEl();
    if (!group) return;
    const gap =
      parseFloat(getComputedStyle(group).columnGap || getComputedStyle(group).gap) ||
      ButtonGroupSpecs.standardGapDefaultDp;
    group.style.width = `${measureGroupPinnedWidthPx(rest, gap)}px`;
  }

  /**
   * Standard only — Compose `animateWidth`:
   * pressed shell +15%, neighbors only, capped by compressionLimit.
   * `k3-icon-button` excluded (square paint).
   */
  private applyPressLayout(): void {
    if (this.variant !== 'standard') {
      this.clearPressWidths(true);
      return;
    }

    const list = this.childrenOf();
    const pressedIdx = list.findIndex((el) => el.hasAttribute('data-pressed'));
    if (pressedIdx < 0) {
      this.clearPressWidths(false);
      return;
    }
    if (list.length < 2 || !isButtonGroupWidthMorphable(list[pressedIdx]!)) {
      this.clearPressWidths(true);
      return;
    }

    if (this.releaseTimer != null) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }

    if (!this.restWidths || this.restWidths.length !== list.length) {
      this.restWidths = list.map((el) => el.getBoundingClientRect().width);
    }

    const plan = planPressWidths({
      restWidths: this.restWidths,
      pressedIdx,
      compressionLimits: list.map((el) =>
        isButtonGroupWidthMorphable(el) ? readCompressionLimitPx(el) : 0,
      ),
    });
    if (!plan) {
      this.clearPressWidths(true);
      return;
    }

    this.pinGroupWidth(this.restWidths);

    const touchSet = new Set(plan.touched);
    list.forEach((el, i) => {
      if (!touchSet.has(i) || !isButtonGroupWidthMorphable(el)) {
        this.clearChildWidth(el);
        return;
      }
      this.setChildWidth(el, plan.widths[i]!);
    });
    this.pressTouched = plan.touched.filter((i) => isButtonGroupWidthMorphable(list[i]!));
  }

  /* ── Child chrome / a11y ── */

  private syncChildChrome(): void {
    const radio = this.selection === 'single';
    const hideLabels = this.labels === 'selected';
    const connected = this.variant === 'connected';

    for (const el of this.childrenOf()) {
      if (!isButtonGroupWidthMorphable(el)) this.clearChildWidth(el);
      if (this.sync) {
        if (el.size !== this.size) el.size = this.size;
        if (el.shape !== this.shape) el.shape = this.shape;
      }
      el.radio = radio;
      el.toggleAttribute('data-radio', radio);
      el.toggleAttribute('data-connected', connected);
      if (this.disabled) {
        el.disabled = true;
        el.setAttribute('disabled', '');
      }
      el.toggleAttribute('data-hide-label', hideLabels && !this.isSelected(el));
    }

    this.syncPositions();
    this.applyPressLayout();
    this.syncHostA11y();
  }

  private syncHostA11y(): void {
    const named =
      !!this.label.trim() ||
      !!this.getAttribute('aria-label')?.trim() ||
      !!this.getAttribute('aria-labelledby')?.trim();

    this.setAttribute('role', this.selection === 'single' ? 'radiogroup' : 'group');

    if (this.label.trim()) {
      this.setAttribute('aria-label', this.label.trim());
    } else if (!named) {
      this.setAttribute('aria-label', 'Button group');
    }
    this.toggleAttribute('aria-disabled', this.disabled);
  }

  private onSlotClick = async (e: Event): Promise<void> => {
    if (this.disabled || this.selection === 'none') return;
    const t = (e.target as HTMLElement | null)?.closest?.(
      ButtonGroupSpecs.childSelector,
    ) as GroupChild | null;
    if (!t || !this.contains(t) || t.disabled || t.hasAttribute('disabled')) return;
    if (!emitLifecycle(this, 'select-start', { source: 'user' })) return;

    this.syncingSelection = true;
    try {
      if (this.selection === 'single') {
        if (this.isSelected(t) && this.required) {
          emitLifecycle(this, 'select-end', { source: 'user' });
          return;
        }
        for (const el of this.childrenOf()) {
          const on = el === t;
          el.selected = on;
          el.toggleAttribute('selected', on);
        }
      } else {
        const next = !this.isSelected(t);
        if (!next && this.required && this.selectedChildren().length <= 1) {
          emitLifecycle(this, 'select-end', { source: 'user' });
          return;
        }
        t.selected = next;
        t.toggleAttribute('selected', next);
      }
      this.syncChildChrome();
    } finally {
      this.syncingSelection = false;
    }

    await new Promise((r) => setTimeout(r, 180));
    emitLifecycle(this, 'select-end', { source: 'user' });
    this.emit('k3-change', { selected: t, values: this.selectedValues() });
  };

  private onSlotChange = (): void => {
    queueMicrotask(() => this.syncChildChrome());
  };

  /** Arrow / Home / End — shared focus-nav (orientation follows group). */
  private onKeydown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    const list = this.childrenOf().filter(
      (el) => !el.disabled && !el.hasAttribute('disabled'),
    ) as HTMLElement[];
    if (list.length < 2) return;
    const rtl = isRtl(this);
    const nav = handleFocusNavKey(e, list, {
      orientation: this.orientation === 'vertical' ? 'vertical' : 'horizontal',
      wrap: true,
      homeEnd: true,
      rtl,
    });
    if (nav.handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this.onKeydown);
    this.slotObserver = new MutationObserver((records) => {
      if (this.syncingSelection) {
        if (records.some((r) => r.attributeName === 'data-pressed')) {
          this.applyPressLayout();
        }
        return;
      }
      const pressOnly = records.every(
        (r) => r.type === 'attributes' && r.attributeName === 'data-pressed',
      );
      if (pressOnly) this.applyPressLayout();
      else this.syncChildChrome();
    });
    this.slotObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['selected', 'data-pressed'],
    });
  }

  override disconnectedCallback(): void {
    this.removeEventListener('keydown', this.onKeydown);
    this.slotObserver?.disconnect();
    this.slotObserver = undefined;
    this.clearPressWidths(true);
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    this.syncChildChrome();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (
      changed.has('variant') ||
      changed.has('selection') ||
      changed.has('size') ||
      changed.has('shape') ||
      changed.has('labels') ||
      changed.has('disabled') ||
      changed.has('label') ||
      changed.has('required') ||
      changed.has('sync')
    ) {
      if (changed.has('variant')) this.clearPressWidths(true);
      this.syncChildChrome();
    }
  }

  override render() {
    const labelledBy = this.getAttribute('aria-labelledby');
    return html`<div
      part="container"
      class="group"
      role="presentation"
      aria-labelledby=${ifDefined(labelledBy || undefined)}
      @click=${this.onSlotClick}
    >
      <slot @slotchange=${this.onSlotChange}></slot>
    </div>`;
  }
}

export default K3ButtonGroup;
