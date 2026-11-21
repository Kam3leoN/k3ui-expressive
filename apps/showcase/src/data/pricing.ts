/** Pricing content adapted from the Material Expressive draft (FR-first). */

import type { MaterialShapeName } from '../shape-icon.js';

export type Billing = 'monthly' | 'annual';

export type PlanId = 'free' | 'essential' | 'pro' | 'enterprise';

export interface Plan {
  id: PlanId;
  nameKey: string;
  tagKey: string;
  monthly: number;
  annual: number;
  recommended?: boolean;
  /** M3 Expressive catalog shape (not Material Symbols). */
  shape: MaterialShapeName;
  ctaKey: string;
  noteKey: string;
  includesKey: string;
  featureKeys: string[];
}

export interface FaqItem {
  qKey: string;
  aKey: string;
}

export const PLANS: readonly Plan[] = [
  {
    id: 'free',
    nameKey: 'showcase.pricing.plan.free.name',
    tagKey: 'showcase.pricing.plan.free.tag',
    monthly: 0,
    annual: 0,
    shape: 'Flower',
    ctaKey: 'showcase.pricing.plan.free.cta',
    noteKey: 'showcase.pricing.plan.free.note',
    includesKey: 'showcase.pricing.plan.free.includes',
    featureKeys: [
      'showcase.pricing.plan.free.f1',
      'showcase.pricing.plan.free.f2',
      'showcase.pricing.plan.free.f3',
      'showcase.pricing.plan.free.f4',
      'showcase.pricing.plan.free.f5',
    ],
  },
  {
    id: 'essential',
    nameKey: 'showcase.pricing.plan.essential.name',
    tagKey: 'showcase.pricing.plan.essential.tag',
    monthly: 10,
    annual: 96,
    shape: 'Slanted',
    ctaKey: 'showcase.pricing.plan.essential.cta',
    noteKey: 'showcase.pricing.plan.essential.note',
    includesKey: 'showcase.pricing.plan.essential.includes',
    featureKeys: [
      'showcase.pricing.plan.essential.f1',
      'showcase.pricing.plan.essential.f2',
      'showcase.pricing.plan.essential.f3',
      'showcase.pricing.plan.essential.f4',
      'showcase.pricing.plan.essential.f5',
    ],
  },
  {
    id: 'pro',
    nameKey: 'showcase.pricing.plan.pro.name',
    tagKey: 'showcase.pricing.plan.pro.tag',
    monthly: 20,
    annual: 192,
    recommended: true,
    shape: 'Sunny',
    ctaKey: 'showcase.pricing.plan.pro.cta',
    noteKey: 'showcase.pricing.plan.pro.note',
    includesKey: 'showcase.pricing.plan.pro.includes',
    featureKeys: [
      'showcase.pricing.plan.pro.f1',
      'showcase.pricing.plan.pro.f2',
      'showcase.pricing.plan.pro.f3',
      'showcase.pricing.plan.pro.f4',
      'showcase.pricing.plan.pro.f5',
      'showcase.pricing.plan.pro.f6',
    ],
  },
  {
    id: 'enterprise',
    nameKey: 'showcase.pricing.plan.enterprise.name',
    tagKey: 'showcase.pricing.plan.enterprise.tag',
    monthly: 40,
    annual: 384,
    shape: 'Gem',
    ctaKey: 'showcase.pricing.plan.enterprise.cta',
    noteKey: 'showcase.pricing.plan.enterprise.note',
    includesKey: 'showcase.pricing.plan.enterprise.includes',
    featureKeys: [
      'showcase.pricing.plan.enterprise.f1',
      'showcase.pricing.plan.enterprise.f2',
      'showcase.pricing.plan.enterprise.f3',
      'showcase.pricing.plan.enterprise.f4',
      'showcase.pricing.plan.enterprise.f5',
    ],
  },
] as const;

export const FAQS: readonly FaqItem[] = [
  { qKey: 'showcase.pricing.faq.q1', aKey: 'showcase.pricing.faq.a1' },
  { qKey: 'showcase.pricing.faq.q2', aKey: 'showcase.pricing.faq.a2' },
  { qKey: 'showcase.pricing.faq.q3', aKey: 'showcase.pricing.faq.a3' },
] as const;

export function planPrice(plan: Plan, billing: Billing): number {
  if (plan.monthly === 0) return 0;
  return billing === 'annual' ? Math.round(plan.annual / 12) : plan.monthly;
}

export function annualSavingsPercent(plan: Plan): number | null {
  if (plan.monthly <= 0) return null;
  const full = plan.monthly * 12;
  if (full <= 0 || plan.annual >= full) return null;
  return Math.round(((full - plan.annual) / full) * 100);
}

/** Absolute € saved vs paying monthly for 12 months. */
export function annualSavingsEuros(plan: Plan): number | null {
  if (plan.monthly <= 0) return null;
  const saved = plan.monthly * 12 - plan.annual;
  return saved > 0 ? saved : null;
}
