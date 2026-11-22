/**
 * Lit controller — press jelly when `data-k3-motion="fluid"`.
 * Attach once per interactive host (button, FAB, icon-button, …).
 */
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { attachFluidPress, type FluidPressHandle } from './fluid.js';

type Host = ReactiveControllerHost & HTMLElement;

export class FluidPressController implements ReactiveController {
  #handle?: FluidPressHandle;
  #attached = false;

  constructor(
    private readonly host: Host,
    private readonly resolveTarget?: () => HTMLElement | null | undefined,
  ) {
    host.addController(this);
  }

  hostUpdated(): void {
    if (this.#attached) return;
    const target = this.resolveTarget?.() ?? undefined;
    this.#handle = attachFluidPress(this.host, {
      target: target ?? undefined,
    });
    this.#attached = true;
  }

  hostDisconnected(): void {
    this.#handle?.detach();
    this.#handle = undefined;
    this.#attached = false;
  }
}
