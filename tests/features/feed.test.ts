import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UPDATES_BAR_ID } from "../../src/config/constants";import {
  FEED_NEW_CLASS,
  feedFeature,
  resetFeedRuntimeState,
} from "../../src/features/feed";
import {
  notifyThumbsAdded,
  resetFeatureRuntimeState,
} from "../../src/features/runtime";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import { createDefaultStorage } from "../../src/storage/schema";
import { clearStorageCache, save } from "../../src/storage/store";

const FEED_MENU_ITEM_ID = "rdw-feed-menu";
const CURRENT_PAGE_CLASS = "current-page";
const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
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

function seedArtists(tags: string[], seenPostId = 0): void {
  const data = createDefaultStorage();
  data.artists = tags.map((tag) => ({ tag }));
  data.updates = { seenPostId };
  save(data);
}

function makeContext(
  pageKind: FeatureContext["pageKind"] = "list",
  search = "",
): FeatureContext {
  return {
    pageKind,
    search,
    getState: <T>(_parse: (raw: unknown) => T): T => {
      throw new Error("getState unused in feed tests");
    },
    setState: (): void => {},
  };
}

function makeMenuItem(
  text: string,
  options?: { href?: string; current?: boolean },
): HTMLLIElement {
  const li = document.createElement("li");
  if (options?.current === true) {
    li.className = CURRENT_PAGE_CLASS;
  }
  const anchor = document.createElement("a");
  anchor.href = options?.href ?? "https://rule34.xxx/index.php?page=post&s=list&tags=";
  anchor.textContent = text;
  li.append(anchor);
  return li;
}

function buildHeaderMenu(): {
  header: HTMLUListElement;
  posts: HTMLLIElement;
} {
  const header = document.createElement("ul");
  const posts = makeMenuItem("Posts", { current: true });
  const about = makeMenuItem("About");
  header.append(posts, about);

  const content = document.createElement("div");
  content.id = "content";
  const contentList = document.createElement("ul");
  contentList.append(makeMenuItem("Posts"));
  content.append(contentList);

  document.body.append(header, content);
  return { header, posts };
}

function buildThumb(id: string): HTMLSpanElement {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.id = `s${id}`;
  const img = document.createElement("img");
  img.className = "preview";
  thumb.append(img);
  return thumb;
}

function buildListPage(postIds: string[]): HTMLDivElement {
  const list = document.createElement("div");
  list.className = "image-list";
  for (const id of postIds) {
    list.append(buildThumb(id));
  }
  document.body.append(list);
  return list;
}

describe("feedFeature", () => {
  beforeEach(() => {
    installGmMocks();
    resetFeedRuntimeState();
    resetFeatureRuntimeState();
    document.body.replaceChildren();
    document.body.className = "";
    document.head.querySelectorAll("style").forEach((node) => node.remove());
  });

  afterEach(() => {
    resetFeedRuntimeState();
    resetFeatureRuntimeState();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports feature contract fields", () => {
    expect(feedFeature.id).toBe("feed");
    expect(feedFeature.label).toBe("Feed in site menu");
    expect(feedFeature.defaultEnabled).toBe(true);
    expect(feedFeature.pages).toEqual([
      "list",
      "post",
      "favorites",
      "other",
    ]);
  });

  it("scopes css under body.rdw-f-feed and outlines new previews", () => {
    const bodyClass = featureBodyClass("feed");
    expect(bodyClass).toBe("rdw-f-feed");
    expect(feedFeature.css).toContain(`body.${bodyClass}`);
    expect(feedFeature.css).toContain(`span.thumb.${FEED_NEW_CLASS} img.preview`);
    expect(feedFeature.css).toContain("outline:");
  });

  it("inserts Feed immediately after Posts outside #content", () => {
    seedArtists(["a", "b"]);
    const { header, posts } = buildHeaderMenu();

    feedFeature.mount(makeContext("list", "?page=post&s=list&tags=score%3A%3E0"));

    const feedItem = document.getElementById(FEED_MENU_ITEM_ID);
    expect(feedItem).not.toBeNull();
    expect(posts.nextElementSibling).toBe(feedItem);
    expect(feedItem?.querySelector("a")?.textContent).toBe("Feed");
    expect(feedItem?.querySelector("a")?.getAttribute("href")).toContain(
      "tags=%28+a+~+b+%29",
    );
    expect(header.querySelectorAll(`#${FEED_MENU_ITEM_ID}`).length).toBe(1);
    expect(
      document.querySelector("#content a")?.textContent?.trim(),
    ).toBe("Posts");
  });

  it("does not duplicate Feed on remount", () => {
    seedArtists(["a"]);
    buildHeaderMenu();

    feedFeature.mount(makeContext());
    feedFeature.mount(makeContext());

    expect(document.querySelectorAll(`#${FEED_MENU_ITEM_ID}`).length).toBe(1);
  });

  it("shows Feed with Posts href and title when no artists are followed", () => {
    const { posts } = buildHeaderMenu();
    const postsHref = posts.querySelector("a")?.href ?? "";

    feedFeature.mount(makeContext());

    const feedLink = document
      .getElementById(FEED_MENU_ITEM_ID)
      ?.querySelector("a");
    expect(feedLink?.href).toBe(postsHref);
    expect(feedLink?.title).toBe("Follow artists to build your feed");
  });

  it("moves current-page from Posts to Feed on a full feed query", () => {
    seedArtists(["a", "b"]);
    const { posts } = buildHeaderMenu();

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)"),
    );

    const feedItem = document.getElementById(FEED_MENU_ITEM_ID);
    expect(posts.classList.contains(CURRENT_PAGE_CLASS)).toBe(false);
    expect(feedItem?.classList.contains(CURRENT_PAGE_CLASS)).toBe(true);
  });

  it("moves current-page on a partial feed query with id token", () => {
    seedArtists(["a", "b", "c"]);
    const { posts } = buildHeaderMenu();

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)+id%3A%3E5"),
    );

    expect(posts.classList.contains(CURRENT_PAGE_CLASS)).toBe(false);
    expect(
      document
        .getElementById(FEED_MENU_ITEM_ID)
        ?.classList.contains(CURRENT_PAGE_CLASS),
    ).toBe(true);
  });

  it("marks cards newer than seenPostId with the new class", () => {
    seedArtists(["a", "b"], 10);
    buildHeaderMenu();
    buildListPage(["5", "10", "42"]);

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)"),
    );

    expect(document.getElementById("s5")?.classList.contains(FEED_NEW_CLASS)).toBe(
      false,
    );
    expect(
      document.getElementById("s10")?.classList.contains(FEED_NEW_CLASS),
    ).toBe(false);
    expect(
      document.getElementById("s42")?.classList.contains(FEED_NEW_CLASS),
    ).toBe(true);
  });

  it("does not highlight anyone when seenPostId is 0", () => {
    seedArtists(["a", "b"], 0);
    buildHeaderMenu();
    buildListPage(["5", "42"]);

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)"),
    );

    expect(document.querySelectorAll(`.${FEED_NEW_CLASS}`).length).toBe(0);
  });

  it("marks thumbs from onThumbsAdded", () => {
    seedArtists(["a", "b"], 10);
    buildHeaderMenu();
    const list = buildListPage(["11"]);

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)"),
    );

    const late = buildThumb("99");
    list.append(late);
    notifyThumbsAdded(list);

    expect(late.classList.contains(FEED_NEW_CLASS)).toBe(true);
  });

  it("mounts the updates bar from the feed feature on a feed list page", () => {
    seedArtists(["a", "b"], 10);
    buildHeaderMenu();
    buildListPage(["42"]);

    feedFeature.mount(
      makeContext("list", "?page=post&s=list&tags=(+a+~+b+)"),
    );

    expect(document.getElementById(UPDATES_BAR_ID)).not.toBeNull();
  });

  it("does not mount the updates bar for a single-artist search with multiple followed artists", () => {
    seedArtists(["a", "b"], 10);
    buildHeaderMenu();
    buildListPage(["42"]);

    feedFeature.mount(makeContext("list", "?page=post&s=list&tags=a"));

    expect(document.getElementById(UPDATES_BAR_ID)).toBeNull();
    expect(
      document
        .getElementById(FEED_MENU_ITEM_ID)
        ?.classList.contains(CURRENT_PAGE_CLASS),
    ).toBe(false);
  });
});
