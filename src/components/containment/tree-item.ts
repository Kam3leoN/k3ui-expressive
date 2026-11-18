import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { K3Element, emitLifecycle } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { treeItemStyles } from './tree-item.styles.js';

/**
 * Tree node — nest `k3-tree-item` in the default slot; parent `k3-tree` drives selection and keys.
 */
export class K3TreeItem extends K3Element {
  static override styles = [hostReset, treeItemStyles];

  @property({ reflect: true }) label = '';
  @property() value = '';
  @property({ type: Boolean, reflect: true }) expanded = false;
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** Lazy fetch — cancel `k3-expand-start` to abort. */
  @property({ type: Boolean, reflect: true }) lazy = false;

  @state() private hasChildren = false;

  private childItems(): HTMLElement[] {
    return [...this.querySelectorAll(':scope > k3-tree-item')];
  }

  private syncChildren(): void {
    this.hasChildren = this.childItems().length > 0;
  }

  get focusRow(): HTMLElement | null {
    return this.renderRoot.querySelector('.row');
  }

  async requestExpand(source: 'user' | 'api' = 'user'): Promise<boolean> {
    if (!this.hasChildren || this.expanded) return true;
    if (!emitLifecycle(this, 'expand-start', { source, item: this, lazy: this.lazy })) {
      return false;
    }
    this.expanded = true;
    this.emit('k3-expand', { expanded: true, item: this, source });
    emitLifecycle(this, 'expand-end', { source, item: this });
    return true;
  }

  collapse(source: 'user' | 'api' = 'user'): void {
    if (!this.expanded) return;
    if (source === 'user' && !emitLifecycle(this, 'collapse-start', { source, item: this })) {
      return;
    }
    this.expanded = false;
    this.emit('k3-collapse', { expanded: false, item: this, source });
    emitLifecycle(this, 'collapse-end', { source, item: this });
  }

  toggleExpand(): void {
    if (!this.hasChildren || this.disabled) return;
    if (this.expanded) this.collapse();
    else void this.requestExpand();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('slotchange', this.syncChildren);
    this.syncChildren();
  }

  override disconnectedCallback(): void {
    this.removeEventListener('slotchange', this.syncChildren);
    super.disconnectedCallback();
  }

  override render() {
    const id = `tree-item-${this.value || this.label || 'node'}-${Math.random().toString(36).slice(2, 7)}`;

    return html`
      <div
        class="row"
        part="row"
        tabindex="-1"
        role="treeitem"
        aria-expanded=${this.hasChildren ? String(this.expanded) : nothing}
        aria-disabled=${this.disabled ? 'true' : nothing}
        aria-selected=${this.selected ? 'true' : 'false'}
        id=${id}
        @click=${(e: Event) => {
          if (this.disabled) return;
          if ((e.target as Element).closest('[data-expand]')) {
            this.toggleExpand();
            return;
          }
          this.emit('k3-select-request', { item: this, value: this.value });
        }}
        @keydown=${(e: KeyboardEvent) => this.emit('k3-tree-key', { event: e, item: this })}
      >
        ${this.hasChildren
          ? html`<span
              class="chevron"
              part="chevron"
              data-expand
              aria-hidden="true"
              @click=${(e: Event) => {
                e.stopPropagation();
                this.toggleExpand();
              }}
            ></span>`
          : html`<span class="chevron" part="spacer" aria-hidden="true" style="visibility:hidden"></span>`}
        <span class="leading" part="leading"><slot name="leading"></slot></span>
        <span class="label" part="label"
          ><slot>${this.label}</slot></span
        >
        <span class="trailing" part="trailing"><slot name="trailing"></slot></span>
      </div>
      ${this.hasChildren
        ? html`<div
            class="children"
            part="group"
            role="group"
            ?hidden=${!this.expanded}
          >
            <slot @slotchange=${this.syncChildren}></slot>
          </div>`
        : nothing}
    `;
  }
}

export default K3TreeItem;

if (!customElements.get('k3-tree-item')) {
  customElements.define('k3-tree-item', K3TreeItem);
}