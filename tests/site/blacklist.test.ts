import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SITE_BLACKLIST_COOKIE_NAME } from "../../src/config/constants";
import {
  isBlacklisted,
  readSiteBlacklist,
  writeSiteBlacklist,
} from "../../src/site/blacklist";

const LIVE_COOKIE_VALUE = "gay%2520gay_sex%2520roblox";
const LIVE_TAGS = ["gay", "gay_sex", "roblox"] as const;

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

  it("reads the live double-encoded cookie value", () => {
    setCookie(LIVE_COOKIE_VALUE);
    expect(readSiteBlacklist()).toEqual([...LIVE_TAGS]);
  });
});

describe("writeSiteBlacklist", () => {
  beforeEach(() => {
    clearCookies();
  });

  afterEach(() => {
    clearCookies();
  });

  it("writes the live double-encoded cookie value", () => {
    writeSiteBlacklist([...LIVE_TAGS]);
    const raw = document.cookie
      .split(";")
      .map((pair) => pair.trim())
      .find((pair) => pair.startsWith(`${SITE_BLACKLIST_COOKIE_NAME}=`));
    expect(raw).toBe(`${SITE_BLACKLIST_COOKIE_NAME}=${LIVE_COOKIE_VALUE}`);
    expect(readSiteBlacklist()).toEqual([...LIVE_TAGS]);
  });

  it("normalizes trim, case, spaces, empties, and duplicates", () => {
    writeSiteBlacklist(["  Gay Sex  ", "GAY_SEX", "", "Roblox", "roblox"]);
    expect(readSiteBlacklist()).toEqual(["gay_sex", "roblox"]);
  });

  it("writes an empty value for an empty list", () => {
    writeSiteBlacklist(["gay"]);
    writeSiteBlacklist([]);
    expect(readSiteBlacklist()).toEqual([]);
    const raw = document.cookie
      .split(";")
      .map((pair) => pair.trim())
      .find((pair) => pair.startsWith(`${SITE_BLACKLIST_COOKIE_NAME}=`));
    expect(raw === undefined || raw === `${SITE_BLACKLIST_COOKIE_NAME}=`).toBe(
      true,
    );
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
