import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SITE_BLACKLIST_COOKIE_NAME } from "../src/config/constants";
import { readSiteBlacklist, writeSiteBlacklist } from "../src/site/blacklist";
import {
  BLACKLIST_SECTION_CSS,
  createBlacklistSection,
} from "../src/ui/blacklist-section";

function clearCookies(): void {
  const cookies = document.cookie.split(";");
  for (const pair of cookies) {
    const name = pair.split("=")[0]?.trim();
    if (name !== undefined && name.length > 0) {
      document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; path=/`;
    }
  }
}

function chipLabels(section: HTMLElement): string[] {
  return Array.from(
    section.querySelectorAll(".rdw-blacklist-chip-label"),
  ).map((node) => node.textContent ?? "");
}

function removeButton(
  section: HTMLElement,
  tag: string,
): HTMLButtonElement | null {
  const label = `Remove ${tag} from blacklist`;
  const buttons = section.querySelectorAll("button");
  for (const button of buttons) {
    if (button.getAttribute("aria-label") === label) {
      return button;
    }
  }
  return null;
}

function addInput(section: HTMLElement): HTMLInputElement {
  const input = section.querySelector("#rdw-blacklist-add");
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("add input missing");
  }
  return input;
}

function addButton(section: HTMLElement): HTMLButtonElement {
  const buttons = Array.from(section.querySelectorAll("button"));
  const button = buttons.find((entry) => entry.textContent === "Add");
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("Add button missing");
  }
  return button;
}

function reloadButton(section: HTMLElement): HTMLButtonElement {
  const buttons = Array.from(section.querySelectorAll("button"));
  const button = buttons.find((entry) => entry.textContent === "Reload");
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("Reload button missing");
  }
  return button;
}

describe("createBlacklistSection", () => {
  beforeEach(() => {
    clearCookies();
    document.body.replaceChildren();
  });

  afterEach(() => {
    clearCookies();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("exports CSS for the panel shadow root", () => {
    expect(BLACKLIST_SECTION_CSS).toContain(".rdw-blacklist");
    expect(BLACKLIST_SECTION_CSS).toContain(".rdw-blacklist-chip");
  });

  it("renders current tags as chips with remove aria-labels", () => {
    writeSiteBlacklist(["gay", "rating:e", "user:someone"]);
    const section = createBlacklistSection();
    document.body.append(section);

    expect(section.querySelector("h3")?.textContent).toBe("Blacklist");
    expect(chipLabels(section)).toEqual(["gay", "rating:e", "user:someone"]);
    expect(removeButton(section, "gay")?.getAttribute("aria-label")).toBe(
      "Remove gay from blacklist",
    );
    expect(section.textContent).toContain(
      "Saved. Reload the page to apply.",
    );
    expect(section.textContent).toContain(
      "Stored in this browser's site cookie. The list in your account settings is not changed and may overwrite this one after you log in again.",
    );
  });

  it("adds a tag via the button and writes the cookie", () => {
    const section = createBlacklistSection();
    document.body.append(section);

    const input = addInput(section);
    input.value = "Roblox";
    addButton(section).click();

    expect(chipLabels(section)).toEqual(["roblox"]);
    expect(readSiteBlacklist()).toEqual(["roblox"]);
    expect(input.value).toBe("");
  });

  it("adds a tag on Enter", () => {
    const section = createBlacklistSection();
    document.body.append(section);

    const input = addInput(section);
    input.value = "Gay";
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );

    expect(chipLabels(section)).toEqual(["gay"]);
    expect(readSiteBlacklist()).toEqual(["gay"]);
  });

  it("adds multiple tags split on space or comma", () => {
    const section = createBlacklistSection();
    document.body.append(section);

    const input = addInput(section);
    input.value = "gay, Gay_Sex roblox";
    addButton(section).click();

    expect(chipLabels(section)).toEqual(["gay", "gay_sex", "roblox"]);
    expect(readSiteBlacklist()).toEqual(["gay", "gay_sex", "roblox"]);
  });

  it("removes a tag and writes the cookie", () => {
    writeSiteBlacklist(["gay", "roblox"]);
    const section = createBlacklistSection();
    document.body.append(section);

    removeButton(section, "gay")?.click();

    expect(chipLabels(section)).toEqual(["roblox"]);
    expect(readSiteBlacklist()).toEqual(["roblox"]);
  });

  it("writes an empty list when the last tag is removed", () => {
    writeSiteBlacklist(["gay"]);
    const section = createBlacklistSection();
    document.body.append(section);

    removeButton(section, "gay")?.click();

    expect(chipLabels(section)).toEqual([]);
    expect(readSiteBlacklist()).toEqual([]);
    const raw = document.cookie
      .split(";")
      .map((pair) => pair.trim())
      .find((pair) => pair.startsWith(`${SITE_BLACKLIST_COOKIE_NAME}=`));
    expect(raw === undefined || raw === `${SITE_BLACKLIST_COOKIE_NAME}=`).toBe(
      true,
    );
  });

  it("preserves rating: and user: entries when editing other tags", () => {
    writeSiteBlacklist(["rating:e", "user:alice", "gay"]);
    const section = createBlacklistSection();
    document.body.append(section);

    expect(chipLabels(section)).toEqual(["rating:e", "user:alice", "gay"]);

    removeButton(section, "gay")?.click();
    expect(readSiteBlacklist()).toEqual(["rating:e", "user:alice"]);
    expect(chipLabels(section)).toEqual(["rating:e", "user:alice"]);

    const input = addInput(section);
    input.value = "roblox";
    addButton(section).click();

    expect(readSiteBlacklist()).toEqual([
      "rating:e",
      "user:alice",
      "roblox",
    ]);
    expect(chipLabels(section)).toEqual([
      "rating:e",
      "user:alice",
      "roblox",
    ]);
  });

  it("reloads the page when Reload is clicked", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      reload,
    });

    const section = createBlacklistSection();
    document.body.append(section);
    reloadButton(section).click();

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
