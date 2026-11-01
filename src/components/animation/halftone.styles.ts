import { css } from 'lit';

export const halftoneStyles = css`
  :host {
    display: block;
    position: relative;
    overflow: hidden;
    border-radius: var(--k3-halftone-radius, inherit);
    isolation: isolate;
  }

  .content {
    display: block;
    position: relative;
    z-index: 0;
  }

  /* CSS/SVG lookalike of Figma Community “Halftone” — radial dot screen */
  .screen {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    border-radius: inherit;
    background-color: transparent;
    /* Dual lattice (row offset) ≈ print / Figma Community halftone */
    background-image:
      radial-gradient(
        circle closest-side,
        var(--k3-halftone-dot, #0a0a0a) 0%,
        var(--k3-halftone-dot, #0a0a0a) 55%,
        transparent 56%
      ),
      radial-gradient(
        circle closest-side,
        var(--k3-halftone-dot, #0a0a0a) 0%,
        var(--k3-halftone-dot, #0a0a0a) 55%,
        transparent 56%
      );
    background-size:
      var(--k3-halftone-cell, 10px) var(--k3-halftone-cell, 10px),
      var(--k3-halftone-cell, 10px) var(--k3-halftone-cell, 10px);
    background-position:
      0 0,
      calc(var(--k3-halftone-cell, 10px) / 2) calc(var(--k3-halftone-cell, 10px) / 2);
    opacity: var(--k3-halftone-opacity, 0.55);
    mix-blend-mode: var(--k3-halftone-blend, multiply);
  }

  :host([tone='light']) .screen {
    mix-blend-mode: var(--k3-halftone-blend, soft-light);
  }

  :host([animated]) .screen {
    animation: k3-halftone-drift var(--k3-halftone-duration, 12s) linear infinite;
  }

  @keyframes k3-halftone-drift {
    from {
      background-position:
        0 0,
        calc(var(--k3-halftone-cell, 10px) / 2) calc(var(--k3-halftone-cell, 10px) / 2);
    }
    to {
      background-position:
        var(--k3-halftone-cell, 10px) var(--k3-halftone-cell, 10px),
        calc(var(--k3-halftone-cell, 10px) * 1.5) calc(var(--k3-halftone-cell, 10px) * 1.5);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host([animated]) .screen {
      animation: none;
    }
  }
`;
