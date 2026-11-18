import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, emitLifecycle, waitForMotion, hasNamedSlot } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { expansionPanelStyles } from './expansion-panel.styles.js';

export type ExpansionTogglePosition = 'start' | 'end';

/**
 * Single expand/collapse surface — pair panels in `k3-accordion` for exclusive mode.
 */
export class K3ExpansionPanel extends K3Element {
  static override styles = [
    hostReset,
    ...(Array.isArray(expansionPanelStyles) ? expansionPanelStyles : [expansionPanelStyles]),
  ];

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ reflect: true, attribute: 'toggle-position' }) togglePosition: ExpansionTogglePosition =
    'start';
  @property({ type: Boolean, reflect: true, attribute: 'hide-toggle' }) hideToggle = false;

  @state() private hasSupporting = false;
  @state() private hasActions = false;
  private expandFromUser = false;
  private motionToken = 0;

  private readonly panelId = `exp-panel-${Math.random().toString(36).slice(2, 9)}`;
  private readonly headerId = `${this.panelId}-label`;

  private syncSlots = (): void => {
    this.hasSupporting = hasNamedSlot(this, 'supporting');
    this.hasActions = hasNamedSlot(this, 'actions');
  };

  toggle(): void {
    if (this.disabled) return;
    const next = !this.open;
    const phase = next ? 'expand-start' : 'collapse-start';
    if (!emitLifecycle(this, phase, { source: 'api', panel: this })) return;
    this.open = next;
    this.runExpandLifecycle();
  }

  private userToggle(): void {
    if (this.disabled) return;
    const next = !this.open;
    const phase = next ? 'expand-start' : 'collapse-start';
    if (!emitLifecycle(this, phase, { source: 'user', panel: this })) return;
    this.expandFromUser = true;
    this.open = next;
    this.emit('k3-toggle', { open: this.open, panel: this });
  }

  private runExpandLifecycle(): void {
    const expanded = this.open;
    const source = this.expandFromUser ? 'user' : 'api';
    if (!this.expandFromUser) {
      emitLifecycle(this, expanded ? 'expand-start' : 'collapse-start', { source, panel: this });
    }
    this.expandFromUser = false;
    const token = ++this.motionToken;
    const body = this.renderRoot.querySelector('.expand') as HTMLElement | null;
    void waitForMotion(body ?? this).then(() => {
      if (token !== this.motionToken || !this.isConnected) return;
      emitLifecycle(this, expanded ? 'expand-end' : 'collapse-end', { source, panel: this });
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('slotchange', this.syncSlots, true);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('slotchange', this.syncSlots, true);
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    this.syncSlots();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('open')) this.runExpandLifecycle();
  }

  override render() {
    return html`
      <button
        type="button"
        class="header"
        part="header"
        id=${this.headerId}
        ?disabled=${this.disabled}
        aria-expanded=${String(this.open)}
        aria-controls=${this.panelId}
        @click=${() => this.userToggle()}
      >
        <span
          class=${classMap({ chevron: true, open: this.open })}
          part="toggle"
          data-k3-icon="expand_more"
          aria-hidden="true"
        ></span>
        <span class="titles" part="titles">
          <span class="title" part="title"><slot name="header">Panel</slot></span>
          ${this.hasSupporting
            ? html`<span class="supporting" part="supporting"><slot name="supporting"></slot></span>`
            : nothing}
        </span>
        ${this.hasActions
          ? html`<span class="actions" part="actions" @click=${(e: Event) => e.stopPropagation()}
              ><slot name="actions"></slot
            ></span>`
          : nothing}
      </button>
      <div
        class=${classMap({ expand: true, open: this.open })}
        part="expand"
        id=${this.panelId}
        role="region"
        aria-labelledby=${this.headerId}
      >
        <div class="expand-inner">
          <div class="body" part="content">
            <slot name="content"></slot>
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}

export default K3ExpansionPanel;

if (!customElements.get('k3-expansion-panel')) {
  customElements.define('k3-expansion-panel', K3ExpansionPanel);
}