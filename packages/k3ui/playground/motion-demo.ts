/**
 * Styles → Motion demos — mirrors https://expressive.grenishrai.pro/docs/motion
 * 1. Springs: SVG curves + legend tracks with CSS spring-eased beads
 * 2. Fluid: three scheme switches (expressive / standard / fluid · motion)
 */
import {
  springPhysics,
  type MotionSchemeName,
} from '../src/motion/springs.js';
import {
  springAt,
  springDuration,
  springToLinear,
  stepSpring,
  springSettled,
  type Spring,
  type SpringState,
} from '../src/motion/spring.js';
import {
  fluidTokens,
  poseTransform,
  restPose,
  restShape,
  targetStretch,
  leanFor,
  clampStretch,
  type FluidShape,
} from '../src/motion/fluid.js';

const SPEEDS = ['fast', 'default', 'slow'] as const;
type Speed = (typeof SPEEDS)[number];
type Kind = 'spatial' | 'effects';

function currentScheme(): MotionSchemeName {
  const raw = document.documentElement.getAttribute('data-k3-motion');
  if (raw === 'standard' || raw === 'fluid') return raw;
  return 'expressive';
}

function reduced(): boolean {
  return (
    document.documentElement.hasAttribute('data-k3-reduce-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Shared-time polyline like Expressive (viewBox -4 -16 328 152).
 * X = 0…320 over maxDuration; Y = 120 at 0 → 0 at 1 (overshoot &lt; 0).
 */
function springPolylinePoints(
  spring: Spring,
  maxDurationMs: number,
  samples = 80,
): string {
  const maxSec = Math.max(maxDurationMs, 1) / 1000;
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * maxSec;
    const y = springAt(spring, t);
    const x = (i / samples) * 320;
    const svgY = 120 * (1 - y);
    pts.push(`${x.toFixed(2)},${svgY.toFixed(2)}`);
  }
  return pts.join(' ');
}

/* ── Springs chart ─────────────────────────────────────────── */

interface ChartLine {
  kind: Kind;
  speed: Speed;
  path: SVGPolylineElement;
  ms: HTMLElement;
  bead: HTMLElement;
  spring: Spring;
  durationMs: number;
  easing: string;
}

let chartWired = false;
let chartLines: ChartLine[] = [];
let beadEpoch = 0;

function syncSpringChart(): void {
  const root = document.getElementById('motion-springs-chart');
  if (!root) return;
  const scheme = currentScheme();
  const physics = springPhysics[scheme];
  const schemeLabel = root.querySelector<HTMLElement>('[data-motion-scheme-label]');
  if (schemeLabel) {
    schemeLabel.dataset.scheme = scheme;
    schemeLabel.textContent = scheme;
  }

  chartLines = [];
  for (const kind of ['spatial', 'effects'] as const) {
    const kindSprings = SPEEDS.map((speed) => {
      const spring = physics[kind][speed];
      return { speed, spring, durationMs: springDuration(spring) };
    });
    const maxDurationMs = Math.max(...kindSprings.map((s) => s.durationMs));
    for (const { speed, spring, durationMs } of kindSprings) {
      const path = root.querySelector<SVGPolylineElement>(
        `[data-spring-path="${kind}-${speed}"]`,
      );
      const ms = root.querySelector<HTMLElement>(`[data-spring-ms="${kind}-${speed}"]`);
      const bead = root.querySelector<HTMLElement>(`[data-spring-bead="${kind}-${speed}"]`);
      if (!path || !ms || !bead) continue;
      path.setAttribute('points', springPolylinePoints(spring, maxDurationMs));
      ms.textContent = `${durationMs}ms`;
      chartLines.push({
        kind,
        speed,
        path,
        ms,
        bead,
        spring,
        durationMs,
        easing: springToLinear(spring),
      });
    }
  }
  replaySpringChart();
}

/** Restart legend-track beads with CSS spring duration + linear() easing (Expressive). */
function replaySpringChart(): void {
  beadEpoch += 1;
  const epoch = beadEpoch;
  for (const line of chartLines) {
    const el = line.bead;
    el.style.animation = 'none';
    el.style.left = '';
    // Force reflow so the next animation restarts cleanly.
    void el.offsetWidth;
    if (reduced()) {
      el.style.left = 'calc(100% - 1.75rem)';
      continue;
    }
    el.style.animation = '';
    el.style.setProperty('--k3-spring-demo-duration', `${line.durationMs}ms`);
    el.style.setProperty('--k3-spring-demo-easing', line.easing);
    el.style.animation =
      `k3-spring-demo var(--k3-spring-demo-duration) var(--k3-spring-demo-easing) forwards`;
    // Guard against stale restarts overlapping.
    el.dataset.epoch = String(epoch);
  }
}

function wireSpringChart(): void {
  if (chartWired) return;
  const root = document.getElementById('motion-springs-chart');
  if (!root) return;
  chartWired = true;
  root.querySelector('[data-motion-replay]')?.addEventListener('click', () => {
    replaySpringChart();
  });
  syncSpringChart();
}

/* ── Fluid switches (Expressive docs/motion) ───────────────── */

interface SwitchRow {
  scheme: MotionSchemeName;
  stage: HTMLElement;
  handle: HTMLElement;
  pos: SpringState;
  stretch: SpringState;
  shape: FluidShape;
  lastTs: number;
  travelPx: number;
}

const switchRows: SwitchRow[] = [];
let fluidDemoWired = false;
let fluidLoopRaf = 0;
/** Shared target — all three leave together on every flip. */
let fluidSharedTarget: 0 | 1 = 1;
let fluidSharedDwellMs = 0;
let fluidTickLastTs = 0;

/** Pause at each end before auto-flip — readable va-et-vient. */
const FLUID_DWELL_MS = 900;
/** Morph finishes by this fraction of the trip (square ready early). */
const FLUID_MORPH_BY = 0.35;

function schemeTravelSpring(scheme: MotionSchemeName): Spring {
  return springPhysics[scheme].spatial.default;
}

const demoShapeSpring = (): Spring => ({
  dampingRatio: fluidTokens.wobble,
  stiffness: 220,
});

function measureTravel(stage: HTMLElement, handle: HTMLElement): number {
  const pad = 8; /* top-2 / left-2 = 0.5rem */
  return Math.max(0, stage.clientWidth - handle.offsetWidth - pad * 2);
}

/** 0 = circle/primary (off), 1 = square/tertiary (on) — completes early vs travel. */
function morphAmount(pos: number, target: 0 | 1): number {
  const toward = target === 1 ? pos : 1 - pos;
  const early = Math.min(1, Math.max(0, toward / FLUID_MORPH_BY));
  return target === 1 ? early : 1 - early;
}

function applySwitchRow(row: SwitchRow): void {
  const x = row.pos.value * row.travelPx;
  const m = morphAmount(row.pos.value, fluidSharedTarget);
  /* Circle 24px → medium ~12px; drive in JS so shape leads the handle. */
  const radius = 24 - m * 12;
  row.handle.style.borderRadius = `${radius}px`;
  const pct = Math.round(m * 100);
  row.handle.style.backgroundColor =
    `color-mix(in srgb, var(--k3-sys-color-tertiary) ${pct}%, var(--k3-sys-color-primary))`;
  row.handle.classList.toggle('is-on', m >= 0.5);
  row.stage.setAttribute('aria-checked', fluidSharedTarget === 1 ? 'true' : 'false');

  if (row.scheme === 'fluid') {
    const pose = restPose();
    pose.x = x;
    row.shape.stretch = clampStretch(row.stretch.value, fluidTokens);
    row.handle.style.transform = poseTransform(pose, row.shape) || `translateX(${x}px)`;
    row.handle.toggleAttribute('data-fluid', Math.abs(row.stretch.value - 1) > 0.008);
  } else {
    row.shape = restShape();
    row.handle.style.transform = `translateX(${x}px)`;
    row.handle.removeAttribute('data-fluid');
  }
}

function flipAllSwitches(): void {
  fluidSharedTarget = fluidSharedTarget === 1 ? 0 : 1;
  fluidSharedDwellMs = 0;
  ensureFluidLoop();
}

function tickSwitchRows(ts: number): void {
  if (reduced()) {
    fluidLoopRaf = 0;
    return;
  }
  const dt = fluidTickLastTs
    ? Math.min(0.032, (ts - fluidTickLastTs) / 1000)
    : 0.016;
  fluidTickLastTs = ts;
  let allSettled = true;
  for (const row of switchRows) {
    row.lastTs = ts;
    const prev = row.pos.value;
    stepSpring(row.pos, fluidSharedTarget, schemeTravelSpring(row.scheme), dt);

    if (row.scheme === 'fluid') {
      const size = Math.max(row.handle.offsetWidth, 48);
      const vx =
        ((row.pos.value - prev) / Math.max(dt, 1e-4)) * Math.max(row.travelPx, 1);
      const want = targetStretch(vx, 0, size, fluidTokens);
      stepSpring(row.stretch, want, demoShapeSpring(), dt);
      row.shape.angle = 0;
      row.shape.lean = leanFor(vx, size, fluidTokens);
    }

    if (springSettled(row.pos, fluidSharedTarget, 0.6)) {
      row.pos.value = fluidSharedTarget;
      row.pos.velocity = 0;
      if (row.scheme === 'fluid') {
        stepSpring(row.stretch, 1, demoShapeSpring(), dt);
        if (springSettled(row.stretch, 1, 0.25)) {
          row.stretch.value = 1;
          row.stretch.velocity = 0;
          row.shape = restShape();
        } else {
          allSettled = false;
        }
      }
    } else {
      allSettled = false;
    }
    applySwitchRow(row);
  }

  /* Shared dwell + flip — every scheme restarts from the same beat. */
  if (allSettled && switchRows.length) {
    fluidSharedDwellMs += dt * 1000;
    if (fluidSharedDwellMs >= FLUID_DWELL_MS) {
      fluidSharedTarget = fluidSharedTarget === 1 ? 0 : 1;
      fluidSharedDwellMs = 0;
    }
  } else {
    fluidSharedDwellMs = 0;
  }

  fluidLoopRaf = requestAnimationFrame(tickSwitchRows);
}

function ensureFluidLoop(): void {
  if (reduced()) {
    for (const row of switchRows) {
      row.pos.value = fluidSharedTarget;
      row.pos.velocity = 0;
      row.stretch.value = 1;
      row.shape = restShape();
      applySwitchRow(row);
    }
    if (fluidLoopRaf) {
      cancelAnimationFrame(fluidLoopRaf);
      fluidLoopRaf = 0;
    }
    return;
  }
  if (!fluidLoopRaf && switchRows.length) {
    fluidTickLastTs = 0;
    for (const row of switchRows) row.lastTs = 0;
    fluidLoopRaf = requestAnimationFrame(tickSwitchRows);
  }
}

function resizeSwitchRows(): void {
  for (const row of switchRows) {
    row.travelPx = measureTravel(row.stage, row.handle);
    applySwitchRow(row);
  }
}

function wireFluidDemo(): void {
  const root = document.getElementById('motion-fluid-demo');
  if (!root || fluidDemoWired) return;
  fluidDemoWired = true;

  root.querySelectorAll<HTMLElement>('[data-fluid-scheme]').forEach((rowEl) => {
    const scheme = rowEl.dataset.fluidScheme as MotionSchemeName;
    if (scheme !== 'expressive' && scheme !== 'standard' && scheme !== 'fluid') return;
    const stage = rowEl.querySelector<HTMLElement>('.motion-fluid-stage');
    const handle = rowEl.querySelector<HTMLElement>('.motion-fluid-handle');
    if (!stage || !handle) return;
    const row: SwitchRow = {
      scheme,
      stage,
      handle,
      pos: { value: 0, velocity: 0 },
      stretch: { value: 1, velocity: 0 },
      shape: restShape(),
      lastTs: 0,
      travelPx: measureTravel(stage, handle),
    };
    switchRows.push(row);
    applySwitchRow(row);
    stage.addEventListener('click', () => flipAllSwitches());
  });

  window.addEventListener('resize', resizeSwitchRows, { passive: true });
  ensureFluidLoop();
}

export function wireMotionDemos(): void {
  wireSpringChart();
  wireFluidDemo();
  document.addEventListener('k3-theme-change', () => {
    syncSpringChart();
  });
  window
    .matchMedia('(prefers-reduced-motion: reduce)')
    .addEventListener('change', () => {
      syncSpringChart();
      ensureFluidLoop();
    });
}

export function refreshMotionSpringChart(): void {
  syncSpringChart();
}
