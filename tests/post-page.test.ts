import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CSS_CLASS, POST_FAV_BUTTON_ID } from "../src/config/constants";
import { createDefaultStorage } from "../src/storage/schema";
import { save } from "../src/storage/store";
import { mountPostPageToggle } from "../src/ui/post-page";

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

describe("mountPostPageToggle", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    document.head.querySelectorAll("style").forEach((node) => node.remove());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("inserts a new li after the native addFav li", () => {
    const data = createDefaultStorage();
    data.marks["42"] = { fav: true };
    save(data);

    const list = document.createElement("ul");
    const nativeItem = document.createElement("li");
    const nativeLink = document.createElement("a");
    nativeLink.href = "#";
    nativeLink.setAttribute("onclick", "addFav(42); return false;");
    nativeLink.textContent = "Add to favorites";
    nativeItem.append(nativeLink);
    list.append(nativeItem);
    document.body.append(list);

    mountPostPageToggle(document, "?page=post&s=view&id=42");

    const button = document.getElementById(POST_FAV_BUTTON_ID);
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button?.parentElement).toBeInstanceOf(HTMLLIElement);
    expect(button?.parentElement?.previousElementSibling).toBe(nativeItem);
    expect(button?.classList.contains(CSS_CLASS.postFavButton)).toBe(true);
    expect(button?.getAttribute("aria-pressed")).toBe("true");
    expect(nativeLink.parentElement).toBe(nativeItem);
  });

  it("does not throw and mounts nothing without a native addFav link", () => {
    const list = document.createElement("ul");
    const item = document.createElement("li");
    item.textContent = "no fav";
    list.append(item);
    document.body.append(list);

    expect(() => {
      mountPostPageToggle(document, "?page=post&s=view&id=42");
    }).not.toThrow();
    expect(document.getElementById(POST_FAV_BUTTON_ID)).toBeNull();
  });
});
