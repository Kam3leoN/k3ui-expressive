import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  haptic,
  devicePixelSnapCss,
  devicePixelSnapPx,
  watchDevicePixelRatio,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  ButtonPadSizeDp,
  ButtonPadSpecs,
  buttonPadCellsFor,
  type ButtonPadCellDef,
  type ButtonPadDirection,
  type ButtonPadMode,
  type ButtonPadVariant,
} from './button-pad.specs.js';
import { buttonPadStyles } from './button-pad.styles.js';

export type {
  ButtonPadCellDef,
  ButtonPadDirection,
  ButtonPadMode,
  ButtonPadPosition,
  ButtonPadVariant,
} from './button-pad.specs.js';
export {
  ButtonPadSpecs,
  ButtonPadSizeDp,
  ButtonPadDiagonalCells,
  ButtonPadCardinalCells,
  buttonPadCellsFor,
} from './button-pad.specs.js';

/**
 * Pad 4 directions — diagonal (↖↗↙↘) ou cardinal roté 45° (↑→↓←).
 *
 * @fires k3-navigate — `{ direction }`
 * @see ./button-pad.specs.ts
 */
export class K3ButtonPad extends K3Element {
  static override styles = [hostReset, buttonPadStyles];

  @property({ reflect: true })
  mode: ButtonPadMode = ButtonPadSpecs.defaultMode;

  @property({ reflect: true })
  variant: ButtonPadVariant = ButtonPadSpecs.defaultVariant;

  private _unwatchDpr: (() => void) | null = null;

  /**
   * Snap the 2dp cell gap (+ total 2×2 size) to integer device pixels.
   * Same helper as button-grid / split-button (Windows 125% hairline).
   */
  private applyGapToken = (): void => {
    const gapPx = devicePixelSnapPx(ButtonPadSizeDp.gap);
    this.style.setProperty('--k3-bp-gap', devicePixelSnapCss(ButtonPadSizeDp.gap));
    this.style.setProperty(
      '--k3-bp-grid',
      `${2 * ButtonPadSizeDp.cell + gapPx}px`,
    );
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', ButtonPadSpecs.accessibility.role);
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.applyGapToken();
    this._unwatchDpr?.();
    this._unwatchDpr = watchDevicePixelRatio(this.applyGapToken);
    this.addEventListener('keydown', this.onKeyDown);
  }

  override disconnectedCallback(): void {
    this._unwatchDpr?.();
    this._unwatchDpr = null;
    this.removeEventListener('keydown', this.onKeyDown);
    super.disconnectedCallback();
  }

  private cells(): ButtonPadCellDef[] {
    return buttonPadCellsFor(this.mode === 'cardinal' ? 'cardinal' : 'diagonal');
  }

  /**
   * Émet une navigation dans une direction.
   * @param direction - Direction cardinale ou diagonale
   */
  navigate(direction: ButtonPadDirection): void {
    haptic.medium();
    this.emit('k3-navigate', { direction });
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const keyMap: Record<string, ButtonPadDirection> =
      this.mode === 'cardinal'
        ? {
            ArrowUp: 'up',
            ArrowRight: 'right',
            ArrowDown: 'down',
            ArrowLeft: 'left',
          }
        : {
            Home: 'nw',
            PageUp: 'ne',
            End: 'sw',
            PageDown: 'se',
          };
    const dir = keyMap[e.key];
    if (dir) {
      e.preventDefault();
      this.navigate(dir);
    }
  };

  override render() {
    return html`
      ${this.cells().map(
        (cell) => html`
          <button
            type="button"
            class=${classMap({
              btn: true,
              [`btn--${cell.position}`]: true,
            })}
            part=${cell.position}
            data-direction=${cell.direction}
            aria-label=${cell.label}
            @click=${(e: Event) => {
              e.preventDefault();
              this.navigate(cell.direction);
            }}
          >
            <span
              class="icon ms notranslate"
              translate="no"
              lang="zxx"
              data-k3-icon=${cell.icon}
              aria-hidden="true"
            ></span>
          </button>
        `,
      )}
    `;
  }
}

if (!customElements.get('k3-button-pad')) {
  customElements.define('k3-button-pad', K3ButtonPad);
}
export default K3ButtonPad;
