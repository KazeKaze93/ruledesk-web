import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MENU_ITEM_ID,
  RDW_HASH_COLLECTIONS,
  RDW_HASH_FOLLOWING,
  RDW_HASH_SETTINGS,
  RDW_PAGE_ROOT_ID,
  RDW_ROUTE_COLLECTIONS,
  RDW_ROUTE_FOLLOWING,
  RDW_ROUTE_SETTINGS,
} from "../src/pages/constants";
import { hideRdwPage } from "../src/pages/host";
import {
  installSiteMenu,
  persistFavoritesUserId,
  resolveFavoritesHref,
} from "../src/pages/menu";
import { navigateToRdwRoute, startRdwPages } from "../src/pages/router";
import {
  clearFavsCache,
  getSyncState,
  setSyncState,
} from "../src/storage/favs";
import { clearStorageCache } from "../src/storage/store";

const USER_ID = 479099;
const OTHER_USER_ID = 111;
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

function mountNavbar(options?: { withMyFavorites?: boolean }): void {
  document.body.replaceChildren();
  document.documentElement.className = "";
  const header = document.createElement("div");
  header.id = "header";
  const navbar = document.createElement("ul");
  navbar.id = "navbar";
  const posts = document.createElement("li");
  const postsLink = document.createElement("a");
  postsLink.href = "index.php?page=post&s=list";
  postsLink.textContent = "Posts";
  posts.append(postsLink);
  navbar.append(posts);
  if (options?.withMyFavorites === true) {
    const fav = document.createElement("li");
    fav.id = "my-favorites-container";
    const favLink = document.createElement("a");
    favLink.href = `index.php?page=favorites&s=view&id=${String(OTHER_USER_ID)}`;
    favLink.textContent = "My Favorites";
    fav.append(favLink);
    navbar.append(fav);
  }
  header.append(navbar);
  document.body.append(header);
}

describe("navigateToRdwRoute history", () => {
  beforeEach(() => {
    installGmMocks();
    mountNavbar();
    window.history.replaceState(null, "", "/index.php?page=post&s=list");
  });

  afterEach(() => {
    hideRdwPage();
    document.body.replaceChildren();
    document.documentElement.className = "";
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("pushState on first script page, replaceState when switching among #rdw/*", async () => {
    const pushSpy = vi.spyOn(window.history, "pushState");
    const replaceSpy = vi.spyOn(window.history, "replaceState");

    await navigateToRdwRoute(RDW_ROUTE_COLLECTIONS);
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).not.toHaveBeenCalled();
    expect(window.location.hash).toBe(RDW_HASH_COLLECTIONS);

    await navigateToRdwRoute(RDW_ROUTE_SETTINGS);
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe(RDW_HASH_SETTINGS);

    await navigateToRdwRoute(RDW_ROUTE_FOLLOWING);
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledTimes(2);
    expect(window.location.hash).toBe(RDW_HASH_FOLLOWING);
  });

  it("navbar #rdw clicks use push then replace", async () => {
    await startRdwPages();
    const pushSpy = vi.spyOn(window.history, "pushState");
    const replaceSpy = vi.spyOn(window.history, "replaceState");

    const collections = document
      .getElementById(MENU_ITEM_ID.collections)
      ?.querySelector("a");
    const settings = document
      .getElementById(MENU_ITEM_ID.settings)
      ?.querySelector("a");
    expect(collections).toBeInstanceOf(HTMLAnchorElement);
    expect(settings).toBeInstanceOf(HTMLAnchorElement);
    if (
      !(collections instanceof HTMLAnchorElement) ||
      !(settings instanceof HTMLAnchorElement)
    ) {
      throw new Error("menu links missing");
    }

    collections.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
    );
    await vi.waitFor(() => {
      expect(window.location.hash).toBe(RDW_HASH_COLLECTIONS);
      expect(document.getElementById(RDW_PAGE_ROOT_ID)).not.toBeNull();
    });
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).not.toHaveBeenCalled();

    settings.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
    );
    await vi.waitFor(() => {
      expect(window.location.hash).toBe(RDW_HASH_SETTINGS);
      expect(document.getElementById(RDW_PAGE_ROOT_ID)).not.toBeNull();
    });
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledTimes(1);
  });
});

describe("favorites user id persistence", () => {
  beforeEach(() => {
    installGmMocks();
    mountNavbar();
    window.history.replaceState(
      null,
      "",
      "/index.php?page=favorites&s=view&id=479099",
    );
  });

  afterEach(() => {
    document.body.replaceChildren();
    document.documentElement.className = "";
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("persists id from favorites URL when menu submenu is absent", () => {
    expect(getSyncState()).toBeUndefined();
    const href = resolveFavoritesHref(document, window.location.search);
    expect(href).toContain(`id=${String(USER_ID)}`);
    expect(getSyncState()?.userId).toBe(USER_ID);
    expect(getSyncState()?.finishedAt).toEqual(expect.any(String));
  });

  it("installSiteMenu keeps Favorites item on favorites page via URL id", () => {
    installSiteMenu();
    const item = document.getElementById(MENU_ITEM_ID.favorites);
    expect(item).not.toBeNull();
    const anchor = item?.querySelector("a");
    expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    expect(anchor?.getAttribute("href") ?? "").toContain(
      `id=${String(USER_ID)}`,
    );
    expect(getSyncState()?.userId).toBe(USER_ID);
  });

  it("prefers my-favorites-container link over URL and saved", () => {
    mountNavbar({ withMyFavorites: true });
    window.history.replaceState(
      null,
      "",
      `/index.php?page=favorites&s=view&id=${String(USER_ID)}`,
    );
    setSyncState({
      nextPid: 0,
      lastPid: 0,
      startedAt: "2020-01-01T00:00:00.000Z",
      finishedAt: "2020-01-01T00:00:00.000Z",
      userId: 999,
    });
    const href = resolveFavoritesHref(document, window.location.search);
    expect(href).toContain(`id=${String(OTHER_USER_ID)}`);
    expect(getSyncState()?.userId).toBe(OTHER_USER_ID);
  });

  it("uses saved sync userId when menu and URL have no id", () => {
    window.history.replaceState(null, "", "/index.php?page=post&s=list");
    persistFavoritesUserId(USER_ID);
    expect(getSyncState()?.userId).toBe(USER_ID);
    const href = resolveFavoritesHref(document, window.location.search);
    expect(href).toContain(`id=${String(USER_ID)}`);
  });

  it("merges userId into existing sync without clearing progress fields", () => {
    setSyncState({
      nextPid: 50,
      lastPid: 100,
      startedAt: "2020-01-01T00:00:00.000Z",
      running: false,
    });
    persistFavoritesUserId(USER_ID);
    expect(getSyncState()).toEqual({
      nextPid: 50,
      lastPid: 100,
      startedAt: "2020-01-01T00:00:00.000Z",
      running: false,
      userId: USER_ID,
    });
  });
});
