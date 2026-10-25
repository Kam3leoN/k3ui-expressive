import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  haptic,
  devicePixelSnapCss,
  watchDevicePixelRatio,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  ButtonArrowSizeDp,
  ButtonArrowSpecs,
  type ButtonArrowDirection,
  type ButtonArrowVariant,
} from './button-arrow.specs.js';
import { buttonArrowStyles } from './button-arrow.styles.js';

export type { ButtonArrowDirection, ButtonArrowVariant } from './button-arrow.specs.js';
export { ButtonArrowSpecs, ButtonArrowSizeDp, ButtonArrowIcons } from './button-arrow.specs.js';

/** Parse `list` attribute — JSON array or comma-separated. */
function parseListAttr(raw: string | null): string[] {
  if (raw == null || raw.trim() === '') return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* fallback CSV */
    }
  }
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Split-button flèches — navigue une liste cyclique (← → ou ↑ ↓).
 *
 * @fires k3-change — `{ value, index }` après un pas / `setIndex`
 * @see ./button-arrow.specs.ts
 */
export class K3ButtonArrow extends K3Element {
  static override styles = [hostReset, buttonArrowStyles];

  @property({ reflect: true })
  direction: ButtonArrowDirection = ButtonArrowSpecs.defaultDirection;

  @property({ reflect: true })
  variant: ButtonArrowVariant = ButtonArrowSpecs.defaultVariant;

  /** Valeurs cycliques — attribut CSV ou JSON, ou tableau JS. */
  @property({
    attribute: 'list',
    converter: {
      fromAttribute: (v: string | null) => parseListAttr(v),
      toAttribute: (v: string[]) => (v?.length ? v.join(',') : null),
    },
  })
  list: string[] = [...ButtonArrowSpecs.defaultList];

  @property({ type: Number, reflect: true })
  index: number = ButtonArrowSpecs.defaultIndex;

  private _unwatchDpr: (() => void) | null = null;

  /**
   * Snap the 2dp half-gap to integer device pixels (Windows 125% hairline).
   * Same helper as split-button / button-grid.
   */
  private applyGapToken = (): void => {
    this.style.setProperty('--k3-ba-gap', devicePixelSnapCss(ButtonArrowSizeDp.gap));
  };

  /** Valeur courante (chaîne vide si liste vide). */
  get value(): string {
    return this.list[this.index] ?? '';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', ButtonArrowSpecs.accessibility.role);
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

  private clampIndex(i: number): number {
    const len = this.list.length;
    if (len === 0) return 0;
    return ((i % len) + len) % len;
  }

  private step(delta: number): void {
    if (this.list.length === 0) {
      haptic.medium();
      this.emit('k3-change', { value: '', index: this.index });
      return;
    }
    this.index = this.clampIndex(this.index + delta);
    haptic.medium();
    this.emit('k3-change', { value: this.value, index: this.index });
  }

  /** Élément précédent (cycle). */
  prev(): void {
    this.step(-1);
  }

  /** Élément suivant (cycle). */
  next(): void {
    this.step(+1);
  }

  /**
   * Fixe l'index (clamp + cycle) et émet `k3-change`.
   * @param index - Nouvel index
   */
  setIndex(index: number): void {
    this.index = this.clampIndex(index);
    this.emit('k3-change', { value: this.value, index: this.index });
  }

  /**
   * Remplace la liste de valeurs.
   * @param list - Nouvelle liste
   * @param resetIndex - Remettre l'index à 0 (défaut true)
   */
  setList(list: string[], resetIndex = true): void {
    this.list = [...list];
    if (resetIndex) this.index = 0;
    else this.index = this.clampIndex(this.index);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const isH = this.direction !== 'vertical';
    const prevKey = isH ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isH ? 'ArrowRight' : 'ArrowDown';
    if (e.key === prevKey) {
      e.preventDefault();
      this.step(-1);
    } else if (e.key === nextKey) {
      e.preventDefault();
      this.step(+1);
    }
  };

  override render() {
    const isH = this.direction !== 'vertical';
    const { icons, accessibility: a11y } = ButtonArrowSpecs;
    const iconA = isH ? icons.left : icons.up;
    const iconB = isH ? icons.right : icons.down;
    const labelA = isH ? a11y.labelPrev : a11y.labelUp;
    const labelB = isH ? a11y.labelNext : a11y.labelDown;

    return html`
      <button
        type="button"
        class=${classMap({ btn: true, 'btn--a': true })}
        part="prev"
        aria-label=${labelA}
        @click=${(e: Event) => {
          e.preventDefault();
          this.step(-1);
        }}
      >
        <span
          class="icon ms notranslate"
          translate="no"
          lang="zxx"
          data-k3-icon=${iconA}
          aria-hidden="true"
        ></span>
      </button>
      <button
        type="button"
        class=${classMap({ btn: true, 'btn--b': true })}
        part="next"
        aria-label=${labelB}
        @click=${(e: Event) => {
          e.preventDefault();
          this.step(+1);
        }}
      >
        <span
          class="icon ms notranslate"
          translate="no"
          lang="zxx"
          data-k3-icon=${iconB}
          aria-hidden="true"
        ></span>
      </button>
    `;
  }
}

if (!customElements.get('k3-button-arrow')) {
  customElements.define('k3-button-arrow', K3ButtonArrow);
}
export default K3ButtonArrow;
