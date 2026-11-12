import { describe, expect, it } from "vitest";

import { gridDensityFeature } from "../../src/features/grid-density";
import { featureChoiceBodyClass } from "../../src/features/types";

describe("gridDensityFeature", () => {
  it("exposes choice defaultValue default and list+favorites pages", () => {
    expect(gridDensityFeature.choice?.defaultValue).toBe("default");
    expect(gridDensityFeature.pages).toEqual(["list", "favorites"]);
    expect(gridDensityFeature.defaultEnabled).toBe(true);
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

  it("mount is a noop", () => {
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
    expect(document.body.innerHTML).toBe(beforeHtml);
    expect(document.body.className).toBe(beforeClass);
  });
});
