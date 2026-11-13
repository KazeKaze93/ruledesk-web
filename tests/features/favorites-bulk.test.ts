import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import {
  CLASS_THUMB_CHECK,
  CLASS_THUMB_SELECTED,
  favoritesBulkFeature,
} from "../../src/features/favorites-bulk";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import { FAVORITES_SYNC_PAGE_PAUSE_MS } from "../../src/site/favorites-sync";
import { addFav, clearFavsCache, isFav } from "../../src/storage/favs";
import { clearStorageCache } from "../../src/storage/store";

const ROOT_ID = "rdw-favorites-bulk";
const BODY_CLASS = featureBodyClass("favorites-bulk");

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

function makeCtx(): FeatureContext {
  return {
    pageKind: "favorites",
    search: "?page=favorites&s=view",
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function buildFavoritesPage(ids: number[]): void {
  for (const id of ids) {
    const thumb = document.createElement("span");
    thumb.className = "thumb";
    thumb.id = `s${String(id)}`;

    const postLink = document.createElement("a");
    postLink.id = `p${String(id)}`;
    postLink.href = `index.php?page=post&s=view&id=${String(id)}`;
    const img = document.createElement("img");
    img.className = "preview";
    postLink.append(img);

    const remove = document.createElement("a");
    remove.href = "#";
    remove.setAttribute(
      "onclick",
      `document.location='index.php?page=favorites&s=delete&id=${String(id)}&return_pid=0'; return false;`,
    );
    remove.textContent = "Remove";

    thumb.append(postLink, remove);
    document.body.append(thumb);
  }

  const paginator = document.createElement("div");
  paginator.id = "paginator";
  paginator.innerHTML = "<b>1</b>";
  document.body.append(paginator);
}

function mountFeature(): void {
  document.body.classList.add(BODY_CLASS);
  act(() => {
    favoritesBulkFeature.mount(makeCtx());
  });
}

function clickButtonWithText(label: string): void {
  const buttons = document.querySelectorAll("button");
  for (const button of buttons) {
    if (button.textContent?.trim() === label) {
      act(() => {
        button.click();
      });
      return;
    }
  }
  throw new Error(`Button not found: ${label}`);
}

function mockFetchOk(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    text: async () => "<html>ok</html>",
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function mockFetchFailAt(failIndex: number): ReturnType<typeof vi.fn> {
  let call = 0;
  const fetchMock = vi.fn(async () => {
    const index = call;
    call += 1;
    if (index === failIndex) {
      return {
        ok: false,
        status: 500,
        text: async () => "err",
      };
    }
    return {
      ok: true,
      status: 200,
      text: async () => "<html>ok</html>",
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("favoritesBulkFeature", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    installGmMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("mounts a Select control above the favorites thumbs", () => {
    buildFavoritesPage([11, 22]);
    mountFeature();

    const root = document.getElementById(ROOT_ID);
    expect(root).not.toBeNull();
    const firstThumb = document.querySelector("span.thumb");
    expect(firstThumb).not.toBeNull();
    expect(root?.nextElementSibling).toBe(firstThumb);
    expect(root?.textContent).toContain("Select");
  });

  it("toggles selection chrome as a sibling of a#p{ID}, not inside it", () => {
    buildFavoritesPage([11]);
    mountFeature();
    clickButtonWithText("Select");

    const postLink = document.getElementById("p11");
    expect(postLink).toBeInstanceOf(HTMLAnchorElement);
    act(() => {
      postLink?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });

    const thumb = document.getElementById("s11");
    expect(thumb?.classList.contains(CLASS_THUMB_SELECTED)).toBe(true);
    const check = thumb?.querySelector(`:scope > .${CLASS_THUMB_CHECK}`);
    expect(check).not.toBeNull();
    expect(check?.parentElement).toBe(thumb);
    if (check !== null && check !== undefined && postLink !== null) {
      expect(postLink.contains(check)).toBe(false);
      expect(postLink.nextElementSibling).toBe(check);
    }
  });

  it("blocks navigation when toggling a thumb in selection mode", () => {
    buildFavoritesPage([11]);
    mountFeature();
    clickButtonWithText("Select");

    const postLink = document.getElementById("p11");
    expect(postLink).toBeInstanceOf(HTMLAnchorElement);
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      postLink?.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
  });

  it("opens kit confirm instead of window.confirm for Remove selected", () => {
    buildFavoritesPage([11, 22]);
    mountFeature();
    clickButtonWithText("Select");
    clickButtonWithText("Select page");
    clickButtonWithText("Remove selected (2)");

    expect(window.confirm).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("cannot be undone on the site");
    expect(document.body.textContent).toContain("Remove 2 favorites");
    const confirmBtn = [...document.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Confirm",
    );
    expect(confirmBtn).toBeTruthy();
  });

  it("removes favorites one-by-one with the sync pause between requests", async () => {
    vi.useFakeTimers();
    buildFavoritesPage([11, 22]);
    addFav(11);
    addFav(22);
    mountFeature();
    const fetchMock = mockFetchOk();

    clickButtonWithText("Select");
    clickButtonWithText("Select page");
    clickButtonWithText("Remove selected (2)");
    clickButtonWithText("Confirm");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(isFav(11)).toBe(false);
    expect(document.getElementById("s11")).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_PAGE_PAUSE_MS - 1);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(isFav(22)).toBe(false);
    expect(document.getElementById("s22")).toBeNull();
    expect(document.getElementById(ROOT_ID)?.textContent).toContain("Select");
  });

  it("stops on non-200 without retries and reports deleted count + failed id", async () => {
    vi.useFakeTimers();
    buildFavoritesPage([11, 22, 33]);
    addFav(11);
    addFav(22);
    addFav(33);
    mountFeature();
    mockFetchFailAt(1);

    clickButtonWithText("Select");
    clickButtonWithText("Select page");
    clickButtonWithText("Remove selected (3)");
    clickButtonWithText("Confirm");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_PAGE_PAUSE_MS);
      await vi.advanceTimersByTimeAsync(0);
    });

    const text = document.getElementById(ROOT_ID)?.textContent ?? "";
    expect(text).toContain("Deleted 1 of 3");
    expect(text).toContain("Failed on post 22");
    expect(document.getElementById("s11")).toBeNull();
    expect(document.getElementById("s22")).not.toBeNull();
    expect(document.getElementById("s33")).not.toBeNull();
    expect(isFav(11)).toBe(false);
    expect(isFav(22)).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("Stop aborts the queue during the inter-request pause", async () => {
    vi.useFakeTimers();
    buildFavoritesPage([11, 22]);
    addFav(11);
    addFav(22);
    mountFeature();
    const fetchMock = mockFetchOk();

    clickButtonWithText("Select");
    clickButtonWithText("Select page");
    clickButtonWithText("Remove selected (2)");
    clickButtonWithText("Confirm");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    clickButtonWithText("Stop");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_PAGE_PAUSE_MS);
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const text = document.getElementById(ROOT_ID)?.textContent ?? "";
    expect(text).toContain("Stopped after 1 of 2");
    expect(document.getElementById("s22")).not.toBeNull();
  });

  it("uses buildRemoveFavUrl request shape (favorites delete)", async () => {
    vi.useFakeTimers();
    buildFavoritesPage([55]);
    addFav(55);
    mountFeature();
    const fetchMock = mockFetchOk();

    clickButtonWithText("Select");
    clickButtonWithText("Select page");
    clickButtonWithText("Remove selected (1)");
    clickButtonWithText("Confirm");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("page=favorites");
    expect(url).toContain("s=delete");
    expect(url).toContain("id=55");
  });
});
