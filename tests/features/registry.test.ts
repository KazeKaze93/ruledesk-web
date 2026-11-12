import { describe, expect, it } from "vitest";

import { FEATURES } from "../../src/features/registry";

describe("FEATURES registry", () => {
  it("does not register top-bar or dark-theme", () => {
    const ids = FEATURES.map((feature) => feature.id);
    expect(ids).not.toContain("top-bar");
    expect(ids).not.toContain("dark-theme");
    expect(ids).toContain("search-tokens");
    expect(ids).toContain("pager");
  });
});
