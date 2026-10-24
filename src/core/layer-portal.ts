/**
 * Reparent a host to `document.body` while open, then restore its light-DOM home.
 * Shared by snackbar · dialog · sheet (escape shell overflow / stacking).
 */
export class LayerPortal {
  private homeParent: Node | null = null;
  private homeNext: ChildNode | null = null;
  private elevating = false;

  /** True while `appendChild` runs — skip home clear in disconnectedCallback. */
  get isElevating(): boolean {
    return this.elevating;
  }

  elevate(el: HTMLElement): void {
    if (el.parentNode === document.body) return;
    this.homeParent = el.parentNode;
    this.homeNext = el.nextSibling;
    this.elevating = true;
    try {
      document.body.appendChild(el);
    } finally {
      this.elevating = false;
    }
  }

  restore(el: HTMLElement): void {
    if (!this.homeParent) return;
    this.homeParent.insertBefore(el, this.homeNext);
    this.clearHome();
  }

  /** Drop remembered home without moving the node (e.g. already disconnected). */
  clearHome(): void {
    this.homeParent = null;
    this.homeNext = null;
  }
}