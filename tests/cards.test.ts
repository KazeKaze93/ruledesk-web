import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CSS_CLASS } from "../src/config/constants";
import { addFav, clearFavsCache, isFav } from "../src/storage/favs";
import { setGridFavButtonsEnabled } from "../src/storage/store";
import { mountCards } from "../src/ui/cards";
import { CARD_CSS } from "../src/ui/styles";
import { addFavorite, removeFavorite } from "../src/site/favorites";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearFavsCache();
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

  it("keeps the preview link children intact and places the button after the link", () => {
    const root = document.createElement("div");
    root.append(buildThumb("111"), buildThumb("222"));
    document.body.append(root);

    mountCards(root, "?page=post&s=list&tags=cat");
    mountCards(root, "?page=post&s=list&tags=cat");

    const buttons = root.querySelectorAll(`button.${CSS_CLASS.cardFav}`);
    expect(buttons).toHaveLength(2);

    const thumb = root.querySelector("#s111");
    const link = root.querySelector("#p111");
    expect(thumb).toBeInstanceOf(HTMLElement);
    expect(link).toBeInstanceOf(HTMLAnchorElement);
    if (!(thumb instanceof HTMLElement) || !(link instanceof HTMLAnchorElement)) {
      return;
    }

    expect(thumb.classList.contains(CSS_CLASS.thumb)).toBe(true);
    expect(link.children).toHaveLength(1);
    expect(link.children[0]?.classList.contains("preview")).toBe(true);
    expect(link.nextElementSibling).toBe(
      thumb.querySelector(`button.${CSS_CLASS.cardFav}`),
    );
    expect(root.querySelectorAll(".rdw-img-wrap")).toHaveLength(0);
  });

  it("includes CSS anchor positioning rules", () => {
    expect(CARD_CSS).toContain("anchor-name:");
    expect(CARD_CSS).toContain("position-anchor:");
    expect(CARD_CSS).toContain("@supports (anchor-name: --a)");
    expect(CARD_CSS).not.toContain("rdw-img-wrap");
  });

  it("stops click from bubbling to the preview link", () => {
    const root = document.createElement("div");
    root.append(buildThumb("111"));
    document.body.append(root);
    mountCards(root, "?page=post&s=list");

    const link = root.querySelector("#p111");
    const button = root.querySelector(`button.${CSS_CLASS.cardFav}`);
    expect(link).toBeInstanceOf(HTMLAnchorElement);
    expect(button).toBeInstanceOf(HTMLButtonElement);
    if (
      !(link instanceof HTMLAnchorElement) ||
      !(button instanceof HTMLButtonElement)
    ) {
      return;
    }

    let linkClicks = 0;
    link.addEventListener("click", () => {
      linkClicks += 1;
    });

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(clickEvent);
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(linkClicks).toBe(0);
  });

  it("marks buttons from stored favs", () => {
    addFav(111);

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
    expect(isFav(111)).toBe(true);

    mockFetchSequence([{ body: "removed-page" }]);
    button.click();
    await vi.waitFor(() => {
      expect(button.getAttribute("aria-pressed")).toBe("false");
    });
    expect(isFav(111)).toBe(false);
  });

  it("keeps the star marked when remove fails", async () => {
    addFav(111);

    const root = document.createElement("div");
    root.append(buildThumb("111"));
    document.body.append(root);
    mountCards(root, "?page=post&s=list");

    const button = root.querySelector(`button.${CSS_CLASS.cardFav}`);
    expect(button).toBeInstanceOf(HTMLButtonElement);
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    mockFetchSequence([{ ok: false, body: "fail" }]);
    button.click();
    await vi.waitFor(() => {
      expect(button.classList.contains(CSS_CLASS.cardFavError)).toBe(true);
    });
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.classList.contains(CSS_CLASS.cardFavMarked)).toBe(true);
    expect(isFav(111)).toBe(true);
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

  it("returns error on !ok and does not clear the fav itself", async () => {
    addFav(99);
    const beforeFavs = memory.get("ruledesk-web.favs");
    mockFetchSequence([{ ok: false, body: "fail" }]);

    await expect(removeFavorite("99")).resolves.toEqual({ status: "error" });
    expect(isFav(99)).toBe(true);
    expect(memory.get("ruledesk-web.favs")).toEqual(beforeFavs);
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
