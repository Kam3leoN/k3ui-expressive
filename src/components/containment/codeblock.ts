import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { highlightCode, languageFromClassName, resolveCodeLanguage } from './codeblock-highlighter.js';
import { CodeBlockSpecs } from './codeblock.specs.js';
import { codeblockStyles } from './codeblock.styles.js';

export { CodeBlockSpecs } from './codeblock.specs.js';
export { highlightCode, resolveCodeLanguage } from './codeblock-highlighter.js';

/**
 * Code sample card with optional toolbar (copy / download) and collapse.
 *
 * @fires k3-copy — `{ text }` after a successful copy
 */
export class K3CodeBlock extends K3Element {
  static override styles = [hostReset, codeblockStyles];

  @property() label = CodeBlockSpecs.defaultLabel;
  @property() language: string = CodeBlockSpecs.defaultLanguage;
  @property({ type: Boolean, reflect: true })
  collapsible: boolean = CodeBlockSpecs.defaultCollapsible;
  @property({ type: Number, attribute: 'collapsed-height' }) collapsedHeight =
    CodeBlockSpecs.defaultCollapsedHeight;
  @property({ type: Boolean, attribute: 'show-toolbar' }) showToolbar = CodeBlockSpecs.showToolbar;
  @property({ type: Boolean, attribute: 'show-copy' }) showCopy = CodeBlockSpecs.showCopy;
  @property({ type: Boolean, attribute: 'show-download' }) showDownload = CodeBlockSpecs.showDownload;
  /** Raw source when not using the default slot. */
  @property() code = '';

  @state() private expanded = false;
  @state() private highlighted = '';
  @state() private resolvedLang = 'plain';
  @state() private sourceText = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', CodeBlockSpecs.accessibility.role);
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', CodeBlockSpecs.accessibility.ariaLabel);
    }
    this.style.setProperty('--k3-codeblock-collapsed-height', `${this.collapsedHeight}px`);
  }

  override firstUpdated(): void {
    this.syncSource();
    if (!this.collapsible && this.shouldAutoCollapse()) {
      this.collapsible = true;
    }
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('collapsedHeight')) {
      this.style.setProperty('--k3-codeblock-collapsed-height', `${this.collapsedHeight}px`);
    }
    if (changed.has('code') || changed.has('language')) {
      this.syncSource();
    }
  }

  private shouldAutoCollapse(): boolean {
    const lines = this.sourceText.replace(/\r/g, '').split('\n').length;
    return lines > CodeBlockSpecs.defaultCollapsibleMinLines;
  }

  private findSourceCodeElement(): HTMLElement | null {
    for (const child of this.children) {
      if (child.tagName === 'PRE') {
        const code = child.querySelector('code');
        if (code instanceof HTMLElement) return code;
      }
      if (child.tagName === 'CODE' && child instanceof HTMLElement) return child;
    }
    return null;
  }

  private syncSource(): void {
    let text = this.code?.trim() ?? '';
    let lang = this.language;

    if (!text) {
      const slotCode = this.findSourceCodeElement();
      if (slotCode) {
        text = slotCode.textContent ?? '';
        if (!lang.trim()) {
          lang = languageFromClassName(slotCode.className);
        }
      }
    }

    this.sourceText = text;
    this.resolvedLang = resolveCodeLanguage(lang.trim() || 'plain');
    this.refreshHighlight();
  }

  private refreshHighlight(): void {
    this.highlighted = highlightCode(this.sourceText, this.resolvedLang);
  }

  private async copyText(): Promise<void> {
    const text = this.sourceText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.emit('k3-copy', { text });
    } catch {
      /* ignore — clipboard may be blocked */
    }
  }

  private downloadText(): void {
    const text = this.sourceText;
    if (!text) return;
    const base = (this.label || 'code').replace(/[^\w.-]+/g, '_') || 'code';
    const ext =
      CodeBlockSpecs.extensionByLang[this.resolvedLang] ??
      CodeBlockSpecs.extensionByLang.plain;
    const filename = base.includes('.') ? base : `${base}.${ext}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private toggleExpand(): void {
    this.expanded = !this.expanded;
    if (this.expanded) {
      this.setAttribute('expanded', '');
    } else {
      this.removeAttribute('expanded');
    }
  }

  override render() {
    const showBar = this.showToolbar && (this.showCopy || this.showDownload || this.label);
    const showExpand = this.collapsible;

    return html`
      <div class="card" part="card">
        ${showBar
          ? html`
              <div class="toolbar" part="toolbar">
                ${this.label ? html`<span class="label" part="label">${this.label}</span>` : nothing}
                <div class="actions">
                  ${this.showCopy
                    ? html`
                        <button
                          type="button"
                          class="action"
                          part="copy"
                          aria-label=${CodeBlockSpecs.accessibility.copyLabel}
                          @click=${() => void this.copyText()}
                        >
                          <span
                            class="icon ms notranslate"
                            translate="no"
                            lang="zxx"
                            data-k3-icon="content_copy"
                            aria-hidden="true"
                          ></span>
                        </button>
                      `
                    : nothing}
                  ${this.showDownload
                    ? html`
                        <button
                          type="button"
                          class="action"
                          part="download"
                          aria-label=${CodeBlockSpecs.accessibility.downloadLabel}
                          @click=${() => this.downloadText()}
                        >
                          <span
                            class="icon ms notranslate"
                            translate="no"
                            lang="zxx"
                            data-k3-icon="download"
                            aria-hidden="true"
                          ></span>
                        </button>
                      `
                    : nothing}
                </div>
              </div>
            `
          : nothing}
        <div class="content" part="content">
          <pre><code class="language-${this.resolvedLang || 'plain'}">${unsafeHTML(this.highlighted)}</code></pre>
        </div>
        ${showExpand
          ? html`
              <button
                type="button"
                class="expand"
                part="expand"
                aria-expanded=${this.expanded ? 'true' : 'false'}
                @click=${() => this.toggleExpand()}
              >
                ${this.expanded
                  ? CodeBlockSpecs.accessibility.expandLess
                  : CodeBlockSpecs.accessibility.expandMore}
              </button>
            `
          : nothing}
      </div>
    `;
  }
}

export default K3CodeBlock;

if (!customElements.get('k3-codeblock')) {
  customElements.define('k3-codeblock', K3CodeBlock);
}
