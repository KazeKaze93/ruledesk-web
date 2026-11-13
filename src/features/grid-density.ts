import { SITE_SELECTORS } from "../site/selectors";
import { featureChoiceBodyClass, type Feature } from "./types";

const FEATURE_ID = "grid-density";
const COMPACT_PX = 150;
const LARGE_PX = 250;
const MASONRY_VALUE = "masonry";
/** List-page host for masonry; favorites has no #post-list so rules do not apply. */
const MASONRY_LIST_SCOPE = "#post-list";
const MASONRY_COLUMN_WIDTH_PX = 240;
const MASONRY_COLUMN_GAP_PX = 4;
const MASONRY_LIST_WIDTH_PERCENT = 100;
const MASONRY_THUMB_WIDTH_PERCENT = 100;
const MASONRY_THUMB_MARGIN_TOP_PX = 0;
const MASONRY_THUMB_MARGIN_INLINE_PX = 0;
const MASONRY_THUMB_MARGIN_BOTTOM_PX = 4;
const MASONRY_PREVIEW_WIDTH_PERCENT = 100;
const MASONRY_BORDER_RADIUS_PX = 4;
/** Grow into flex row of #post-list so column-width can span content width. */
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
  const thumbMargin = `${MASONRY_THUMB_MARGIN_TOP_PX}px ${MASONRY_THUMB_MARGIN_INLINE_PX}px ${MASONRY_THUMB_MARGIN_BOTTOM_PX}px`;
  return [
    `${contentScope} {`,
    `  flex: ${contentFlex} !important;`,
    `  min-width: ${MASONRY_CONTENT_MIN_WIDTH_PX}px !important;`,
    `}`,
    `${scope} div.image-list {`,
    `  display: block !important;`,
    `  width: ${MASONRY_LIST_WIDTH_PERCENT}% !important;`,
    `  column-width: ${MASONRY_COLUMN_WIDTH_PX}px !important;`,
    `  column-gap: ${MASONRY_COLUMN_GAP_PX}px !important;`,
    `}`,
    `${scope} span.thumb {`,
    `  display: block !important;`,
    `  width: ${MASONRY_THUMB_WIDTH_PERCENT}% !important;`,
    `  height: auto !important;`,
    `  margin: ${thumbMargin} !important;`,
    `  break-inside: avoid !important;`,
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
  mount: () => {},
};
