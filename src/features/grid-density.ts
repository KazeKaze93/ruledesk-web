import { featureChoiceBodyClass, type Feature } from "./types";

const FEATURE_ID = "grid-density";
const COMPACT_PX = 150;
const LARGE_PX = 250;
const MASONRY_VALUE = "masonry";
const MASONRY_COLUMN_WIDTH_PX = 200;
const MASONRY_COLUMN_GAP_PX = 10;
const MASONRY_THUMB_MARGIN = "0 0 10px";

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
  return [
    `body.${bodyClass} div.image-list {`,
    `  display: block !important;`,
    `  column-width: ${MASONRY_COLUMN_WIDTH_PX}px !important;`,
    `  column-gap: ${MASONRY_COLUMN_GAP_PX}px !important;`,
    `}`,
    `body.${bodyClass} span.thumb {`,
    `  display: block !important;`,
    `  width: auto !important;`,
    `  height: auto !important;`,
    `  margin: ${MASONRY_THUMB_MARGIN} !important;`,
    `  break-inside: avoid !important;`,
    `}`,
    `body.${bodyClass} span.thumb > a {`,
    `  display: block !important;`,
    `  width: auto !important;`,
    `  height: auto !important;`,
    `}`,
    `body.${bodyClass} span.thumb img.preview {`,
    `  display: block !important;`,
    `  width: 100% !important;`,
    `  height: auto !important;`,
    `  max-width: none !important;`,
    `  max-height: none !important;`,
    `  margin: 0 !important;`,
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
