import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { K3Element, prefersReducedMotion } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import '../actions/icon-button.js';
import { showSnackbar } from '../feedback/snackbar-queue.js';
import '../feedback/tooltip.js';
import '../navigation/tabs.js';
import {
  highlightCode,
  loadCodeLanguage,
  rawLanguageFromClassName,
  resolveCodeLanguage,
} from './codeblock-highlighter.js';
import { langTabIcon } from './codeblock-lang-icons.js';
import { CodeBlockSpecs } from './codeblock.specs.js';
import { codeblockStyles } from './codeblock.styles.js';

export { CodeBlockSpecs } from './codeblock.specs.js';
export { highlightCode, resolveCodeLanguage, loadCodeLanguage } from './codeblock-highlighter.js';

/** Token colour theme — `dark` (default panel) · `material` (M3 adaptive) · `okaidia` (alias of dark). */
export type CodeBlockTheme = 'dark' | 'material' | 'okaidia';

type CodeSample = {
  label: string;
  language: string;
  text: string;
};

/**
 * Code sample:
 * - `k3-tabs` title (one sample) or switcher (several slotted `<pre><code>`)
 * - copy / download icon buttons + snackbar confirm
 * - dark rounded `<pre><code>` panel (no list / no line numbers)
 *
 * @fires k3-copy — `{ text }` after a successful copy
 * @fires k3-tab — `{ index }` when the active sample tab changes
 */
export class K3CodeBlock extends K3Element {
  static override styles = [hostReset, ...codeblockStyles];

  @property() label = CodeBlockSpecs.defaultLabel;
  @property() language: string = CodeBlockSpecs.defaultLanguage;
  /**
   * Kept for markup compat — collapse UI was removed with the list shell.
   * @deprecated No effect.
   */
  @property({ type: Boolean, reflect: true })
  collapsible: boolean = CodeBlockSpecs.defaultCollapsible;
  /** @deprecated No effect. */
  @property({ type: Number, attribute: 'collapsed-height' }) collapsedHeight =
    CodeBlockSpecs.defaultCollapsedHeight;
  @property({ type: Boolean, attribute: 'show-toolbar' }) showToolbar = CodeBlockSpecs.showToolbar;
  @property({ type: Boolean, attribute: 'show-copy' }) showCopy = CodeBlockSpecs.showCopy;
  @property({ type: Boolean, attribute: 'show-download' }) showDownload =
    CodeBlockSpecs.showDownload;
  /** Raw source when not using the default slot (single-sample mode). */
  @property() code = '';
  /** Token colours: `dark` (default) · `material` · `okaidia` (alias of dark). */
  @property({ reflect: true }) theme: CodeBlockTheme = 'dark';
  /** Active sample index when several slotted `<pre>` blocks are present. */
  @property({ type: Number }) index = 0;

  @state() private samples: CodeSample[] = [];
  @state() private activeIndex = 0;
  @state() private highlighted = '';
  @state() private resolvedLang = 'plain';
  /** Language as written by the author (`html`, `c++`…) — kept as a class next to the canonical one. */
  @state() private requestedLang = 'plain';
  @state() private sourceText = '';

  /** Cancels in-flight panel height springs on rapid tab switches. */
  private panelAnimGen = 0;

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

  override willUpdate(changed: PropertyValues): void {
    let rebuilt = false;
    if (
      changed.has('code') ||
      changed.has('language') ||
      changed.has('label') ||
      (!this.samples.length && (this.code || this.childElementCount))
    ) {
      this.rebuildSamples();
      rebuilt = true;
    }
    if (rebuilt || (changed.has('index') && this.samples.length)) {
      const clamped = Math.min(
        Math.max(0, this.index),
        Math.max(0, this.samples.length - 1),
      );
      if (rebuilt || clamped !== this.activeIndex) this.applySample(clamped);
    }
  }

  override firstUpdated(): void {
    this.rebuildSamples();
    this.applySample(Math.min(Math.max(0, this.index), Math.max(0, this.samples.length - 1)));
  }

  private collectSlottedSamples(): CodeSample[] {
    const out: CodeSample[] = [];
    for (const child of this.children) {
      let codeEl: HTMLElement | null = null;
      let host: Element = child;
      if (child.tagName === 'PRE') {
        const code = child.querySelector('code');
        if (code instanceof HTMLElement) {
          codeEl = code;
          host = child;
        }
      } else if (child.tagName === 'CODE' && child instanceof HTMLElement) {
        codeEl = child;
      }
      if (!codeEl) continue;
      const lang =
        rawLanguageFromClassName(codeEl.className) ||
        (host.getAttribute('data-language') ?? '').toLowerCase() ||
        'plain';
      const label =
        host.getAttribute('data-label')?.trim() ||
        codeEl.getAttribute('data-label')?.trim() ||
        (lang !== 'plain' ? lang.toUpperCase() : 'Code');
      out.push({ label, language: lang, text: codeEl.textContent ?? '' });
    }
    return out;
  }

  private rebuildSamples(): void {
    const slotted = this.collectSlottedSamples();
    if (slotted.length > 0) {
      this.samples = slotted;
    } else {
      const lang = (this.language.trim() || 'plain').toLowerCase();
      const label =
        this.label.trim() || (lang !== 'plain' ? lang.toUpperCase() : 'Code');
      this.samples = [{ label, language: lang, text: this.code?.trim() ?? '' }];
    }
  }

  private applySample(i: number): void {
    if (!this.samples.length) {
      this.activeIndex = 0;
      this.sourceText = '';
      this.requestedLang = 'plain';
      this.resolvedLang = 'plain';
      this.highlighted = '';
      return;
    }
    const clamped = Math.min(Math.max(0, i), this.samples.length - 1);
    const sample = this.samples[clamped]!;
    this.activeIndex = clamped;
    this.sourceText = sample.text;
    this.requestedLang = (sample.language.trim() || 'plain').toLowerCase();
    this.resolvedLang = resolveCodeLanguage(this.requestedLang);
    this.refreshHighlight();
  }

  private selectSample(i: number, emit: boolean): void {
    const clamped = Math.min(Math.max(0, i), Math.max(0, this.samples.length - 1));
    if (clamped === this.activeIndex) {
      if (clamped !== this.index) this.index = clamped;
      return;
    }
    if (clamped !== this.index) this.index = clamped;
    if (emit && this.samples.length > 1) {
      void this.swapSampleAnimated(clamped);
    } else {
      this.applySample(clamped);
    }
    if (emit) this.emit('k3-tab', { index: clamped });
  }

  /**
   * Animate panel block-size when the active sample changes line count.
   * Uses spatial-fast (menu-like overshoot) under the expressive scheme.
   */
  private async swapSampleAnimated(i: number): Promise<void> {
    const panel = this.renderRoot?.querySelector<HTMLElement>('.panel');
    if (!panel || prefersReducedMotion()) {
      this.applySample(i);
      return;
    }

    const gen = ++this.panelAnimGen;
    panel.classList.remove('panel--animating');

    const from = panel.getBoundingClientRect().height;
    panel.classList.add('panel--sizing');
    panel.style.blockSize = `${from}px`;

    this.applySample(i);
    await this.updateComplete;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    if (gen !== this.panelAnimGen) return;

    /* Natural height of the new content */
    panel.style.blockSize = 'auto';
    const to = panel.getBoundingClientRect().height;
    panel.style.blockSize = `${from}px`;
    panel.offsetHeight; /* reflow — lock start frame */

    if (Math.abs(to - from) < 1) {
      panel.style.blockSize = '';
      panel.classList.remove('panel--sizing');
      return;
    }

    panel.classList.add('panel--animating');
    panel.style.blockSize = `${to}px`;

    const done = (): void => {
      if (gen !== this.panelAnimGen) return;
      panel.removeEventListener('transitionend', onEnd);
      window.clearTimeout(fallback);
      panel.classList.remove('panel--animating', 'panel--sizing');
      panel.style.blockSize = '';
    };
    const onEnd = (e: TransitionEvent): void => {
      if (e.target !== panel) return;
      if (e.propertyName !== 'block-size' && e.propertyName !== 'height') return;
      done();
    };
    panel.addEventListener('transitionend', onEnd);
    /* spatial-fast ≈ 350ms + overshoot settle */
    const fallback = window.setTimeout(done, 600);
  }

  /** `language-html language-markup` — the author's name and canonical id. */
  private languageClass(): string {
    const resolved = this.resolvedLang || 'plain';
    const requested = this.requestedLang || resolved;
    return requested === resolved
      ? `language-${resolved}`
      : `language-${requested} language-${resolved}`;
  }

  private refreshHighlight(): void {
    this.highlighted = highlightCode(this.sourceText, this.resolvedLang);
    const lang = this.resolvedLang;
    void loadCodeLanguage(lang).then((ready) => {
      if (!ready || lang !== this.resolvedLang) return;
      const next = highlightCode(this.sourceText, lang);
      if (next !== this.highlighted) this.highlighted = next;
    });
  }

  private tabLabels(): string {
    if (this.samples.length > 1) {
      return this.samples.map((s) => s.label).join(',');
    }
    const custom = this.label.trim();
    if (custom) return custom;
    return this.samples[0]?.label || 'Code';
  }

  private tabIcons(): readonly string[] {
    return this.samples.map((s) => langTabIcon(s.language));
  }

  private onTabChange = (e: Event): void => {
    if (e.target !== e.currentTarget) return;
    if (this.samples.length < 2) return;
    const i = (e as CustomEvent<{ index?: number }>).detail?.index;
    if (typeof i !== 'number') return;
    this.selectSample(i, true);
  };

  private notify(message: string): void {
    void showSnackbar({ message, duration: 'short', queue: 'replace' });
  }

  private async copyText(): Promise<void> {
    const text = this.sourceText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.emit('k3-copy', { text });
      this.notify(i18n.t('codeblock.copied', CodeBlockSpecs.accessibility.copiedLabel));
    } catch {
      /* ignore — clipboard may be blocked */
    }
  }

  private async downloadText(): Promise<void> {
    const text = this.sourceText;
    if (!text) return;
    const base =
      (this.samples[this.activeIndex]?.label || this.label || 'code').replace(/[^\w.-]+/g, '_') ||
      'code';
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
    this.notify(i18n.t('codeblock.downloaded', CodeBlockSpecs.accessibility.downloadedLabel));
  }

  private renderActions() {
    if (!this.showCopy && !this.showDownload) return nothing;
    return html`
      <div class="actions" part="actions">
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

  private renderChrome() {
    const hasActions = this.showCopy || this.showDownload;
    if (!this.showToolbar && !hasActions) return nothing;
    const multi = this.samples.length > 1;
    return html`
      <div class="chrome" part="header">
        ${this.showToolbar
          ? html`
              <k3-tabs
                class=${multi ? 'title-tabs title-tabs--multi' : 'title-tabs'}
                part="tabs"
                variant="primary"
                labels=${this.tabLabels()}
                .customIcons=${this.tabIcons()}
                .index=${this.activeIndex}
                @k3-change=${this.onTabChange}
              ></k3-tabs>
            `
          : html`<span></span>`}
        ${this.renderActions()}
      </div>
    `;
  }

  override render() {
    const hasChrome =
      this.showToolbar || this.showCopy || this.showDownload;
    return html`
      <div class=${hasChrome ? 'shell shell--chrome' : 'shell'} part="shell">
        ${this.renderChrome()}
        <div class="panel" part="panel">
          <div class="code k3-scroll k3-scroll--x" part="content">
            <pre><code class=${this.languageClass()}>${unsafeHTML(
              this.highlighted,
            )}</code></pre>
          </div>
        </div>
      </div>
      <slot
        hidden
        @slotchange=${() => {
          this.rebuildSamples();
          this.applySample(
            Math.min(Math.max(0, this.index), Math.max(0, this.samples.length - 1)),
          );
        }}
      ></slot>
    `;
  }
}

export default K3CodeBlock;

if (!customElements.get('k3-codeblock')) {
  customElements.define('k3-codeblock', K3CodeBlock);
}
