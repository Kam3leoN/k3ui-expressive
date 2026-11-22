import { css } from 'lit';

export const skeletonStyles = css`
      :host {
        --k3-skeleton-color: var(--k3-sys-color-surface-container-highest);
        --k3-skeleton-tint-color: var(--k3-sys-color-on-surface);
        --k3-skeleton-tint-opacity: 8%;
        --k3-skeleton-accent-color: var(--k3-sys-color-on-surface);
        --k3-skeleton-accent-opacity: 0.08;
        --k3-skeleton-rounded-shape: var(--k3-sys-shape-corner-medium, 0.75rem);
        --k3-skeleton-circular-shape: var(--k3-sys-shape-corner-full, 999px);
        --k3-skeleton-square-shape: 0;
        --k3-skeleton-shape: var(--k3-skeleton-rounded-shape);

        display: inline-block;
        position: relative;
        vertical-align: middle;
        box-sizing: border-box;
        overflow: hidden;
        border-radius: var(--k3-skeleton-shape);
        /* Standalone default bone when no size / slot */
        min-width: 5rem; /* 80 */
        min-height: 1rem; /* 16 — text line */
      }

      :host([block]) {
        display: block;
        width: 100%;
      }

      :host([shape='circular']),
      :host([shape='auto'].circular) {
        --k3-skeleton-shape: var(--k3-skeleton-circular-shape);
        aspect-ratio: 1;
        min-width: 2.5rem;
        min-height: 2.5rem;
      }
      :host([shape='rounded']),
      :host([shape='auto']:not(.circular):not(.square)) {
        --k3-skeleton-shape: var(--k3-skeleton-rounded-shape);
      }
      :host([shape='square']),
      :host([shape='auto'].square) {
        --k3-skeleton-shape: var(--k3-skeleton-square-shape);
      }

      :host([has-content]) {
        min-width: 0;
        min-height: 0;
      }
      /* Empty bone + loaded = remove placeholder (nothing to reveal) */
      :host([loaded]:not([has-content])) {
        display: none !important;
      }

      .bone {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        box-sizing: border-box;
        border-radius: inherit;
        background-color: var(--k3-skeleton-color);
        opacity: 1;
        transition: opacity var(--k3-sys-motion-duration-short3, 150ms)
          var(--k3-sys-motion-easing-standard, ease);
        overflow: hidden;
      }
      .bone::before {
        content: '';
        position: absolute;
        inset: 0;
        background-color: color-mix(
          in srgb,
          var(--k3-skeleton-tint-color) var(--k3-skeleton-tint-opacity),
          transparent
        );
      }

      /* Pulse — soft breathe (not a hard blink) */
      .bone.pulse::after {
        content: '';
        position: absolute;
        inset: 0;
        background-color: var(--k3-skeleton-tint-color);
        opacity: 0.06;
        animation: k3-skeleton-pulse 2s ease-in-out infinite;
      }

      /*
       * Wave — sweeping shimmer band (preferred).
       * translateX band > host so the highlight reads as a continuous wave.
       */
      .bone.wave::after {
        content: '';
        position: absolute;
        inset: 0;
        background-image: linear-gradient(
          105deg,
          transparent 0%,
          transparent 40%,
          color-mix(in srgb, var(--k3-skeleton-accent-color) 28%, transparent) 50%,
          transparent 60%,
          transparent 100%
        );
        background-size: 220% 100%;
        background-repeat: no-repeat;
        animation: k3-skeleton-wave 1.7s ease-in-out infinite;
      }

      :host([loaded]) .bone {
        opacity: 0;
        pointer-events: none;
      }
      :host([loaded]) .bone::after {
        animation: none;
      }

      .content {
        position: relative;
        z-index: 0;
        display: block;
        width: 100%;
        height: 100%;
      }
      :host(:not([has-content])) .content {
        display: none;
      }
      :host(:not([loaded])) .content {
        visibility: hidden;
      }

      @keyframes k3-skeleton-pulse {
        0%,
        100% {
          opacity: 0.04;
        }
        50% {
          opacity: 0.12;
        }
      }
      @keyframes k3-skeleton-wave {
        0% {
          background-position: 120% 0;
        }
        100% {
          background-position: -120% 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .bone::after {
          animation: none !important;
        }
        :host([loaded]) .bone {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        .bone {
          background-color: GrayText;
        }
        .bone::after {
          display: none;
        }
      }
    `;
