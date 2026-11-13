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
  COLLECTIONS_TAB_CSS,
  createCollectionsTab,
  resetCollectionsTabState,
} from "../src/ui/panel";

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

describe("createCollectionsTab", () => {
  beforeEach(() => {
    installGmMocks();
    resetCollectionsTabState();
    document.body.replaceChildren();
    save(createDefaultStorage());
  });

  afterEach(() => {
    resetCollectionsTabState();
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports CSS for the panel shadow root", () => {
    expect(COLLECTIONS_TAB_CSS).toContain(".rdw-collections-tab");
    expect(COLLECTIONS_TAB_CSS).toContain(".rdw-playlist-parts");
  });

  it("creates a playlist by name and lists it with a disabled open button when empty", () => {
    stubLocation("");
    const root = createCollectionsTab();
    document.body.append(root);

    expect(root.textContent).toContain("No playlists yet.");
    expect(root.textContent).toContain("Use the + button on a post");

    const newPlaylist = findButton(root, "New playlist");
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
    expect(root.textContent).not.toContain("No playlists yet.");

    const openBtn = findButtonByAria(root, "Open playlist: Later");
    expect(openBtn).toBeInstanceOf(HTMLButtonElement);
    expect(openBtn?.disabled).toBe(true);
  });

  it("opens the first playlist part via location.assign", () => {
    const { assign } = stubLocation("");
    const playlist = createPlaylist("Watch");
    addPostToPlaylist(playlist.id, 30);
    addPostToPlaylist(playlist.id, 20);
    addPostToPlaylist(playlist.id, 10);

    const root = createCollectionsTab();
    document.body.append(root);

    const openBtn = findButtonByAria(root, "Open playlist: Watch");
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
    expect(String(assign.mock.calls[0]?.[0])).toContain("id");
  });

  it("lists numbered part links when a playlist spans multiple chunks", () => {
    stubLocation("");
    setPlaylistChunkSize(2);
    const playlist = createPlaylist("Chunks");
    for (const id of [5, 4, 3, 2, 1]) {
      addPostToPlaylist(playlist.id, id);
    }

    const root = createCollectionsTab();
    document.body.append(root);

    const parts = root.querySelectorAll(".rdw-playlist-part");
    expect(parts).toHaveLength(3);
    expect(Array.from(parts).map((node) => node.textContent)).toEqual([
      "1",
      "2",
      "3",
    ]);
    const hrefs = Array.from(parts).map((node) =>
      node instanceof HTMLAnchorElement ? node.href : "",
    );
    const queries = buildPlaylistQueries([5, 4, 3, 2, 1], 2);
    expect(queries).toHaveLength(3);
    for (let index = 0; index < queries.length; index += 1) {
      const query = queries[index];
      expect(query).toBeDefined();
      expect(hrefs[index]).toContain("tags=");
    }
    expect(root.textContent).toContain("5 posts");
  });

  it("keeps saved-search open/rename/delete and Save current search", () => {
    const { assign } = stubLocation("?page=post&s=list&tags=cat+dog");
    addCollection("Cats", [
      { tag: "cat", type: "include" },
      { tag: "dog", type: "include" },
    ]);

    const root = createCollectionsTab();
    document.body.append(root);

    expect(root.textContent).toContain("Saved searches");
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

  it("does not list playlists under saved searches", () => {
    stubLocation("");
    addCollection("Search only", [{ tag: "bird", type: "include" }]);
    createPlaylist("Posts only");

    const root = createCollectionsTab();
    document.body.append(root);

    const openSearch = findButtonByAria(
      root,
      `${UI_TEXT.openCollection}: Search only`,
    );
    const openPlaylist = findButtonByAria(root, "Open playlist: Posts only");
    expect(openSearch).not.toBeNull();
    expect(openPlaylist).not.toBeNull();
    expect(
      findButtonByAria(root, `${UI_TEXT.openCollection}: Posts only`),
    ).toBeNull();
  });
});
