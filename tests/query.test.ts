import { describe, expect, it } from "vitest";

import {
  TAG_TYPE_EXCLUDE,
  TAG_TYPE_INCLUDE,
} from "../src/config/constants";
import {
  buildSearchUrl,
  parseTags,
  serialize,
} from "../src/search/query";
import type { TagEntry } from "../src/storage/schema";

describe("parseTags", () => {
  it("parses include and exclude tokens", () => {
    expect(parseTags("cat -dog bird")).toEqual([
      { tag: "cat", type: TAG_TYPE_INCLUDE },
      { tag: "dog", type: TAG_TYPE_EXCLUDE },
      { tag: "bird", type: TAG_TYPE_INCLUDE },
    ]);
  });

  it("returns empty array for empty or whitespace-only input", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags("   ")).toEqual([]);
  });

  it("collapses repeated whitespace", () => {
    expect(parseTags("  a   -b\tc  ")).toEqual([
      { tag: "a", type: TAG_TYPE_INCLUDE },
      { tag: "b", type: TAG_TYPE_EXCLUDE },
      { tag: "c", type: TAG_TYPE_INCLUDE },
    ]);
  });

  it("keeps special characters inside tags", () => {
    expect(parseTags("artist:foo_(bar) score:>=10")).toEqual([
      { tag: "artist:foo_(bar)", type: TAG_TYPE_INCLUDE },
      { tag: "score:>=10", type: TAG_TYPE_INCLUDE },
    ]);
  });

  it("keeps a lone minus token as include", () => {
    expect(parseTags("-")).toEqual([{ tag: "-", type: TAG_TYPE_INCLUDE }]);
  });
});

describe("serialize / parseTags round-trip", () => {
  it("restores the original tag entries", () => {
    const tags: TagEntry[] = [
      { tag: "cat", type: TAG_TYPE_INCLUDE },
      { tag: "dog", type: TAG_TYPE_EXCLUDE },
      { tag: "artist:foo_(bar)", type: TAG_TYPE_INCLUDE },
      { tag: "score:>=10", type: TAG_TYPE_EXCLUDE },
    ];
    expect(parseTags(serialize(tags))).toEqual(tags);
  });
});

describe("buildSearchUrl", () => {
  it("builds a list search URL with + separators and encoded tags", () => {
    const tags: TagEntry[] = [
      { tag: "foo bar", type: TAG_TYPE_INCLUDE },
      { tag: "baz", type: TAG_TYPE_EXCLUDE },
      { tag: "a+b", type: TAG_TYPE_INCLUDE },
    ];
    expect(buildSearchUrl(tags)).toBe(
      "https://rule34.xxx/index.php?page=post&s=list&tags=foo%20bar+-baz+a%2Bb",
    );
  });
});
