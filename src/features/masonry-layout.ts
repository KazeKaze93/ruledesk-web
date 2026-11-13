/**
 * CSS-grid masonry spans for list thumbs. Loaded after first paint from
 * grid-density mount (dynamic import) so the 0.12 CSS-first boot stays intact.
 */

import { SITE_SELECTORS } from "../site/selectors";
import {
  GRID_DENSITY_FEATURE_ID,
  MASONRY_COLUMN_GAP_PX,
  MASONRY_COLUMN_MIN_PX,
  MASONRY_ITEM_GAP_PX,
  MASONRY_LIST_SCOPE,
  MASONRY_ROW_UNIT_PX,
  MASONRY_SPAN_CSS_VAR,
  MASONRY_VALUE,
} from "./grid-density";
import { onThumbsAdded } from "./runtime";
import { featureChoiceBodyClass } from "./types";

const MASONRY_BODY_CLASS = featureChoiceBodyClass(
  GRID_DENSITY_FEATURE_ID,
  MASONRY_VALUE,
);
const IMAGE_LIST_SELECTOR = `${MASONRY_LIST_SCOPE} ${SITE_SELECTORS.imageList}`;
const PLACEHOLDER_NATURAL_SIZE = 1;
const MIN_COLUMN_COUNT = 1;
const MIN_ROW_SPAN = 1;
const BODY_CLASS_OBSERVER_OPTIONS: MutationObserverInit = {
  attributes: true,
  attributeFilter: ["class"],
};

let columnWidthPx = MASONRY_COLUMN_MIN_PX;
let resizeObserver: ResizeObserver | undefined;
let bodyClassObserver: MutationObserver | undefined;
let unsubscribeThumbsAdded: (() => void) | undefined;
let rafId = 0;
let started = false;
let layoutActive = false;

const placedThumbs = new Set<HTMLElement>();
const pendingSpans = new Map<HTMLElement, number>();
const loadListeners = new WeakMap<HTMLImageElement, () => void>();

/**
 * Row span N for grid-row-end. Uses intrinsic ratio only — no element layout reads.
 * Missing / zero natural sizes → 1:1 placeholder.
 */
export function computeMasonryRowSpan(
  columnWidth: number,
  naturalWidth: number,
  naturalHeight: number,
): number {
  const width =
    naturalWidth > 0 ? naturalWidth : PLACEHOLDER_NATURAL_SIZE;
  const height =
    naturalHeight > 0 ? naturalHeight : PLACEHOLDER_NATURAL_SIZE;
  const contentHeightPx = columnWidth * (height / width);
  const totalHeightPx = contentHeightPx + MASONRY_ITEM_GAP_PX;
  return Math.max(
    MIN_ROW_SPAN,
    Math.ceil(totalHeightPx / MASONRY_ROW_UNIT_PX),
  );
}

/**
 * Column width for `repeat(auto-fill, minmax(min, 1fr))` with a fixed column-gap.
 */
export function computeMasonryColumnWidthPx(listWidthPx: number): number {
  if (listWidthPx <= 0) {
    return MASONRY_COLUMN_MIN_PX;
  }
  const columnCount = Math.max(
    MIN_COLUMN_COUNT,
    Math.floor(
      (listWidthPx + MASONRY_COLUMN_GAP_PX) /
        (MASONRY_COLUMN_MIN_PX + MASONRY_COLUMN_GAP_PX),
    ),
  );
  return (
    (listWidthPx - (columnCount - 1) * MASONRY_COLUMN_GAP_PX) / columnCount
  );
}

function isMasonryChoiceActive(): boolean {
  return document.body.classList.contains(MASONRY_BODY_CLASS);
}

function findImageList(): HTMLElement | null {
  const node = document.querySelector(IMAGE_LIST_SELECTOR);
  if (!(node instanceof HTMLElement)) {
    return null;
  }
  return node;
}

function flushPendingSpans(): void {
  rafId = 0;
  for (const [thumb, span] of pendingSpans) {
    // Inline style exception: grid-row-end span must be per-thumb; CSS var is the
    // only allowed write (see grid-density masonry rules).
    thumb.style.setProperty(MASONRY_SPAN_CSS_VAR, String(span));
  }
  pendingSpans.clear();
}

function scheduleSpanWrite(thumb: HTMLElement, span: number): void {
  pendingSpans.set(thumb, span);
  if (rafId !== 0) {
    return;
  }
  rafId = requestAnimationFrame(flushPendingSpans);
}

function readPreviewRatio(thumb: HTMLElement): {
  naturalWidth: number;
  naturalHeight: number;
} {
  const img = thumb.querySelector(SITE_SELECTORS.previewImage);
  if (!(img instanceof HTMLImageElement)) {
    return {
      naturalWidth: PLACEHOLDER_NATURAL_SIZE,
      naturalHeight: PLACEHOLDER_NATURAL_SIZE,
    };
  }
  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
    return {
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    };
  }
  return {
    naturalWidth: PLACEHOLDER_NATURAL_SIZE,
    naturalHeight: PLACEHOLDER_NATURAL_SIZE,
  };
}

function bindPreviewLoad(thumb: HTMLElement): void {
  const img = thumb.querySelector(SITE_SELECTORS.previewImage);
  if (!(img instanceof HTMLImageElement)) {
    return;
  }
  if (loadListeners.has(img)) {
    return;
  }
  const onLoad = (): void => {
    if (!layoutActive || !placedThumbs.has(thumb)) {
      return;
    }
    const { naturalWidth, naturalHeight } = readPreviewRatio(thumb);
    const span = computeMasonryRowSpan(
      columnWidthPx,
      naturalWidth,
      naturalHeight,
    );
    scheduleSpanWrite(thumb, span);
  };
  loadListeners.set(img, onLoad);
  img.addEventListener("load", onLoad);
}

function placeThumb(thumb: HTMLElement): void {
  if (placedThumbs.has(thumb)) {
    return;
  }
  placedThumbs.add(thumb);
  const { naturalWidth, naturalHeight } = readPreviewRatio(thumb);
  const span = computeMasonryRowSpan(
    columnWidthPx,
    naturalWidth,
    naturalHeight,
  );
  scheduleSpanWrite(thumb, span);
  bindPreviewLoad(thumb);
}

function placeThumbsInRoot(root: ParentNode): void {
  const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
  for (const node of thumbs) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    placeThumb(node);
  }
}

function updateColumnWidthFromList(list: HTMLElement): void {
  columnWidthPx = computeMasonryColumnWidthPx(list.clientWidth);
}

function recalculateAllPlacedInList(list: HTMLElement): void {
  const thumbs = list.querySelectorAll(SITE_SELECTORS.thumb);
  for (const node of thumbs) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (!placedThumbs.has(node)) {
      placeThumb(node);
      continue;
    }
    const { naturalWidth, naturalHeight } = readPreviewRatio(node);
    const span = computeMasonryRowSpan(
      columnWidthPx,
      naturalWidth,
      naturalHeight,
    );
    scheduleSpanWrite(node, span);
  }
}

function activateLayout(): void {
  if (layoutActive) {
    return;
  }
  const list = findImageList();
  if (list === null) {
    return;
  }
  layoutActive = true;
  updateColumnWidthFromList(list);
  placeThumbsInRoot(list);
  if (resizeObserver === undefined) {
    resizeObserver = new ResizeObserver(() => {
      if (!layoutActive) {
        return;
      }
      const current = findImageList();
      if (current === null) {
        return;
      }
      const nextWidth = computeMasonryColumnWidthPx(current.clientWidth);
      if (nextWidth === columnWidthPx) {
        return;
      }
      columnWidthPx = nextWidth;
      recalculateAllPlacedInList(current);
    });
    resizeObserver.observe(list);
  }
}

function deactivateLayout(): void {
  layoutActive = false;
  placedThumbs.clear();
  if (resizeObserver !== undefined) {
    resizeObserver.disconnect();
    resizeObserver = undefined;
  }
  pendingSpans.clear();
  if (rafId !== 0) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function syncLayoutToBodyClass(): void {
  if (isMasonryChoiceActive()) {
    activateLayout();
    return;
  }
  deactivateLayout();
}

function onThumbsAddedRoot(root: ParentNode): void {
  if (!isMasonryChoiceActive()) {
    return;
  }
  if (!layoutActive) {
    activateLayout();
  }
  if (!layoutActive) {
    return;
  }
  placeThumbsInRoot(root);
}

/**
 * Begin observing list masonry (no-op when choice is not masonry).
 * Safe to call once per page; idempotent.
 */
export function startMasonryLayout(): void {
  if (started) {
    return;
  }
  started = true;
  if (unsubscribeThumbsAdded === undefined) {
    unsubscribeThumbsAdded = onThumbsAdded(onThumbsAddedRoot);
  }
  if (bodyClassObserver === undefined) {
    bodyClassObserver = new MutationObserver(() => {
      syncLayoutToBodyClass();
    });
    bodyClassObserver.observe(document.body, BODY_CLASS_OBSERVER_OPTIONS);
  }
  syncLayoutToBodyClass();
}

/** Tear down observers (tests / page teardown). */
export function stopMasonryLayout(): void {
  deactivateLayout();
  if (unsubscribeThumbsAdded !== undefined) {
    unsubscribeThumbsAdded();
    unsubscribeThumbsAdded = undefined;
  }
  if (bodyClassObserver !== undefined) {
    bodyClassObserver.disconnect();
    bodyClassObserver = undefined;
  }
  started = false;
}

/** Clears runtime state between tests. */
export function resetMasonryLayoutState(): void {
  stopMasonryLayout();
  columnWidthPx = MASONRY_COLUMN_MIN_PX;
}
