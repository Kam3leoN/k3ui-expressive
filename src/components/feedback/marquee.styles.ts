import { css } from 'lit';

export const marqueeStyles = css`
  :host {
    display: block;
    /* Full width even as a flex item — a classic pass must cross the whole space */
    inline-size: 100%;
    min-inline-size: 0;
    box-sizing: border-box;
    overflow: hidden;
    --k3-marquee-gap: 5rem;
    /* Edge fade (0% to disable) */
    --k3-marquee-fade: 8%;
  }

  :host([direction='up']),
  :host([direction='down']) {
    /* Vertical scrolling needs a height (MarqueeJS: containerHeight) */
    block-size: var(--k3-marquee-height, 12rem);
  }

  .viewport {
    position: relative;
    overflow: hidden;
    inline-size: 100%;
    block-size: 100%;
    /* Fade length 0 / none → no mask (full-bleed to the host edge) */
    mask-image: linear-gradient(
      to right,
      transparent,
      #000 var(--k3-marquee-fade, 8%),
      #000 calc(100% - var(--k3-marquee-fade, 8%)),
      transparent
    );
  }

  .viewport[data-axis='y'] {
    mask-image: linear-gradient(
      to bottom,
      transparent,
      #000 var(--k3-marquee-fade, 8%),
      #000 calc(100% - var(--k3-marquee-fade, 8%)),
      transparent
    );
  }

  :host([data-fade='off']) .viewport {
    mask-image: none;
  }

  .track {
    display: flex;
    inline-size: max-content;
    gap: var(--k3-marquee-gap);
    will-change: transform;
  }

  /* Right / down: copies extend backwards; the anchor offset is set in JS */
  .viewport[data-direction='right'] .track {
    flex-direction: row-reverse;
  }

  .viewport[data-axis='y'] .track {
    flex-direction: column;
    inline-size: 100%;
    block-size: max-content;
  }

  .viewport[data-direction='down'] .track {
    flex-direction: column-reverse;
  }

  .set,
  .sep {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--k3-marquee-gap);
  }

  .viewport[data-axis='y'] .set {
    flex-direction: column;
  }

  .sep {
    color: var(--k3-marquee-separator-color, currentColor);
    opacity: 0.6;
  }

  /* Reduced motion: no movement — the original content scrolls by hand instead */
  .viewport[data-state='reduced'] {
    overflow: auto;
    mask-image: none;
  }

  .viewport[data-state='reduced'] .clone,
  .viewport[data-state='reduced'] .sep {
    display: none;
  }
`;
