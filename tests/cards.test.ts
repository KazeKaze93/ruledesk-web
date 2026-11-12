import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CSS_CLASS } from "../src/config/constants";
import { createDefaultStorage } from "../src/storage/schema";
import { save } from "../src/storage/store";
import { mountCards } from "../src/ui/cards";

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

describe("mountCards", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    document.head.querySelectorAll("style").forEach((node) => node.remove());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds one button per card and does not duplicate on remount", () => {
    const root = document.createElement("div");
    root.append(buildThumb("111"), buildThumb("222"));
    document.body.append(root);

    mountCards(root, "?page=post&s=list&tags=cat");
    mountCards(root, "?page=post&s=list&tags=cat");

    const buttons = root.querySelectorAll(`button.${CSS_CLASS.cardFav}`);
    expect(buttons).toHaveLength(2);
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
});
