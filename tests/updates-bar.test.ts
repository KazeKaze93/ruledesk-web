import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UPDATES_BAR_ID, UI_TEXT } from "../src/config/constants";
import { createDefaultStorage } from "../src/storage/schema";
import { getSeenPostId, save } from "../src/storage/store";
import { mountUpdatesBar } from "../src/ui/updates-bar";

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

function seedArtists(seenPostId = 0): void {
  const data = createDefaultStorage();
  data.artists = [{ tag: "a" }, { tag: "b" }];
  data.updates = { seenPostId };
  save(data);
}

function buildListPage(postIds: string[]): void {
  const list = document.createElement("div");
  list.className = "image-list";
  for (const id of postIds) {
    const thumb = document.createElement("span");
    thumb.className = "thumb";
    thumb.id = `s${id}`;
    list.append(thumb);
  }
  document.body.append(list);
}

describe("mountUpdatesBar", () => {
  beforeEach(() => {
    installGmMocks();
    seedArtists();
    document.body.replaceChildren();
    document.head.querySelectorAll("style").forEach((node) => node.remove());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows Mark all seen when page max id is greater than seen", () => {
    seedArtists(10);
    buildListPage(["10", "42", "7"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=(+a+~+b+)");

    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar).not.toBeNull();
    const button = bar?.querySelector("button");
    expect(button?.textContent).toBe("Mark all seen");
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(getSeenPostId()).toBe(42);
    expect(bar?.textContent).toContain("42");
    expect(bar?.querySelector("a")?.textContent).toBe("Reload updates");
  });

  it("hides Mark all seen when page max id is already covered", () => {
    seedArtists(42);
    buildListPage(["10", "42", "7"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=(+a+~+b+)");

    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar?.querySelector("button")).toBeNull();
    expect(bar?.textContent).toContain(
      "Everything here is already marked as seen (up to #42)",
    );
    expect(bar?.querySelector("a")?.textContent).toBe(UI_TEXT.openUpdates);
    expect(getSeenPostId()).toBe(42);
  });

  it("shows page-1 hint when pid > 0 on a full query", () => {
    buildListPage(["10"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=(+a+~+b+)&pid=42");
    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar?.textContent).toContain("Go to page 1");
    expect(bar?.querySelector("button")).toBeNull();
  });

  it("shows empty text when there are no cards on a full query", () => {
    buildListPage([]);
    mountUpdatesBar(document, "?page=post&s=list&tags=(+a+~+b+)");
    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar?.textContent).toContain("No new posts");
  });

  it("shows partial hint without a mark button and does not write seenPostId", () => {
    buildListPage(["99"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=a+id%3A%3E5");
    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar?.textContent).toContain(UI_TEXT.updatesPartialHint);
    expect(bar?.querySelector("button")).toBeNull();
    expect(getSeenPostId()).toBe(0);
  });

  it("does not mount a bar for a plain artist search without id", () => {
    buildListPage(["99"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=a");
    expect(document.getElementById(UPDATES_BAR_ID)).toBeNull();
    expect(getSeenPostId()).toBe(0);
  });

  it("mounts empty-page bar into #post-list div.content when image-list is missing", () => {
    seedArtists(19300000);
    const postList = document.createElement("div");
    postList.id = "post-list";
    const content = document.createElement("div");
    content.className = "content";
    const chickens = document.createElement("p");
    chickens.textContent = "Nobody here but us chickens!";
    content.append(chickens);
    postList.append(content);
    document.body.append(postList);

    mountUpdatesBar(
      document,
      "?page=post&s=list&tags=(+a+~+b+)+id%3A%3E19300000",
    );

    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar).not.toBeNull();
    expect(content.firstElementChild).toBe(bar);
    expect(bar?.textContent).toContain("No new posts since #19300000");
    expect(bar?.querySelector("a")?.textContent).toBe(
      UI_TEXT.showAllFollowedPosts,
    );
    expect(bar?.querySelector("a")?.getAttribute("href")).toContain(
      "tags=%28+a+~+b+%29",
    );
    expect(bar?.querySelector("a")?.getAttribute("href")).not.toContain(
      "id%3A%3E",
    );
  });

  it("falls back to #content when post-list content is missing", () => {
    seedArtists(7);
    const content = document.createElement("div");
    content.id = "content";
    document.body.append(content);

    mountUpdatesBar(document, "?page=post&s=list&tags=a+id%3A%3E7");

    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(content.firstElementChild).toBe(bar);
    expect(bar?.textContent).toContain("No new posts since #7");
  });

  it("does not mount when image-list and both hosts are missing", () => {
    mountUpdatesBar(
      document,
      "?page=post&s=list&tags=(+a+~+b+)+id%3A%3E1",
    );
    expect(document.getElementById(UPDATES_BAR_ID)).toBeNull();
  });
});
