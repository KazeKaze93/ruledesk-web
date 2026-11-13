import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SITE_BLACKLIST_COOKIE_NAME } from "../../src/config/constants";
import {
  blacklistHideFeature,
  resetBlacklistHideRuntimeState,
} from "../../src/features/blacklist-hide";
import {
  notifyThumbsAdded,
  resetFeatureRuntimeState,
} from "../../src/features/runtime";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import {
  resetSiteBlacklistListeners,
  writeSiteBlacklist,
} from "../../src/site/blacklist";

const CLASS_BLACKLISTED = "rdw-blacklisted";
const BODY_CLASS = featureBodyClass("blacklist-hide");

function clearCookies(): void {
  const cookies = document.cookie.split(";");
  for (const pair of cookies) {
    const name = pair.split("=")[0]?.trim();
    if (name !== undefined && name.length > 0) {
      document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; path=/`;
    }
  }
}

function makeCtx(
  pageKind: FeatureContext["pageKind"] = "list",
): FeatureContext {
  return {
    pageKind,
    search: "?page=post&s=list&tags=test",
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function buildThumb(
  postId: string,
  alt: string,
  title: string,
): HTMLSpanElement {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.id = `s${postId}`;

  const link = document.createElement("a");
  link.id = `p${postId}`;
  link.href = `index.php?page=post&s=view&id=${postId}`;

  const img = document.createElement("img");
  img.className = "preview";
  img.alt = alt;
  img.title = title;

  link.append(img);
  thumb.append(link);
  return thumb;
}

function buildList(...thumbs: HTMLSpanElement[]): HTMLDivElement {
  const list = document.createElement("div");
  list.className = "image-list";
  list.append(...thumbs);
  document.body.append(list);
  return list;
}

describe("blacklistHideFeature", () => {
  beforeEach(() => {
    clearCookies();
    resetFeatureRuntimeState();
    resetBlacklistHideRuntimeState();
    resetSiteBlacklistListeners();
    document.body.replaceChildren();
    document.body.className = BODY_CLASS;
  });

  afterEach(() => {
    resetBlacklistHideRuntimeState();
    resetSiteBlacklistListeners();
    resetFeatureRuntimeState();
    clearCookies();
    document.body.replaceChildren();
    document.body.className = "";
  });

  it("hides thumbs whose alt tags intersect the blacklist", () => {
    writeSiteBlacklist(["blocked_tag"]);
    const blocked = buildThumb(
      "1",
      "blocked_tag other",
      "blocked_tag other score:1 rating:s",
    );
    const safe = buildThumb("2", "safe_tag", "safe_tag score:1 rating:s");
    buildList(blocked, safe);

    blacklistHideFeature.mount(makeCtx());

    expect(blocked.classList.contains(CLASS_BLACKLISTED)).toBe(true);
    expect(safe.classList.contains(CLASS_BLACKLISTED)).toBe(false);
  });

  it("matches rating:x against the preview title, not alt alone", () => {
    writeSiteBlacklist(["rating:e"]);
    const explicit = buildThumb(
      "1",
      "tag_a",
      "tag_a score:2 rating:e",
    );
    const safe = buildThumb("2", "tag_b", "tag_b score:1 rating:s");
    const ratingOnlyInAlt = buildThumb(
      "3",
      "tag_c rating:e",
      "tag_c score:1 rating:s",
    );
    buildList(explicit, safe, ratingOnlyInAlt);

    blacklistHideFeature.mount(makeCtx());

    expect(explicit.classList.contains(CLASS_BLACKLISTED)).toBe(true);
    expect(safe.classList.contains(CLASS_BLACKLISTED)).toBe(false);
    expect(ratingOnlyInAlt.classList.contains(CLASS_BLACKLISTED)).toBe(false);
  });

  it("ignores user: blacklist entries", () => {
    writeSiteBlacklist(["user:alice", "user:bob"]);
    const thumb = buildThumb("1", "tag_a", "tag_a score:1 rating:s");
    buildList(thumb);

    blacklistHideFeature.mount(makeCtx());

    expect(thumb.classList.contains(CLASS_BLACKLISTED)).toBe(false);
  });

  it("stamps new thumbs delivered via onThumbsAdded", () => {
    writeSiteBlacklist(["late_tag"]);
    const list = buildList(
      buildThumb("1", "safe_tag", "safe_tag score:1 rating:s"),
    );
    blacklistHideFeature.mount(makeCtx());

    const late = buildThumb(
      "99",
      "late_tag extra",
      "late_tag extra score:1 rating:q",
    );
    list.append(late);
    notifyThumbsAdded(list);

    expect(late.classList.contains(CLASS_BLACKLISTED)).toBe(true);
  });

  it("reapplies immediately after writeSiteBlacklist without reload", () => {
    const blocked = buildThumb(
      "1",
      "will_block",
      "will_block score:1 rating:s",
    );
    const other = buildThumb("2", "keep", "keep score:1 rating:s");
    buildList(blocked, other);
    blacklistHideFeature.mount(makeCtx());

    expect(blocked.classList.contains(CLASS_BLACKLISTED)).toBe(false);

    writeSiteBlacklist(["will_block"]);

    expect(blocked.classList.contains(CLASS_BLACKLISTED)).toBe(true);
    expect(other.classList.contains(CLASS_BLACKLISTED)).toBe(false);

    writeSiteBlacklist([]);

    expect(blocked.classList.contains(CLASS_BLACKLISTED)).toBe(false);
  });

  it("does nothing on non-list pages", () => {
    writeSiteBlacklist(["blocked_tag"]);
    const thumb = buildThumb(
      "1",
      "blocked_tag",
      "blocked_tag score:1 rating:s",
    );
    buildList(thumb);

    blacklistHideFeature.mount(makeCtx("post"));

    expect(thumb.classList.contains(CLASS_BLACKLISTED)).toBe(false);
  });

  it("exposes hide CSS gated on the feature body class", () => {
    expect(blacklistHideFeature.css).toContain(BODY_CLASS);
    expect(blacklistHideFeature.css).toContain(CLASS_BLACKLISTED);
    expect(blacklistHideFeature.css).toContain("display: none");
  });
});
