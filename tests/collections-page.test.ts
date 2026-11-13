import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import { UI_TEXT } from "../src/config/constants";
import { buildPlaylistQueries, buildSearchUrl } from "../src/search/query";
import { createDefaultStorage } from "../src/storage/schema";
import {
  addCollection,
  addPostToPlaylist,
  clearStorageCache,
  createPlaylist,
  getPlaylistChunkSize,
  listPlaylists,
  load,
  save,
  setPlaylistChunkSize,
} from "../src/storage/store";
import {
  COLLECTIONS_PAGE_CSS,
  createCollectionsPage,
  resetCollectionsPageState,
} from "../src/pages/collections-page";

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

function stubLocation(search: string): {
  assign: ReturnType<typeof vi.fn>;
} {
  const assign = vi.fn();
  vi.stubGlobal("location", {
    search,
    assign,
    reload: vi.fn(),
  });
  return { assign };
}

function click(el: Element): void {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function findButton(
  root: HTMLElement,
  text: string,
): HTMLButtonElement | null {
  const buttons = Array.from(root.querySelectorAll("button"));
  const match = buttons.find((button) => button.textContent === text);
  return match instanceof HTMLButtonElement ? match : null;
}

function findButtonByAria(
  root: HTMLElement,
  label: string,
): HTMLButtonElement | null {
  const buttons = Array.from(root.querySelectorAll("button"));
  const match = buttons.find(
    (button) => button.getAttribute("aria-label") === label,
  );
  return match instanceof HTMLButtonElement ? match : null;
}

describe("createCollectionsPage", () => {
  beforeEach(() => {
    installGmMocks();
    resetCollectionsPageState();
    document.body.replaceChildren();
    save(createDefaultStorage());
  });

  afterEach(() => {
    resetCollectionsPageState();
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports CSS and uses Custom Collection naming", () => {
    expect(COLLECTIONS_PAGE_CSS).toContain(".rdw-collections-page");
    expect(COLLECTIONS_PAGE_CSS).toContain(".rdw-playlist-parts");
    stubLocation("");
    const root = createCollectionsPage();
    document.body.append(root);
    expect(root.textContent).toContain("Custom Collection");
    expect(root.textContent).toContain("Dynamic Collection");
    expect(root.textContent).toContain("No custom collections yet.");
    expect(root.textContent).not.toContain("Playlists");
    expect(root.textContent).not.toContain("Saved searches");
  });

  it("creates a custom collection by name", () => {
    stubLocation("");
    const root = createCollectionsPage();
    document.body.append(root);

    const newPlaylist = findButton(root, "New Custom Collection");
    expect(newPlaylist).not.toBeNull();
    if (newPlaylist !== null) {
      click(newPlaylist);
    }
    const input = root.querySelector("#rdw-playlist-name");
    expect(input).toBeInstanceOf(HTMLInputElement);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("expected playlist name input");
    }
    act(() => {
      input.value = "Later";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => {
      input.form?.requestSubmit();
    });

    expect(listPlaylists().map((item) => item.name)).toEqual(["Later"]);
    expect(root.textContent).toContain("Later");
    expect(root.textContent).toContain("0 posts");

    const openBtn = findButtonByAria(root, "Open Custom Collection: Later");
    expect(openBtn).toBeInstanceOf(HTMLButtonElement);
    expect(openBtn?.disabled).toBe(true);
  });

  it("opens the first custom collection part via location.assign", () => {
    const { assign } = stubLocation("");
    const playlist = createPlaylist("Watch");
    addPostToPlaylist(playlist.id, 30);
    addPostToPlaylist(playlist.id, 20);
    addPostToPlaylist(playlist.id, 10);

    const root = createCollectionsPage();
    document.body.append(root);

    const openBtn = findButtonByAria(root, "Open Custom Collection: Watch");
    expect(openBtn?.disabled).toBe(false);
    if (openBtn !== null) {
      click(openBtn);
    }

    const expected = buildPlaylistQueries(
      [30, 20, 10],
      getPlaylistChunkSize(),
    )[0];
    expect(expected).toBeDefined();
    expect(assign).toHaveBeenCalledTimes(1);
    expect(String(assign.mock.calls[0]?.[0])).toContain("tags=");
  });

  it("lists numbered part links when a custom collection spans chunks", () => {
    stubLocation("");
    setPlaylistChunkSize(2);
    const playlist = createPlaylist("Chunks");
    for (const id of [5, 4, 3, 2, 1]) {
      addPostToPlaylist(playlist.id, id);
    }

    const root = createCollectionsPage();
    document.body.append(root);

    const parts = root.querySelectorAll(".rdw-playlist-part");
    expect(parts).toHaveLength(3);
    expect(
      root
        .querySelector('[aria-label="Custom Collection parts"]')
        ?.querySelectorAll(".rdw-playlist-part"),
    ).toHaveLength(3);
  });

  it("keeps dynamic collection open/rename/delete and Save current search", () => {
    const { assign } = stubLocation("?page=post&s=list&tags=cat+dog");
    addCollection("Cats", [
      { tag: "cat", type: "include" },
      { tag: "dog", type: "include" },
    ]);

    const root = createCollectionsPage();
    document.body.append(root);

    expect(root.textContent).toContain("Dynamic Collection");
    expect(root.textContent).toContain("Cats");

    const openBtn = findButtonByAria(root, `${UI_TEXT.openCollection}: Cats`);
    if (openBtn !== null) {
      click(openBtn);
    }
    expect(assign).toHaveBeenCalledWith(
      buildSearchUrl([
        { tag: "cat", type: "include" },
        { tag: "dog", type: "include" },
      ]),
    );

    const saveCurrent = findButton(root, UI_TEXT.saveCurrent);
    expect(saveCurrent).not.toBeNull();
    if (saveCurrent !== null) {
      click(saveCurrent);
    }
    const saveInput = root.querySelector("#rdw-save-name");
    expect(saveInput).toBeInstanceOf(HTMLInputElement);
    if (!(saveInput instanceof HTMLInputElement)) {
      throw new Error("expected save name input");
    }
    act(() => {
      saveInput.value = "My search";
      saveInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => {
      saveInput.form?.requestSubmit();
    });
    expect(
      load().collections.some((entry) => entry.name === "My search"),
    ).toBe(true);

    const renameBtn = findButtonByAria(root, `${UI_TEXT.rename}: Cats`);
    if (renameBtn !== null) {
      click(renameBtn);
    }
    const renameInput = root.querySelector('input[id^="rdw-rename-"]');
    expect(renameInput).toBeInstanceOf(HTMLInputElement);
    if (!(renameInput instanceof HTMLInputElement)) {
      throw new Error("expected rename input");
    }
    act(() => {
      renameInput.value = "Felines";
      renameInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => {
      renameInput.form?.requestSubmit();
    });
    expect(
      load().collections.some((entry) => entry.name === "Felines"),
    ).toBe(true);

    const deleteBtn = findButtonByAria(root, `${UI_TEXT.delete}: Felines`);
    if (deleteBtn !== null) {
      click(deleteBtn);
    }
    const confirmBtn = findButton(root, UI_TEXT.confirm);
    if (confirmBtn !== null) {
      click(confirmBtn);
    }
    expect(
      load().collections.some((entry) => entry.name === "Felines"),
    ).toBe(false);
  });

  it("does not list custom collections under dynamic collections", () => {
    stubLocation("");
    addCollection("Search only", [{ tag: "bird", type: "include" }]);
    createPlaylist("Posts only");

    const root = createCollectionsPage();
    document.body.append(root);

    const openSearch = findButtonByAria(
      root,
      `${UI_TEXT.openCollection}: Search only`,
    );
    const openPlaylist = findButtonByAria(
      root,
      "Open Custom Collection: Posts only",
    );
    expect(openSearch).not.toBeNull();
    expect(openPlaylist).not.toBeNull();
    expect(
      findButtonByAria(root, `${UI_TEXT.openCollection}: Posts only`),
    ).toBeNull();
  });
});
