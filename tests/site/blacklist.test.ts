import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SITE_BLACKLIST_COOKIE_NAME } from "../../src/config/constants";
import {
  isBlacklisted,
  readSiteBlacklist,
} from "../../src/site/blacklist";

function setCookie(raw: string): void {
  document.cookie = `${SITE_BLACKLIST_COOKIE_NAME}=${raw}`;
}

function clearCookies(): void {
  const cookies = document.cookie.split(";");
  for (const pair of cookies) {
    const name = pair.split("=")[0]?.trim();
    if (name !== undefined && name.length > 0) {
      document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; path=/`;
    }
  }
}

describe("readSiteBlacklist", () => {
  beforeEach(() => {
    clearCookies();
  });

  afterEach(() => {
    clearCookies();
  });

  it("returns an empty list when the cookie is missing", () => {
    expect(readSiteBlacklist()).toEqual([]);
  });

  it("decodes and splits like the site (comma, space, %20)", () => {
    setCookie(encodeURI("tag_a,tag_b%20tag_c rating:e"));
    expect(readSiteBlacklist()).toEqual([
      "tag_a",
      "tag_b",
      "tag_c",
      "rating:e",
    ]);
  });

  it("drops empties and lowercases entries", () => {
    setCookie(encodeURI("Tag_A,,  ,TAG_B"));
    expect(readSiteBlacklist()).toEqual(["tag_a", "tag_b"]);
  });
});

describe("isBlacklisted", () => {
  it("matches a normal tag case-insensitively", () => {
    expect(
      isBlacklisted(["Cat", "dog"], 0, "s", ["cat"]),
    ).toBe(true);
    expect(
      isBlacklisted(["dog"], 0, "s", ["cat"]),
    ).toBe(false);
  });

  it("matches rating:x entries against the post rating", () => {
    expect(
      isBlacklisted(["dog"], 1, "e", ["rating:e"]),
    ).toBe(true);
    expect(
      isBlacklisted(["dog"], 1, "s", ["rating:e"]),
    ).toBe(false);
  });

  it("ignores user: entries", () => {
    expect(
      isBlacklisted(["dog"], 0, "s", ["user:someone", "user:x"]),
    ).toBe(false);
  });

  it("returns false for an empty list", () => {
    expect(isBlacklisted(["cat"], 10, "q", [])).toBe(false);
  });
});
