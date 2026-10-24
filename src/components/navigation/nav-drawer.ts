import { property } from 'lit/decorators.js';
import type { PropertyValues } from 'lit';
import { K3Sheet, type SheetPlacement, type SheetSide } from '../containment/sheet.js';

/**
 * @deprecated M3 Expressive — drawers are gone; use
 * `<k3-sheet placement="side" side="start">` instead.
 *
 * Thin alias: same surface + open/close motion as a start side sheet.
 */
export class K3NavDrawer extends K3Sheet {
  /** Forced to side sheet (M3E). */
  @property({ reflect: true }) override placement: SheetPlacement = 'side';
  /** Slide in from inline-start (RTL-aware). */
  @property({ reflect: true }) override side: SheetSide = 'start';

  /**
   * Legacy API — `standard` → non-modal sheet; `modal` → scrim.
   * Prefer the `modal` boolean on `k3-sheet`.
   */
  @property({ reflect: true }) mode: 'modal' | 'standard' = 'modal';

  override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('mode')) {
      this.modal = this.mode === 'modal';
    }
    /* Keep legacy tag locked to start-side sheet */
    this.placement = 'side';
    this.side = 'start';
  }
}
export default K3NavDrawer;
