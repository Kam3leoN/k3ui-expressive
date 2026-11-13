/**
 * Navigation Rail playground lab — one live rail + option controls.
 * FAB morph matches the shell (`k3-extended-fab` only).
 */

type RailEl = HTMLElement & {
  size: 'compact' | 'large';
  layout: 'modal' | 'standard';
  position: 'start' | 'center' | 'bottom';
  collapsible: boolean;
  expanded: boolean;
};

type SelectEl = HTMLElement & { value?: string };
type SwitchEl = HTMLElement & { selected?: boolean };

let wired = false;

/** Wire `#nr-lab` controls once (idempotent). */
export function wireNavRailLab(): void {
  const rail = document.getElementById('nr-lab') as RailEl | null;
  const stage = document.getElementById('nr-stage');
  if (!rail || !stage || wired) return;
  wired = true;

  const layoutSel = document.getElementById('nr-layout') as SelectEl | null;
  const positionSel = document.getElementById('nr-position') as SelectEl | null;
  const sizeSel = document.getElementById('nr-size') as SelectEl | null;
  const collapsibleSw = document.getElementById('nr-collapsible') as SwitchEl | null;
  const fabSw = document.getElementById('nr-fab') as SwitchEl | null;
  const trailingSw = document.getElementById('nr-trailing') as SwitchEl | null;
  const fab = document.getElementById('nr-lab-fab');
  const trailItems = [
    document.getElementById('nr-lab-trail-settings'),
    document.getElementById('nr-lab-trail-profile'),
  ].filter(Boolean) as HTMLElement[];

  let syncingSizeSel = false;
  let booted = false;

  const isLarge = (): boolean => rail.size === 'large' || rail.expanded;

  const syncStage = (): void => {
    const size = isLarge() ? 'large' : 'compact';
    stage.dataset.layout = rail.layout === 'standard' ? 'standard' : 'modal';
    stage.dataset.size = size;
    if (sizeSel && sizeSel.value !== size) {
      syncingSizeSel = true;
      sizeSel.value = size;
      syncingSizeSel = false;
    }
  };

  const syncFab = (): void => {
    if (!fab) return;
    const on = fabSw?.selected !== false;
    if (on) {
      fab.slot = 'fab';
      fab.hidden = false;
    } else {
      fab.removeAttribute('slot');
      fab.hidden = true;
    }
  };

  const syncTrailing = (): void => {
    const on = trailingSw?.selected !== false;
    for (const el of trailItems) {
      if (on) el.slot = 'trailing';
      else el.removeAttribute('slot');
      el.hidden = !on;
    }
  };

  const setSize = (next: 'compact' | 'large', viaSel: boolean): void => {
    const wantLarge = next === 'large';
    if (wantLarge === isLarge()) return;
    /* Prefer the rail toggle so collapse/expand morph stays soft (same as shell). */
    if (booted && viaSel && rail.collapsible) {
      rail.shadowRoot?.querySelector<HTMLElement>('.toggle')?.click();
      return;
    }
    rail.size = next;
    rail.expanded = wantLarge;
  };

  const applyControls = (opts?: { sizeFromSel?: boolean }): void => {
    if (layoutSel?.value === 'standard' || layoutSel?.value === 'modal') {
      rail.layout = layoutSel.value;
    }
    if (
      positionSel?.value === 'start' ||
      positionSel?.value === 'center' ||
      positionSel?.value === 'bottom'
    ) {
      rail.position = positionSel.value;
    }
    if (sizeSel?.value === 'compact' || sizeSel?.value === 'large') {
      setSize(sizeSel.value, opts?.sizeFromSel === true);
    }
    rail.collapsible = collapsibleSw?.selected !== false;
    syncFab();
    syncTrailing();
    syncStage();
  };

  layoutSel?.addEventListener('k3-change', () => applyControls());
  positionSel?.addEventListener('k3-change', () => applyControls());
  sizeSel?.addEventListener('k3-change', () => {
    if (syncingSizeSel) return;
    applyControls({ sizeFromSel: true });
  });
  collapsibleSw?.addEventListener('k3-change', () => applyControls());
  fabSw?.addEventListener('k3-change', () => applyControls());
  trailingSw?.addEventListener('k3-change', () => applyControls());
  rail.addEventListener('k3-expand', () => syncStage());

  applyControls();
  booted = true;
}
