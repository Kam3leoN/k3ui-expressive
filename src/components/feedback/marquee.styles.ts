import { css } from 'lit';

export const marqueeStyles = css`
  :host {
    display: block;
    overflow: hidden;
    --k3-marquee-gap: 5rem;
    --k3-marquee-duration: 20s;
  }

  .viewport {
    overflow: hidden;
    width: 100%;
    mask-image: linear-gradient(
      to right,
      transparent,
      #000 8%,
      #000 92%,
      transparent
    );
  }

  .viewport[data-state='paused'] .track {
    animation-play-state: paused;
  }

  .track {
    display: flex;
    width: max-content;
    gap: var(--k3-marquee-gap);
    will-change: transform;
  }

  .track--infinite {
    animation: k3-marquee-infinite-left var(--k3-marquee-duration) linear infinite;
  }

  .track--infinite[data-direction='right'] {
    animation-name: k3-marquee-infinite-right;
  }

  .track--classic {
    animation: k3-marquee-classic-left var(--k3-marquee-duration) linear infinite;
  }

  .track--classic[data-direction='right'] {
    animation-name: k3-marquee-classic-right;
  }

  .set {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--k3-marquee-gap);
  }

  .viewport[data-pause-hover='true']:hover .track {
    animation-play-state: paused;
  }

  @keyframes k3-marquee-infinite-left {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(calc(-50% - var(--k3-marquee-gap) / 2));
    }
  }

  @keyframes k3-marquee-infinite-right {
    from {
      transform: translateX(calc(-50% - var(--k3-marquee-gap) / 2));
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes k3-marquee-classic-left {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(-100%);
    }
  }

  @keyframes k3-marquee-classic-right {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(100%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .track {
      animation: none !important;
      transform: none !important;
    }
  }
`;
