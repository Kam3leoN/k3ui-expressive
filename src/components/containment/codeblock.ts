import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import '../actions/icon-button.js';
import '../feedback/tooltip.js';
import '../navigation/tabs.js';
import './list.js';
import './list-item.js';
import {
  highlightCode,
  loadCodeLanguage,
  rawLanguageFromClassName,
  resolveCodeLanguage,
} from './codeblock-highlighter.js';
import { CodeBlockSpecs } from './codeblock.specs.js';
import { codeblockStyles } from './codeblock.styles.js';

export { CodeBlockSpecs } from './codeblock.specs.js';
export { highlightCode, resolveCodeLanguage, loadCodeLanguage } from './codeblock-highlighter.js';

/** Token colour theme — `material` (M3 adaptive, default) or `okaidia` (fixed Prism dark). */
export type CodeBlockTheme = 'material' | 'okaidia';

type TipHost = HTMLElement & {
  content: string;
  show: () => Promise<void>;
  hide: () => Promise<void>;
};

/**
 * Code sample built on `k3-list`:
 * - first item = header (`k3-tabs` title + copy / download)
 * - last item = highlighted source (expandable when `collapsible`)
 *
 * @fires k3-copy — `{ text }` after a successful copy
 */
export class K3CodeBlock extends K3Element {
  static override styles = [hostReset, ...codeblockStyles];

  @property() label = CodeBlockSpecs.defaultLabel;
  @property() language: string = CodeBlockSpecs.defaultLanguage;
  @property({ type: Boolean, reflect: true })
  collapsible: boolean = CodeBlockSpecs.defaultCollapsible;
  @property({ type: Number, attribute: 'collapsed-height' }) collapsedHeight =
    CodeBlockSpecs.defaultCollapsedHeight;
  @property({ type: Boolean, attribute: 'show-toolbar' }) showToolbar = CodeBlockSpecs.showToolbar;
  @property({ type: Boolean, attribute: 'show-copy' }) showCopy = CodeBlockSpecs.showCopy;
  @property({ type: Boolean, attribute: 'show-download' }) showDownload =
    CodeBlockSpecs.showDownload;
  /** Raw source when not using the default slot. */
  @property() code = '';
  /** Token colours: `okaidia` (default) · `material` (follows the M3 theme). */
  @property({ reflect: true }) theme: CodeBlockTheme = 'okaidia';

  @state() private contentExpanded = true;
  @state() private highlighted = '';
  @state() private resolvedLang = 'plain';
  /** Language as written by the author (`html`, `c++`…) — kept as a class next to the canonical one. */
  @state() private requestedLang = 'plain';
  @state() private sourceText = '';

  private tipTimers = new Map<string, number>();

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', CodeBlockSpecs.accessibility.role);
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute(
        'aria-label',
        i18n.t('codeblock.ariaLabel', CodeBlockSpecs.accessibility.ariaLabel),
      );
    }
  }

  override disconnectedCallback(): void {
    for (const id of this.tipTimers.values()) window.clearTimeout(id);
    this.tipTimers.clear();
    super.disconnectedCallback();
  }

  override willUpdate(changed: PropertyValues): void {
    if (
      changed.has('code') ||
      changed.has('language') ||
      (!this.sourceText && (this.code || this.childElementCount))
    ) {
      this.syncSource();
    }
  }

  override firstUpdated(): void {
    this.syncSource();
    if (!this.collapsible && this.shouldAutoCollapse()) {
      queueMicrotask(() => {
        this.collapsible = true;
      });
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
          lang = rawLanguageFromClassName(slotCode.className);
        }
      }
    }

    this.sourceText = text;
    this.requestedLang = (lang.trim() || 'plain').toLowerCase();
    this.resolvedLang = resolveCodeLanguage(this.requestedLang);
    this.refreshHighlight();
  }

  /** `language-html language-markup` — the author's name and Prism's canonical id. */
  private languageClass(): string {
    const resolved = this.resolvedLang || 'plain';
    const requested = this.requestedLang || resolved;
    return requested === resolved ? `language-${resolved}` : `language-${requested} language-${resolved}`;
  }

  private refreshHighlight(): void {
    this.highlighted = highlightCode(this.sourceText, this.resolvedLang);
    /* Grammar in the extended pack: show plain text now, highlight once loaded */
    const lang = this.resolvedLang;
    void loadCodeLanguage(lang).then((ready) => {
      if (!ready || lang !== this.resolvedLang) return;
      const next = highlightCode(this.sourceText, lang);
      if (next !== this.highlighted) this.highlighted = next;
    });
  }

  private titleLabel(): string {
    const custom = this.label.trim();
    if (custom) return custom;
    const lang = this.resolvedLang;
    if (!lang || lang === 'plain') return 'Code';
    return lang.toUpperCase();
  }

  private async flashTip(part: 'copy' | 'download', message: string): Promise<void> {
    const tip = this.renderRoot?.querySelector(
      `k3-tooltip[data-action="${part}"]`,
    ) as TipHost | null;
    if (!tip?.show || !tip?.hide) return;
    const prev = tip.content;
    tip.content = message;
    await tip.show();
    const prevTimer = this.tipTimers.get(part);
    if (prevTimer) window.clearTimeout(prevTimer);
    this.tipTimers.set(
      part,
      window.setTimeout(() => {
        this.tipTimers.delete(part);
        void tip.hide();
        tip.content = prev;
      }, 1400),
    );
  }

  private async copyText(): Promise<void> {
    const text = this.sourceText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.emit('k3-copy', { text });
      await this.flashTip(
        'copy',
        i18n.t('codeblock.copied', CodeBlockSpecs.accessibility.copiedLabel),
      );
    } catch {
      /* ignore — clipboard may be blocked */
    }
  }

  private async downloadText(): Promise<void> {
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
    await this.flashTip(
      'download',
      i18n.t('codeblock.downloaded', CodeBlockSpecs.accessibility.downloadedLabel),
    );
  }

  private onContentExpand = (e: Event): void => {
    const detail = (e as CustomEvent<{ expanded?: boolean }>).detail;
    if (typeof detail?.expanded === 'boolean') {
      this.contentExpanded = detail.expanded;
    }
  };

  private stopItemActivate = (e: Event): void => {
    e.stopPropagation();
  };

  private renderCode() {
    return html`
      <div class="code k3-scroll k3-scroll--x" part="content">
        <pre><code class=${this.languageClass()}>${unsafeHTML(
          this.highlighted,
        )}</code></pre>
      </div>
    `;
  }

  private renderActions() {
    if (!this.showToolbar || (!this.showCopy && !this.showDownload)) return nothing;
    return html`
      <div class="actions" slot="trailing" @click=${this.stopItemActivate} @keydown=${this.stopItemActivate}>
        ${this.showCopy
          ? html`
              <k3-tooltip
                data-action="copy"
                position="top"
                content=${i18n.t('codeblock.copy', CodeBlockSpecs.accessibility.copyLabel)}
              >
                <k3-icon-button
                  part="copy"
                  size="sm"
                  variant="standard"
                  label=${i18n.t('codeblock.copy', CodeBlockSpecs.accessibility.copyLabel)}
                  @k3-click=${() => this.copyText()}
                >
                  <span
                    class="ms notranslate"
                    translate="no"
                    lang="zxx"
                    data-k3-icon="content_copy"
                    aria-hidden="true"
                  ></span>
                </k3-icon-button>
              </k3-tooltip>
            `
          : nothing}
        ${this.showDownload
          ? html`
              <k3-tooltip
                data-action="download"
                position="top"
                content=${i18n.t('codeblock.download', CodeBlockSpecs.accessibility.downloadLabel)}
              >
                <k3-icon-button
                  part="download"
                  size="sm"
                  variant="standard"
                  label=${i18n.t('codeblock.download', CodeBlockSpecs.accessibility.downloadLabel)}
                  @k3-click=${() => this.downloadText()}
                >
                  <span
                    class="ms notranslate"
                    translate="no"
                    lang="zxx"
                    data-k3-icon="download"
                    aria-hidden="true"
                  ></span>
                </k3-icon-button>
              </k3-tooltip>
            `
          : nothing}
      </div>
    `;
  }

  private onBodyExpand = (e: Event): void => {
    if (!this.collapsible) {
      /* Locked open — force expand back if the row was toggled. */
      const item = e.target as HTMLElement & { expanded?: boolean };
      if (item && item.expanded === false) item.expanded = true;
      return;
    }
    this.onContentExpand(e);
  };

  override render() {
    const title = this.titleLabel();
    const canToggle = this.collapsible;
    const open = !canToggle || this.contentExpanded;

    return html`
      <k3-list class="shell" part="list" variant="segmented" aria-label=${title}>
        <k3-list-item class="header" part="header" lines="three">
          <k3-tabs
            class="title-tabs"
            slot="headline"
            part="tabs"
            variant="secondary"
            labels=${title}
            index="0"
            @click=${this.stopItemActivate}
          ></k3-tabs>
          ${this.renderActions()}
        </k3-list-item>
        <k3-list-item
          class=${canToggle ? 'body' : 'body body--static'}
          part="body"
          expandable
          ?expanded=${open}
          @k3-expand=${this.onBodyExpand}
        >
          ${canToggle
            ? html`
                <span slot="headline" class="body-label">
                  ${open
                    ? i18n.t('codeblock.showLess', CodeBlockSpecs.accessibility.expandLess)
                    : i18n.t('codeblock.showMore', CodeBlockSpecs.accessibility.expandMore)}
                </span>
              `
            : nothing}
          <div slot="expand">${this.renderCode()}</div>
        </k3-list-item>
      </k3-list>
      <slot hidden @slotchange=${() => this.syncSource()}></slot>
    `;
  }
}

export default K3CodeBlock;

if (!customElements.get('k3-codeblock')) {
  customElements.define('k3-codeblock', K3CodeBlock);
}
