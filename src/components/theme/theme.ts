import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { themeApi, type ColorMode, type MotionScheme, type ColorVariant, type ContrastPreference, DEFAULT_COLOR_SPEC, type ColorSpecVersion } from '../../theme/apply.js';
import { hostReset } from '../_shared.js';

export class K3Theme extends K3Element {
  static override styles = [hostReset, css`:host { display: contents; }`];
  @property({ attribute: 'primary-seed' }) primarySeed = '#6750A4';
  @property({ attribute: 'color-mode' }) colorMode: ColorMode = 'auto';
  @property() motion: MotionScheme = 'expressive';
  /** MCU scheme — expressive = M3E 2025/26 default */
  @property({ attribute: 'color-variant' }) colorVariant: ColorVariant = 'expressive';
  /** Theme Builder contrast — default · medium · high · auto (OS `prefers-contrast`) */
  @property({ attribute: 'contrast' }) contrast: ContrastPreference = 'default';
  @property({ type: Boolean }) global = true;
  /** Material color spec — `2025` (default, M3 Expressive) or `2021` (legacy hues). */
  @property({ attribute: 'spec-version' }) specVersion: ColorSpecVersion = DEFAULT_COLOR_SPEC;

  override connectedCallback(): void {
    super.connectedCallback();
    this.apply();
  }

  override updated(): void {
    this.apply();
  }

  override disconnectedCallback(): void {
    /* A local scope stops following OS / clock changes once removed. */
    if (!this.global) themeApi.release(this);
    super.disconnectedCallback();
  }

  private apply(): void {
    themeApi.apply({
      seed: this.primarySeed,
      mode: this.colorMode,
      motion: this.motion,
      variant: this.colorVariant,
      contrast: this.contrast,
      specVersion: this.specVersion,
      target: this.global ? document.documentElement : this,
    });
  }

  override render() {
    return html`<slot></slot>`;
  }
}
export default K3Theme;

if (!customElements.get('k3-theme')) {
  customElements.define('k3-theme', K3Theme);
}
