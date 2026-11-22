import { css } from 'lit';

/**
 * Styles for `k3-menu-group` — one elevated plate in a gap stack.
 *
 * Pad 4 all (= menu container pad, visible on every gap surface).
 * Outer corner 16 · gap-facing inner via `--k3-menu-group-radius` from parent.
 * Soft box-shadow here (never filter on elev — that broke fixed flyouts).
 */
export const menuGroupStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    width: 100%;
    flex: 0 0 auto;
    /* Pad 4 — !important beats Tailwind preflight on CE host */
    padding: 0.25rem !important;
    border-radius: var(
      --k3-menu-group-radius,
      var(--k3-menu-surface-radius, var(--k3-sys-shape-corner-large))
    );
    background: var(--k3-menu-bg, var(--k3-sys-color-surface-container-low));
    color: var(--k3-menu-fg, var(--k3-sys-color-on-surface));
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.08),
      0 2px 10px rgb(0 0 0 / 0.1);
    min-width: var(--k3-menu-min-w, 7rem);
  }
  .inner {
    display: flex;
    flex-direction: column;
    gap: 0.125rem; /* 2 — non-connected item gap */
    width: 100%;
  }
  /* Connected — items share one shape, no inter-item gap */
  :host([connected]) .inner {
    gap: 0;
  }
  :host([connected]) ::slotted(k3-menu-item) {
    --k3-menu-item-radius: 0;
  }
  :host([connected]) ::slotted(k3-menu-item:first-child) {
    --k3-menu-item-radius: var(--k3-sys-shape-corner-medium)
      var(--k3-sys-shape-corner-medium) 0 0;
  }
  :host([connected]) ::slotted(k3-menu-item:last-child) {
    --k3-menu-item-radius: 0 0 var(--k3-sys-shape-corner-medium)
      var(--k3-sys-shape-corner-medium);
  }
  :host([connected]) ::slotted(k3-menu-item:only-child) {
    --k3-menu-item-radius: var(--k3-sys-shape-corner-medium);
  }
`;