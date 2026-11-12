import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
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
  setFeatureState,
} from "../src/storage/store";
import { PANEL_UI_CLASS } from "../src/ui/styles";

/** Isolate panel tests from the live registry while mutating FEATURES. */
vi.mock("../src/features/registry", () => {
  const features: Feature[] = [];
  return { FEATURES: features };
});

import { FEATURES } from "../src/features/registry";
import { mountPanel } from "../src/ui/panel";

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
  toggle.click();
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

    getTab(shadow, "artists").click();
    expect(getTab(shadow, "artists").getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(getFeatureState("panel")).toEqual(
      expect.objectContaining({ tab: "artists" }),
    );

    const artistsTab = getTab(shadow, "artists");
    artistsTab.focus();
    artistsTab.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
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

  it("unfollows an artist with a 5s undo window", () => {
    vi.useFakeTimers();
    const data = createDefaultStorage();
    data.artists = [{ tag: "nyx_x" }, { tag: "alpha_beta" }];
    save(data);

    const shadow = openPanel();
    getTab(shadow, "artists").click();

    const unfollow = shadow.querySelector(
      `button[aria-label="Unfollow nyx_x"]`,
    );
    expect(unfollow).toBeInstanceOf(HTMLButtonElement);
    if (!(unfollow instanceof HTMLButtonElement)) {
      throw new Error("expected unfollow button");
    }
    unfollow.click();

    expect(load().artists.map((entry) => entry.tag)).toEqual(["alpha_beta"]);
    expect(shadow.textContent ?? "").toContain("Unfollowed nyx x");
    const undo = Array.from(shadow.querySelectorAll("button")).find(
      (button) => button.textContent === "Undo",
    );
    expect(undo).toBeInstanceOf(HTMLButtonElement);
    if (!(undo instanceof HTMLButtonElement)) {
      throw new Error("expected undo button");
    }
    undo.click();
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
    unfollowAgain.click();
    expect(load().artists.map((entry) => entry.tag)).toEqual(["alpha_beta"]);
    vi.advanceTimersByTime(5000);
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
    toggle.click();
    expect(panel.hidden).toBe(true);

    toggle.click();
    expect(panel.hidden).toBe(false);

    document.body.dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true }),
    );
    expect(panel.hidden).toBe(true);

    toggle.click();
    expect(panel.hidden).toBe(false);
    panel.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
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

  it("applies dark theme class and CSS variables when site theme is dark", () => {
    const shadow = openPanel();
    getTab(shadow, "settings").click();
    const host = document.getElementById(PANEL_ROOT_ID);
    expect(host).not.toBeNull();
    expect(host?.classList.contains(PANEL_UI_CLASS.themeDark)).toBe(false);

    const theme = shadow.querySelector("#rdw-site-dark-theme");
    expect(theme).toBeInstanceOf(HTMLInputElement);
    if (!(theme instanceof HTMLInputElement)) {
      throw new Error("expected theme checkbox");
    }
    theme.checked = true;
    theme.dispatchEvent(new Event("change"));
    expect(host?.classList.contains(PANEL_UI_CLASS.themeDark)).toBe(true);

    const cssText = Array.from(shadow.querySelectorAll("style"))
      .map((node) => node.textContent ?? "")
      .join("\n");
    expect(cssText).toContain(`:host(.${PANEL_UI_CLASS.themeDark})`);
    expect(cssText).toContain("--rdw-bg:");
  });

  it("renders choice modules as select-only without a checkbox", () => {
    const choiceFeature: Feature = {
      id: "grid-density",
      label: "Grid size",
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
    getTab(shadow, "settings").click();

    expect(shadow.querySelector("#rdw-feature-grid-density")).toBeNull();
    const select = shadow.querySelector("#rdw-feature-choice-grid-density");
    expect(select).toBeInstanceOf(HTMLSelectElement);

    const checkbox = shadow.querySelector("#rdw-feature-menu-cleanup");
    expect(checkbox).toBeInstanceOf(HTMLInputElement);
    expect(shadow.querySelector("#rdw-feature-choice-menu-cleanup")).toBeNull();
  });

  it("shows the userscript version in the footer", () => {
    const shadow = openPanel();
    const footer = shadow.querySelector(`.${PANEL_UI_CLASS.footer}`);
    expect(footer?.textContent).toBe(`v${USERSCRIPT_VERSION}`);
  });

  it("shows artists empty hint and omits manual add / open updates controls", () => {
    const shadow = openPanel();
    getTab(shadow, "artists").click();
    expect(shadow.textContent ?? "").toContain(
      "Follow artists with the Follow button next to their name in the tag list.",
    );
    expect(shadow.querySelector("#rdw-artist-tag")).toBeNull();
    expect(shadow.textContent ?? "").not.toContain("Open updates");
  });
});
