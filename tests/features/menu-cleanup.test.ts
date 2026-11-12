import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { menuCleanupFeature } from "../../src/features/menu-cleanup";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";

const HIDDEN_CLASS = "rdw-menu-hidden";

function makeContext(): FeatureContext {
  return {
    pageKind: "list",
    search: "",
    getState: <T>(_parse: (raw: unknown) => T): T => {
      throw new Error("getState unused in menu-cleanup tests");
    },
    setState: (): void => {},
  };
}

function makeMenuItem(text: string, options?: { id?: string; current?: boolean }): HTMLLIElement {
  const li = document.createElement("li");
  if (options?.id !== undefined) {
    li.id = options.id;
  }
  if (options?.current === true) {
    li.className = "current-page";
  }
  const anchor = document.createElement("a");
  anchor.href = "#";
  anchor.textContent = text;
  li.append(anchor);
  return li;
}

function buildDom(): {
  headerDiscord: HTMLLIElement;
  headerPosts: HTMLLIElement;
  headerAbout: HTMLLIElement;
  contentDiscord: HTMLLIElement;
  favorites: HTMLLIElement;
} {
  const header = document.createElement("ul");
  const headerDiscord = makeMenuItem("Discord");
  const headerPosts = makeMenuItem("Posts", { current: true });
  const headerAbout = makeMenuItem("About");
  const favorites = makeMenuItem("My Favorites", { id: "my-favorites-container" });
  header.append(headerDiscord, headerPosts, headerAbout, favorites);

  const content = document.createElement("div");
  content.id = "content";
  const contentList = document.createElement("ul");
  const contentDiscord = makeMenuItem("Discord");
  contentList.append(contentDiscord);
  content.append(contentList);

  document.body.append(header, content);
  return {
    headerDiscord,
    headerPosts,
    headerAbout,
    contentDiscord,
    favorites,
  };
}

describe("menuCleanupFeature", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports feature contract fields", () => {
    expect(menuCleanupFeature.id).toBe("menu-cleanup");
    expect(menuCleanupFeature.label).toBe("Clean header menu");
    expect(menuCleanupFeature.defaultEnabled).toBe(true);
    expect(menuCleanupFeature.cssOnly).toBe(true);
    expect(menuCleanupFeature.pages).toEqual([
      "list",
      "post",
      "favorites",
      "other",
    ]);
  });

  it("scopes every css rule under body.rdw-f-menu-cleanup", () => {
    const bodyClass = featureBodyClass("menu-cleanup");
    expect(bodyClass).toBe("rdw-f-menu-cleanup");
    const rules = menuCleanupFeature.css
      .split("}")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(rule.startsWith(`body.${bodyClass}`)).toBe(true);
    }
    expect(menuCleanupFeature.css).toContain(`li.${HIDDEN_CLASS}`);
    expect(menuCleanupFeature.css).toContain("display:none");
  });

  it("hides matching header lis by class and leaves others untouched", () => {
    const {
      headerDiscord,
      headerPosts,
      headerAbout,
      contentDiscord,
      favorites,
    } = buildDom();

    menuCleanupFeature.mount(makeContext());

    expect(headerDiscord.classList.contains(HIDDEN_CLASS)).toBe(true);
    expect(headerAbout.classList.contains(HIDDEN_CLASS)).toBe(true);
    expect(headerPosts.classList.contains(HIDDEN_CLASS)).toBe(false);
    expect(favorites.classList.contains(HIDDEN_CLASS)).toBe(false);
    expect(contentDiscord.classList.contains(HIDDEN_CLASS)).toBe(false);
  });

  it("does not hide matching link text inside #content", () => {
    const content = document.createElement("div");
    content.id = "content";
    const li = makeMenuItem("TOS");
    content.append(li);
    document.body.append(content);

    menuCleanupFeature.mount(makeContext());
    expect(li.classList.contains(HIDDEN_CLASS)).toBe(false);
  });

  it("does not throw when menu is missing and warns", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => {
      menuCleanupFeature.mount(makeContext());
    }).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("compares trimmed link text exactly", () => {
    const header = document.createElement("ul");
    const exact = makeMenuItem("  Discord  ");
    const partial = makeMenuItem("Discord Server");
    header.append(exact, partial);
    document.body.append(header);

    menuCleanupFeature.mount(makeContext());
    expect(exact.classList.contains(HIDDEN_CLASS)).toBe(true);
    expect(partial.classList.contains(HIDDEN_CLASS)).toBe(false);
  });
});
