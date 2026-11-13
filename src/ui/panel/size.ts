/** Border-box size helpers for panel resize persistence (shrink-bug fix). */

export const PANEL_MIN_WIDTH_PX = 340;
export const PANEL_MIN_HEIGHT_PX = 260;
export const PANEL_DEFAULT_WIDTH_PX = 360;
export const PANEL_DEFAULT_HEIGHT_PX = 480;
export const PANEL_MAX_WIDTH_CSS = "90vw";
export const PANEL_MAX_HEIGHT_CSS = "90vh";
export const SIZE_PERSIST_MS = 300;

export type PanelSize = {
  readonly width: number;
  readonly height: number;
};

export function clampSize(value: number, min: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.floor(value));
}

/**
 * Reads border-box size from a ResizeObserver entry.
 * Prefers `borderBoxSize[0]`; falls back to offsetWidth/offsetHeight.
 * Returns null when either dimension is missing or non-positive after rounding.
 */
export function measureBorderBoxSize(
  entry: ResizeObserverEntry,
  element: HTMLElement,
): PanelSize | null {
  const boxList = entry.borderBoxSize;
  const box =
    boxList !== undefined && boxList.length > 0 ? boxList[0] : undefined;
  let width: number;
  let height: number;
  if (box !== undefined) {
    width = Math.round(box.inlineSize);
    height = Math.round(box.blockSize);
  } else {
    width = Math.round(element.offsetWidth);
    height = Math.round(element.offsetHeight);
  }
  if (width <= 0 || height <= 0) {
    return null;
  }
  return {
    width: clampSize(width, PANEL_MIN_WIDTH_PX),
    height: clampSize(height, PANEL_MIN_HEIGHT_PX),
  };
}

export function sizesEqual(a: PanelSize, b: PanelSize): boolean {
  return a.width === b.width && a.height === b.height;
}

export function buildSizeCssRule(width: number, height: number): string {
  return `.rdw-panel{width:${String(width)}px;height:${String(height)}px;}`;
}
