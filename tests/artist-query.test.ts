import { describe, expect, it } from "vitest";

import {
  buildUpdatesQueries,
  buildUpdatesSearchUrl,
  isUpdatesQuery,
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

describe("isUpdatesQuery", () => {
  const tracked = ["a", "b", "nyx_x"];

  it("accepts a single tracked artist and optional id token", () => {
    expect(isUpdatesQuery("nyx_x", tracked)).toBe(true);
    expect(isUpdatesQuery("nyx_x id:>10", tracked)).toBe(true);
  });

  it("accepts a group of tracked artists", () => {
    expect(isUpdatesQuery("( a ~ b )", tracked)).toBe(true);
    expect(isUpdatesQuery("( a ~ b ) id:>19300000", tracked)).toBe(true);
  });

  it("rejects foreign artists, extra tokens, and malformed groups", () => {
    expect(isUpdatesQuery("( a ~ stranger )", tracked)).toBe(false);
    expect(isUpdatesQuery("( a ~ b ) sort:score", tracked)).toBe(false);
    expect(isUpdatesQuery("a b", tracked)).toBe(false);
    expect(isUpdatesQuery("( a b )", tracked)).toBe(false);
  });
});
