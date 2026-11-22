/**
 * Infer circular vs square from a border-radius string (skeleton `shape="auto"`).
 * Returns `null` when the default rounded bone should apply.
 */
export function inferSkeletonShapeFromRadius(
  borderRadius: string,
): 'circular' | 'square' | null {
  const r = borderRadius.trim();
  if (!r || r === '0px' || r === '0') return 'square';
  if (r.includes('%')) return 'circular';
  const parts = r.split(/\s+/);
  const first = parts[0] ?? '';
  if (parts.every((p) => p === first && Number.parseFloat(p) >= 999)) {
    return 'circular';
  }
  return null;
}
