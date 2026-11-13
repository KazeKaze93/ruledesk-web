import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  collectFavoritePostIds,
  listFavoriteThumbEntries,
  removeFavoriteCell,
  resolveFavoriteThumbPostId,
  syncFavoritesPage,
} from "../src/site/favorites-page";
import { addFav, clearFavsCache, isFav } from "../src/storage/favs";
import { clearStorageCache } from "../src/storage/store";


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

/** Remove sits outside the thumb with separators — live leftovers after thumb-only delete. */
function buildFavoritesFragmentWithAdjacentRemove(): HTMLDivElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <span class="thumb" id="s111">
      <a id="p111" href="index.php?page=post&s=view&id=111"><img class="preview"></a>
    </span>
    <a href="#" onclick="document.location='index.php?page=favorites&s=delete&id=111&return_pid=0'; return false;"><b>Remove</b></a>
    |
    <br>
    <span class="thumb" id="s222">
      <a id="p222" href="index.php?page=post&s=view&id=222"><img class="preview"></a>
    </span>
    <a href="#" onclick="document.location='index.php?page=favorites&s=delete&id=222&return_pid=0'; return false;"><b>Remove</b></a>
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

  it("lists thumb entries with resolvable post ids", () => {
    const root = buildFavoritesFragment();
    const entries = listFavoriteThumbEntries(root);
    expect(entries.map((entry) => entry.postId)).toEqual(["111", "222"]);
    const first = entries[0];
    expect(first).toBeDefined();
    if (first === undefined) {
      return;
    }
    expect(resolveFavoriteThumbPostId(first.thumb)).toBe("111");
  });


  it("marks collected ids as fav in one storage write", () => {
    const root = buildFavoritesFragment();
    document.body.append(root);
    syncFavoritesPage(root, "?page=favorites&s=view");
    expect(isFav(111)).toBe(true);
    expect(isFav(222)).toBe(true);
  });

  it("clears the fav when a Remove link is clicked", () => {
    addFav(111);

    const root = buildFavoritesFragment();
    document.body.append(root);
    syncFavoritesPage(root, "?page=favorites&s=view");

    const remove = root.querySelector("a[onclick*='id=111']");
    expect(remove).toBeInstanceOf(HTMLAnchorElement);
    remove?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(isFav(111)).toBe(false);
  });

  it("removeFavoriteCell drops thumb when Remove is inside the thumb", () => {
    const root = buildFavoritesFragment();
    const thumb = root.querySelector("#s111");
    expect(thumb).toBeInstanceOf(HTMLElement);
    if (!(thumb instanceof HTMLElement)) {
      return;
    }
    removeFavoriteCell(thumb);
    expect(root.querySelector("#s111")).toBeNull();
    expect(root.querySelector("#s222")).not.toBeNull();
    expect(root.textContent).not.toContain("id=111");
  });

  it("removeFavoriteCell drops adjacent Remove and separators until the next thumb", () => {
    const root = buildFavoritesFragmentWithAdjacentRemove();
    const thumb = root.querySelector("#s111");
    expect(thumb).toBeInstanceOf(HTMLElement);
    if (!(thumb instanceof HTMLElement)) {
      return;
    }
    removeFavoriteCell(thumb);
    expect(root.querySelector("#s111")).toBeNull();
    expect(root.querySelector("a[onclick*='id=111']")).toBeNull();
    expect(root.querySelector("#s222")).not.toBeNull();
    expect(root.querySelector("a[onclick*='id=222']")).not.toBeNull();
    expect(root.textContent).not.toContain("|");
  });

  it("removeFavoriteCell does not remove the paginator after the last thumb", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <span class="thumb" id="s111">
        <a id="p111" href="index.php?page=post&s=view&id=111"><img class="preview"></a>
      </span>
      <a href="#" onclick="document.location='index.php?page=favorites&s=delete&id=111&return_pid=0'; return false;">Remove</a>
      <div id="paginator"><b>1</b></div>
    `;
    const thumb = root.querySelector("#s111");
    expect(thumb).toBeInstanceOf(HTMLElement);
    if (!(thumb instanceof HTMLElement)) {
      return;
    }
    removeFavoriteCell(thumb);
    expect(root.querySelector("#s111")).toBeNull();
    expect(root.querySelector("a[onclick*='id=111']")).toBeNull();
    expect(root.querySelector("#paginator")).not.toBeNull();
  });
});
