import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import {
  K3Element,
  handleFocusNavKey,
  runWhenConnected,
} from '../../core/index.js';
import { attachSortable, type SortableController } from '../../core/dnd.js';
import { hostReset } from '../_shared.js';
import type { K3Chip } from './chip.js';
import { chipSetStyles } from './chip-set.styles.js';

export type ChipSetSelection = 'multi' | 'single' | 'none';

/**
 * M3 chip set — groups chips, selection + arrow-key focus + optional sortable.
 *
 * ```html
 * <k3-chip-set selection="multi" sortable aria-label="Topics">
 *   <k3-chip variant="filter" value="a">A</k3-chip>
 *   <k3-chip variant="filter" value="b" selected>B</k3-chip>
 * </k3-chip-set>
 * ```
 *
 * @see https://m3.material.io/components/chips/guidelines
 */
export class K3ChipSet extends K3Element {
  static override styles = [hostReset, chipSetStyles];

  @property({ reflect: true }) selection: ChipSetSelection = 'multi';
  @property() label = '';
  /** Enable reorder via pointer drag (shared K3 DnD). */
  @property({ type: Boolean, reflect: true }) sortable = false;

  private sortableCtrl: SortableController | null = null;
  /** True while a sort gesture is active — skip slotchange refresh (would kill the drag). */
  private sortingActive = false;

  private chips(): HTMLElement[] {
    return [...this.querySelectorAll(':scope > k3-chip')].filter(
      (el) => el instanceof HTMLElement && !el.hasAttribute('hidden'),
    ) as HTMLElement[];
  }

  private interactiveChips(): K3Chip[] {
    return this.chips().filter((c) => {
      const chip = c as K3Chip;
      if (chip.status) return false;
      if (chip.disabled && !chip.disabledInteractive) return false;
      return true;
    }) as K3Chip[];
  }

  private onChipChange = (e: Event) => {
    const chip = e.target as K3Chip;
    if (!(chip instanceof HTMLElement) || chip.localName !== 'k3-chip') return;
    if (this.selection === 'none') {
      this.emit('k3-change', { chip, values: this.selectedValues() });
      return;
    }
    if (this.selection === 'single') {
      if (chip.selected) {
        this.chips().forEach((el) => {
          if (el !== chip) (el as K3Chip).selected = false;
        });
      } else {
        chip.selected = true;
      }
    }
    this.emit('k3-change', { chip, values: this.selectedValues() });
  };

  private onChipRemove = (e: Event) => {
    const chip = e.target as HTMLElement;
    if (!(chip instanceof HTMLElement) || chip.localName !== 'k3-chip') return;
    const list = this.interactiveChips();
    const idx = list.indexOf(chip as K3Chip);
    chip.remove();
    const next = list[idx] ?? list[idx - 1];
    const focusEl = next?.shadowRoot?.querySelector('.chip') as HTMLElement | null;
    (focusEl ?? next)?.focus?.();
    this.emit('k3-remove', { chip, values: this.selectedValues() });
    this.emit('k3-change', { values: this.selectedValues() });
    this.sortableCtrl?.refresh();
  };

  selectedValues(): string[] {
    return this.chips()
      .filter((c) => (c as K3Chip).selected)
      .map((c) => {
        const v = (c as K3Chip).value?.trim();
        return v || (c.textContent ?? '').replace(/\s+/g, ' ').trim();
      })
      .filter(Boolean);
  }

  private onKeydown = (e: KeyboardEvent) => {
    const list = this.interactiveChips() as HTMLElement[];
    if (!list.length) return;
    const rtl = getComputedStyle(this).direction === 'rtl';
    const nav = handleFocusNavKey(e, list, {
      orientation: 'horizontal',
      wrap: false,
      homeEnd: true,
      rtl,
    });
    if (nav.handled) e.preventDefault();
  };

  /** Affordance ⋮⋮ on each chip while the set is sortable. */
  private syncDragHandles(): void {
    for (const el of this.querySelectorAll(':scope > k3-chip')) {
      const chip = el as K3Chip;
      if (chip.dragHandle !== this.sortable) chip.dragHandle = this.sortable;
    }
  }

  private syncSortable(): void {
    this.sortableCtrl?.destroy();
    this.sortableCtrl = null;
    this.syncDragHandles();
    if (!this.sortable) return;

    this.sortableCtrl = attachSortable(this, {
      itemSelector: ':scope > k3-chip',
      axis: 'both',
      draggingAttr: 'dragged',
      sortingAttr: 'sorting',
      canStart: (item, e) => {
        const c = item as K3Chip;
        if (c.status) return false;
        if (c.disabled && !c.disabledInteractive) return false;
        /* Don't steal pointer from remove / trailing actions */
        for (const n of e.composedPath()) {
          if (!(n instanceof Element)) continue;
          if (n.classList?.contains('remove') || n.classList?.contains('trailing-btn')) {
            return false;
          }
        }
        return true;
      },
      onActivate: ({ item }) => {
        this.sortingActive = true;
        this.emit('k3-dnd-start', { item });
      },
      onReorder: ({ from, to, items, item }) => {
        this.emit('k3-reorder', {
          from,
          to,
          item,
          values: items.map((el) => {
            const c = el as K3Chip;
            return c.value?.trim() || (el.textContent ?? '').replace(/\s+/g, ' ').trim();
          }),
        });
      },
      onEnd: ({ item, active }) => {
        this.sortingActive = false;
        if (active) this.emit('k3-dnd-end', { item, values: this.selectedValues() });
      },
    });
  }

  private onSlotChange = (): void => {
    /* Re-bind only when children are added/removed — never mid-drag (insertBefore fires slotchange). */
    if (this.sortingActive) return;
    this.syncDragHandles();
    this.sortableCtrl?.refresh();
  };

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('k3-change', this.onChipChange);
    this.addEventListener('k3-remove', this.onChipRemove);
    this.addEventListener('keydown', this.onKeydown);
    /*
     * demo-enhance reparents into `.demo-case-stage` after firstUpdated —
     * disconnectedCallback tears down sortable; rebind on reconnect.
     */
    runWhenConnected(this, () => this.syncSortable());
  }

  override firstUpdated() {
    this.syncSortable();
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('sortable')) this.syncSortable();
  }

  override disconnectedCallback() {
    this.sortableCtrl?.destroy();
    this.sortableCtrl = null;
    this.removeEventListener('k3-change', this.onChipChange);
    this.removeEventListener('k3-remove', this.onChipRemove);
    this.removeEventListener('keydown', this.onKeydown);
    super.disconnectedCallback();
  }

  override render() {
    const single = this.selection === 'single';
    return html`<div
      class="set"
      part="container"
      role=${single ? 'radiogroup' : 'group'}
      aria-label=${this.label || nothing}
    >
      <slot @slotchange=${this.onSlotChange}></slot>
    </div>`;
  }
}

export default K3ChipSet;

if (!customElements.get('k3-chip-set')) {
  customElements.define('k3-chip-set', K3ChipSet);
}
