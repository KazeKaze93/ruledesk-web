import { describe, expect, it } from "vitest";

import {
  buildFeedQuery,
  buildFeedUrl,
  buildUpdatesQueries,
  buildUpdatesSearchUrl,
  isFullUpdatesQuery,
  isPartialUpdatesQuery,
  normalizeArtistTag,
} from "../src/search/query";

describe("normalizeArtistTag", () => {
  it("trims, lowercases, and replaces spaces with underscores", () => {
    expect(normalizeArtistTag("  Nyx X  ")).toBe("nyx_x");
  });

  it("rejects empty, operators, leading minus, and leftover whitespace", () => {
    expect(normalizeArtistTag("")).toBeNull();
    expect(normalizeArtistTag("   ")).toBeNull();
    expect(normalizeArtistTag("(")).toBeNull();
    expect(normalizeArtistTag(")")).toBeNull();
    expect(normalizeArtistTag("~")).toBeNull();
    expect(normalizeArtistTag("-foo")).toBeNull();
    expect(normalizeArtistTag("foo\tbar")).toBeNull();
  });
});

describe("buildUpdatesQueries", () => {
  it("formats a single artist", () => {
    expect(buildUpdatesQueries(["nyx_x"], 0, 0)).toEqual(["nyx_x"]);
  });

  it("formats an or-group and appends id filter when seen > 0", () => {
    expect(buildUpdatesQueries(["a", "b", "c"], 19300000, 0)).toEqual([
      "( a ~ b ~ c ) id:>19300000",
    ]);
  });

  it("splits into groups by groupSize", () => {
    expect(buildUpdatesQueries(["a", "b", "c", "d"], 0, 2)).toEqual([
      "( a ~ b )",
      "( c ~ d )",
    ]);
  });
});

describe("buildUpdatesSearchUrl", () => {
  it("matches the site encoding sample", () => {
    expect(buildUpdatesSearchUrl("( a ~ b ) id:>19300000")).toBe(
      "https://rule34.xxx/index.php?page=post&s=list&tags=%28+a+~+b+%29+id%3A%3E19300000",
    );
  });
});

describe("buildFeedQuery / buildFeedUrl", () => {
  it("returns the first artist group without an id token", () => {
    expect(buildFeedQuery(["nyx_x"], 0)).toBe("nyx_x");
    expect(buildFeedQuery(["a", "b", "c"], 0)).toBe("( a ~ b ~ c )");
    expect(buildFeedQuery(["a", "b", "c", "d"], 2)).toBe("( a ~ b )");
  });

  it("returns an empty query and a plain list URL when there are no artists", () => {
    expect(buildFeedQuery([], 0)).toBe("");
    expect(buildFeedUrl([], 0)).toBe(
      "https://rule34.xxx/index.php?page=post&s=list&tags=",
    );
  });

  it("builds a search URL for the first feed group", () => {
    expect(buildFeedUrl(["a", "b"], 0)).toBe(
      "https://rule34.xxx/index.php?page=post&s=list&tags=%28+a+~+b+%29",
    );
  });
});

describe("isFullUpdatesQuery / isPartialUpdatesQuery", () => {
  const tracked = ["a", "b", "nyx_x"];

  it("treats a full group and a single tracked artist as full", () => {
    expect(isFullUpdatesQuery("( a ~ b ~ nyx_x )", tracked)).toBe(true);
    expect(isFullUpdatesQuery("( nyx_x ~ a ~ b ) id:>10", tracked)).toBe(true);
    expect(isFullUpdatesQuery("nyx_x", ["nyx_x"])).toBe(true);
    expect(isFullUpdatesQuery("nyx_x id:>10", ["nyx_x"])).toBe(true);
  });

  it("order of artists does not matter for full matches", () => {
    expect(isFullUpdatesQuery("( b ~ a ~ nyx_x )", tracked)).toBe(true);
  });

  it("marks incomplete tracked sets with id as partial only", () => {
    expect(isPartialUpdatesQuery("( a ~ b ) id:>19300000", tracked)).toBe(true);
    expect(isPartialUpdatesQuery("a id:>5", tracked)).toBe(true);
    expect(isFullUpdatesQuery("( a ~ b ) id:>19300000", tracked)).toBe(false);
  });

  it("does not treat incomplete sets without id as updates queries", () => {
    expect(isPartialUpdatesQuery("( a ~ b )", tracked)).toBe(false);
    expect(isFullUpdatesQuery("( a ~ b )", tracked)).toBe(false);
    expect(isPartialUpdatesQuery("a", tracked)).toBe(false);
    expect(isFullUpdatesQuery("a", tracked)).toBe(false);
  });

  it("rejects foreign tags and duplicate tags", () => {
    expect(isFullUpdatesQuery("( a ~ stranger )", tracked)).toBe(false);
    expect(isPartialUpdatesQuery("( a ~ stranger ) id:>1", tracked)).toBe(
      false,
    );
    expect(isFullUpdatesQuery("( a ~ a ~ b )", ["a", "b"])).toBe(false);
    expect(isPartialUpdatesQuery("( a ~ a ) id:>1", tracked)).toBe(false);
    expect(isFullUpdatesQuery("( a ~ b ) sort:score", tracked)).toBe(false);
    expect(isFullUpdatesQuery("a b", tracked)).toBe(false);
  });
});
