import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  GRID_DENSITY_FEATURE_ID,
  MASONRY_COLUMN_GAP_PX,
  MASONRY_COLUMN_MIN_PX,
  MASONRY_ITEM_GAP_PX,
  MASONRY_ROW_UNIT_PX,
  MASONRY_SPAN_CSS_VAR,
  MASONRY_VALUE,
} from "../../src/features/grid-density";
import {
  computeMasonryColumnWidthPx,
  computeMasonryRowSpan,
  resetMasonryLayoutState,
  startMasonryLayout,
} from "../../src/features/masonry-layout";
import {
  notifyThumbsAdded,
  resetFeatureRuntimeState,
} from "../../src/features/runtime";
import { featureChoiceBodyClass } from "../../src/features/types";

const MASONRY_BODY_CLASS = featureChoiceBodyClass(
  GRID_DENSITY_FEATURE_ID,
  MASONRY_VALUE,
);

function flushAnimationFrames(): void {
  vi.runOnlyPendingTimers();
}

function buildThumb(id: string): HTMLElement {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.id = `s${id}`;
  const link = document.createElement("a");
  link.id = `p${id}`;
  link.href = `index.php?page=post&s=view&id=${id}`;
  const img = document.createElement("img");
  img.className = "preview";
  link.append(img);
  thumb.append(link);
  return thumb;
}

function buildPostList(thumbIds: string[]): {
  list: HTMLElement;
  thumbs: HTMLElement[];
} {
  const postList = document.createElement("div");
  postList.id = "post-list";
  const content = document.createElement("div");
  content.className = "content";
  const list = document.createElement("div");
  list.className = "image-list";
  Object.defineProperty(list, "clientWidth", {
    configurable: true,
    value: 500,
  });
  const thumbs = thumbIds.map((id) => buildThumb(id));
  for (const thumb of thumbs) {
    list.append(thumb);
  }
  content.append(list);
  postList.append(content);
  document.body.append(postList);
  return { list, thumbs };
}

describe("computeMasonryRowSpan", () => {
  it("uses 1:1 when natural sizes are missing", () => {
    const span = computeMasonryRowSpan(MASONRY_COLUMN_MIN_PX, 0, 0);
    expect(span).toBe(
      Math.ceil(
        (MASONRY_COLUMN_MIN_PX + MASONRY_ITEM_GAP_PX) / MASONRY_ROW_UNIT_PX,
      ),
    );
  });

  it("scales by natural aspect ratio and includes item gap", () => {
    const columnWidth = 200;
    const naturalWidth = 100;
    const naturalHeight = 200;
    const expected = Math.ceil(
      (columnWidth * (naturalHeight / naturalWidth) + MASONRY_ITEM_GAP_PX) /
        MASONRY_ROW_UNIT_PX,
    );
    expect(
      computeMasonryRowSpan(columnWidth, naturalWidth, naturalHeight),
    ).toBe(expected);
  });

  it("never returns less than 1", () => {
    expect(computeMasonryRowSpan(1, 1000, 1)).toBeGreaterThanOrEqual(1);
  });
});

describe("computeMasonryColumnWidthPx", () => {
  it("matches auto-fill minmax column math", () => {
    const listWidth = 500;
    const columnCount = 2;
    const expected =
      (listWidth - (columnCount - 1) * MASONRY_COLUMN_GAP_PX) / columnCount;
    expect(computeMasonryColumnWidthPx(listWidth)).toBe(expected);
  });

  it("falls back to min column when list width is 0", () => {
    expect(computeMasonryColumnWidthPx(0)).toBe(MASONRY_COLUMN_MIN_PX);
  });
});

describe("startMasonryLayout placement", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback): number => {
        return window.setTimeout(() => {
          cb(0);
        }, 0);
      },
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number): void => {
      window.clearTimeout(id);
    });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );
    document.body.className = "";
    document.body.innerHTML = "";
    resetFeatureRuntimeState();
    resetMasonryLayoutState();
  });

  afterEach(() => {
    resetMasonryLayoutState();
    resetFeatureRuntimeState();
    document.body.className = "";
    document.body.innerHTML = "";
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("sets span CSS var on thumbs when masonry choice is active", () => {
    document.body.classList.add(MASONRY_BODY_CLASS);
    const { thumbs } = buildPostList(["1", "2"]);
    startMasonryLayout();
    flushAnimationFrames();

    const span = thumbs[0]?.style.getPropertyValue(MASONRY_SPAN_CSS_VAR);
    expect(span).not.toBe("");
    expect(Number(span)).toBeGreaterThanOrEqual(1);
  });

  it("does not rewrite span CSS var on already placed thumbs when new ones arrive", () => {
    document.body.classList.add(MASONRY_BODY_CLASS);
    const { list, thumbs } = buildPostList(["1"]);
    startMasonryLayout();
    flushAnimationFrames();

    const first = thumbs[0];
    expect(first).toBeDefined();
    if (first === undefined) {
      return;
    }
    const before = first.style.getPropertyValue(MASONRY_SPAN_CSS_VAR);
    expect(before).not.toBe("");

    first.style.setProperty(MASONRY_SPAN_CSS_VAR, "999");

    const late = buildThumb("2");
    list.append(late);
    notifyThumbsAdded(list);
    flushAnimationFrames();

    expect(first.style.getPropertyValue(MASONRY_SPAN_CSS_VAR)).toBe("999");
    expect(late.style.getPropertyValue(MASONRY_SPAN_CSS_VAR)).not.toBe("");
  });

  it("does nothing while masonry body class is absent", () => {
    const { thumbs } = buildPostList(["1"]);
    startMasonryLayout();
    flushAnimationFrames();
    expect(thumbs[0]?.style.getPropertyValue(MASONRY_SPAN_CSS_VAR)).toBe("");
  });
});
