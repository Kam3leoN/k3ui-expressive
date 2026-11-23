/**
 * Thumbs — upvote / downvote with a live counter (YouTube-style toggle).
 *
 * `vote` is exclusive: `''` | `'up'` | `'down'`. Tapping the active thumb
 * clears the vote; switching adjusts the counter by ±2.
 */

export type ThumbsSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ThumbsVote = '' | 'up' | 'down';

/** Icon optical size (dp) per size ladder. */
export const ThumbsIconDp: Record<ThumbsSize, number> = {
  xs: 20,
  sm: 24,
  md: 28,
  lg: 32,
  xl: 40,
};

/** Hit target min (dp). */
export const ThumbsTargetDp: Record<ThumbsSize, number> = {
  xs: 32,
  sm: 40,
  md: 48,
  lg: 48,
  xl: 56,
};

export const ThumbsSpecs = {
  defaultSize: 'md' as ThumbsSize,
  defaultValue: 0,
  defaultVote: '' as ThumbsVote,
  defaultStep: 1,
  defaultUpIcon: 'thumb_up',
  defaultDownIcon: 'thumb_down',
  iconDp: ThumbsIconDp,
  targetDp: ThumbsTargetDp,
} as const;

export function resolveThumbsSize(size: string | null | undefined): ThumbsSize {
  if (size === 'xs' || size === 'sm' || size === 'md' || size === 'lg' || size === 'xl') {
    return size;
  }
  return ThumbsSpecs.defaultSize;
}

export function resolveThumbsVote(vote: string | null | undefined): ThumbsVote {
  if (vote === 'up' || vote === 'down') return vote;
  return '';
}
