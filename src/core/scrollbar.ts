import { css } from 'lit';

/**
 * Discreet edge scrollbar — flush to the scrollport edge, no Windows arrows.
 *
 * Apply class **`k3-scroll`** on the overflow element. Override size with
 * `--k3-scroll-size` (default 6dp).
 *
 * **Rounded scrollports:** set `--k3-scroll-track-inset` ≥ the element’s
 * `border-radius`. WebKit paints the gutter as a rectangle — without inset the
 * thumb cuts through the curve. Match the radius token (ex. extra-large → 1.75rem).
 *
 * Do **not** set `scrollbar-width` / `scrollbar-color` on WebKit hosts:
 * Chromium 121+ lets those override `::-webkit-scrollbar-*` and keeps the
 * arrow buttons (incident already hit on side sheets).
 *
 * Keep in sync with `src/tokens/_scrollbar.scss` (light DOM / docs).
 *
 * @see sheet side content · dialog body
 */
export const edgeScrollbarStyles = css`
  .k3-scroll {
    --k3-scroll-size: 0.375rem; /* 6dp — discreet */
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .k3-scroll::-webkit-scrollbar {
    width: var(--k3-scroll-size);
    height: var(--k3-scroll-size);
  }
  .k3-scroll::-webkit-scrollbar-button {
    width: 0;
    height: 0;
    display: none;
    background: transparent;
    border: 0;
  }
  .k3-scroll::-webkit-scrollbar-track {
    background: transparent;
    margin-block: var(--k3-scroll-track-inset, 0);
  }
  .k3-scroll::-webkit-scrollbar-thumb {
    background: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface-variant) 40%,
      transparent
    );
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    border: 0;
    min-height: 2rem;
  }
  .k3-scroll::-webkit-scrollbar-thumb:hover {
    background: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface-variant) 55%,
      transparent
    );
  }
  .k3-scroll::-webkit-scrollbar-corner {
    background: transparent;
  }

  @supports not selector(::-webkit-scrollbar) {
    .k3-scroll {
      scrollbar-width: thin;
      scrollbar-color: color-mix(
          in srgb,
          var(--k3-sys-color-on-surface-variant) 40%,
          transparent
        )
        transparent;
    }
  }
`;
