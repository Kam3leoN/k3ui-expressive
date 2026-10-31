/**
 * Demo frame enhancer — m3.material.io case layout for EVERY component page.
 *
 * Patterns covered:
 * 1. Existing `--cases|--demo|--icon-button|--fab` frames → numbered `.demo-case`
 * 2. Control rows (`.surface.row`, `.row.wrap`, `.avatar-demo-row`, `.badge-demo-*`, …)
 * 3. `.grid-2` / `.grid-3` of k3-* or field stacks → one case per column
 * 4. `.surface.stack` control runs (+ page-level `.variant-guide` → under frame)
 * 5. Lone `.surface > k3-*` (slider, progress, toolbar, prev-next)
 * 6. `.variant-block` / `.surface-rail` / `.sticky-demo` wrappers
 */

const SKIP_FRAME =
  '.demo-frame--width-matrix, .demo-frame--fab-menu, [data-demo-enhance="off"]';

const CASE_FRAME =
  '.demo-frame--cases, .demo-frame--demo, .demo-frame--icon-button, .demo-frame--fab';

const SKIP_HOST =
  '.color-tone-row, .color-role-swatch, .token-scale, .catalog-grid, .shell-sheet-link, [data-demo-enhance="off"]';

const SKIP_PAGE =
  '[data-page="home"], [data-page="quick-start"], [data-page^="color-"], [data-page="elevation"], [data-page="icons"], [data-page="motion"], [data-page="shapes"], [data-page="spacing"], [data-page="typography"]';

/** Components that need full-width stacked cases (not equal horizontal columns). */
const WIDE_TAG = new Set([
  'k3-button-group',
  'k3-list',
  'k3-top-app-bar',
  'k3-footer-bar',
  'k3-table',
  'k3-tabs',
  'k3-nav-bar',
  'k3-nav-rail',
  'k3-toolbar',
  'k3-doc-nav',
  'k3-field-group',
  'k3-text-field',
  'k3-textarea',
  'k3-pin-field',
  'k3-select',
  'k3-slider',
  'k3-progress',
  'k3-card',
  'k3-carousel',
  'k3-menu',
  'k3-avatar-group',
]);

/** Element check that works in browser + jsdom without global HTMLElement. */
function isEl(n: unknown): n is HTMLElement {
  return !!n && typeof n === 'object' && (n as Node).nodeType === 1;
}

function isOlGuide(n: Element | null | undefined): n is HTMLOListElement {
  return !!n && n.tagName === 'OL' && n.classList.contains('variant-guide');
}

function isWideControl(el: Element): boolean {
  return WIDE_TAG.has(el.tagName.toLowerCase());
}

/** Overlays — never wrap as demo cases (Popover / elevate above frames). */
const OVERLAY_TAG = new Set([
  'k3-date-picker',
  'k3-time-picker',
  'k3-dialog',
  'k3-sheet',
  'k3-snackbar',
  'k3-menu',
]);

function isOverlayControl(el: Element): boolean {
  return OVERLAY_TAG.has(el.tagName.toLowerCase());
}

function isDemoControl(el: Element): boolean {
  if (!isEl(el)) return false;
  if (el.matches(SKIP_HOST)) return false;
  if (el.closest('.demo-block, .demo-frame, .doc-usage, .doc-tables, .code-sample')) return false;
  const t = el.tagName.toLowerCase();
  if (isOverlayControl(el)) return false;
  if (t.startsWith('k3-')) return true;
  if (t === 'button' || el.classList.contains('ripple-demo-surface')) return true;
  return false;
}

/** Extract the visual demo unit from a row child (figure → badge, etc.). */
function unitFromRowChild(el: HTMLElement): HTMLElement | null {
  if (isDemoControl(el)) return el;
  if (el.matches('figure.badge-demo-item, .tooltip-variant-card')) return el;
  if (el.matches('.surface-rail')) return el;
  const nested = [...el.children].find((c) => c.tagName.toLowerCase().startsWith('k3-'));
  return isEl(nested) ? nested : null;
}

/** Wrap one control into a numbered demo case. */
export function wrapAsCase(el: Element, index: number): HTMLElement {
  const doc = el.ownerDocument;
  const caseEl = doc.createElement('div');
  caseEl.className = 'demo-case';
  const stage = doc.createElement('div');
  stage.className = 'demo-case-stage';
  const num = doc.createElement('span');
  num.className = 'demo-case-num';
  num.setAttribute('aria-hidden', 'true');
  num.textContent = String(index + 1);
  el.replaceWith(caseEl);
  stage.append(el);
  caseEl.append(stage, num);
  return caseEl;
}

function needsStackLayout(controls: Element[]): boolean {
  return controls.some(isWideControl) || controls.length === 1;
}

/**
 * Insert demo-block + frame at `anchor`, moving `controls` into cases.
 * Optionally attach `guide` under the frame.
 */
function insertDemoBlock(
  controls: HTMLElement[],
  guide?: HTMLElement | null,
  opts?: { stack?: boolean },
): HTMLElement | null {
  if (!controls.length) return null;
  const anchor = controls[0]!;
  const parent = anchor.parentNode;
  if (!parent) return null;

  const doc = anchor.ownerDocument;
  const marker = doc.createComment('k3-demo');
  parent.insertBefore(marker, anchor);
  if (guide?.parentNode) guide.remove();

  const block = doc.createElement('div');
  block.className = 'demo-block';
  const frame = doc.createElement('div');
  const stack = opts?.stack ?? needsStackLayout(controls);
  frame.className = stack
    ? 'demo-frame demo-frame--cases demo-frame--stack'
    : 'demo-frame demo-frame--cases items-end';
  for (const c of controls) frame.append(c);
  block.append(frame);
  enhanceDemoFrame(frame);
  if (guide) block.append(guide);
  marker.replaceWith(block);
  return block;
}

/** Enhance a single frame — no-op if already structured or excluded. */
export function enhanceDemoFrame(frame: Element): number {
  if (!isEl(frame)) return 0;
  if (frame.matches(SKIP_FRAME)) return 0;
  if (!frame.matches(CASE_FRAME) && !frame.classList.contains('demo-frame')) return 0;
  if (frame.querySelector(':scope > .demo-case, :scope > .demo-case-row')) return 0;
  if (frame.querySelector(':scope > .width-matrix')) return 0;

  const kids = [...frame.children].filter(isEl);
  if (!kids.length) return 0;
  kids.forEach((kid, i) => wrapAsCase(kid, i));
  frame.classList.add('demo-frame--cases');
  return kids.length;
}

/**
 * Immediate previous `.variant-guide` only when its pill count matches the case count
 * (avoids stealing skeleton’s 3-pill guide onto a lone toggle button).
 */
function takeLeadingGuide(host: HTMLElement, caseCount: number): HTMLElement | null {
  const prev = host.previousElementSibling;
  if (!isOlGuide(prev)) return null;
  if (prev.children.length !== caseCount) return null;
  return prev;
}

/** Promote a bare control row into demo-block + frame. */
export function promoteDemoHost(host: Element): boolean {
  if (!isEl(host)) return false;
  if (host.closest('.demo-frame, .demo-block, .doc-usage, pre, code, .code-sample')) return false;
  if (host.matches(SKIP_HOST)) return false;
  if (host.dataset.demoEnhance === 'off') return false;
  if (host.closest('[data-demo-enhance="off"]')) return false;
  if (host.closest(SKIP_PAGE)) return false;

  const kids = [...host.children].filter(isEl).filter((k) => !isOverlayControl(k));
  if (!kids.length || kids.length > 16) return false;

  for (const k of kids) {
    if (!unitFromRowChild(k)) return false;
  }

  const guide = takeLeadingGuide(host, kids.length);
  const doc = host.ownerDocument;
  const block = doc.createElement('div');
  block.className = 'demo-block';
  const frame = doc.createElement('div');
  /* Rows of badges/avatars/menus stay horizontal */
  const forceRow = host.matches(
    '.avatar-demo-row, .badge-demo-row, .badge-demo-grid, .tooltip-physical, .row.wrap, .surface.row',
  );
  const stack = !forceRow && needsStackLayout(kids);
  frame.className = stack
    ? 'demo-frame demo-frame--cases demo-frame--stack'
    : 'demo-frame demo-frame--cases items-end';
  kids.forEach((k) => frame.append(k));
  block.append(frame);
  enhanceDemoFrame(frame);
  if (guide) {
    guide.remove();
    block.append(guide);
  }
  host.replaceWith(block);
  return true;
}

/** Promote grid of cards / field columns — each child (k3-* or stack) → one case. */
export function promoteGrid(grid: HTMLElement): boolean {
  if (grid.closest('.demo-block, .demo-frame, .doc-usage')) return false;
  if (grid.closest(SKIP_PAGE)) return false;
  if (grid.dataset.demoEnhance === 'off') return false;

  const kids = [...grid.children].filter(isEl);
  if (kids.length < 1 || kids.length > 6) return false;

  const units: HTMLElement[] = [];

  for (const k of kids) {
    if (isDemoControl(k)) {
      units.push(k);
      continue;
    }
    if (k.classList.contains('stack')) {
      const header = [...k.children].find((c) => c.classList.contains('section-head'));
      const controls = [...k.children].filter((c) =>
        c.tagName.toLowerCase().startsWith('k3-'),
      ) as HTMLElement[];
      if (!controls.length) return false;
      const col = grid.ownerDocument.createElement('div');
      col.className = 'demo-field-col stack gap-md';
      controls.forEach((c) => col.append(c));
      if (isEl(header)) header.after(col);
      else k.append(col);
      units.push(col);
      continue;
    }
    return false;
  }

  const guide = takeLeadingGuide(grid, units.length);
  const doc = grid.ownerDocument;
  const block = doc.createElement('div');
  block.className = 'demo-block';
  const frame = doc.createElement('div');
  frame.className = 'demo-frame demo-frame--cases items-end';
  for (const u of units) frame.append(u);
  block.append(frame);
  enhanceDemoFrame(frame);
  frame.querySelectorAll('.demo-case-stage').forEach((stage) => {
    if (
      stage.querySelector(
        '.demo-field-col, k3-text-field, k3-textarea, k3-pin-field, k3-select, k3-field-group, k3-card',
      )
    ) {
      const s = stage as HTMLElement;
      s.style.flexDirection = 'column';
      s.style.alignItems = 'stretch';
      s.style.width = '100%';
    }
  });
  if (guide) {
    guide.remove();
    block.append(guide);
  }

  const parent = grid.parentNode;
  if (!parent) return false;
  const leftovers: HTMLElement[] = [];
  for (const k of kids) {
    if (!k.isConnected) continue;
    leftovers.push(...([...k.querySelectorAll(':scope > .section-head')] as HTMLElement[]));
  }
  const marker = doc.createComment('k3-grid');
  parent.insertBefore(marker, grid);
  for (const h of leftovers) marker.before(h);
  grid.remove();
  marker.replaceWith(block);
  return true;
}

function isWrapTarget(el: HTMLElement): boolean {
  return (
    isDemoControl(el) ||
    el.classList.contains('sticky-demo') ||
    el.classList.contains('variant-block')
  );
}

/** Wrap consecutive k3-* runs inside a stack (or all controls under one guide). */
export function wrapStackControlRuns(stack: HTMLElement): number {
  if (stack.closest(SKIP_PAGE)) return 0;
  if (stack.dataset.demoEnhance === 'off') return 0;
  if (stack.closest('[data-demo-enhance="off"]')) return 0;
  if (stack.closest('.demo-block, .demo-frame, .doc-usage')) return 0;

  const children = [...stack.children].filter(isEl);
  const guide = children.find(isOlGuide);

  const targets = children.filter(isWrapTarget);
  if (!targets.length) return 0;

  /*
   * Page-level guide → one frame for all targets **only** when pill count matches.
   * Avoids e.g. button-group’s 2-pill “Standard/Connected” guide stuck under 5 cases.
   */
  if (guide && guide.children.length === targets.length) {
    if (insertDemoBlock(targets, guide, { stack: true })) return 1;
    return 0;
  }

  let wrapped = 0;
  let guard = 0;
  while (guard++ < 40) {
    const live = [...stack.children].filter(isEl);
    let runStart = -1;
    for (let i = 0; i < live.length; i++) {
      if (isWrapTarget(live[i]!)) {
        runStart = i;
        break;
      }
    }
    if (runStart < 0) break;

    const strict: HTMLElement[] = [];
    for (let j = runStart; j < live.length; j++) {
      const el = live[j]!;
      if (isWrapTarget(el)) strict.push(el);
      else break;
    }
    if (!strict.length) break;

    const prev = strict[0]!.previousElementSibling;
    const g =
      isOlGuide(prev) && prev.children.length === strict.length ? prev : null;

    if (insertDemoBlock(strict, g)) wrapped++;
    else break;
  }
  return wrapped;
}

/** Lone `.surface` demos (slider / progress / toolbar). */
export function wrapLoneSurface(surface: HTMLElement): boolean {
  if (surface.closest(SKIP_PAGE)) return false;
  if (surface.dataset.demoEnhance === 'off') return false;
  if (surface.classList.contains('stack') || surface.classList.contains('row')) return false;
  if (surface.classList.contains('surface-flush')) return false;
  if (surface.closest('.demo-block, .demo-frame')) return false;
  if (surface.matches(SKIP_HOST)) return false;

  const kids = [...surface.children].filter(isEl);
  const controls = kids.filter(
    (k) => k.tagName.toLowerCase().startsWith('k3-') && !isOverlayControl(k),
  );
  if (controls.length < 1 || controls.length !== kids.length) return false;

  const doc = surface.ownerDocument;
  const block = doc.createElement('div');
  block.className = 'demo-block';
  const frame = doc.createElement('div');
  frame.className = needsStackLayout(controls)
    ? 'demo-frame demo-frame--cases demo-frame--stack'
    : 'demo-frame demo-frame--cases';
  controls.forEach((c) => frame.append(c));
  block.append(frame);
  enhanceDemoFrame(frame);
  surface.replaceWith(block);
  return true;
}

/** Tooltip compass / special hosts → single framed stage. */
function wrapSpecialHosts(root: ParentNode): number {
  let n = 0;
  root
    .querySelectorAll<HTMLElement>(
      '.comp-page .tooltip-compass, .comp-page .tooltip-variants, .comp-page .skeleton-demo-row',
    )
    .forEach((host) => {
      if (host.closest('.demo-block, .demo-frame')) return;
      if (host.closest(SKIP_PAGE)) return;
      const doc = host.ownerDocument;
      const block = doc.createElement('div');
      block.className = 'demo-block';
      const frame = doc.createElement('div');
      frame.className = 'demo-frame demo-frame--cases';
      const caseEl = doc.createElement('div');
      caseEl.className = 'demo-case';
      const stage = doc.createElement('div');
      stage.className = 'demo-case-stage';
      const num = doc.createElement('span');
      num.className = 'demo-case-num';
      num.setAttribute('aria-hidden', 'true');
      num.textContent = '1';
      host.replaceWith(block);
      stage.append(host);
      caseEl.append(stage, num);
      frame.append(caseEl);
      block.append(frame);
      n++;
    });
  return n;
}

/** Run once at playground boot. */
export function enhanceAllDemos(root: ParentNode = document): {
  frames: number;
  hosts: number;
  grids: number;
  stacks: number;
  surfaces: number;
  special: number;
} {
  let frames = 0;
  let hosts = 0;
  let grids = 0;
  let stacks = 0;
  let surfaces = 0;

  root.querySelectorAll<HTMLElement>(CASE_FRAME).forEach((frame) => {
    frames += enhanceDemoFrame(frame) > 0 ? 1 : 0;
  });

  root
    .querySelectorAll<HTMLElement>(
      [
        '.comp-page .surface.row',
        '.comp-page .row.wrap',
        '.comp-page .avatar-demo-row',
        '.comp-page .badge-demo-row',
        '.comp-page .badge-demo-grid',
        '.comp-page .tooltip-physical',
        '.comp-page .avatar-demo-stack',
      ].join(', '),
    )
    .forEach((host) => {
      if (promoteDemoHost(host)) hosts += 1;
    });

  root.querySelectorAll<HTMLElement>('.comp-page .grid-2, .comp-page .grid-3').forEach((grid) => {
    if (promoteGrid(grid)) grids += 1;
  });

  root.querySelectorAll<HTMLElement>('.comp-page .surface.stack').forEach((stack) => {
    stacks += wrapStackControlRuns(stack);
  });

  root.querySelectorAll<HTMLElement>('.comp-page > .surface, .comp-page .surface').forEach((surface) => {
    if (wrapLoneSurface(surface)) surfaces += 1;
  });

  const special = wrapSpecialHosts(root);

  root.querySelectorAll<HTMLElement>(CASE_FRAME).forEach((frame) => {
    frames += enhanceDemoFrame(frame) > 0 ? 1 : 0;
  });

  return { frames, hosts, grids, stacks, surfaces, special };
}
