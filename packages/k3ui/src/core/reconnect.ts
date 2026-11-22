/**
 * Re-bind after DOM reparent (e.g. playground demo-enhance).
 * Lit `firstUpdated` runs once — `disconnectedCallback` tears down; on
 * reconnect `hasUpdated` is true so we must re-attach controllers.
 */

export interface ReconnectHost {
  readonly hasUpdated: boolean;
}

/** Run `fn` when the host has already completed a first update (reconnect). */
export function runWhenConnected(host: ReconnectHost, fn: () => void): void {
  if (host.hasUpdated) fn();
}