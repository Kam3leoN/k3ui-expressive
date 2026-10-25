import { html, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, hasNamedSlot } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  ToolbarSpecs,
  type ToolbarColor,
  type ToolbarLayout,
  type ToolbarOrientation,
  type ToolbarShape,
  type ToolbarVariant,
} from './toolbar.specs.js';
import { toolbarStyles } from './toolbar.styles.js';

export type {
  ToolbarColor,
  ToolbarLayout,
  ToolbarOrientation,
  ToolbarShape,
  ToolbarVariant,
} from './toolbar.specs.js';
export { ToolbarSpecs } from './toolbar.specs.js';

/**
 * Material 3 Expressive Toolbar — docked or floating action container.
 *
 * Slots are flexible: icon buttons, buttons, text fields, dividers.
 * Pair a FAB via `slot="fab"` (8dp gap · FAB 56dp · toolbar 64dp).
 *
 * M3E: prefer this over the legacy bottom app bar. Do **not** show a
 * toolbar together with a navigation bar.
 *
 * ```html
 * <k3-toolbar variant="floating" color="vibrant">
 *   <k3-icon-button variant="standard" label="Bold">…</k3-icon-button>
 *   <k3-fab slot="fab" size="default">…</k3-fab>
 * </k3-toolbar>
 *
 * <k3-toolbar variant="floating" shape="rounded" expanded>
 *   <div slot="expand">…reactions…</div>
 *   …actions…
 * </k3-toolbar>
 * ```
 *
 * @see https://m3.material.io/components/toolbars/overview
 * @see ./toolbar.specs.ts
 */
export class K3Toolbar extends K3Element {
  static override styles = [
    hostReset,
    ...(Array.isArray(toolbarStyles) ? toolbarStyles : [toolbarStyles]),
  ];

  /**
   * `floating` — pill · elevated · contextual (default).
   * `docked` — full-width bottom strip (replaces bottom app bar).
   */
  @property({ reflect: true }) variant: ToolbarVariant =
    ToolbarSpecs.defaultVariant;
  /** `standard` surface-container · `vibrant` primary-container. */
  @property({ reflect: true }) color: ToolbarColor = ToolbarSpecs.defaultColor;
  /** Horizontal (default) or vertical — vertical is for floating only. */
  @property({ reflect: true }) orientation: ToolbarOrientation =
    ToolbarSpecs.defaultOrientation;
  /**
   * Docked item distribution:
   * - `cluster` — fixed 32dp gaps
   * - `spread` — leading / middle / trailing with fill
   */
  @property({ reflect: true }) layout: ToolbarLayout =
    ToolbarSpecs.defaultLayout;
  /**
   * Floating corners — `full` pill (default) · `rounded` Extra large 28dp
   * (Meet-like flatter capsule). Ignored for docked (always square).
   */
  @property({ reflect: true }) shape: ToolbarShape = ToolbarSpecs.defaultShape;
  /**
   * Show `slot="expand"` above the actions row (Meet reactions strip).
   * Opens with the same scaleY enter as menus (FastSpatial).
   */
  @property({ type: Boolean, reflect: true }) expanded = false;
  /** Docked only — stick to bottom of scrollport. */
  @property({ type: Boolean, reflect: true }) sticky = false;
  /** Docked only — subtle top elevation shadow. */
  @property({ type: Boolean, reflect: true }) elevated = false;
  /** Accessible name for the toolbar landmark. */
  @property() label = '';

  @state() private hasLeading = false;
  @state() private hasTrailing = false;
  @state() private hasFab = false;
  @state() private hasExpand = false;

  private syncSlots = (): void => {
    this.hasLeading = hasNamedSlot(this, 'leading');
    this.hasTrailing = hasNamedSlot(this, 'trailing');
    this.hasFab = hasNamedSlot(this, 'fab');
    this.hasExpand = hasNamedSlot(this, 'expand');
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('slotchange', this.syncSlots, true);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('slotchange', this.syncSlots, true);
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    this.syncSlots();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    /* Vertical only makes sense on floating — coerce docked to horizontal */
    if (
      changed.has('variant') &&
      this.variant === 'docked' &&
      this.orientation === 'vertical'
    ) {
      queueMicrotask(() => {
        this.orientation = 'horizontal';
      });
    }
  }

  override render() {
    return html`
      <div class="shell" part="shell">
        <div
          class="bar"
          part="container"
          role="toolbar"
          aria-orientation=${this.orientation}
          aria-expanded=${this.expanded ? 'true' : 'false'}
          aria-label=${this.label || undefined}
        >
          <div
            class=${classMap({ expand: true, has: this.hasExpand })}
            part="expand"
          >
            <div class="expand-clip">
              <div class="expand-surface" part="expand-surface">
                <slot name="expand" @slotchange=${this.syncSlots}></slot>
              </div>
            </div>
          </div>
          <div class="actions" part="actions">
            <div
              class=${classMap({ leading: true, has: this.hasLeading })}
              part="leading"
            >
              <slot name="leading" @slotchange=${this.syncSlots}></slot>
            </div>
            <div class="middle" part="middle">
              <slot @slotchange=${this.syncSlots}></slot>
            </div>
            <div
              class=${classMap({ trailing: true, has: this.hasTrailing })}
              part="trailing"
            >
              <slot name="trailing" @slotchange=${this.syncSlots}></slot>
            </div>
          </div>
        </div>
        <div class=${classMap({ fab: true, has: this.hasFab })} part="fab">
          <slot name="fab" @slotchange=${this.syncSlots}></slot>
        </div>
      </div>
    `;
  }
}
export default K3Toolbar;
