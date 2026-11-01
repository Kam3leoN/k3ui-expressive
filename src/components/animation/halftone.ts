import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { halftoneStyles } from './halftone.styles.js';

export const HalftoneSpecs = {
  size: 10,
  intensity: 0.55,
  durationMs: 12000,
} as const;

export type HalftoneTone = 'dark' | 'light';

/**
 * Halftone lookalike (Figma Community vibe) — CSS radial-dot screen over slotted content.
 * No WebGL / WebGPU.
 *
 * ```html
 * <k3-halftone size="12" intensity="0.6" animated>
 *   <img src="photo.jpg" alt="" />
 * </k3-halftone>
 * ```
 */
export class K3Halftone extends K3Element {
  static override styles = [hostReset, halftoneStyles];

  /** Dot cell size in CSS px (≈ pitch). */
  @property({ type: Number }) size: number = HalftoneSpecs.size;
  /** Screen opacity 0…1. */
  @property({ type: Number }) intensity: number = HalftoneSpecs.intensity;
  /** Dot color. */
  @property() color = '#0a0a0a';
  /** `dark` = multiply · `light` = soft-light. */
  @property({ reflect: true }) tone: HalftoneTone = 'dark';
  /** Slow drift of the dot grid. */
  @property({ type: Boolean, reflect: true }) animated = false;
  /** Drift loop duration (ms). */
  @property({ type: Number, attribute: 'duration' }) duration: number = HalftoneSpecs.durationMs;

  override render() {
    const cell = `${Math.max(2, this.size)}px`;
    const opacity = Math.min(1, Math.max(0, this.intensity));
    return html`
      <div class="content"><slot></slot></div>
      <div
        class="screen"
        part="screen"
        aria-hidden="true"
        style=${styleMap({
          '--k3-halftone-cell': cell,
          '--k3-halftone-dot': this.color || '#0a0a0a',
          '--k3-halftone-opacity': String(opacity),
          '--k3-halftone-duration': `${Math.max(1000, this.duration)}ms`,
        })}
      ></div>
    `;
  }
}

export default K3Halftone;

if (!customElements.get('k3-halftone')) {
  customElements.define('k3-halftone', K3Halftone);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-halftone': K3Halftone;
  }
}
