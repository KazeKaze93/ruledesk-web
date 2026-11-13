import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import {
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_LIGHT,
  CSS_CLASS,
  PANEL_ROOT_ID,
  USERSCRIPT_VERSION,
} from "../src/config/constants";
import type { Feature } from "../src/features/types";
import { createDefaultStorage } from "../src/storage/schema";
import {
  clearStorageCache,
  getFeatureState,
  load,
  save,
  setAppearance,
  setFeatureState,
} from "../src/storage/store";
import {
  measureBorderBoxSize,
  mountPanel,
  PANEL_MIN_HEIGHT_PX,
  PANEL_MIN_WIDTH_PX,
  PANEL_UI_CLASS,
  sizesEqual,
} from "../src/ui/panel";

function click(el: Element): void {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
  });
}

/** Isolate panel tests from the live registry while mutating FEATURES. */
vi.mock("../src/features/registry", () => {
  const features: Feature[] = [];
  return { FEATURES: features };
});

import { FEATURES } from "../src/features/registry";

const memory = new Map<string, unknown>();
const ORIGINAL_FEATURES = [...FEATURES];

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
}

function clearFeatures(): void {
  FEATURES.length = 0;
}

function restoreFeatures(): void {
  FEATURES.length = 0;
  FEATURES.push(...ORIGINAL_FEATURES);
}

function openPanel(): ShadowRoot {
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
  click(toggle);
  return shadow;
}

function getTab(shadow: ShadowRoot, name: string): HTMLButtonElement {
  const tab = shadow.querySelector(`#rdw-tab-${name}`);
  expect(tab).toBeInstanceOf(HTMLButtonElement);
  if (!(tab instanceof HTMLButtonElement)) {
    throw new Error(`expected tab ${name}`);
  }
  return tab;
}

describe("panel tabs redesign", () => {
  beforeEach(() => {
    installGmMocks();
    clearFeatures();
    document.body.replaceChildren();
    document.body.className = "";
    document.documentElement.removeAttribute("data-rdw-theme");
    document.cookie = "theme=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    vi.useRealTimers();
  });

  afterEach(() => {
    restoreFeatures();
    document.getElementById(PANEL_ROOT_ID)?.remove();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("switches tabs with click and arrow keys, and persists the active tab", () => {
    const shadow = openPanel();
    const tablist = shadow.querySelector('[role="tablist"]');
    expect(tablist).not.toBeNull();

    const collections = getTab(shadow, "collections");
    expect(collections.getAttribute("aria-selected")).toBe("true");

    click(getTab(shadow, "artists"));
    expect(getTab(shadow, "artists").getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(getFeatureState("panel")).toEqual(
      expect.objectContaining({ tab: "artists" }),
    );

    const artistsTab = getTab(shadow, "artists");
    artistsTab.focus();
    act(() => {
      artistsTab.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
    });
    expect(getTab(shadow, "favorites").getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(getFeatureState("panel")).toEqual(
      expect.objectContaining({ tab: "favorites" }),
    );

    document.getElementById(PANEL_ROOT_ID)?.remove();
    clearStorageCache();
    const shadow2 = openPanel();
    expect(getTab(shadow2, "favorites").getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(
      shadow2.querySelector("#rdw-tabpanel-favorites")?.hasAttribute("hidden"),
    ).toBe(false);
  });

  it("includes Blacklist as its own tab", () => {
    const shadow = openPanel();
    expect(getTab(shadow, "blacklist")).toBeInstanceOf(HTMLButtonElement);
    click(getTab(shadow, "blacklist"));
    expect(
      shadow.querySelector("#rdw-tabpanel-blacklist")?.hasAttribute("hidden"),
    ).toBe(false);
  });

  it("unfollows an artist with a 5s undo window", () => {
    vi.useFakeTimers();
    const data = createDefaultStorage();
    data.artists = [{ tag: "nyx_x" }, { tag: "alpha_beta" }];
    save(data);

    const shadow = openPanel();
    click(getTab(shadow, "artists"));

    const unfollow = shadow.querySelector(
      `button[aria-label="Unfollow nyx_x"]`,
    );
    expect(unfollow).toBeInstanceOf(HTMLButtonElement);
    if (!(unfollow instanceof HTMLButtonElement)) {
      throw new Error("expected unfollow button");
    }
    click(unfollow);

    expect(load().artists.map((entry) => entry.tag)).toEqual(["alpha_beta"]);
    expect(shadow.textContent ?? "").toContain("Unfollowed nyx x");
    const undo = Array.from(shadow.querySelectorAll("button")).find(
      (button) => button.textContent === "Undo",
    );
    expect(undo).toBeInstanceOf(HTMLButtonElement);
    if (!(undo instanceof HTMLButtonElement)) {
      throw new Error("expected undo button");
    }
    click(undo);
    expect(load().artists.map((entry) => entry.tag).sort()).toEqual([
      "alpha_beta",
      "nyx_x",
    ]);
    expect(shadow.textContent ?? "").not.toContain("Unfollowed nyx x");

    const unfollowAgain = shadow.querySelector(
      `button[aria-label="Unfollow nyx_x"]`,
    );
    expect(unfollowAgain).toBeInstanceOf(HTMLButtonElement);
    if (!(unfollowAgain instanceof HTMLButtonElement)) {
      throw new Error("expected unfollow button");
    }
    click(unfollowAgain);
    expect(load().artists.map((entry) => entry.tag)).toEqual(["alpha_beta"]);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(shadow.textContent ?? "").not.toContain("Unfollowed nyx x");
    expect(load().artists.map((entry) => entry.tag)).toEqual(["alpha_beta"]);
  });

  it("closes on outside click and Escape, but not when clicking the toggle", () => {
    const shadow = openPanel();
    const panel = shadow.querySelector("#ruledesk-web-panel");
    expect(panel).toBeInstanceOf(HTMLElement);
    if (!(panel instanceof HTMLElement)) {
      throw new Error("expected panel");
    }
    expect(panel.hidden).toBe(false);

    const toggle = shadow.querySelector("#ruledesk-web-toggle");
    expect(toggle).toBeInstanceOf(HTMLButtonElement);
    if (!(toggle instanceof HTMLButtonElement)) {
      throw new Error("expected toggle");
    }
    click(toggle);
    expect(panel.hidden).toBe(true);

    click(toggle);
    expect(panel.hidden).toBe(false);

    act(() => {
      document.body.dispatchEvent(
        new MouseEvent("click", { bubbles: true, composed: true }),
      );
    });
    expect(panel.hidden).toBe(true);

    click(toggle);
    expect(panel.hidden).toBe(false);
    act(() => {
      panel.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    expect(panel.hidden).toBe(true);
  });

  it("restores persisted size via a shadow style rule, not a style attribute", () => {
    setFeatureState("panel", {
      tab: "collections",
      width: 420,
      height: 360,
    });
    const shadow = openPanel();
    const panel = shadow.querySelector("#ruledesk-web-panel");
    expect(panel).toBeInstanceOf(HTMLElement);
    if (!(panel instanceof HTMLElement)) {
      throw new Error("expected panel");
    }
    expect(panel.getAttribute("style")).toBeNull();

    const sizeRule = Array.from(shadow.querySelectorAll("style"))
      .map((node) => node.textContent ?? "")
      .join("\n");
    expect(sizeRule).toContain(`.${CSS_CLASS.panel}{width:420px;height:360px;}`);
  });

  it("three save-apply size cycles do not shrink when border-box is unchanged", () => {
    const sizes: Array<{ width: number; height: number }> = [];
    let current = { width: 400, height: 300 };
    for (let cycle = 0; cycle < 3; cycle += 1) {
      const entry = {
        borderBoxSize: [
          { inlineSize: current.width, blockSize: current.height },
        ],
        contentRect: {
          width: current.width - 2,
          height: current.height - 2,
        },
      } as unknown as ResizeObserverEntry;
      const el = document.createElement("div");
      Object.defineProperty(el, "offsetWidth", { value: current.width });
      Object.defineProperty(el, "offsetHeight", { value: current.height });
      const measured = measureBorderBoxSize(entry, el);
      expect(measured).not.toBeNull();
      if (measured === null) {
        throw new Error("expected size");
      }
      expect(measured.width).toBeGreaterThanOrEqual(PANEL_MIN_WIDTH_PX);
      expect(measured.height).toBeGreaterThanOrEqual(PANEL_MIN_HEIGHT_PX);
      if (sizes.length > 0) {
        const previous = sizes[sizes.length - 1];
        expect(previous).toBeDefined();
        if (previous !== undefined) {
          expect(sizesEqual(measured, previous)).toBe(true);
        }
      }
      sizes.push(measured);
      current = measured;
    }
    expect(sizes).toHaveLength(3);
    expect(sizes[0]).toEqual(sizes[2]);
  });

  it("applies dark theme class when appearance theme is dark", () => {
    setAppearance({ theme: APPEARANCE_THEME_DARK });
    const shadow = openPanel();
    const host = document.getElementById(PANEL_ROOT_ID);
    expect(host?.classList.contains(PANEL_UI_CLASS.themeDark)).toBe(true);

    const cssText = Array.from(shadow.querySelectorAll("style"))
      .map((node) => node.textContent ?? "")
      .join("\n");
    expect(cssText).toContain(`:host(.${PANEL_UI_CLASS.themeDark})`);
    expect(cssText).toContain("--rdw-bg:");

    document.getElementById(PANEL_ROOT_ID)?.remove();
    setAppearance({ theme: APPEARANCE_THEME_LIGHT });
    clearStorageCache();
    const hostLight = openPanel();
    expect(
      document
        .getElementById(PANEL_ROOT_ID)
        ?.classList.contains(PANEL_UI_CLASS.themeDark),
    ).toBe(false);
    expect(hostLight.querySelector(`.${PANEL_UI_CLASS.footer}`)).not.toBeNull();
  });

  it("renders choice modules as select-only without a switch", () => {
    const choiceFeature: Feature = {
      id: "demo-choice",
      label: "Demo choice",
      pages: ["list"],
      defaultEnabled: true,
      cssOnly: true,
      choice: {
        options: [
          { value: "default", label: "Default" },
          { value: "compact", label: "Compact" },
        ],
        defaultValue: "default",
      },
      css: "",
      mount: () => {},
    };
    const toggleFeature: Feature = {
      id: "menu-cleanup",
      label: "Menu cleanup",
      pages: ["list"],
      defaultEnabled: true,
      cssOnly: true,
      css: "",
      mount: () => {},
    };
    FEATURES.push(choiceFeature, toggleFeature);

    const shadow = openPanel();
    click(getTab(shadow, "settings"));

    expect(shadow.querySelector("#rdw-feature-demo-choice")).toBeNull();
    expect(
      shadow.querySelector("#rdw-feature-choice-demo-choice"),
    ).not.toBeNull();

    const checkbox = shadow.querySelector("#rdw-feature-menu-cleanup");
    expect(checkbox).toBeInstanceOf(HTMLButtonElement);
    expect(checkbox?.getAttribute("role")).toBe("switch");
    expect(shadow.querySelector("#rdw-feature-choice-menu-cleanup")).toBeNull();
  });

  it("shows the userscript version in the footer", () => {
    const shadow = openPanel();
    const footer = shadow.querySelector(`.${PANEL_UI_CLASS.footer}`);
    expect(footer?.textContent ?? "").toContain(`v${USERSCRIPT_VERSION}`);
  });

  it("shows artists empty hint and omits manual add / open updates controls", () => {
    const shadow = openPanel();
    click(getTab(shadow, "artists"));
    expect(
      shadow.querySelector("#rdw-tabpanel-artists")?.textContent ?? "",
    ).toContain(
      "Follow artists with the Follow button next to their name in the tag list.",
    );
    expect(shadow.querySelector("#rdw-artist-tag")).toBeNull();
    expect(shadow.textContent ?? "").not.toContain("Open updates");
  });

  it("settings page group uses Collapse tags label for tag-groups", () => {
    FEATURES.push({
      id: "tag-groups",
      label: "Collapse tags",
      pages: ["list"],
      defaultEnabled: true,
      cssOnly: true,
      css: "",
      mount: () => {},
    });
    const shadow = openPanel();
    click(getTab(shadow, "settings"));
    const settingsText =
      shadow.querySelector("#rdw-tabpanel-settings")?.textContent ?? "";
    expect(settingsText).toContain("Collapse tags");
    expect(settingsText).toContain("Page");
    expect(settingsText).toContain("Data");
  });
});
