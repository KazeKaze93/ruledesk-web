import { featureChoiceBodyClass, type Feature } from "./types";

const FEATURE_ID = "grid-density";
const COMPACT_PX = 150;
const LARGE_PX = 250;

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

export const gridDensityFeature: Feature = {
  id: FEATURE_ID,
  label: "Grid size",
  pages: ["list", "favorites"],
  defaultEnabled: true,
  choice: {
    options: [
      { value: "compact", label: "Compact" },
      { value: "default", label: "Default" },
      { value: "large", label: "Large" },
    ],
    defaultValue: "default",
  },
  css: [sizeCss("compact", COMPACT_PX), sizeCss("large", LARGE_PX)].join("\n"),
  mount: () => {},
};
