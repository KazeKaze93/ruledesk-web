import type { MarkFlags } from "./schema";

/** Keep at most this many mark entries (highest post ids). */
export const MARKS_KEEP_LIMIT = 20_000;

/** Prune only after size exceeds keep limit by this fraction (hysteresis). */
export const MARKS_PRUNE_OVERFLOW_RATIO = 0.1;

export function marksPruneThreshold(
  keepLimit: number = MARKS_KEEP_LIMIT,
): number {
  return keepLimit + Math.floor(keepLimit * MARKS_PRUNE_OVERFLOW_RATIO);
}

function postIdSortKey(postId: string): number {
  const parsed = Number(postId);
  if (!Number.isFinite(parsed)) {
    return Number.NEGATIVE_INFINITY;
  }
  return Math.trunc(parsed);
}

/**
 * When marks size exceeds keepLimit by 10%, keep only the highest
 * `keepLimit` post ids. Below/at the threshold, returns the same object.
 */
export function pruneMarksIfNeeded(
  marks: Record<string, MarkFlags>,
  keepLimit: number = MARKS_KEEP_LIMIT,
): { marks: Record<string, MarkFlags>; pruned: boolean } {
  const entries = Object.entries(marks);
  const threshold = marksPruneThreshold(keepLimit);
  if (entries.length <= threshold) {
    return { marks, pruned: false };
  }

  const sorted = [...entries].sort(
    (left, right) => postIdSortKey(right[0]) - postIdSortKey(left[0]),
  );
  const next: Record<string, MarkFlags> = {};
  for (const [postId, flags] of sorted.slice(0, keepLimit)) {
    next[postId] = flags;
  }
  return { marks: next, pruned: true };
}
