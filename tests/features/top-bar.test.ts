import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEBUG_KEY, TAG_TYPE_INCLUDE } from "../../src/config/constants";
import { topBarFeature } from "../../src/features/top-bar";
import {
  TOPBAR_ID,
  TOPBAR_SLOT_LEFT_ID,
  TOPBAR_SLOT_PAGER_ID,
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import {
  buildSearchUrl,
  buildUpdatesQueries,
  buildUpdatesSearchUrl,
} from "../../src/search/query";
import { createDefaultStorage } from "../../src/storage/schema";
import {
  getUpdatesGroupSize,
  save,
  setUpdatesGroupSize,
} from "../../src/storage/store";

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

function makeContext(): FeatureContext {
  return {
    pageKind: "list",
    search: "?page=post&s=list",
    getState: <T>(_parse: (raw: unknown) => T): T => {
      throw new Error("getState unused in top-bar tests");
    },
    setState: (): void => {},
  };
}

function buildSiteSearchForm(): HTMLFormElement {
  const form = document.createElement("form");
  form.id = "site-search";
  const br = document.createElement("br");
  const input = document.createElement("input");
  input.name = "tags";
  input.type = "text";
  form.append(br, input);
  return form;
}

describe("topBarFeature", () => {
  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
    document.body.replaceChildren();
    document.body.className = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports feature contract fields", () => {
    expect(topBarFeature.id).toBe("top-bar");
    expect(topBarFeature.label).toBe("Top bar");
    expect(topBarFeature.defaultEnabled).toBe(true);
    expect(topBarFeature.pages).toEqual(["list", "post", "favorites"]);
  });

  it("scopes every css rule under body.rdw-f-top-bar", () => {
    const bodyClass = featureBodyClass("top-bar");
    expect(bodyClass).toBe("rdw-f-top-bar");
    const rules = topBarFeature.css
      .split("}")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(rule.startsWith(`body.${bodyClass}`)).toBe(true);
    }
    expect(topBarFeature.css).toContain(`#${TOPBAR_ID}`);
    expect(topBarFeature.css).toContain("padding-top");
    expect(topBarFeature.css).toContain("overflow: visible");
    expect(topBarFeature.css).toContain("br");
    expect(topBarFeature.css).toContain(":focus-visible");
  });

  it("creates bar with slots and moves the native search form", () => {
    const form = buildSiteSearchForm();
    document.body.append(form);

    topBarFeature.mount(makeContext());

    const bar = document.getElementById(TOPBAR_ID);
    expect(bar).toBeInstanceOf(HTMLDivElement);
    if (!(bar instanceof HTMLDivElement)) {
      return;
    }

    expect(document.getElementById(TOPBAR_SLOT_LEFT_ID)).not.toBeNull();
    expect(document.getElementById(TOPBAR_SLOT_PAGER_ID)).not.toBeNull();
    expect(bar.contains(form)).toBe(true);
    expect(form.classList.contains("rdw-topbar-search")).toBe(true);
    expect(document.body.querySelectorAll("form#site-search")).toHaveLength(1);
    expect(form.querySelector('input[name="tags"]')).not.toBeNull();
  });

  it("still mounts when the search form is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => {
      topBarFeature.mount(makeContext());
    }).not.toThrow();

    const bar = document.getElementById(TOPBAR_ID);
    expect(bar).not.toBeNull();
    expect(bar?.querySelector("form")).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("hides collections select when empty and navigates when selected", () => {
    const assignSpy = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign: assignSpy,
    });

    topBarFeature.mount(makeContext());
    const emptySelect = document.querySelector("select.rdw-topbar-collections");
    expect(emptySelect).toBeInstanceOf(HTMLSelectElement);
    if (!(emptySelect instanceof HTMLSelectElement)) {
      return;
    }
    expect(emptySelect.hidden).toBe(true);

    document.body.replaceChildren();
    const data = createDefaultStorage();
    data.collections = [
      {
        id: "c1",
        name: "Cats",
        tags: [{ tag: "cat", type: TAG_TYPE_INCLUDE }],
      },
    ];
    save(data);

    topBarFeature.mount(makeContext());
    const select = document.querySelector("select.rdw-topbar-collections");
    expect(select).toBeInstanceOf(HTMLSelectElement);
    if (!(select instanceof HTMLSelectElement)) {
      return;
    }
    expect(select.hidden).toBe(false);
    select.value = "c1";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(assignSpy).toHaveBeenCalledWith(
      buildSearchUrl([{ tag: "cat", type: TAG_TYPE_INCLUDE }]),
    );
  });

  it("disables Updates without artists and navigates to the first query when present", () => {
    const assignSpy = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign: assignSpy,
    });

    topBarFeature.mount(makeContext());
    const disabled = document.querySelector("button.rdw-topbar-updates");
    expect(disabled).toBeInstanceOf(HTMLButtonElement);
    if (!(disabled instanceof HTMLButtonElement)) {
      return;
    }
    expect(disabled.disabled).toBe(true);
    expect(disabled.textContent).toBe("Updates");

    document.body.replaceChildren();
    const data = createDefaultStorage();
    data.artists = [{ tag: "artist_a" }, { tag: "artist_b" }];
    data.updates = { seenPostId: 10 };
    save(data);
    setUpdatesGroupSize(1);
    expect(getUpdatesGroupSize()).toBe(1);

    const queries = buildUpdatesQueries(
      ["artist_a", "artist_b"],
      10,
      1,
    );
    expect(queries.length).toBeGreaterThan(1);

    topBarFeature.mount(makeContext());
    const button = document.querySelector("button.rdw-topbar-updates");
    expect(button).toBeInstanceOf(HTMLButtonElement);
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe("Updates");
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const firstQuery = queries[0];
    expect(firstQuery).toBeDefined();
    if (firstQuery === undefined) {
      return;
    }
    expect(assignSpy).toHaveBeenCalledWith(buildUpdatesSearchUrl(firstQuery));
    expect(assignSpy).toHaveBeenCalledTimes(1);
  });

  it("does not throw when critical elements are missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => {
      topBarFeature.mount(makeContext());
    }).not.toThrow();
    expect(document.getElementById(TOPBAR_ID)).not.toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("builds the bar only once", () => {
    topBarFeature.mount(makeContext());
    topBarFeature.mount(makeContext());
    expect(document.querySelectorAll(`#${TOPBAR_ID}`)).toHaveLength(1);
  });
});
