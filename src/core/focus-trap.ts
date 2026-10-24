const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export class FocusTrap {
  private previous: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private onKey: ((e: KeyboardEvent) => void) | null = null;

  activate(container: HTMLElement): void {
    this.deactivate({ restore: false });
    this.previous = document.activeElement as HTMLElement | null;
    this.container = container;
    this.onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (n) => !n.hasAttribute('disabled') && n.offsetParent !== null,
      );
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    container.addEventListener('keydown', this.onKey);
    const first = container.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
  }

  /** @param restore — focus previously focused node (default true) */
  deactivate(opts: { restore?: boolean } = {}): void {
    const restore = opts.restore !== false;
    if (this.container && this.onKey) {
      this.container.removeEventListener('keydown', this.onKey);
    }
    this.onKey = null;
    this.container = null;
    if (restore) this.previous?.focus?.();
    this.previous = null;
  }

  get keyHandler(): ((e: KeyboardEvent) => void) | null {
    return this.onKey;
  }
}