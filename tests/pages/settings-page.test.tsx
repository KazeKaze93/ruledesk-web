import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import { DEBUG_KEY } from "../../src/config/constants";
import { createSettingsPage } from "../../src/pages/settings-page";
import { clearStorageCache } from "../../src/storage/store";

const APPEARANCE_ROW_CLASS = "rdw-appearance__row";

describe("SettingsPage flat rows", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    clearStorageCache();
    const memory = new Map<string, unknown>();
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("injects a late style that clears Appearance (Grid) row zebra", () => {
    let root: HTMLElement | undefined;
    act(() => {
      root = createSettingsPage();
      document.body.append(root);
    });
    if (root === undefined) {
      throw new Error("expected settings page root");
    }
    const styleNodes = Array.from(root.querySelectorAll("style"));
    const flatRe = new RegExp(
      String.raw`\.${APPEARANCE_ROW_CLASS}:nth-child\(even\)\s*\{[^}]*background:\s*transparent`,
    );
    const flatIndex = styleNodes.findIndex((node) =>
      flatRe.test(node.textContent ?? ""),
    );
    expect(flatIndex).toBeGreaterThanOrEqual(0);
    // Must come after AppearanceSection's own <style> so it wins the cascade.
    const appearanceOwn = styleNodes.findIndex((node) =>
      (node.textContent ?? "").includes(".rdw-appearance {"),
    );
    expect(appearanceOwn).toBeGreaterThanOrEqual(0);
    expect(flatIndex).toBeGreaterThan(appearanceOwn);
  });
});
