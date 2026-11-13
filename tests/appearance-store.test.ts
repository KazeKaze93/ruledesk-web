import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  APPEARANCE_BACKGROUND_KEY,
  APPEARANCE_BACKGROUND_TOO_LARGE,
  DEBUG_KEY,
  STORAGE_KEY,
} from "../src/config/constants";
import { createDefaultStorage } from "../src/storage/schema";
import {
  clearAppearanceBackgroundDataUrl,
  clearStorageCache,
  getAppearance,
  getAppearanceBackgroundDataUrl,
  load,
  save,
  setAppearance,
  setAppearanceBackgroundDataUrl,
} from "../src/storage/store";

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
}

describe("appearance settings", () => {
  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
  });

  it("defaults to light theme", () => {
    expect(getAppearance()).toEqual({ theme: "light" });
    expect(createDefaultStorage().settings?.appearance).toEqual({
      theme: "light",
    });
  });

  it("persists appearance without SCHEMA_VERSION bump", () => {
    setAppearance({
      theme: "dark",
    });
    expect(load().version).toBe(1);
    expect(getAppearance()).toEqual({ theme: "dark" });
  });

  it("loads old storage without appearance", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: {},
      settings: {
        gridFavButtons: true,
        tweaksEnabled: true,
      },
    });
    const data = load();
    expect(data.settings?.appearance).toBeUndefined();
    expect(getAppearance()).toEqual({ theme: "light" });
  });

  it("stores background data URL in a separate GM key", () => {
    const dataUrl = "data:image/png;base64,aaaa";
    setAppearanceBackgroundDataUrl(dataUrl);
    expect(memory.get(APPEARANCE_BACKGROUND_KEY)).toBe(dataUrl);
    expect(getAppearanceBackgroundDataUrl()).toBe(dataUrl);
    clearAppearanceBackgroundDataUrl();
    expect(getAppearanceBackgroundDataUrl()).toBeUndefined();
  });

  it("rejects oversized background data URLs", () => {
    const oversized = `data:image/png;base64,${"a".repeat(2_000_000)}`;
    expect(() => setAppearanceBackgroundDataUrl(oversized)).toThrow(
      APPEARANCE_BACKGROUND_TOO_LARGE,
    );
    expect(memory.has(APPEARANCE_BACKGROUND_KEY)).toBe(false);
  });

  it("round-trips custom appearance through save/load", () => {
    const data = createDefaultStorage();
    data.settings = {
      gridFavButtons: true,
      appearance: {
        theme: "custom",
        custom: {
          accent: "#2f6fed",
          bg: "#aae5a4",
          surface: "#ffffff",
          text: "#1c2228",
          backgroundDim: 0.4,
        },
      },
    };
    save(data);
    expect(getAppearance()).toEqual(data.settings?.appearance);
  });
});
