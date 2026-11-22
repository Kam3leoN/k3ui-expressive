import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import K3TreeItem from './tree-item.js';
import type { K3TreeItem as K3TreeItemType } from './tree-item.js';
import { treeStyles } from './tree.styles.js';

if (!customElements.get('k3-tree-item')) customElements.define('k3-tree-item', K3TreeItem);

export type TreeSelection = 'none' | 'single' | 'multiple';

interface FlatNode {
  item: K3TreeItemType;
  level: number;
  parent: K3TreeItemType | null;
  indexInParent: number;
  setSize: number;
}

/**
 * Hierarchical tree with WAI-ARIA tree keyboard support.
 */
export class K3Tree extends K3Element {
  static override styles = [hostReset, treeStyles];

  @property({ reflect: true }) selection: TreeSelection = 'none';
  @property() label = '';

  @state() private typeahead = '';
  private typeaheadTimer: number | undefined;

  private rootItems(): K3TreeItemType[] {
    return [...this.querySelectorAll(':scope > k3-tree-item')] as K3TreeItemType[];
  }

  private itemChildren(item: K3TreeItemType): K3TreeItemType[] {
    return [...item.querySelectorAll(':scope > k3-tree-item')] as K3TreeItemType[];
  }

  private flatVisible(): FlatNode[] {
    const out: FlatNode[] = [];
    const walk = (items: K3TreeItemType[], level: number, parent: K3TreeItemType | null) => {
      const size = items.length;
      items.forEach((item, indexInParent) => {
        out.push({ item, level, parent, indexInParent, setSize: size });
        if (item.expanded) {
          walk(this.itemChildren(item), level + 1, item);
        }
      });
    };
    walk(this.rootItems(), 1, null);
    return out;
  }

  private syncTreeAria(): void {
    const assign = (items: K3TreeItemType[], level: number) => {
      const size = items.length;
      items.forEach((item, pos) => {
        const row = item.focusRow;
        if (row) {
          row.setAttribute('aria-level', String(level));
          row.setAttribute('aria-setsize', String(size));
          row.setAttribute('aria-posinset', String(pos + 1));
        }
        if (item.expanded) assign(this.itemChildren(item), level + 1);
      });
    };
    assign(this.rootItems(), 1);
  }

  private itemLabel(item: K3TreeItemType): string {
    return (item.label || item.textContent || '').replace(/\s+/g, ' ').trim();
  }

  private focusItem(item: K3TreeItemType | undefined): void {
    item?.focusRow?.focus();
  }

  private onSelectRequest = (e: Event) => {
    const detail = (e as CustomEvent).detail as { item: K3TreeItemType; value: string };
    const item = detail?.item;
    if (!item || item.disabled || this.selection === 'none') return;
    if (this.selection === 'single') {
      this.flatVisible().forEach(({ item: n }) => {
        n.selected = n === item;
      });
    } else {
      item.selected = !item.selected;
    }
    this.emit('k3-change', {
      values: this.flatVisible().filter(({ item: n }) => n.selected).map(({ item: n }) => n.value),
      item,
    });
  };

  private onTreeKey = (e: Event) => {
    const ev = (e as CustomEvent).detail as { event: KeyboardEvent; item: K3TreeItemType };
    const keyEv = ev.event;
    const current = ev.item;
    const flat = this.flatVisible();
    const idx = flat.findIndex((n) => n.item === current);
    if (idx < 0) return;

    const node = flat[idx]!;

    if (keyEv.key.length === 1 && !keyEv.ctrlKey && !keyEv.metaKey && !keyEv.altKey) {
      keyEv.preventDefault();
      this.typeahead += keyEv.key.toLowerCase();
      window.clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = window.setTimeout(() => {
        this.typeahead = '';
      }, 500);
      const rest = flat.slice(idx + 1).concat(flat.slice(0, idx + 1));
      const match = rest.find((n) =>
        this.itemLabel(n.item).toLowerCase().startsWith(this.typeahead),
      );
      if (match) this.focusItem(match.item);
      return;
    }

    if (keyEv.key === 'ArrowDown') {
      keyEv.preventDefault();
      if (flat[idx + 1]) this.focusItem(flat[idx + 1]!.item);
    } else if (keyEv.key === 'ArrowUp') {
      keyEv.preventDefault();
      if (flat[idx - 1]) this.focusItem(flat[idx - 1]!.item);
    } else if (keyEv.key === 'ArrowRight') {
      keyEv.preventDefault();
      const kids = this.itemChildren(current);
      if (kids.length && !current.expanded) void current.requestExpand();
      else if (kids[0]) this.focusItem(kids[0]);
    } else if (keyEv.key === 'ArrowLeft') {
      keyEv.preventDefault();
      if (current.expanded) current.collapse();
      else if (node.parent) this.focusItem(node.parent);
    } else if (keyEv.key === 'Home') {
      keyEv.preventDefault();
      this.focusItem(flat[0]?.item);
    } else if (keyEv.key === 'End') {
      keyEv.preventDefault();
      this.focusItem(flat[flat.length - 1]?.item);
    } else if (keyEv.key === '*') {
      keyEv.preventDefault();
      const siblings = node.parent
        ? this.itemChildren(node.parent)
        : this.rootItems();
      siblings.forEach((s) => {
        if (!s.expanded) void s.requestExpand();
      });
    } else if (keyEv.key === 'Enter' || keyEv.key === ' ') {
      keyEv.preventDefault();
      current.emit('k3-select-request', { item: current, value: current.value });
    }
  };

  expandAll(): void {
    const walk = (items: K3TreeItemType[]) => {
      items.forEach((item) => {
        void item.requestExpand('api');
        walk(this.itemChildren(item));
      });
    };
    walk(this.rootItems());
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('k3-select-request', this.onSelectRequest);
    this.addEventListener('k3-tree-key', this.onTreeKey);
    this.addEventListener('slotchange', this.syncTreeAria);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('k3-select-request', this.onSelectRequest);
    this.removeEventListener('k3-tree-key', this.onTreeKey);
    this.removeEventListener('slotchange', this.syncTreeAria);
    window.clearTimeout(this.typeaheadTimer);
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    this.syncTreeAria();
    const first = this.flatVisible()[0]?.item;
    if (first?.focusRow) first.focusRow.tabIndex = 0;
  }

  override updated(): void {
    queueMicrotask(() => this.syncTreeAria());
  }

  override render() {
    return html`
      <div
        class="tree"
        part="tree"
        role="tree"
        aria-label=${this.label || nothing}
        aria-multiselectable=${this.selection === 'multiple' ? 'true' : nothing}
      >
        <slot @slotchange=${this.syncTreeAria}></slot>
      </div>
    `;
  }
}

export default K3Tree;

if (!customElements.get('k3-tree')) {
  customElements.define('k3-tree', K3Tree);
}