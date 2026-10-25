/**
 * Specs for `k3-bubble` — chat conversation row (placement, body color).
 */

export type BubblePlacement = 'start' | 'end';

export type BubbleColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export const BubbleSpecs = {
  placements: ['start', 'end'] as const satisfies readonly BubblePlacement[],
  colors: [
    'default',
    'primary',
    'secondary',
    'accent',
    'neutral',
    'info',
    'success',
    'warning',
    'error',
  ] as const satisfies readonly BubbleColor[],
  defaultPlacement: 'start' as BubblePlacement,
  defaultColor: 'default' as BubbleColor,
  accessibility: {
    role: 'group' as const,
  },
  tailMask:
    "url(\"data:image/svg+xml,%3csvg width='13' height='13' xmlns='http://www.w3.org/2000/svg'%3e%3cpath fill='black' d='M0 11.5004C0 13.0004 2 13.0004 2 13.0004H12H13V0.00036329L12.5 0C12.5 0 11.977 2.09572 11.8581 2.50033C11.6075 3.35237 10.9149 4.22374 9 5.50036C6 7.50036 0 10.0004 0 11.5004Z'/%3e%3c/svg%3e\")",
} as const;

export function isBubblePlacement(value: string): value is BubblePlacement {
  return (BubbleSpecs.placements as readonly string[]).includes(value);
}

export function isBubbleColor(value: string): value is BubbleColor {
  return (BubbleSpecs.colors as readonly string[]).includes(value);
}
