import { describe, expect, it, vi } from "vitest";

import {
  gridDensityFeature,
  MASONRY_COLUMN_GAP_PX,
  MASONRY_COLUMN_MIN_PX,
  MASONRY_ROW_GAP_PX,
  MASONRY_ROW_UNIT_PX,
  MASONRY_SPAN_CSS_VAR,
} from "../../src/features/grid-density";
import { featureChoiceBodyClass } from "../../src/features/types";
import { SITE_SELECTORS } from "../../src/site/selectors";

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
      "masonry",
    ]);
    expect(gridDensityFeature.choice?.options.map((option) => option.label)).toEqual([
      "Default",
      "Compact (150)",
      "Large (250)",
      "Masonry",
    ]);
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

  it("css has masonry CSS grid layout under body.rdw-f-grid-density-masonry", () => {
    const css = gridDensityFeature.css;
    const masonryClass = featureChoiceBodyClass("grid-density", "masonry");
    const masonryList = `body.${masonryClass} #post-list div.image-list`;
    const masonryThumb = `body.${masonryClass} #post-list span.thumb`;
    const masonryPreview = `body.${masonryClass} #post-list span.thumb img.preview`;

    expect(css).toContain(masonryList);
    expect(css).toContain("display: grid !important");
    expect(css).toContain("width: 100% !important");
    expect(css).toContain(
      `grid-template-columns: repeat(auto-fill, minmax(${MASONRY_COLUMN_MIN_PX}px, 1fr)) !important`,
    );
    expect(css).toContain(
      `grid-auto-rows: ${MASONRY_ROW_UNIT_PX}px !important`,
    );
    expect(css).toContain(
      `column-gap: ${MASONRY_COLUMN_GAP_PX}px !important`,
    );
    expect(css).toContain(`row-gap: ${MASONRY_ROW_GAP_PX}px !important`);
    expect(css).not.toContain("column-width:");
    expect(css).not.toContain("break-inside:");
    expect(css).toContain(masonryThumb);
    expect(css).toContain("height: auto !important");
    expect(css).toContain(
      `grid-row-end: span var(${MASONRY_SPAN_CSS_VAR}`,
    );
    expect(css).toContain(`body.${masonryClass} #post-list span.thumb > a`);
    expect(css).toContain(masonryPreview);
    expect(css).toContain("border-radius: 4px !important");
    expect(css).toContain("max-width: none !important");
    expect(css).toContain("max-height: none !important");
  });

  it("masonry grows #post-list div.content so grid fills flex content width", () => {
    const css = gridDensityFeature.css;
    const masonryClass = featureChoiceBodyClass("grid-density", "masonry");
    const masonryContent = `body.${masonryClass} ${SITE_SELECTORS.postListContent}`;

    expect(SITE_SELECTORS.postListContent).toBe("#post-list div.content");
    expect(css).toContain(masonryContent);
    expect(css).toContain("flex: 1 1 auto !important");
    expect(css).toContain("min-width: 0px !important");
  });

  it("masonry rules are scoped to #post-list so favorites does not get them", () => {
    const css = gridDensityFeature.css;
    const masonryClass = featureChoiceBodyClass("grid-density", "masonry");

    expect(css).toContain(`body.${masonryClass} #post-list`);
    expect(css).not.toMatch(
      new RegExp(
        `body\\.${masonryClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+div\\.image-list`,
      ),
    );
    expect(gridDensityFeature.pages).toContain("favorites");
  });

  it("mount on list does not mutate DOM synchronously (defers masonry-layout)", () => {
    vi.useFakeTimers();
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
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("mount on favorites is a sync noop", () => {
    const beforeHtml = document.body.innerHTML;
    gridDensityFeature.mount({
      pageKind: "favorites",
      search: "?page=favorites&s=view",
      getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
      setState: () => {
        throw new Error("setState must not be called");
      },
    });
    expect(document.body.innerHTML).toBe(beforeHtml);
  });
});
