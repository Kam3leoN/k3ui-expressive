import { css } from 'lit';

/**
 * M3 badge — small (6dp dot) · large (16dp pill, max 4 chars / 999+).
 * Logical corners (`*-start` / `*-end`) mirror in RTL.
 * Physical corners (`*-left` / `*-right`) stay fixed.
 *
 * @see https://m3.material.io/components/badges/specs
 */
export const badgeStyles = css`
  :host {
    --k3-badge-dot-size: 0.375rem; /* 6 */
    --k3-badge-large-size: 1rem; /* 16 */
    --k3-badge-large-pad-inline: 0.25rem; /* 4 */
    --k3-badge-dot-offset: 0;
    --k3-badge-large-offset-block: -0.125rem;
    --k3-badge-large-offset-inline: -0.25rem;
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    vertical-align: middle;
  }

  .badge {
    position: absolute;
    z-index: 1;
    box-sizing: border-box;
    display: grid;
    place-items: center;
    pointer-events: none;
    background: var(--k3-sys-color-error);
    color: var(--k3-sys-color-on-error);
    border-radius: var(--k3-sys-shape-corner-full);
    font-family: var(--k3-ref-typeface-plain, inherit);
    font-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
    font-weight: var(--k3-sys-typescale-label-small-weight, 500);
    letter-spacing: var(--k3-sys-typescale-label-small-tracking, 0.03rem);
    line-height: 1;
    white-space: nowrap;
  }

  .badge[data-size='large'] {
    min-width: var(--k3-badge-large-size);
    height: var(--k3-badge-large-size);
    padding-inline: var(--k3-badge-large-pad-inline);
  }

  .badge[data-size='dot'] {
    min-width: 0;
    width: var(--k3-badge-dot-size);
    height: var(--k3-badge-dot-size);
    padding: 0;
  }

  .badge[hidden] {
    display: none;
  }

  /* ── Logical corners (RTL-aware) ───────────────────────────────────────── */
  :host(:not([position])) .badge[data-size='dot'],
  :host([position='top-end']) .badge[data-size='dot'] {
    inset-block-start: var(--k3-badge-dot-offset);
    inset-inline-end: var(--k3-badge-dot-offset);
  }
  :host(:not([position])) .badge[data-size='large'],
  :host([position='top-end']) .badge[data-size='large'] {
    inset-block-start: var(--k3-badge-large-offset-block);
    inset-inline-end: var(--k3-badge-large-offset-inline);
  }

  :host([position='top-start']) .badge[data-size='dot'] {
    inset-block-start: var(--k3-badge-dot-offset);
    inset-inline-start: var(--k3-badge-dot-offset);
  }
  :host([position='top-start']) .badge[data-size='large'] {
    inset-block-start: var(--k3-badge-large-offset-block);
    inset-inline-start: var(--k3-badge-large-offset-inline);
  }

  :host([position='bottom-end']) .badge[data-size='dot'] {
    inset-block-end: var(--k3-badge-dot-offset);
    inset-inline-end: var(--k3-badge-dot-offset);
  }
  :host([position='bottom-end']) .badge[data-size='large'] {
    inset-block-end: var(--k3-badge-large-offset-block);
    inset-inline-end: var(--k3-badge-large-offset-inline);
  }

  :host([position='bottom-start']) .badge[data-size='dot'] {
    inset-block-end: var(--k3-badge-dot-offset);
    inset-inline-start: var(--k3-badge-dot-offset);
  }
  :host([position='bottom-start']) .badge[data-size='large'] {
    inset-block-end: var(--k3-badge-large-offset-block);
    inset-inline-start: var(--k3-badge-large-offset-inline);
  }

  /* ── Physical corners (ignore writing direction) ───────────────────────── */
  :host([position='top-right']) .badge[data-size='dot'] {
    top: var(--k3-badge-dot-offset);
    right: var(--k3-badge-dot-offset);
  }
  :host([position='top-right']) .badge[data-size='large'] {
    top: var(--k3-badge-large-offset-block);
    right: var(--k3-badge-large-offset-inline);
  }

  :host([position='top-left']) .badge[data-size='dot'] {
    top: var(--k3-badge-dot-offset);
    left: var(--k3-badge-dot-offset);
  }
  :host([position='top-left']) .badge[data-size='large'] {
    top: var(--k3-badge-large-offset-block);
    left: var(--k3-badge-large-offset-inline);
  }

  :host([position='bottom-right']) .badge[data-size='dot'] {
    bottom: var(--k3-badge-dot-offset);
    right: var(--k3-badge-dot-offset);
  }
  :host([position='bottom-right']) .badge[data-size='large'] {
    bottom: var(--k3-badge-large-offset-block);
    right: var(--k3-badge-large-offset-inline);
  }

  :host([position='bottom-left']) .badge[data-size='dot'] {
    bottom: var(--k3-badge-dot-offset);
    left: var(--k3-badge-dot-offset);
  }
  :host([position='bottom-left']) .badge[data-size='large'] {
    bottom: var(--k3-badge-large-offset-block);
    left: var(--k3-badge-large-offset-inline);
  }
`;
