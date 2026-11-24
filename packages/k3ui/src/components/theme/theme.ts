import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import {
  themeApi,
  type ColorMode,
  type MotionScheme,
  type ColorVariant,
  type ContrastPreference,
  DEFAULT_COLOR_SPEC,
  type ColorSpecVersion,
} from '../../theme/apply.js';
import { hostReset } from '../_shared.js';

export class K3Theme extends K3Element {
  static override styles = [hostReset, css`:host { display: contents; }`];
  @property({ attribute: 'primary-seed' }) primarySeed = '#3F51B5';
  /** Second seed for `color-variant="cmf"` (MCU Spec 2026 dual-source). */
  @property({ attribute: 'secondary-seed' }) secondarySeed = '';
  @property({ attribute: 'color-mode' }) colorMode: ColorMode = 'auto';
  @property() motion: MotionScheme = 'expressive';
  /** MCU scheme — tonalspot = Material You default (seed hue on primary @ 2025) */
  @property({ attribute: 'color-variant' }) colorVariant: ColorVariant = 'tonalspot';
  /** Theme Builder contrast — default · medium · high · auto (OS `prefers-contrast`) */
  @property({ attribute: 'contrast' }) contrast: ContrastPreference = 'default';
  @property({ type: Boolean }) global = true;
  /**
   * Material color spec — `2025` (default) · `2026` (CMF) · `2021` (legacy).
   * `cmf` variant always resolves under 2026 inside MCU.
   */
  @property({ attribute: 'spec-version' }) specVersion: ColorSpecVersion = DEFAULT_COLOR_SPEC;
  /** Pure black dark theme (OLED) — `<k3-theme amoled>`. Ignored in light mode. */
  @property({ type: Boolean, reflect: true }) amoled = false;

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
      secondarySeed: this.secondarySeed || undefined,
      mode: this.colorMode,
      motion: this.motion,
      variant: this.colorVariant,
      contrast: this.contrast,
      specVersion: this.specVersion,
      amoled: this.amoled,
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
