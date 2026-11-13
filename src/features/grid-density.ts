import { IMAGE_LIST_GAP_PX } from "../config/constants";
import {
  featureBodyClass,
  featureChoiceBodyClass,
  type Feature,
} from "./types";

export const GRID_DENSITY_FEATURE_ID = "grid-density";
const FEATURE_ID = GRID_DENSITY_FEATURE_ID;
const COMPACT_PX = 150;
const LARGE_PX = 250;
const CHOICE_DEFAULT = "default";
const CHOICE_COMPACT = "compact";
const CHOICE_LARGE = "large";

function sizeCss(choiceValue: string, px: number): string {
  const bodyClass = featureChoiceBodyClass(FEATURE_ID, choiceValue);
  return [
    `body.${bodyClass} span.thumb,`,
    `body.${bodyClass} span.thumb > a {`,
    `  width: ${String(px)}px !important;`,
    `  height: ${String(px)}px !important;`,
    `}`,
    `body.${bodyClass} img.preview {`,
    `  max-width: ${String(px)}px !important;`,
    `  max-height: ${String(px)}px !important;`,
    `}`,
  ].join("\n");
}

/** Same gap on both axes for Default, Compact, and Large. Does not set cell size. */
function gapCss(): string {
  const bodyClass = featureBodyClass(FEATURE_ID);
  return [
    `body.${bodyClass} div.image-list {`,
    `  column-gap: ${String(IMAGE_LIST_GAP_PX)}px !important;`,
    `  row-gap: ${String(IMAGE_LIST_GAP_PX)}px !important;`,
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
      { value: CHOICE_DEFAULT, label: "Default" },
      { value: CHOICE_COMPACT, label: "Compact (150)" },
      { value: CHOICE_LARGE, label: "Large (250)" },
    ],
    defaultValue: CHOICE_DEFAULT,
  },
  css: [
    sizeCss(CHOICE_COMPACT, COMPACT_PX),
    sizeCss(CHOICE_LARGE, LARGE_PX),
    gapCss(),
  ].join("\n"),
  mount: () => undefined,
};
