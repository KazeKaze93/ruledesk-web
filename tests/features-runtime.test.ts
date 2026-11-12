import * as z from "zod/mini";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEBUG_KEY, STORAGE_KEY } from "../src/config/constants";
import { FEATURES } from "../src/features/registry";
import {
  applyCssOnlyFeatureChoice,
  applyCssOnlyFeatureEnabled,
  getFeatureChoice,
  isFeatureEnabled,
  notifyThumbsAdded,
  onThumbsAdded,
  resetFeatureRuntimeState,
  runFeatures,
} from "../src/features/runtime";
import type { Feature } from "../src/features/types";
import {
  featureBodyClass,
  featureChoiceBodyClass,
} from "../src/features/types";
import { clearFavsCache, isFav } from "../src/storage/favs";
import { createDefaultStorage } from "../src/storage/schema";
import {
  clearStorageCache,
  load,
  save,
  setFeatureChoiceValue,
  setFeatureEnabled,
  setFeatureState,
  setPostSeenMark,
  setTweaksEnabled,
} from "../src/storage/store";
import { mountPanel } from "../src/ui/panel";
import { PANEL_ROOT_ID } from "../src/config/constants";

const memory = new Map<string, unknown>();
const ORIGINAL_FEATURES = [...FEATURES];

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

function clearFeatures(): void {
  FEATURES.length = 0;
}

function restoreFeatures(): void {
  FEATURES.length = 0;
  FEATURES.push(...ORIGINAL_FEATURES);
}

function makeFeature(
  partial: Pick<Feature, "id" | "pages"> &
    Partial<Omit<Feature, "id" | "pages">> & {
      mountImpl?: Feature["mount"];
    },
): Feature {
  const mountImpl = partial.mountImpl;
  return {
    id: partial.id,
    label: partial.label ?? partial.id,
    pages: partial.pages,
    defaultEnabled: partial.defaultEnabled ?? true,
    css: partial.css ?? `body.${featureBodyClass(partial.id)} { color: red; }`,
    ...(partial.cssOnly !== undefined ? { cssOnly: partial.cssOnly } : {}),
    ...(partial.choice !== undefined ? { choice: partial.choice } : {}),
    mount: (ctx) => {
      if (mountImpl !== undefined) {
        mountImpl(ctx);
      }
    },
  };
}

describe("features runtime", () => {
  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
    clearFeatures();
    resetFeatureRuntimeState();
    document.body.replaceChildren();
    document.body.className = "";
    document.head.querySelectorAll("style").forEach((node) => node.remove());
  });

  afterEach(() => {
    restoreFeatures();
    resetFeatureRuntimeState();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("mounts enabled features in registry order and skips other pages", () => {
    const order: string[] = [];
    FEATURES.push(
      makeFeature({
        id: "first",
        pages: ["list"],
        mountImpl: () => {
          order.push("first");
        },
      }),
      makeFeature({
        id: "second",
        pages: ["list", "post"],
        mountImpl: () => {
          order.push("second");
        },
      }),
      makeFeature({
        id: "post-only",
        pages: ["post"],
        mountImpl: () => {
          order.push("post-only");
        },
      }),
      makeFeature({
        id: "disabled",
        pages: ["list"],
        defaultEnabled: false,
        mountImpl: () => {
          order.push("disabled");
        },
      }),
    );

    runFeatures("list", "?page=post&s=list");
    expect(order).toEqual(["first", "second"]);
  });

  it("isolates mount exceptions so later features still run", () => {
    const order: string[] = [];
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    FEATURES.push(
      makeFeature({
        id: "boom",
        pages: ["list"],
        mountImpl: () => {
          order.push("boom");
          throw new Error("mount failed");
        },
      }),
      makeFeature({
        id: "ok",
        pages: ["list"],
        mountImpl: () => {
          order.push("ok");
        },
      }),
    );

    runFeatures("list", "?page=post&s=list");
    expect(order).toEqual(["boom", "ok"]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("adds body classes for feature id and choice value", () => {
    FEATURES.push(
      makeFeature({
        id: "grid-density",
        pages: ["list"],
        choice: {
          options: [
            { value: "compact", label: "Compact" },
            { value: "default", label: "Default" },
            { value: "large", label: "Large" },
          ],
          defaultValue: "default",
        },
      }),
    );

    runFeatures("list", "?page=post&s=list");
    expect(
      document.body.classList.contains(featureBodyClass("grid-density")),
    ).toBe(true);
    expect(
      document.body.classList.contains(
        featureChoiceBodyClass("grid-density", "default"),
      ),
    ).toBe(true);

    setFeatureChoiceValue("grid-density", "compact");
    document.body.className = "";
    runFeatures("list", "?page=post&s=list");
    expect(
      document.body.classList.contains(
        featureChoiceBodyClass("grid-density", "compact"),
      ),
    ).toBe(true);
  });

  it("does not mount when page tweaks are disabled", () => {
    const order: string[] = [];
    FEATURES.push(
      makeFeature({
        id: "x",
        pages: ["list"],
        mountImpl: () => {
          order.push("x");
        },
      }),
    );
    setTweaksEnabled(false);
    runFeatures("list", "?page=post&s=list");
    expect(order).toEqual([]);
    expect(document.body.className).toBe("");
  });

  it("loads old storage without new feature fields", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: { "7": { fav: true } },
    });
    const data = load();
    expect(data.settings).toBeUndefined();
    expect(data.marks["7"]).toBeUndefined();
    expect(isFav(7)).toBe(true);
    expect(isFeatureEnabled("missing")).toBe(false);
  });

  it("validates featureState with zod and keeps defaults", () => {
    const StateSchema = z.object({
      collapsed: z.array(z.string()),
    });
    const DEFAULT_STATE = { collapsed: ["General"] };

    FEATURES.push(
      makeFeature({
        id: "tag-groups",
        pages: ["list"],
        mountImpl: (ctx) => {
          const state = ctx.getState((raw) => {
            const parsed = StateSchema.safeParse(raw);
            return parsed.success ? parsed.data : DEFAULT_STATE;
          });
          expect(state).toEqual(DEFAULT_STATE);
          ctx.setState({ collapsed: ["Meta"] });
        },
      }),
    );

    runFeatures("list", "?page=post&s=list");
    expect(load().settings?.featureState?.["tag-groups"]).toEqual({
      collapsed: ["Meta"],
    });

    setFeatureState("tag-groups", { collapsed: "bad" });
    FEATURES[0] = makeFeature({
      id: "tag-groups",
      pages: ["list"],
      mountImpl: (ctx) => {
        const state = ctx.getState((raw) => {
          const parsed = StateSchema.safeParse(raw);
          return parsed.success ? parsed.data : DEFAULT_STATE;
        });
        expect(state).toEqual(DEFAULT_STATE);
      },
    });
    runFeatures("list", "?page=post&s=list");
  });

  it("respects stored feature enabled flags and choice helpers", () => {
    FEATURES.push(
      makeFeature({
        id: "sample-feature",
        pages: ["list"],
        defaultEnabled: false,
        choice: {
          options: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
          defaultValue: "a",
        },
      }),
    );

    expect(isFeatureEnabled("sample-feature")).toBe(false);
    expect(getFeatureChoice("sample-feature")).toBe("a");

    setFeatureEnabled("sample-feature", true);
    setFeatureChoiceValue("sample-feature", "b");
    expect(isFeatureEnabled("sample-feature")).toBe(true);
    expect(getFeatureChoice("sample-feature")).toBe("b");
  });

  it("ignores stale settings keys after registry removal", () => {
    const data = createDefaultStorage();
    data.settings = {
      gridFavButtons: true,
      tweaksEnabled: true,
      updatesGroupSize: 0,
      features: {
        "top-bar": true,
        "dark-theme": false,
        pager: true,
        "followed-badge": true,
      },
    };
    save(data);

    expect(load().settings?.features?.["top-bar"]).toBe(true);
    expect(load().settings?.features?.["dark-theme"]).toBe(false);
    expect(load().settings?.features?.pager).toBe(true);
    expect(load().settings?.features?.["followed-badge"]).toBe(true);
    expect(isFeatureEnabled("top-bar")).toBe(false);
    expect(isFeatureEnabled("dark-theme")).toBe(false);
    expect(isFeatureEnabled("pager")).toBe(false);
    expect(isFeatureEnabled("followed-badge")).toBe(false);
  });

  it("notifies thumbs-added subscribers and supports unsubscribe", () => {
    const seen: ParentNode[] = [];
    const stop = onThumbsAdded((root) => {
      seen.push(root);
    });
    const root = document.createElement("div");
    notifyThumbsAdded(root);
    expect(seen).toEqual([root]);
    stop();
    notifyThumbsAdded(document.createElement("div"));
    expect(seen).toHaveLength(1);
  });

  it("setPostSeenMark writes seen without clearing fav", () => {
    const data = createDefaultStorage();
    data.marks["42"] = { fav: true };
    save(data);
    setPostSeenMark("42");
    expect(isFav(42)).toBe(true);
    expect(load().marks["42"]).toEqual({ seen: true });
  });

  it("injects feature css once", () => {
    FEATURES.push(
      makeFeature({
        id: "once",
        pages: ["list"],
        css: "body.rdw-f-once { outline: 1px solid red; }",
      }),
    );
    runFeatures("list", "?page=post&s=list");
    runFeatures("list", "?page=post&s=list");
    expect(
      document.head.querySelectorAll("#rdw-feature-style-once"),
    ).toHaveLength(1);
  });

  it("cssOnly toggle applies body class and CSS without remounting", () => {
    const mountCount = { value: 0 };
    FEATURES.push(
      makeFeature({
        id: "live-css",
        pages: ["list"],
        defaultEnabled: false,
        cssOnly: true,
        css: "body.rdw-f-live-css { color: blue; }",
        mountImpl: () => {
          mountCount.value += 1;
        },
      }),
    );

    runFeatures("list", "?page=post&s=list");
    expect(mountCount.value).toBe(0);
    expect(
      document.body.classList.contains(featureBodyClass("live-css")),
    ).toBe(false);

    setFeatureEnabled("live-css", true);
    applyCssOnlyFeatureEnabled("live-css", true);
    expect(mountCount.value).toBe(1);
    expect(
      document.body.classList.contains(featureBodyClass("live-css")),
    ).toBe(true);
    expect(
      document.head.querySelectorAll("#rdw-feature-style-live-css"),
    ).toHaveLength(1);

    applyCssOnlyFeatureEnabled("live-css", false);
    expect(
      document.body.classList.contains(featureBodyClass("live-css")),
    ).toBe(false);
    expect(mountCount.value).toBe(1);

    applyCssOnlyFeatureEnabled("live-css", true);
    expect(
      document.body.classList.contains(featureBodyClass("live-css")),
    ).toBe(true);
    expect(mountCount.value).toBe(1);
  });

  it("cssOnly choice swaps body classes without remounting", () => {
    const mountCount = { value: 0 };
    FEATURES.push(
      makeFeature({
        id: "live-choice",
        pages: ["list"],
        cssOnly: true,
        choice: {
          options: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
          defaultValue: "a",
        },
        mountImpl: () => {
          mountCount.value += 1;
        },
      }),
    );

    runFeatures("list", "?page=post&s=list");
    expect(mountCount.value).toBe(1);
    expect(
      document.body.classList.contains(
        featureChoiceBodyClass("live-choice", "a"),
      ),
    ).toBe(true);

    setFeatureChoiceValue("live-choice", "b");
    applyCssOnlyFeatureChoice("live-choice", "b");
    expect(
      document.body.classList.contains(
        featureChoiceBodyClass("live-choice", "a"),
      ),
    ).toBe(false);
    expect(
      document.body.classList.contains(
        featureChoiceBodyClass("live-choice", "b"),
      ),
    ).toBe(true);
    expect(mountCount.value).toBe(1);
  });
});

describe("panel settings apply", () => {
  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
    clearFeatures();
    resetFeatureRuntimeState();
    document.body.replaceChildren();
    document.body.className = "";
    document.head.querySelectorAll("style").forEach((node) => node.remove());
    window.history.replaceState({}, "", "/index.php?page=post&s=list");
  });

  afterEach(() => {
    restoreFeatures();
    resetFeatureRuntimeState();
    document.getElementById(PANEL_ROOT_ID)?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function openSettingsPanel(): ShadowRoot {
    mountPanel();
    const host = document.getElementById(PANEL_ROOT_ID);
    expect(host).not.toBeNull();
    const shadow = host?.shadowRoot;
    expect(shadow).not.toBeNull();
    if (shadow === null || shadow === undefined) {
      throw new Error("expected panel shadow root");
    }
    const toggle = shadow.querySelector("#ruledesk-web-toggle");
    expect(toggle).toBeInstanceOf(HTMLButtonElement);
    if (!(toggle instanceof HTMLButtonElement)) {
      throw new Error("expected toggle button");
    }
    toggle.click();
    return shadow;
  }

  it("reloads when a non-cssOnly feature is toggled", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      reload,
      search: "?page=post&s=list",
    });

    FEATURES.push(
      makeFeature({
        id: "needs-reload",
        pages: ["list"],
        defaultEnabled: false,
      }),
    );

    const shadow = openSettingsPanel();
    const checkbox = shadow.querySelector("#rdw-feature-needs-reload");
    expect(checkbox).toBeInstanceOf(HTMLInputElement);
    if (!(checkbox instanceof HTMLInputElement)) {
      throw new Error("expected feature checkbox");
    }
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change"));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not reload when a cssOnly feature is toggled", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      reload,
      search: "?page=post&s=list",
    });

    FEATURES.push(
      makeFeature({
        id: "live-panel",
        pages: ["list"],
        defaultEnabled: false,
        cssOnly: true,
      }),
    );

    runFeatures("list", "?page=post&s=list");
    const shadow = openSettingsPanel();
    const checkbox = shadow.querySelector("#rdw-feature-live-panel");
    expect(checkbox).toBeInstanceOf(HTMLInputElement);
    if (!(checkbox instanceof HTMLInputElement)) {
      throw new Error("expected feature checkbox");
    }
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change"));
    expect(reload).not.toHaveBeenCalled();
    expect(
      document.body.classList.contains(featureBodyClass("live-panel")),
    ).toBe(true);
  });

  it("reloads when Enable page tweaks is toggled", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      reload,
      search: "?page=post&s=list",
    });

    const shadow = openSettingsPanel();
    const checkbox = shadow.querySelector("#rdw-tweaks-enabled");
    expect(checkbox).toBeInstanceOf(HTMLInputElement);
    if (!(checkbox instanceof HTMLInputElement)) {
      throw new Error("expected tweaks checkbox");
    }
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event("change"));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not show a reload-to-apply hint for feature toggles", () => {
    const shadow = openSettingsPanel();
    const blacklist = shadow.querySelector(".rdw-blacklist");
    expect(blacklist).not.toBeNull();
    expect(blacklist?.textContent ?? "").toContain(
      "Saved. Reload the page to apply.",
    );
    const withoutBlacklist = (shadow.textContent ?? "").replace(
      blacklist?.textContent ?? "",
      "",
    );
    expect(withoutBlacklist).not.toContain("Reload the page to apply");
  });
});
