import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyAppearanceToDocument,
  injectSiteSkinHook,
  injectTokenStyles,
} from "../src/boot/appearance-dom";
import { bootEarly } from "../src/boot/early";
import { whenDomReady } from "../src/boot/ready";
import {
  DEBUG_KEY,
  DEFAULT_APPEARANCE_THEME,
  RDW_SKIN_CLASS,
  RDW_THEME_ATTR,
  SITE_SKIN_STYLE_ID,
  STORAGE_KEY,
  TOKEN_STYLE_ID,
} from "../src/config/constants";
import { getSiteSkinCss } from "../src/skin/site-skin";
import { clearStorageCache } from "../src/storage/store";
import { LIGHT_PALETTE, TOKEN_VAR } from "../src/ui/tokens";

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

describe("boot early appearance", () => {
  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
    document.documentElement.removeAttribute(RDW_THEME_ATTR);
    document.documentElement.classList.remove(RDW_SKIN_CLASS);
    document.getElementById(TOKEN_STYLE_ID)?.remove();
    document.getElementById(SITE_SKIN_STYLE_ID)?.remove();
    document.documentElement.style.cssText = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("injects token styles and theme attrs without needing body", () => {
    expect(document.body).toBeTruthy();
    const bodySpy = vi.spyOn(document.body, "append");
    bootEarly();
    expect(document.documentElement.getAttribute(RDW_THEME_ATTR)).toBe(
      DEFAULT_APPEARANCE_THEME,
    );
    expect(document.documentElement.classList.contains(RDW_SKIN_CLASS)).toBe(
      true,
    );
    const style = document.getElementById(TOKEN_STYLE_ID);
    expect(style).toBeInstanceOf(HTMLStyleElement);
    expect(style?.textContent).toContain(TOKEN_VAR.accent);
    expect(style?.textContent).toContain(LIGHT_PALETTE.accent);
    const skin = document.getElementById(SITE_SKIN_STYLE_ID);
    expect(skin).toBeInstanceOf(HTMLStyleElement);
    expect(skin?.textContent).toBe(getSiteSkinCss());
    expect(bodySpy).not.toHaveBeenCalled();
  });

  it("applies custom theme via setProperty", () => {
    applyAppearanceToDocument({
      appearance: {
        theme: "custom",
        custom: {
          accent: "#112233",
          bg: "#445566",
          surface: "#778899",
          text: "#abcdef",
        },
      },
    });
    expect(document.documentElement.style.getPropertyValue(TOKEN_VAR.accent)).toBe(
      "#112233",
    );
    expect(document.documentElement.style.getPropertyValue(TOKEN_VAR.bg)).toBe(
      "#445566",
    );
  });

  it("does not enable rdw-skin for site theme", () => {
    applyAppearanceToDocument({
      appearance: { theme: "site" },
    });
    expect(document.documentElement.classList.contains(RDW_SKIN_CLASS)).toBe(
      false,
    );
    expect(document.documentElement.getAttribute(RDW_THEME_ATTR)).toBe("site");
  });
});

describe("whenDomReady", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defers callback until DOMContentLoaded while loading", () => {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get: () => "loading",
    });
    const callback = vi.fn();
    whenDomReady(callback);
    expect(callback).not.toHaveBeenCalled();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("runs immediately when document is already interactive", () => {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get: () => "interactive",
    });
    const callback = vi.fn();
    whenDomReady(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe("boot order contract", () => {
  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
    document.documentElement.removeAttribute(RDW_THEME_ATTR);
    document.documentElement.classList.remove(RDW_SKIN_CLASS);
    document.getElementById(TOKEN_STYLE_ID)?.remove();
    document.getElementById(SITE_SKIN_STYLE_ID)?.remove();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("injects styles before DOMContentLoaded and modules after", () => {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get: () => "loading",
    });

    const order: string[] = [];
    const startApp = vi.fn(() => {
      order.push("modules");
    });

    bootEarly();
    order.push("styles");
    expect(document.getElementById(TOKEN_STYLE_ID)).toBeInstanceOf(
      HTMLStyleElement,
    );
    expect(startApp).not.toHaveBeenCalled();

    whenDomReady(() => {
      startApp();
    });
    expect(startApp).not.toHaveBeenCalled();
    expect(order).toEqual(["styles"]);

    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(startApp).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["styles", "modules"]);
  });
});

describe("token injection helpers", () => {
  beforeEach(() => {
    document.getElementById(TOKEN_STYLE_ID)?.remove();
    document.getElementById(SITE_SKIN_STYLE_ID)?.remove();
  });

  it("reuses the same style element on reinject", () => {
    const first = injectTokenStyles(LIGHT_PALETTE);
    const second = injectTokenStyles(LIGHT_PALETTE);
    expect(first).toBe(second);
    expect(document.querySelectorAll(`#${TOKEN_STYLE_ID}`).length).toBe(1);
  });

  it("fills the site-skin style element when CSS is passed", () => {
    const css = getSiteSkinCss();
    const hook = injectSiteSkinHook(css);
    expect(hook.id).toBe(SITE_SKIN_STYLE_ID);
    expect(hook.textContent).toBe(css);
  });
});

describe("old storage still loads for boot", () => {
  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
    document.getElementById(TOKEN_STYLE_ID)?.remove();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults appearance to light when settings are missing", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: {},
    });
    bootEarly();
    expect(document.documentElement.getAttribute(RDW_THEME_ATTR)).toBe("light");
    expect(document.getElementById(TOKEN_STYLE_ID)?.textContent).toContain(
      LIGHT_PALETTE.bg,
    );
  });
});
