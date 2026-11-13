import { describe, expect, it } from "vitest";

import { IMAGE_LIST_GAP_PX } from "../../src/config/constants";
import { gridDensityFeature } from "../../src/features/grid-density";
import { featureBodyClass, featureChoiceBodyClass } from "../../src/features/types";

describe("gridDensityFeature", () => {
  it("exposes choice defaultValue default and list+favorites pages", () => {
    expect(gridDensityFeature.choice?.defaultValue).toBe("default");
    expect(gridDensityFeature.pages).toEqual(["list", "favorites"]);
    expect(gridDensityFeature.defaultEnabled).toBe(true);
    expect(gridDensityFeature.cssOnly).toBe(true);
    expect(gridDensityFeature.choice?.options.map((option) => option.value)).toEqual([
      "default",
      "compact",
      "large",
    ]);
    expect(gridDensityFeature.choice?.options.map((option) => option.label)).toEqual([
      "Default",
      "Compact (150)",
      "Large (250)",
    ]);
    expect(gridDensityFeature.css).not.toContain("masonry");
    expect(gridDensityFeature.css).not.toContain("--rdw-masonry-span");
  });

  it("css has compact 150 and large 250 with !important; no default size rules", () => {
    const css = gridDensityFeature.css;
    const compactClass = featureChoiceBodyClass("grid-density", "compact");
    const largeClass = featureChoiceBodyClass("grid-density", "large");
    const defaultClass = featureChoiceBodyClass("grid-density", "default");

    expect(css).toContain(`body.${compactClass}`);
    expect(css).toContain("150px !important");
    expect(css).toContain(`body.${largeClass}`);
    expect(css).toContain("250px !important");
    expect(css).not.toContain(defaultClass);
    expect(css).not.toMatch(
      /body\.rdw-f-grid-density-default[\s\S]*?(?:width|height|max-width|max-height)\s*:/,
    );
  });

  it("sets a 4px column and row gap without changing cell size", () => {
    const css = gridDensityFeature.css;
    const bodyClass = featureBodyClass("grid-density");
    expect(IMAGE_LIST_GAP_PX).toBe(4);
    expect(css).toContain(`body.${bodyClass} div.image-list`);
    expect(css).toContain(`column-gap: ${String(IMAGE_LIST_GAP_PX)}px !important`);
    expect(css).toContain(`row-gap: ${String(IMAGE_LIST_GAP_PX)}px !important`);
    expect(css).toContain("150px !important");
    expect(css).toContain("250px !important");
  });

  it("mount does not mutate the document", () => {
    const beforeHtml = document.body.innerHTML;
    const beforeClass = document.body.className;
    gridDensityFeature.mount({
      pageKind: "list",
      search: "?page=post&s=list",
      getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
      setState: () => {
        throw new Error("setState must not be called");
      },
    });
    gridDensityFeature.mount({
      pageKind: "favorites",
      search: "?page=favorites&s=view",
      getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
      setState: () => {
        throw new Error("setState must not be called");
      },
    });
    expect(document.body.innerHTML).toBe(beforeHtml);
    expect(document.body.className).toBe(beforeClass);
  });
});
