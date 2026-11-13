import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import {
  DEBUG_KEY,
  RDW_SKIN_CLASS,
  RDW_THEME_ATTR,
  SITE_THEME_COOKIE_NAME,
  SITE_THEME_STYLESHEET_LIGHT,
  TOKEN_STYLE_ID,
} from "../../src/config/constants";
import { featureChoiceBodyClass } from "../../src/features/types";
import {
  clearStorageCache,
  getAppearance,
  getFeatureChoiceValue,
} from "../../src/storage/store";
import {
  APPEARANCE_SECTION_CSS,
  createAppearanceSection,
} from "../../src/ui/appearance-section";
import { fireClick, flushEffects } from "../kit/render";

const memory = new Map<string, unknown>();
const LIGHT_HREF = `https://rule34.xxx/css/${SITE_THEME_STYLESHEET_LIGHT}?v=1`;

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

function setDocumentCookie(value: string): void {
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => value,
    set: (next: string) => {
      const [pair] = next.split(";");
      if (pair === undefined) {
        return;
      }
      const eq = pair.indexOf("=");
      const name = eq === -1 ? pair.trim() : pair.slice(0, eq).trim();
      const cookieValue = eq === -1 ? "" : pair.slice(eq + 1);
      const entries = value
        .split(";")
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .filter((part) => !part.startsWith(`${name}=`));
      if (cookieValue.length > 0) {
        entries.push(`${name}=${cookieValue}`);
      }
      value = entries.join("; ");
    },
  });
}

function appendStylesheet(href: string): void {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.append(link);
}

function selectTriggers(section: HTMLElement): HTMLButtonElement[] {
  return Array.from(
    section.querySelectorAll<HTMLButtonElement>(".rdw-select__trigger"),
  );
}

function chooseSelectOption(section: HTMLElement, label: string): void {
  const options = Array.from(
    section.querySelectorAll<HTMLElement>(".rdw-select__option"),
  );
  const option = options.find((node) => node.textContent === label);
  if (option === undefined) {
    throw new Error(`option not found: ${label}`);
  }
  fireClick(option);
}

describe("createAppearanceSection", () => {
  let host: HTMLElement | null = null;

  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
    document.head.replaceChildren();
    document.body.replaceChildren();
    document.documentElement.removeAttribute(RDW_THEME_ATTR);
    document.documentElement.classList.remove(RDW_SKIN_CLASS);
    document.documentElement.style.cssText = "";
    document.body.style.cssText = "";
    document.body.className = "";
    setDocumentCookie("");
    appendStylesheet(LIGHT_HREF);
  });

  afterEach(() => {
    if (host !== null) {
      host.remove();
      host = null;
    }
    document.getElementById(TOKEN_STYLE_ID)?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports section CSS and mounts a labeled Appearance block", () => {
    expect(APPEARANCE_SECTION_CSS).toContain(".rdw-appearance");
    host = createAppearanceSection();
    document.body.append(host);
    expect(host.querySelector('[aria-label="Appearance"]')).toBeTruthy();
    expect(host.textContent).toContain("Site theme");
    expect(host.textContent).toContain("Grid");
  });

  it("theme select applies custom mode with contrast warning", async () => {
    host = createAppearanceSection();
    document.body.append(host);

    const themeTrigger = selectTriggers(host)[0];
    expect(themeTrigger).toBeTruthy();
    fireClick(themeTrigger!);
    chooseSelectOption(host, "Custom");
    await flushEffects();

    expect(getAppearance().theme).toBe("custom");
    expect(document.documentElement.classList.contains(RDW_SKIN_CLASS)).toBe(
      true,
    );
    expect(document.cookie).not.toContain(`${SITE_THEME_COOKIE_NAME}=`);

    const textInput = host.querySelector<HTMLInputElement>(
      'input[type="color"][aria-label="Text"]',
    );
    const bgInput = host.querySelector<HTMLInputElement>(
      'input[type="color"][aria-label="Background"]',
    );
    expect(textInput).toBeTruthy();
    expect(bgInput).toBeTruthy();

    act(() => {
      textInput!.value = "#777777";
      textInput!.dispatchEvent(new Event("input", { bubbles: true }));
      bgInput!.value = "#888888";
      bgInput!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await flushEffects();

    expect(host.textContent).toContain("Low contrast");
    expect(getAppearance().custom?.text.toLowerCase()).toBe("#777777");
    expect(getAppearance().custom?.bg.toLowerCase()).toBe("#888888");
  });

  it("grid select writes featureChoice grid-density", async () => {
    host = createAppearanceSection();
    document.body.append(host);

    const gridTrigger = selectTriggers(host)[1];
    expect(gridTrigger).toBeTruthy();
    fireClick(gridTrigger!);
    chooseSelectOption(host, "Masonry");
    await flushEffects();

    expect(getFeatureChoiceValue("grid-density")).toBe("masonry");
    expect(
      document.body.classList.contains(
        featureChoiceBodyClass("grid-density", "masonry"),
      ),
    ).toBe(true);
  });

  it("reset to defaults restores custom palette colors", async () => {
    host = createAppearanceSection();
    document.body.append(host);

    fireClick(selectTriggers(host)[0]!);
    chooseSelectOption(host, "Custom");
    await flushEffects();

    const accent = host.querySelector<HTMLInputElement>(
      'input[type="color"][aria-label="Accent"]',
    );
    act(() => {
      accent!.value = "#ff0000";
      accent!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await flushEffects();
    expect(getAppearance().custom?.accent.toLowerCase()).toBe("#ff0000");

    const reset = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent === "Reset to defaults",
    );
    expect(reset).toBeTruthy();
    fireClick(reset!);
    await flushEffects();

    expect(getAppearance().custom?.accent.toLowerCase()).toBe("#2f6fed");
  });
});
