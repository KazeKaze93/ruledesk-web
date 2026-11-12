import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CSS_CLASS, STORAGE_KEY } from "../src/config/constants";
import { createDefaultStorage } from "../src/storage/schema";
import { load, save, setGridFavButtonsEnabled } from "../src/storage/store";
import { mountCards } from "../src/ui/cards";
import { addFavorite, removeFavorite } from "../src/site/favorites";

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

function buildThumb(postId: string): HTMLSpanElement {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.id = `s${postId}`;

  const link = document.createElement("a");
  link.id = `p${postId}`;
  link.href = `index.php?page=post&s=view&id=${postId}`;

  const img = document.createElement("img");
  img.className = "preview";
  img.alt = "tag_a tag_b";
  img.title = "tag_a tag_b score:1 rating:s";

  link.append(img);
  thumb.append(link);
  return thumb;
}

function mockFetchSequence(
  responses: Array<{ ok?: boolean; body: string } | Error>,
): void {
  const fetchMock = vi.fn();
  for (const item of responses) {
    if (item instanceof Error) {
      fetchMock.mockRejectedValueOnce(item);
    } else {
      fetchMock.mockResolvedValueOnce({
        ok: item.ok ?? true,
        status: item.ok === false ? 500 : 200,
        text: async () => item.body,
      });
    }
  }
  vi.stubGlobal("fetch", fetchMock);
}

describe("mountCards", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    document.body.className = "";
    document.head.querySelectorAll("style").forEach((node) => node.remove());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("wraps the preview link and adds one button without duplicating on remount", () => {
    const root = document.createElement("div");
    root.append(buildThumb("111"), buildThumb("222"));
    document.body.append(root);

    mountCards(root, "?page=post&s=list&tags=cat");
    mountCards(root, "?page=post&s=list&tags=cat");

    const wraps = root.querySelectorAll(`span.${CSS_CLASS.thumbWrap}`);
    const buttons = root.querySelectorAll(`button.${CSS_CLASS.cardFav}`);
    expect(wraps).toHaveLength(2);
    expect(buttons).toHaveLength(2);
    expect(root.querySelector(`#p111`)?.parentElement?.classList.contains(
      CSS_CLASS.thumbWrap,
    )).toBe(true);
  });

  it("marks buttons from stored fav marks", () => {
    const data = createDefaultStorage();
    data.marks["111"] = { fav: true };
    save(data);

    const root = document.createElement("div");
    root.append(buildThumb("111"), buildThumb("222"));
    document.body.append(root);

    mountCards(root, "?page=post&s=list");

    const marked = root.querySelector(`#s111 button.${CSS_CLASS.cardFav}`);
    const plain = root.querySelector(`#s222 button.${CSS_CLASS.cardFav}`);
    expect(marked?.getAttribute("aria-pressed")).toBe("true");
    expect(plain?.getAttribute("aria-pressed")).toBe("false");
  });

  it("does nothing outside post list pages", () => {
    const root = document.createElement("div");
    root.append(buildThumb("111"));
    document.body.append(root);

    mountCards(root, "?page=post&s=view&id=111");
    expect(root.querySelectorAll(`button.${CSS_CLASS.cardFav}`)).toHaveLength(
      0,
    );
  });

  it("does not mount buttons when grid setting is disabled", () => {
    setGridFavButtonsEnabled(false);
    const root = document.createElement("div");
    root.append(buildThumb("111"));
    document.body.append(root);

    mountCards(root, "?page=post&s=list");
    expect(root.querySelectorAll(`button.${CSS_CLASS.cardFav}`)).toHaveLength(
      0,
    );
  });

  it("toggles add and remove through the card button", async () => {
    const root = document.createElement("div");
    root.append(buildThumb("111"));
    document.body.append(root);
    mountCards(root, "?page=post&s=list");

    const button = root.querySelector(`button.${CSS_CLASS.cardFav}`);
    expect(button).toBeInstanceOf(HTMLButtonElement);
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    mockFetchSequence([{ body: "3" }, { body: "10" }]);
    button.click();
    await vi.waitFor(() => {
      expect(button.getAttribute("aria-pressed")).toBe("true");
    });
    expect(load().marks["111"]?.fav).toBe(true);

    mockFetchSequence([{ body: "removed-page" }]);
    button.click();
    await vi.waitFor(() => {
      expect(button.getAttribute("aria-pressed")).toBe("false");
    });
    expect(load().marks["111"]?.fav).toBe(false);
  });
});

describe("removeFavorite", () => {
  beforeEach(() => {
    installGmMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns error on !ok and does not clear the mark itself", async () => {
    const data = createDefaultStorage();
    data.marks["99"] = { fav: true };
    save(data);
    mockFetchSequence([{ ok: false, body: "fail" }]);

    await expect(removeFavorite("99")).resolves.toEqual({ status: "error" });
    expect(load().marks["99"]?.fav).toBe(true);
    expect(memory.get(STORAGE_KEY)).toEqual(data);
  });

  it("returns error on network failure", async () => {
    mockFetchSequence([new Error("offline")]);
    await expect(removeFavorite("99")).resolves.toEqual({ status: "error" });
  });

  it("returns removed when response.ok", async () => {
    mockFetchSequence([{ body: "html" }]);
    await expect(removeFavorite("99")).resolves.toEqual({ status: "removed" });
  });
});

describe("addFavorite still covered", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("still adds via addFavorite helper", async () => {
    vi.stubGlobal("GM_getValue", () => undefined);
    vi.stubGlobal("GM_setValue", () => undefined);
    mockFetchSequence([{ body: "3" }, { body: "1" }]);
    await expect(addFavorite("1")).resolves.toEqual({
      status: "added",
      score: 1,
    });
  });
});
