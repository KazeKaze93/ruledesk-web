import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UPDATES_BAR_ID } from "../src/config/constants";
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

function seedArtists(): void {
  const data = createDefaultStorage();
  data.artists = [{ tag: "a" }, { tag: "b" }];
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

  it("marks all seen on page 1 and records the max thumb id", () => {
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

  it("shows page-1 hint when pid > 0", () => {
    buildListPage(["10"]);
    mountUpdatesBar(document, "?page=post&s=list&tags=a&pid=42");
    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar?.textContent).toContain("Go to page 1");
    expect(bar?.querySelector("button")).toBeNull();
  });

  it("shows empty text when there are no cards", () => {
    buildListPage([]);
    mountUpdatesBar(document, "?page=post&s=list&tags=a");
    const bar = document.getElementById(UPDATES_BAR_ID);
    expect(bar?.textContent).toContain("No new posts");
  });
});
