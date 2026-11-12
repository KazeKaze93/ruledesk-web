import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEBUG_KEY, STORAGE_KEY } from "../../src/config/constants";
import { searchToolsFeature } from "../../src/features/search-tools";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import { clearStorageCache, save } from "../../src/storage/store";
import { createDefaultStorage } from "../../src/storage/schema";

const ROOT_ID = "rdw-search-tools";
const CHIP_CLASS = "rdw-search-tools-chip";
const CHIP_EXCLUDE_CLASS = "rdw-search-tools-chip--exclude";
const CHIP_TOGGLE_CLASS = "rdw-search-tools-chip-toggle";
const CHIP_REMOVE_CLASS = "rdw-search-tools-chip-remove";
const CHIP_LABEL_CLASS = "rdw-search-tools-chip-label";
const MEDIA_BTN_CLASS = "rdw-search-tools-media-btn";
const SORT_CLASS = "rdw-search-tools-sort";

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
  memory.set(DEBUG_KEY, false);
}

function makeCtx(): FeatureContext {
  return {
    pageKind: "list",
    search: "?page=post&s=list&tags=a+b",
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function buildSearchForm(value = ""): {
  form: HTMLFormElement;
  input: HTMLInputElement;
  parent: HTMLElement;
} {
  const parent = document.createElement("div");
  parent.id = "search-host";
  const form = document.createElement("form");
  const input = document.createElement("input");
  input.name = "tags";
  input.value = value;
  const awesomplete = document.createElement("div");
  awesomplete.className = "awesomplete";
  form.append(input, awesomplete);
  parent.append(form);
  document.body.append(parent);
  return { form, input, parent };
}

function chipRoots(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll(`#${ROOT_ID} .${CHIP_CLASS}`),
  ).filter((node): node is HTMLElement => node instanceof HTMLElement);
}

function chipLabels(): string[] {
  return chipRoots().map((chip) => {
    const toggle = chip.querySelector(`button.${CHIP_TOGGLE_CLASS}`);
    if (toggle instanceof HTMLButtonElement) {
      return toggle.textContent ?? "";
    }
    const label = chip.querySelector(`.${CHIP_LABEL_CLASS}`);
    return label?.textContent ?? "";
  });
}

function mediaButton(label: string): HTMLButtonElement {
  const buttons = Array.from(
    document.querySelectorAll(`#${ROOT_ID} button.${MEDIA_BTN_CLASS}`),
  );
  for (const node of buttons) {
    if (!(node instanceof HTMLButtonElement)) {
      continue;
    }
    if (node.textContent === label) {
      return node;
    }
  }
  throw new Error(`media button not found: ${label}`);
}

function sortSelect(): HTMLSelectElement {
  const select = document.querySelector(`#${ROOT_ID} select.${SORT_CLASS}`);
  if (!(select instanceof HTMLSelectElement)) {
    throw new Error("sort select not found");
  }
  return select;
}

describe("searchToolsFeature", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    installGmMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exports Feature metadata for list and post", () => {
    expect(searchToolsFeature.id).toBe("search-tools");
    expect(searchToolsFeature.label).toBe("Search tools");
    expect(searchToolsFeature.pages).toEqual(["list", "post"]);
    expect(searchToolsFeature.defaultEnabled).toBe(true);
  });

  it("scopes every css rule under body.rdw-f-search-tools", () => {
    const bodyClass = featureBodyClass("search-tools");
    const rules = searchToolsFeature.css
      .split("}")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const selector = rule.split("{")[0]?.trim() ?? "";
      expect(selector.startsWith(`body.${bodyClass}`)).toBe(true);
    }
  });

  it("parses whitespace tokens into chips under the form", () => {
    const { form, input } = buildSearchForm("cat  dog  -bird");
    searchToolsFeature.mount(makeCtx());

    const root = document.getElementById(ROOT_ID);
    expect(root).not.toBeNull();
    expect(root?.previousElementSibling).toBe(form);
    expect(chipLabels()).toEqual(["cat", "dog", "-bird"]);
    expect(chipRoots()[2]?.classList.contains(CHIP_EXCLUDE_CLASS)).toBe(true);
    expect(chipRoots()[0]?.classList.contains(CHIP_EXCLUDE_CLASS)).toBe(false);
    expect(
      chipRoots()[0]
        ?.querySelector(`button.${CHIP_REMOVE_CLASS}`)
        ?.getAttribute("aria-label"),
    ).toBe("Remove cat");
    expect(input.parentElement).toBe(form);
  });

  it("hides controlled media/sort/score tokens from chips", () => {
    buildSearchForm("cat -video sort:score:desc score:>=10 dog");
    searchToolsFeature.mount(makeCtx());
    expect(chipLabels()).toEqual(["cat", "dog"]);
    expect(mediaButton("Images").getAttribute("aria-pressed")).toBe("true");
    expect(sortSelect().value).toBe("score");
  });

  it("does not move form, input, or awesomplete and keeps the same parent", () => {
    const { form, input, parent } = buildSearchForm("one two");
    const awesomplete = form.querySelector("div.awesomplete");
    expect(awesomplete).not.toBeNull();

    searchToolsFeature.mount(makeCtx());

    expect(form.parentElement).toBe(parent);
    expect(input.parentElement).toBe(form);
    expect(awesomplete?.parentElement).toBe(form);
    expect(input.getAttribute("name")).toBe("tags");
    expect(document.getElementById(ROOT_ID)?.previousElementSibling).toBe(form);
  });

  it("toggles include/exclude on chip click and removes via ×", () => {
    const { input } = buildSearchForm("alpha beta gamma");
    searchToolsFeature.mount(makeCtx());

    chipRoots()[1]
      ?.querySelector(`button.${CHIP_TOGGLE_CLASS}`)
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(input.value).toBe("alpha -beta gamma");
    expect(chipLabels()).toEqual(["alpha", "-beta", "gamma"]);

    chipRoots()[1]
      ?.querySelector(`button.${CHIP_REMOVE_CLASS}`)
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(input.value).toBe("alpha gamma");
    expect(chipLabels()).toEqual(["alpha", "gamma"]);
  });

  it("renders meta and parenthesis tokens without toggle", () => {
    buildSearchForm("( a ~ b ) id:>12");
    searchToolsFeature.mount(makeCtx());
    expect(chipLabels()).toEqual(["(", "a", "~", "b", ")", "id:>12"]);
    const noToggle = new Set(["(", "~", ")", "id:>12"]);
    for (const chip of chipRoots()) {
      const toggle = chip.querySelector(`button.${CHIP_TOGGLE_CLASS}`);
      const label = chip.querySelector(`.${CHIP_LABEL_CLASS}`);
      const text =
        toggle instanceof HTMLButtonElement
          ? (toggle.textContent ?? "")
          : (label?.textContent ?? "");
      if (noToggle.has(text)) {
        expect(toggle).toBeNull();
        expect(label).not.toBeNull();
        continue;
      }
      expect(toggle).not.toBeNull();
      expect(label).toBeNull();
    }
  });

  it("colors chips from tag-sidebar type classes", () => {
    const sidebar = document.createElement("ul");
    sidebar.id = "tag-sidebar";
    const li = document.createElement("li");
    li.className = "tag-type-artist";
    const link = document.createElement("a");
    link.href = "index.php?page=post&s=list&tags=nyx_x";
    link.textContent = "nyx x";
    li.append(link);
    sidebar.append(li);
    document.body.append(sidebar);

    buildSearchForm("nyx_x other");
    searchToolsFeature.mount(makeCtx());

    expect(chipRoots()[0]?.classList.contains(`${CHIP_CLASS}--artist`)).toBe(
      true,
    );
    expect(chipRoots()[1]?.classList.contains(`${CHIP_CLASS}--artist`)).toBe(
      false,
    );
  });

  it("updates media tokens and navigates via buildSearchUrl", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign,
      search: "?page=post&s=list&tags=cat",
    });
    const { input } = buildSearchForm("cat dog");
    searchToolsFeature.mount(makeCtx());

    mediaButton("Images").click();
    expect(input.value).toBe("cat dog -video");
    expect(assign).toHaveBeenCalledTimes(1);
    const url = String(assign.mock.calls[0]?.[0] ?? "");
    expect(url).toContain("tags=");
    expect(url).toContain("cat");
    expect(url).toContain("dog");
    expect(url).toContain("-video");

    mediaButton("Videos").click();
    expect(input.value).toBe("cat dog video");
    expect(String(assign.mock.calls[1]?.[0] ?? "")).toContain("video");
    expect(String(assign.mock.calls[1]?.[0] ?? "")).not.toContain("-video");
  });

  it("updates sort tokens and preserves free tokens", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign,
      search: "?page=post&s=list&tags=cat",
    });
    const { input } = buildSearchForm("cat sort:random");
    searchToolsFeature.mount(makeCtx());
    expect(chipLabels()).toEqual(["cat"]);
    expect(sortSelect().value).toBe("random");

    sortSelect().value = "oldest";
    sortSelect().dispatchEvent(new Event("change", { bubbles: true }));
    expect(input.value).toBe("cat sort:id:asc");
    expect(String(assign.mock.calls[0]?.[0] ?? "")).toContain("sort%3Aid%3Aasc");
  });

  it("updates from input events without stealing focus while typing", () => {
    const { input } = buildSearchForm("a");
    searchToolsFeature.mount(makeCtx());
    input.focus();
    expect(document.activeElement).toBe(input);

    input.value = "a b";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(chipLabels()).toEqual(["a", "b"]);
    expect(document.activeElement).toBe(input);
  });

  it("polls programmatic value changes when the document is visible", () => {
    const { input } = buildSearchForm("start");
    searchToolsFeature.mount(makeCtx());
    expect(chipLabels()).toEqual(["start"]);

    input.value = "start next";
    vi.advanceTimersByTime(700);

    expect(chipLabels()).toEqual(["start", "next"]);
  });

  it("rereads after tag-sidebar click on the next macrotask", () => {
    const { input } = buildSearchForm("old");
    const sidebar = document.createElement("ul");
    sidebar.id = "tag-sidebar";
    document.body.append(sidebar);
    searchToolsFeature.mount(makeCtx());

    input.value = "old new";
    sidebar.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(chipLabels()).toEqual(["old"]);

    vi.advanceTimersByTime(0);
    expect(chipLabels()).toEqual(["old", "new"]);
  });

  it("warns and returns when the search form is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => {
      searchToolsFeature.mount(makeCtx());
    }).not.toThrow();
    expect(document.getElementById(ROOT_ID)).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("keeps the save form hidden until Save search, then Cancel hides it", () => {
    const bodyClass = featureBodyClass("search-tools");
    const hiddenRule = `body.${bodyClass} [class^="rdw-search-tools"][hidden]`;
    expect(searchToolsFeature.css).toContain(hiddenRule);
    expect(searchToolsFeature.css).toMatch(
      /\[class\^="rdw-search-tools"\]\[hidden\]\s*\{\s*display:\s*none\s*!important;/,
    );

    buildSearchForm("fox -dog");
    searchToolsFeature.mount(makeCtx());

    const saveForm = document.querySelector(
      `#${ROOT_ID} .rdw-search-tools-save-form`,
    );
    const saveBtn = document.querySelector(
      `#${ROOT_ID} button.rdw-search-tools-save-btn`,
    );
    expect(saveForm).toBeInstanceOf(HTMLElement);
    expect(saveBtn).toBeInstanceOf(HTMLButtonElement);
    if (
      !(saveForm instanceof HTMLElement) ||
      !(saveBtn instanceof HTMLButtonElement)
    ) {
      throw new Error("save controls missing");
    }

    expect(saveForm.hidden).toBe(true);
    expect(saveForm.hasAttribute("hidden")).toBe(true);
    expect(saveBtn.hidden).toBe(false);

    saveBtn.click();
    expect(saveForm.hidden).toBe(false);
    expect(saveForm.hasAttribute("hidden")).toBe(false);
    expect(saveBtn.hidden).toBe(true);

    const cancel = document.querySelector(
      `#${ROOT_ID} button.rdw-search-tools-save-cancel`,
    );
    expect(cancel).toBeInstanceOf(HTMLButtonElement);
    if (!(cancel instanceof HTMLButtonElement)) {
      throw new Error("cancel button missing");
    }
    cancel.click();
    expect(saveForm.hidden).toBe(true);
    expect(saveForm.hasAttribute("hidden")).toBe(true);
    expect(saveBtn.hidden).toBe(false);
  });

  it("saves the current search into collections", () => {
    const { input } = buildSearchForm("fox -dog");
    searchToolsFeature.mount(makeCtx());

    const saveBtn = document.querySelector(
      `#${ROOT_ID} button.rdw-search-tools-save-btn`,
    );
    expect(saveBtn).toBeInstanceOf(HTMLButtonElement);
    if (!(saveBtn instanceof HTMLButtonElement)) {
      throw new Error("save button missing");
    }
    expect(saveBtn.disabled).toBe(false);
    saveBtn.click();

    const nameInput = document.querySelector(
      `#${ROOT_ID} input.rdw-search-tools-save-name`,
    );
    const confirm = document.querySelector(
      `#${ROOT_ID} button.rdw-search-tools-save-confirm`,
    );
    expect(nameInput).toBeInstanceOf(HTMLInputElement);
    expect(confirm).toBeInstanceOf(HTMLButtonElement);
    if (
      !(nameInput instanceof HTMLInputElement) ||
      !(confirm instanceof HTMLButtonElement)
    ) {
      throw new Error("save form missing");
    }
    nameInput.value = "Fox pack";
    confirm.click();

    const stored = memory.get(STORAGE_KEY);
    expect(stored).toMatchObject({
      collections: [
        {
          name: "Fox pack",
          tags: [
            { tag: "fox", type: "include" },
            { tag: "dog", type: "exclude" },
          ],
        },
      ],
    });
    expect(input.value).toBe("fox -dog");
  });

  it("disables followed artists source when no artists are stored", () => {
    save(createDefaultStorage());
    buildSearchForm("cat");
    const fav = document.createElement("li");
    fav.id = "my-favorites-container";
    const link = document.createElement("a");
    link.href = "index.php?page=favorites&s=view&id=1";
    link.textContent = "My Favorites";
    fav.append(link);
    document.body.append(fav);

    searchToolsFeature.mount(makeCtx());
    const source = document.querySelector(
      `#${ROOT_ID} select.rdw-search-tools-source`,
    );
    expect(source).toBeInstanceOf(HTMLSelectElement);
    if (!(source instanceof HTMLSelectElement)) {
      throw new Error("source select missing");
    }
    const followed = source.querySelector('option[value="followed"]');
    const favorites = source.querySelector('option[value="favorites"]');
    expect(followed).toBeInstanceOf(HTMLOptionElement);
    expect(favorites).toBeInstanceOf(HTMLOptionElement);
    if (!(followed instanceof HTMLOptionElement)) {
      throw new Error("followed option missing");
    }
    expect(followed.disabled).toBe(true);
  });
});
