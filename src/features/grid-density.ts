import { SITE_SELECTORS } from "../site/selectors";
import { featureChoiceBodyClass, type Feature, type FeatureContext } from "./types";

export const GRID_DENSITY_FEATURE_ID = "grid-density";
const FEATURE_ID = GRID_DENSITY_FEATURE_ID;
const COMPACT_PX = 150;
const LARGE_PX = 250;
export const MASONRY_VALUE = "masonry";
/** List-page host for masonry; favorites has no #post-list so rules do not apply. */
export const MASONRY_LIST_SCOPE = "#post-list";
/** minmax() track minimum — keep in sync with masonry-layout column math. */
export const MASONRY_COLUMN_MIN_PX = 170;
export const MASONRY_COLUMN_GAP_PX = 4;
export const MASONRY_ROW_UNIT_PX = 4;
export const MASONRY_ROW_GAP_PX = 0;
/** Extra height baked into row-span so items separate with row-gap: 0. */
export const MASONRY_ITEM_GAP_PX = 4;
/** Per-thumb CSS variable driving `grid-row-end: span N` (set by masonry-layout). */
export const MASONRY_SPAN_CSS_VAR = "--rdw-masonry-span";
const MASONRY_LIST_WIDTH_PERCENT = 100;
const MASONRY_THUMB_WIDTH_PERCENT = 100;
const MASONRY_PREVIEW_WIDTH_PERCENT = 100;
const MASONRY_BORDER_RADIUS_PX = 4;
/** 1:1 placeholder span at min column width before JS runs. */
const MASONRY_SPAN_FALLBACK = Math.ceil(
  (MASONRY_COLUMN_MIN_PX + MASONRY_ITEM_GAP_PX) / MASONRY_ROW_UNIT_PX,
);
/** Grow into flex row of #post-list so grid tracks can span content width. */
const MASONRY_CONTENT_FLEX_GROW = 1;
const MASONRY_CONTENT_FLEX_SHRINK = 1;
const MASONRY_CONTENT_FLEX_BASIS = "auto";
const MASONRY_CONTENT_MIN_WIDTH_PX = 0;

function sizeCss(choiceValue: string, px: number): string {
  const bodyClass = featureChoiceBodyClass(FEATURE_ID, choiceValue);
  return [
    `body.${bodyClass} span.thumb,`,
    `body.${bodyClass} span.thumb > a {`,
    `  width: ${px}px !important;`,
    `  height: ${px}px !important;`,
    `}`,
    `body.${bodyClass} img.preview {`,
    `  max-width: ${px}px !important;`,
    `  max-height: ${px}px !important;`,
    `}`,
  ].join("\n");
}

function masonryCss(): string {
  const bodyClass = featureChoiceBodyClass(FEATURE_ID, MASONRY_VALUE);
  const scope = `body.${bodyClass} ${MASONRY_LIST_SCOPE}`;
  const contentScope = `body.${bodyClass} ${SITE_SELECTORS.postListContent}`;
  const contentFlex = `${MASONRY_CONTENT_FLEX_GROW} ${MASONRY_CONTENT_FLEX_SHRINK} ${MASONRY_CONTENT_FLEX_BASIS}`;
  const gridColumns = `repeat(auto-fill, minmax(${MASONRY_COLUMN_MIN_PX}px, 1fr))`;
  return [
    `${contentScope} {`,
    `  flex: ${contentFlex} !important;`,
    `  min-width: ${MASONRY_CONTENT_MIN_WIDTH_PX}px !important;`,
    `}`,
    `${scope} div.image-list {`,
    `  display: grid !important;`,
    `  width: ${MASONRY_LIST_WIDTH_PERCENT}% !important;`,
    `  grid-template-columns: ${gridColumns} !important;`,
    `  grid-auto-rows: ${MASONRY_ROW_UNIT_PX}px !important;`,
    `  column-gap: ${MASONRY_COLUMN_GAP_PX}px !important;`,
    `  row-gap: ${MASONRY_ROW_GAP_PX}px !important;`,
    `}`,
    `${scope} span.thumb {`,
    `  display: block !important;`,
    `  width: ${MASONRY_THUMB_WIDTH_PERCENT}% !important;`,
    `  height: auto !important;`,
    `  margin: 0 !important;`,
    `  grid-row-end: span var(${MASONRY_SPAN_CSS_VAR}, ${MASONRY_SPAN_FALLBACK}) !important;`,
    `}`,
    `${scope} span.thumb > a {`,
    `  display: block !important;`,
    `  width: ${MASONRY_THUMB_WIDTH_PERCENT}% !important;`,
    `  height: auto !important;`,
    `}`,
    `${scope} span.thumb img.preview {`,
    `  display: block !important;`,
    `  width: ${MASONRY_PREVIEW_WIDTH_PERCENT}% !important;`,
    `  height: auto !important;`,
    `  max-width: none !important;`,
    `  max-height: none !important;`,
    `  margin: 0 !important;`,
    `  border-radius: ${MASONRY_BORDER_RADIUS_PX}px !important;`,
    `}`,
  ].join("\n");
}

/**
 * Schedule masonry-layout after first paint (rAF + setTimeout 0), matching
 * boot/ready.scheduleAfterFirstPaint so this stay off the CSS-first path.
 */
function mountGridDensity(ctx: FeatureContext): void {
  if (ctx.pageKind !== "list") {
    return;
  }
  requestAnimationFrame(() => {
    setTimeout(() => {
      void import("./masonry-layout").then((mod) => {
        mod.startMasonryLayout();
      });
    }, 0);
  });
}

export const gridDensityFeature: Feature = {
  id: FEATURE_ID,
  label: "Grid size",
  pages: ["list", "favorites"],
  defaultEnabled: true,
  cssOnly: true,
  choice: {
    options: [
      { value: "default", label: "Default" },
      { value: "compact", label: "Compact (150)" },
      { value: "large", label: "Large (250)" },
      { value: MASONRY_VALUE, label: "Masonry" },
    ],
    defaultValue: "default",
  },
  css: [
    sizeCss("compact", COMPACT_PX),
    sizeCss("large", LARGE_PX),
    masonryCss(),
  ].join("\n"),
  mount: mountGridDensity,
};
