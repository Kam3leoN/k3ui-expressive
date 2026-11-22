import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { springPhysics } from '../../src/motion/springs.js';
import { springAt, springDuration } from '../../src/motion/spring.js';

const SPEEDS = ['fast', 'default', 'slow'] as const;

describe('motion page Expressive-like demos', () => {
  const html = readFileSync(
    resolve(__dirname, '../../playground/index.html'),
    'utf8',
  );
  const demo = readFileSync(
    resolve(__dirname, '../../playground/motion-demo.ts'),
    'utf8',
  );
  const css = readFileSync(
    resolve(__dirname, '../../playground/playground.css'),
    'utf8',
  );

  it('ships springs chart + fluid switch comparison markup', () => {
    const pageStart = html.indexOf('data-page="motion"');
    const page = html.slice(pageStart, pageStart + 14000);
    expect(page).toContain('id="motion-springs-chart"');
    expect(page).toContain('data-spring-path="spatial-fast"');
    expect(page).toContain('data-spring-path="effects-slow"');
    expect(page).toContain('data-spring-bead="spatial-fast"');
    expect(page).toContain('data-spring-bead="effects-slow"');
    expect(page).toContain('motion-springs-track');
    expect(page).toContain('data-motion-replay');
    expect(page).toContain('viewBox="-4 -16 328 152"');
    expect(page).toContain('id="motion-fluid-demo"');
    expect(page).toContain('data-fluid-scheme="expressive"');
    expect(page).toContain('data-fluid-scheme="standard"');
    expect(page).toContain('data-fluid-scheme="fluid"');
    expect(page).toContain('motion-fluid-stage');
    expect(page).toContain('role="switch"');
    expect(page).toContain('motion-springs-case');
    expect(page).toContain('data-spring-kind="spatial"');
    expect(page).toContain('data-spring-kind="effects"');
  });

  it('samples fluid spatial springs with mild overshoot like the docs chart', () => {
    const spring = springPhysics.fluid.spatial.fast;
    const dur = springDuration(spring) / 1000;
    let max = 0;
    for (let i = 0; i <= 40; i++) {
      max = Math.max(max, springAt(spring, (i / 40) * dur));
    }
    expect(max).toBeGreaterThan(1);
    expect(springDuration(spring)).toBe(405);
  });

  it('wires Expressive-like spring beads + fluid switches', () => {
    expect(demo).toContain('springPhysics');
    expect(demo).toContain('springPolylinePoints');
    expect(demo).toContain('springToLinear');
    expect(demo).toContain('k3-spring-demo');
    expect(demo).toContain('wireMotionDemos');
    expect(demo).toContain('targetStretch');
    expect(demo).toContain('tickSwitchRows');
    expect(demo).toContain('FLUID_DWELL_MS');
    expect(demo).toContain('fluidSharedTarget');
    expect(demo).toContain('flipAllSwitches');
    expect(demo).toContain('FLUID_MORPH_BY');
    expect(css).toContain('@keyframes k3-spring-demo');
    expect(css).toContain('motion-springs-track__bead');
  });

  it('shared time axis fans fast/default/slow into distinct curves', () => {
    const physics = springPhysics.expressive.spatial;
    const durs = SPEEDS.map((s) => springDuration(physics[s]));
    const max = Math.max(...durs);
    const t = (max / 1000) * 0.18;
    const yFast = springAt(physics.fast, t);
    const ySlow = springAt(physics.slow, t);
    expect(yFast).toBeGreaterThan(ySlow + 0.1);
    expect(durs[0]).toBeLessThan(durs[2]);
  });

  it('matches Expressive documented durations for expressive + fluid', () => {
    expect(springDuration(springPhysics.expressive.spatial.fast)).toBe(360);
    expect(springDuration(springPhysics.expressive.spatial.default)).toBe(435);
    expect(springDuration(springPhysics.expressive.spatial.slow)).toBe(600);
    expect(springDuration(springPhysics.fluid.spatial.fast)).toBe(405);
    expect(springDuration(springPhysics.fluid.spatial.default)).toBe(610);
    expect(springDuration(springPhysics.fluid.spatial.slow)).toBe(836);
  });
});
