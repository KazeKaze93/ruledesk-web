import { describe, expect, it } from "vitest";

import { FEATURES } from "../../src/features/registry";

describe("FEATURES registry", () => {
  it("registers 0.8.0 modules in order and omits removed ones", () => {
    const ids = FEATURES.map((feature) => feature.id);
    expect(ids).toEqual([
      "feed",
      "menu-cleanup",
      "tag-groups",
      "search-tools",
      "seen-dim",
      "playlist-menu",
      "playlist-bar",
      "infinite-scroll",
      "post-actions",
      "grid-density",
    ]);
    expect(ids).not.toContain("top-bar");
    expect(ids).not.toContain("dark-theme");
    expect(ids).not.toContain("pager");
    expect(ids).not.toContain("followed-badge");
    expect(ids).not.toContain("search-tokens");
  });
});
