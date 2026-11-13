import { describe, expect, it } from "vitest";

import {
  MARKS_KEEP_LIMIT,
  MARKS_PRUNE_OVERFLOW_RATIO,
  marksPruneThreshold,
  pruneMarksIfNeeded,
} from "../src/storage/marks-prune";
import type { MarkFlags } from "../src/storage/schema";

function buildMarks(
  count: number,
  startId: number,
): Record<string, MarkFlags> {
  const marks: Record<string, MarkFlags> = {};
  for (let index = 0; index < count; index += 1) {
    const id = startId + index;
    marks[String(id)] = { seen: true };
  }
  return marks;
}

describe("marks prune", () => {
  it("exposes keep limit 20000 and 10% overflow threshold 22000", () => {
    expect(MARKS_KEEP_LIMIT).toBe(20_000);
    expect(MARKS_PRUNE_OVERFLOW_RATIO).toBe(0.1);
    expect(marksPruneThreshold()).toBe(22_000);
  });

  it("does not prune at or below the overflow threshold", () => {
    const atLimit = buildMarks(MARKS_KEEP_LIMIT, 1);
    const atLimitResult = pruneMarksIfNeeded(atLimit);
    expect(atLimitResult.pruned).toBe(false);
    expect(Object.keys(atLimitResult.marks)).toHaveLength(MARKS_KEEP_LIMIT);

    const atThreshold = buildMarks(marksPruneThreshold(), 1);
    const thresholdResult = pruneMarksIfNeeded(atThreshold);
    expect(thresholdResult.pruned).toBe(false);
    expect(Object.keys(thresholdResult.marks)).toHaveLength(
      marksPruneThreshold(),
    );
  });

  it("prunes to the highest keep-limit ids when over threshold", () => {
    const keepLimit = 10;
    const threshold = marksPruneThreshold(keepLimit);
    expect(threshold).toBe(11);
    const marks = buildMarks(threshold + 1, 100);
    // ids 100..111 (12 entries) → keep highest 10 → 102..111
    const result = pruneMarksIfNeeded(marks, keepLimit);
    expect(result.pruned).toBe(true);
    const ids = Object.keys(result.marks)
      .map(Number)
      .sort((a, b) => a - b);
    expect(ids).toEqual([102, 103, 104, 105, 106, 107, 108, 109, 110, 111]);
  });

  it("drops non-numeric keys before numeric ones when pruning", () => {
    const keepLimit = 2;
    const marks: Record<string, MarkFlags> = {
      bad: { seen: true },
      "5": { seen: true },
      "9": { seen: true },
      "1": { seen: true },
    };
    // size 4 > threshold 2 (floor(2*0.1)=0 → threshold 2), prune to 2 highest
    const result = pruneMarksIfNeeded(marks, keepLimit);
    expect(result.pruned).toBe(true);
    expect(Object.keys(result.marks).sort()).toEqual(["5", "9"]);
  });
});
