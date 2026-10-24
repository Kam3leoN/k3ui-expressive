import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import {
  themeApi,
  type ColorMode,
  type MotionScheme,
  type ColorVariant,
  type ContrastLevel,
} from '../../theme/apply.js';
import { hostReset } from '../_shared.js';

export class K3Theme extends K3Element {
  static override styles = [hostReset, css`:host { display: contents; }`];
  @property({ attribute: 'primary-seed' }) primarySeed = '#6750A4';
  @property({ attribute: 'color-mode' }) colorMode: ColorMode = 'auto';
  @property() motion: MotionScheme = 'expressive';
  /** MCU scheme — expressive = M3E 2025/26 default */
  @property({ attribute: 'color-variant' }) colorVariant: ColorVariant = 'expressive';
  /** Theme Builder contrast — default · medium · high */
  @property({ attribute: 'contrast' }) contrast: ContrastLevel = 'default';
  @property({ type: Boolean }) global = true;

  override connectedCallback(): void {
    super.connectedCallback();
    this.apply();
  }

  override updated(): void {
    this.apply();
  }

  private apply(): void {
    themeApi.apply({
      seed: this.primarySeed,
      mode: this.colorMode,
      motion: this.motion,
      variant: this.colorVariant,
      contrast: this.contrast,
      target: this.global ? document.documentElement : this,
    });
  }

  override render() {
    return html`<slot></slot>`;
  }
}
export default K3Theme;
