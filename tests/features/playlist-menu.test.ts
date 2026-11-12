import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPlaylistMenu,
  playlistMenuFeature,
  resetPlaylistMenuRuntimeState,
} from "../../src/features/playlist-menu";
import {
  notifyThumbsAdded,
  resetFeatureRuntimeState,
} from "../../src/features/runtime";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import { clearFavsCache } from "../../src/storage/favs";
import {
  addPostToPlaylist,
  clearStorageCache,
  createPlaylist,
  listPlaylists,
  playlistsContaining,
} from "../../src/storage/store";

const CLASS_ADD = "rdw-playlist-add";
const CLASS_ADD_IN = "rdw-playlist-add--in";
const CLASS_MENU = "rdw-playlist-menu";
const CLASS_ITEM = "rdw-playlist-menu-item";
const CLASS_NEW = "rdw-playlist-menu-new";
const CLASS_NEW_INPUT = "rdw-playlist-menu-new-input";
const CLASS_NEW_SUBMIT = "rdw-playlist-menu-new-submit";
const ATTR_POST_ID = "data-rdw-post-id";

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

function buildThumb(postId: string): HTMLSpanElement {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.id = `s${postId}`;

  const link = document.createElement("a");
  link.id = `p${postId}`;
  link.href = `index.php?page=post&s=view&id=${postId}`;

  const img = document.createElement("img");
  img.className = "preview";
  img.alt = "tag_a";

  link.append(img);
  thumb.append(link);
  return thumb;
}

function addButton(thumb: HTMLElement): HTMLButtonElement {
  const button = thumb.querySelector(`button.${CLASS_ADD}`);
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("playlist add button missing");
  }
  return button;
}

function openMenus(): HTMLElement[] {
  return Array.from(document.querySelectorAll(`.${CLASS_MENU}`)).filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
}

describe("playlistMenuFeature", () => {
  beforeEach(() => {
    installGmMocks();
    resetFeatureRuntimeState();
    resetPlaylistMenuRuntimeState();
    document.body.replaceChildren();
    document.body.className = featureBodyClass("playlist-menu");
  });

  afterEach(() => {
    resetPlaylistMenuRuntimeState();
    resetFeatureRuntimeState();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports Feature metadata for list and post", () => {
    expect(playlistMenuFeature.id).toBe("playlist-menu");
    expect(playlistMenuFeature.label).toBe("Add to playlist button");
    expect(playlistMenuFeature.pages).toEqual(["list", "post"]);
    expect(playlistMenuFeature.defaultEnabled).toBe(true);
  });

  it("scopes every css rule under body.rdw-f-playlist-menu", () => {
    const bodyClass = featureBodyClass("playlist-menu");
    expect(bodyClass).toBe("rdw-f-playlist-menu");
    const rules = playlistMenuFeature.css
      .split("}")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const selector = rule.split("{")[0]?.trim() ?? "";
      expect(selector.startsWith(`body.${bodyClass}`)).toBe(true);
    }
  });

  it("adds a + button on list thumbs outside a#p{ID}", () => {
    const thumb = buildThumb("111");
    document.body.append(thumb);

    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    const button = addButton(thumb);
    expect(button.textContent).toBe("+");
    expect(button.getAttribute(ATTR_POST_ID)).toBe("111");
    expect(thumb.querySelector("a#p111")?.contains(button)).toBe(false);
    expect(button.previousElementSibling?.id).toBe("p111");
  });

  it("does not render list UI on the post page", () => {
    const thumb = buildThumb("42");
    document.body.append(thumb);

    playlistMenuFeature.mount(
      makeCtx("post", "?page=post&s=view&id=42"),
    );

    expect(document.querySelector(`button.${CLASS_ADD}`)).toBeNull();
    expect(document.querySelector(`.${CLASS_MENU}`)).toBeNull();
  });

  it("does not duplicate buttons on remount", () => {
    const thumb = buildThumb("111");
    document.body.append(thumb);
    const ctx = makeCtx("list", "?page=post&s=list");

    playlistMenuFeature.mount(ctx);
    playlistMenuFeature.mount(ctx);

    expect(thumb.querySelectorAll(`button.${CLASS_ADD}`).length).toBe(1);
  });

  it("marks the button when the post is already in a playlist", () => {
    const playlist = createPlaylist("Later");
    addPostToPlaylist(playlist.id, 111);
    const thumb = buildThumb("111");
    document.body.append(thumb);

    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    expect(addButton(thumb).classList.contains(CLASS_ADD_IN)).toBe(true);
  });

  it("toggles playlist membership from the open menu", () => {
    const playlist = createPlaylist("A");
    const thumb = buildThumb("10");
    document.body.append(thumb);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(thumb).click();
    const menus = openMenus();
    expect(menus).toHaveLength(1);

    const item = menus[0]?.querySelector(`button.${CLASS_ITEM}`);
    expect(item).toBeInstanceOf(HTMLButtonElement);
    expect(item?.getAttribute("aria-checked")).toBe("false");

    item?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(playlistsContaining(10).map((entry) => entry.id)).toEqual([
      playlist.id,
    ]);
    expect(addButton(thumb).classList.contains(CLASS_ADD_IN)).toBe(true);
    expect(openMenus()).toHaveLength(1);
    expect(
      openMenus()[0]?.querySelector(`button.${CLASS_ITEM}`)?.getAttribute(
        "aria-checked",
      ),
    ).toBe("true");

    openMenus()[0]
      ?.querySelector(`button.${CLASS_ITEM}`)
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(playlistsContaining(10)).toEqual([]);
    expect(addButton(thumb).classList.contains(CLASS_ADD_IN)).toBe(false);
  });

  it("creates a playlist from New playlist and closes the menu", () => {
    const thumb = buildThumb("20");
    document.body.append(thumb);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(thumb).click();
    const menu = openMenus()[0];
    expect(menu).toBeDefined();

    const newButton = menu?.querySelector(`button.${CLASS_NEW}`);
    expect(newButton).toBeInstanceOf(HTMLButtonElement);
    newButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const input = menu?.querySelector(`input.${CLASS_NEW_INPUT}`);
    const submit = menu?.querySelector(`button.${CLASS_NEW_SUBMIT}`);
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(submit).toBeInstanceOf(HTMLButtonElement);

    if (!(input instanceof HTMLInputElement)) {
      throw new Error("new playlist input missing");
    }
    input.value = "  Watch later  ";
    submit?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(openMenus()).toHaveLength(0);
    const playlists = listPlaylists();
    expect(playlists).toHaveLength(1);
    expect(playlists[0]?.name).toBe("Watch later");
    expect(playlistsContaining(20).map((entry) => entry.id)).toEqual([
      playlists[0]?.id,
    ]);
    expect(addButton(thumb).classList.contains(CLASS_ADD_IN)).toBe(true);
  });

  it("keeps only one open menu at a time", () => {
    const first = buildThumb("1");
    const second = buildThumb("2");
    document.body.append(first, second);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(first).click();
    expect(openMenus()).toHaveLength(1);
    addButton(second).click();
    expect(openMenus()).toHaveLength(1);
    expect(openMenus()[0]?.getAttribute(ATTR_POST_ID)).toBe("2");
  });

  it("closes the menu on Escape and outside pointerdown", () => {
    const thumb = buildThumb("7");
    document.body.append(thumb);
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    addButton(thumb).click();
    expect(openMenus()).toHaveLength(1);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(openMenus()).toHaveLength(0);

    addButton(thumb).click();
    expect(openMenus()).toHaveLength(1);
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(openMenus()).toHaveLength(0);
  });

  it("stamps buttons for thumbs delivered via onThumbsAdded", () => {
    playlistMenuFeature.mount(makeCtx("list", "?page=post&s=list"));

    const batch = document.createElement("div");
    const thumb = buildThumb("99");
    batch.append(thumb);
    document.body.append(batch);
    notifyThumbsAdded(batch);

    expect(addButton(thumb).getAttribute(ATTR_POST_ID)).toBe("99");
  });

  it("exports createPlaylistMenu for post-actions reuse", () => {
    const playlist = createPlaylist("Side");
    const menu = createPlaylistMenu(55);
    document.body.append(menu);

    expect(menu.classList.contains(CLASS_MENU)).toBe(true);
    expect(menu.getAttribute(ATTR_POST_ID)).toBe("55");
    expect(menu.querySelector(`button.${CLASS_ITEM}`)?.textContent).toContain(
      "Side",
    );

    menu
      .querySelector(`button.${CLASS_ITEM}`)
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(playlistsContaining(55).map((entry) => entry.id)).toEqual([
      playlist.id,
    ]);
  });
});
