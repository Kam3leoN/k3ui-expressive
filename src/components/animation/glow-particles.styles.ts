import { css } from 'lit';

export const glowParticlesStyles = css`
  :host {
    display: block;
    position: relative;
    overflow: hidden;
    min-block-size: var(--k3-glow-particles-min-block-size, 12rem);
    border-radius: var(--k3-glow-particles-radius, var(--k3-sys-shape-corner-extra-large, 1.75rem));
    background: var(--k3-glow-particles-bg, #0b1220);
    color: var(--k3-sys-color-on-surface, #fff);
  }

  canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .content {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    min-block-size: inherit;
    padding: var(--k3-sys-spacing-space300, 1rem);
    text-align: center;
    pointer-events: none;
  }

  .content ::slotted(*) {
    pointer-events: auto;
  }
`;
