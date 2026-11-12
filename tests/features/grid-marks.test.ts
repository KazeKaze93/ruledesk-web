import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetSeenDimRuntimeState,
  seenDimFeature,
} from "../../src/features/grid-marks";
import {
  notifyThumbsAdded,
  resetFeatureRuntimeState,
} from "../../src/features/runtime";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import { clearFavsCache } from "../../src/storage/favs";
import { createDefaultStorage } from "../../src/storage/schema";
import {
  clearStorageCache,
  load,
  save,
} from "../../src/storage/store";
import { STORAGE_KEY } from "../../src/config/constants";

const SEEN_CLASS = "rdw-seen";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearFavsCache();
  clearStorageCache();
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

describe("seenDimFeature", () => {
  beforeEach(() => {
    installGmMocks();
    resetFeatureRuntimeState();
    resetSeenDimRuntimeState();
    document.body.replaceChildren();
    document.body.className = "";
  });

  afterEach(() => {
    resetSeenDimRuntimeState();
    resetFeatureRuntimeState();
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
    expect(seenDimFeature.css).toContain("opacity: 0.65");
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

  it("restamps from storage on pageshow when persisted", () => {
    const initial = createDefaultStorage();
    save(initial);

    const thumb = buildThumb("555", "tag_c");
    document.body.append(thumb);
    seenDimFeature.mount(makeCtx("list", "?page=post&s=list"));
    expect(thumb.classList.contains(SEEN_CLASS)).toBe(false);

    const external = createDefaultStorage();
    external.marks["555"] = { seen: true };
    memory.set(STORAGE_KEY, external);

    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    );

    expect(thumb.classList.contains(SEEN_CLASS)).toBe(true);
    expect(load().marks["555"]?.seen).toBe(true);
  });

  it("does not restamp on pageshow when not persisted", () => {
    const initial = createDefaultStorage();
    save(initial);

    const thumb = buildThumb("556", "tag_d");
    document.body.append(thumb);
    seenDimFeature.mount(makeCtx("list", "?page=post&s=list"));

    const external = createDefaultStorage();
    external.marks["556"] = { seen: true };
    memory.set(STORAGE_KEY, external);

    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: false }),
    );

    expect(thumb.classList.contains(SEEN_CLASS)).toBe(false);
  });

  it("stamps new thumbs delivered via onThumbsAdded", () => {
    const data = createDefaultStorage();
    data.marks["777"] = { seen: true };
    save(data);

    seenDimFeature.mount(makeCtx("list", "?page=post&s=list"));

    const batch = document.createElement("div");
    const seenThumb = buildThumb("777", "tag_e");
    const unseenThumb = buildThumb("888", "tag_f");
    batch.append(seenThumb, unseenThumb);
    document.body.append(batch);

    notifyThumbsAdded(batch);

    expect(seenThumb.classList.contains(SEEN_CLASS)).toBe(true);
    expect(unseenThumb.classList.contains(SEEN_CLASS)).toBe(false);
  });
});

describe("grid-marks feature metadata", () => {
  it("exports the expected ids, pages, and defaults", () => {
    expect(seenDimFeature.id).toBe("seen-dim");
    expect(seenDimFeature.pages).toEqual(["list", "post"]);
    expect(seenDimFeature.defaultEnabled).toBe(true);
    expect(seenDimFeature.cssOnly).toBe(true);
  });
});
