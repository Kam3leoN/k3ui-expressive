import { css } from 'lit';

/**
 * QR Code host — surface for qr-code-styling SVG/canvas output.
 * Circle shape keeps overflow visible so decorative outer dots are not clipped.
 */
export const qrCodeStyles = css`
  :host {
    display: inline-flex;
    box-sizing: border-box;
    line-height: 0;
    color: var(--k3-sys-color-on-surface);
    --k3-qr-dots: var(--k3-sys-color-on-surface);
    --k3-qr-corners-square: var(--k3-sys-color-on-surface);
    --k3-qr-corners-dot: var(--k3-sys-color-on-surface);
    --k3-qr-background: transparent;
    --k3-qr-frame: var(--k3-qr-dots);
    --k3-qr-frame-width: 3px;
    --k3-qr-frame-gap: 10px;
  }

  :host([hidden]) {
    display: none !important;
  }

  :host([color='primary']) {
    --k3-qr-dots: var(--k3-sys-color-primary);
    --k3-qr-corners-square: var(--k3-sys-color-primary);
    --k3-qr-corners-dot: var(--k3-sys-color-primary);
    --k3-qr-frame: var(--k3-sys-color-primary);
  }
  :host([color='secondary']) {
    --k3-qr-dots: var(--k3-sys-color-secondary);
    --k3-qr-corners-square: var(--k3-sys-color-secondary);
    --k3-qr-corners-dot: var(--k3-sys-color-secondary);
    --k3-qr-frame: var(--k3-sys-color-secondary);
  }
  :host([color='tertiary']) {
    --k3-qr-dots: var(--k3-sys-color-tertiary);
    --k3-qr-corners-square: var(--k3-sys-color-tertiary);
    --k3-qr-corners-dot: var(--k3-sys-color-tertiary);
    --k3-qr-frame: var(--k3-sys-color-tertiary);
  }
  :host([color='error']) {
    --k3-qr-dots: var(--k3-sys-color-error);
    --k3-qr-corners-square: var(--k3-sys-color-error);
    --k3-qr-corners-dot: var(--k3-sys-color-error);
    --k3-qr-frame: var(--k3-sys-color-error);
  }
  :host([color='on-surface-variant']) {
    --k3-qr-dots: var(--k3-sys-color-on-surface-variant);
    --k3-qr-corners-square: var(--k3-sys-color-on-surface-variant);
    --k3-qr-corners-dot: var(--k3-sys-color-on-surface-variant);
    --k3-qr-frame: var(--k3-sys-color-on-surface-variant);
  }

  /* Optional stroke frame around the QR (square or circle). */
  :host([framed]) {
    padding: var(--k3-qr-frame-gap);
    border: var(--k3-qr-frame-width) solid var(--k3-qr-frame);
    background: var(--k3-qr-background, transparent);
  }

  :host([framed]:not([shape='circle'])) {
    border-radius: var(--k3-sys-shape-corner-large, 1rem);
  }

  :host([framed][shape='circle']) {
    border-radius: 50%;
    overflow: hidden; /* ring clips the circular matrix cleanly */
  }

  .frame {
    display: block;
    width: var(--k3-qr-size, 160px);
    height: var(--k3-qr-size, 160px);
    border-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
    overflow: hidden;
    background: transparent;
  }

  /*
   * Circle shape — qr-code-styling paints decorative dots around the matrix.
   * Do not clip; the library owns the circular silhouette.
   */
  :host([shape='circle']) .frame {
    border-radius: 0;
    overflow: visible;
  }

  .frame :where(svg, canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .placeholder {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    background: var(--k3-sys-color-surface-container);
    color: var(--k3-sys-color-on-surface-variant);
    font-family: var(--k3-ref-typeface-plain);
    font-size: var(--k3-sys-typescale-label-medium-size, 0.75rem);
    line-height: 1.2;
    text-align: center;
    padding: var(--k3-sys-spacing-space200);
    box-sizing: border-box;
    border-radius: inherit;
  }
`;
