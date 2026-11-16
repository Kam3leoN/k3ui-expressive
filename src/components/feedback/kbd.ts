import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { kbdStyles } from './kbd.styles.js';

/**
 * Split a chord string into key tokens.
 * `"Ctrl+K"` → `['Ctrl','K']` · `"⌘⇧P"` stays one glyph cluster when no `+`/space.
 */
export function parseKbdKeys(value: string): string[] {
  const raw = value.trim();
  if (!raw) return [];
  if (raw.includes('+')) {
    return raw
      .split('+')
      .map((p) => p.trim())
      .filter(Boolean);
  }
  if (/\s/.test(raw)) {
    return raw.split(/\s+/).filter(Boolean);
  }
  return [raw];
}

/**
 * Keyboard key / chord display — Material-style keycaps.
 *
 * ```html
 * <k3-kbd keys="Ctrl+K"></k3-kbd>
 * <k3-kbd>Esc</k3-kbd>
 * <k3-kbd keys="⌘+⇧+P" size="sm"></k3-kbd>
 * ```
 *
 * Prefer `keys` for chords (`+` or spaces). Default slot is a single label.
 */
export class K3Kbd extends K3Element {
  static override styles = [hostReset, kbdStyles];

  /**
   * Chord or key list — `"Ctrl+K"`, `"Shift Enter"`, or a single glyph.
   * When empty, the default slot content is used as one key.
   */
  @property() keys = '';
  /** Visual size — `sm` · `md` (default) · `lg`. */
  @property({ reflect: true }) size: 'sm' | 'md' | 'lg' = 'md';

  private resolvedKeys(): string[] {
    const fromAttr = parseKbdKeys(this.keys);
    if (fromAttr.length) return fromAttr;
    const slotted = (this.textContent ?? '').trim();
    return slotted ? [slotted] : [];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('aria-hidden')) {
      this.setAttribute('aria-hidden', 'true');
    }
  }

  override render() {
    const parts = this.resolvedKeys();
    if (!parts.length) {
      return html`<span class="chord" part="chord"><kbd class="key" part="key"><slot></slot></kbd></span>`;
    }
    return html`
      <span class="chord" part="chord">
        ${parts.map(
          (k, i) => html`
            ${i > 0 ? html`<span class="sep" part="sep" aria-hidden="true">+</span>` : null}
            <kbd class="key" part="key">${k}</kbd>
          `,
        )}
      </span>
    `;
  }
}

export default K3Kbd;

if (!customElements.get('k3-kbd')) {
  customElements.define('k3-kbd', K3Kbd);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-kbd': K3Kbd;
  }
}
