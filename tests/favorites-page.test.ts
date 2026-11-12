import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  collectFavoritePostIds,
  syncFavoritesPage,
} from "../src/site/favorites-page";
import { createDefaultStorage } from "../src/storage/schema";
import { load, save } from "../src/storage/store";

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

function buildFavoritesFragment(): HTMLDivElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <span class="thumb" id="s111">
      <a href="#" onclick="document.location='index.php?page=favorites&s=delete&id=111&return_pid=0'; return false;"><b>Remove</b></a>
    </span>
    <span class="thumb" id="s222">
      <a href="#" onclick="document.location='index.php?page=favorites&s=delete&id=222&return_pid=5'; return false;"><b>Remove</b></a>
    </span>
  `;
  return root;
}

describe("favorites page sync", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses delete ids from the known markup", () => {
    const root = buildFavoritesFragment();
    expect(collectFavoritePostIds(root)).toEqual(["111", "222"]);
  });

  it("marks collected ids as fav in one storage write", () => {
    const root = buildFavoritesFragment();
    document.body.append(root);
    syncFavoritesPage(root, "?page=favorites&s=view");
    const data = load();
    expect(data.marks["111"]?.fav).toBe(true);
    expect(data.marks["222"]?.fav).toBe(true);
  });

  it("clears the mark when a Remove link is clicked", () => {
    const data = createDefaultStorage();
    data.marks["111"] = { fav: true };
    save(data);

    const root = buildFavoritesFragment();
    document.body.append(root);
    syncFavoritesPage(root, "?page=favorites&s=view");

    const remove = root.querySelector("a[onclick*='id=111']");
    expect(remove).toBeInstanceOf(HTMLAnchorElement);
    remove?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(load().marks["111"]?.fav).toBe(false);
  });
});
