import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  springs,
  springPhysics,
  motionCss,
  springAt,
  springDuration,
  springToLinear,
  stepSpring,
  poseTransform,
  restPose,
  restShape,
  targetStretch,
  fluidTokens,
  clampStretch,
} from '../../src/motion/index.js';
import { applyMotionSchemeVars } from '../../src/theme/css-vars.js';
import { themeApi } from '../../src/theme/apply.js';

describe('fluid spring physics', () => {
  it('settles near 1 for soft fluid spatial springs', () => {
    const spring = springPhysics.fluid.spatial.fast;
    const end = springAt(spring, springDuration(spring) / 1000);
    expect(end).toBeGreaterThan(0.99);
    expect(end).toBeLessThan(1.02);
  });

  it('samples a CSS linear() easing ending at 1', () => {
    const linear = springToLinear(springPhysics.fluid.spatial.default, 20);
    expect(linear.startsWith('linear(')).toBe(true);
    expect(linear.endsWith(', 1)') || linear.endsWith(' 1)')).toBe(true);
  });

  it('exposes fluid duration / easing tokens', () => {
    expect(springs.fluid.spatial.fast.durationMs).toBe(405);
    expect(springs.fluid.spatial.default.durationMs).toBe(610);
    expect(springs.fluid.spatial.slow.durationMs).toBe(836);
    expect(springs.fluid.spatial.fast.easing.startsWith('linear(')).toBe(true);
    expect(motionCss('fluid', 'spatial', 'fast')).toContain('405ms');
  });

  it('steps a squash spring toward press then rest', () => {
    const state = { value: 0, velocity: 0 };
    const spring = { dampingRatio: fluidTokens.wobble, stiffness: 380 };
    stepSpring(state, fluidTokens.squash, spring, 0.05);
    expect(state.value).toBeGreaterThan(0);
    for (let i = 0; i < 80; i++) stepSpring(state, 0, spring, 0.016);
    expect(Math.abs(state.value)).toBeLessThan(0.01);
  });
});

describe('fluid shape math', () => {
  it('builds stretch from velocity and clamps bounds', () => {
    const stretch = targetStretch(400, 0, 40, fluidTokens);
    expect(stretch).toBeGreaterThan(1);
    expect(stretch).toBeLessThanOrEqual(1 + fluidTokens.maxStretch);
    expect(clampStretch(2, fluidTokens)).toBe(1 + fluidTokens.maxStretch);
  });

  it('emits empty transform at rest and scale when squashed', () => {
    expect(poseTransform(restPose(), restShape())).toBe('');
    const pose = restPose();
    pose.squash = 0.07;
    const t = poseTransform(pose, restShape());
    expect(t).toContain('scale(');
  });
});

describe('theme motion=fluid', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-k3-motion');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-k3-motion');
  });

  it('sets data-k3-motion=fluid on apply', () => {
    themeApi.apply({ seed: '#00796B', mode: 'light', motion: 'fluid' });
    expect(document.documentElement.getAttribute('data-k3-motion')).toBe('fluid');
  });

  it('writes fluid duration aliases on a style target', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    applyMotionSchemeVars(el.style, 'fluid');
    expect(el.style.getPropertyValue('--k3-sys-motion-duration-spatial-fast')).toBe('405ms');
    expect(el.style.getPropertyValue('--k3-sys-motion-easing-spatial')).toContain(
      'fluid-spatial',
    );
    el.remove();
  });
});
