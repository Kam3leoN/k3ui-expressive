/** Vite/vitest fallback when sibling `../k3ux` is not checked out. */

export function getSoundFx(): { isMuted: () => boolean; setMuted: (_m: boolean) => void } {
  return { isMuted: () => true, setMuted: () => {} };
}

const stubRegistry = {
  isKnown: () => false,
  registerAll: async () => {},
};

if (typeof window !== 'undefined') {
  (window as Window & { K3UX?: { registry?: typeof stubRegistry } }).K3UX = {
    registry: stubRegistry,
  };
}