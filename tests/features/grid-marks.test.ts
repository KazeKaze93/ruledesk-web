import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  followedBadgeFeature,
  seenDimFeature,
} from "../../src/features/grid-marks";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import { createDefaultStorage } from "../../src/storage/schema";
import {
  addArtist,
  load,
  save,
} from "../../src/storage/store";

const FOLLOWED_BADGE_CLASS = "rdw-followed-badge";
const SEEN_CLASS = "rdw-seen";
const THUMB_CLASS = "rdw-thumb";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  vi.stubGlobal(
    "GM_getValue",
    (key: string, defaultValue?: unknown): unknown => {
      if (!memory.has(key)) {
        return defaultValue;
      }
      return memory.get(key);
    },
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

function makeCtx(
  pageKind: FeatureContext["pageKind"],
  search: string,
): FeatureContext {
  return {
    pageKind,
    search,
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function buildThumb(postId: string, alt: string): HTMLSpanElement {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.id = `s${postId}`;

  const link = document.createElement("a");
  link.id = `p${postId}`;
  link.href = `index.php?page=post&s=view&id=${postId}`;

  const img = document.createElement("img");
  img.className = "preview";
  img.alt = alt;

  link.append(img);
  thumb.append(link);
  return thumb;
}

describe("followedBadgeFeature", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    document.body.className = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("appends a Following badge when a followed artist is in alt", () => {
    addArtist("artist_a");
    const thumb = buildThumb("111", "tag_x artist_a tag_y");
    document.body.append(thumb);

    followedBadgeFeature.mount(makeCtx("list", "?page=post&s=list"));

    const badge = thumb.querySelector(`.${FOLLOWED_BADGE_CLASS}`);
    const link = thumb.querySelector("#p111");
    expect(badge).toBeInstanceOf(HTMLSpanElement);
    expect(badge?.textContent).toBe("Following");
    expect(badge?.getAttribute("aria-hidden")).toBe("true");
    expect(link?.nextElementSibling).toBe(badge);
    expect(link?.querySelector(`.${FOLLOWED_BADGE_CLASS}`)).toBeNull();
    expect(thumb.classList.contains(THUMB_CLASS)).toBe(true);
  });

  it("does not duplicate the badge on remount", () => {
    addArtist("artist_a");
    const thumb = buildThumb("111", "artist_a");
    document.body.append(thumb);

    const ctx = makeCtx("list", "?page=post&s=list");
    followedBadgeFeature.mount(ctx);
    followedBadgeFeature.mount(ctx);

    expect(thumb.querySelectorAll(`.${FOLLOWED_BADGE_CLASS}`)).toHaveLength(1);
  });

  it("skips thumbs without a followed artist", () => {
    addArtist("artist_a");
    const thumb = buildThumb("111", "tag_x tag_y");
    document.body.append(thumb);

    followedBadgeFeature.mount(makeCtx("list", "?page=post&s=list"));

    expect(thumb.querySelector(`.${FOLLOWED_BADGE_CLASS}`)).toBeNull();
  });

  it("scopes CSS under body.rdw-f-followed-badge and anchors top-left", () => {
    const bodyClass = featureBodyClass(followedBadgeFeature.id);
    expect(followedBadgeFeature.css).toContain(`body.${bodyClass}`);
    expect(followedBadgeFeature.css).toContain(FOLLOWED_BADGE_CLASS);
    expect(followedBadgeFeature.css).toContain("@supports (anchor-name: --a)");
    expect(followedBadgeFeature.css).toContain("position-anchor:");
    expect(followedBadgeFeature.css).toContain("anchor(top)");
    expect(followedBadgeFeature.css).toContain("anchor(left)");
  });

  it("does not throw on empty DOM", () => {
    expect(() => {
      followedBadgeFeature.mount(makeCtx("list", "?page=post&s=list"));
    }).not.toThrow();
  });
});

describe("seenDimFeature", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    document.body.className = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("marks the current post as seen on the post page", () => {
    seenDimFeature.mount(
      makeCtx("post", "?page=post&s=view&id=4242"),
    );

    expect(load().marks["4242"]?.seen).toBe(true);
  });

  it("warns and returns when post id is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    seenDimFeature.mount(makeCtx("post", "?page=post&s=view"));

    expect(load().marks).toEqual({});
    expect(warnSpy).toHaveBeenCalled();
  });

  it("adds the seen class on list thumbs with a seen mark", () => {
    const data = createDefaultStorage();
    data.marks["111"] = { seen: true };
    save(data);

    const seenThumb = buildThumb("111", "tag_a");
    const unseenThumb = buildThumb("222", "tag_b");
    document.body.append(seenThumb, unseenThumb);

    seenDimFeature.mount(makeCtx("list", "?page=post&s=list"));

    expect(seenThumb.classList.contains(SEEN_CLASS)).toBe(true);
    expect(unseenThumb.classList.contains(SEEN_CLASS)).toBe(false);
    expect(seenThumb.querySelector("#p111")?.children).toHaveLength(1);
  });

  it("uses opacity-only CSS scoped under body.rdw-f-seen-dim", () => {
    const bodyClass = featureBodyClass(seenDimFeature.id);
    expect(seenDimFeature.css).toContain(`body.${bodyClass}`);
    expect(seenDimFeature.css).toContain(`.${SEEN_CLASS} img.preview`);
    expect(seenDimFeature.css).toContain("opacity: 0.4");
    expect(seenDimFeature.css).toContain(
      `.${SEEN_CLASS}:hover img.preview`,
    );
    expect(seenDimFeature.css).toContain("opacity: 1");

    const cssWithoutOpacity = seenDimFeature.css.replace(
      /opacity\s*:\s*[^;]+;/g,
      "",
    );
    expect(cssWithoutOpacity).not.toMatch(/\bwidth\s*:/);
    expect(cssWithoutOpacity).not.toMatch(/\bheight\s*:/);
    expect(cssWithoutOpacity).not.toMatch(/\bdisplay\s*:/);
    expect(cssWithoutOpacity).not.toMatch(/\boverflow\s*:/);
  });

  it("does not throw on empty DOM", () => {
    expect(() => {
      seenDimFeature.mount(makeCtx("list", "?page=post&s=list"));
    }).not.toThrow();
  });
});

describe("grid-marks feature metadata", () => {
  it("exports the expected ids, pages, and defaults", () => {
    expect(followedBadgeFeature.id).toBe("followed-badge");
    expect(followedBadgeFeature.pages).toEqual(["list"]);
    expect(followedBadgeFeature.defaultEnabled).toBe(true);

    expect(seenDimFeature.id).toBe("seen-dim");
    expect(seenDimFeature.pages).toEqual(["list", "post"]);
    expect(seenDimFeature.defaultEnabled).toBe(true);
  });
});
