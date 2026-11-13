import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { applyAppearanceTheme } from "../../src/skin/theme";
import { hideRdwPage, showRdwPage } from "../../src/pages/host";
import {
  RDW_PAGE_ROOT_ID,
  RDW_ROUTE_SETTINGS,
} from "../../src/pages/constants";
import {
  clearStorageCache,
  setAppearance,
} from "../../src/storage/store";
import { DARK_PALETTE, LIGHT_PALETTE, TOKEN_VAR } from "../../src/ui/tokens";
import { DEBUG_KEY, SITE_THEME_STYLESHEET_LIGHT } from "../../src/config/constants";

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

describe("rdw page host theme tokens", () => {
  let header: HTMLElement;

  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
    document.head.replaceChildren();
    document.body.replaceChildren();
    header = document.createElement("div");
    header.id = "header";
    document.body.append(header);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://rule34.xxx/css/${SITE_THEME_STYLESHEET_LIGHT}`;
    document.head.append(link);
  });

  afterEach(() => {
    hideRdwPage();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("updates Shadow host tokens on the first theme change without remount", () => {
    setAppearance({ theme: "light" });
    applyAppearanceTheme({ appearance: { theme: "light" } });
    showRdwPage(RDW_ROUTE_SETTINGS, header);

    const host = document.getElementById(RDW_PAGE_ROOT_ID);
    expect(host).toBeTruthy();
    expect(host!.style.getPropertyValue(TOKEN_VAR.bg)).toBe(LIGHT_PALETTE.bg);

    setAppearance({ theme: "dark" });
    applyAppearanceTheme({ appearance: { theme: "dark" } });

    expect(host!.style.getPropertyValue(TOKEN_VAR.bg)).toBe(DARK_PALETTE.bg);
    expect(host!.style.getPropertyValue(TOKEN_VAR.surface)).toBe(
      DARK_PALETTE.surface,
    );
  });

  it("uses light palette for site and dark for site-dark on script pages", () => {
    setAppearance({ theme: "site-dark" });
    applyAppearanceTheme({ appearance: { theme: "site-dark" } });
    showRdwPage(RDW_ROUTE_SETTINGS, header);
    const host = document.getElementById(RDW_PAGE_ROOT_ID)!;
    expect(host.style.getPropertyValue(TOKEN_VAR.bg)).toBe(DARK_PALETTE.bg);

    setAppearance({ theme: "site" });
    applyAppearanceTheme({ appearance: { theme: "site" } });
    expect(host.style.getPropertyValue(TOKEN_VAR.bg)).toBe(LIGHT_PALETTE.bg);
  });
});
