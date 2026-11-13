import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  RDW_SKIN_CLASS,
  RDW_THEME_ATTR,
  SITE_THEME_COOKIE_NAME,
  SITE_THEME_COOKIE_VALUE_DARK,
  SITE_THEME_STYLESHEET_DARK,
  SITE_THEME_STYLESHEET_LIGHT,
  TOKEN_STYLE_ID,
} from "../../src/config/constants";
import {
  applyAppearanceTheme,
  applyBodyBackgroundImage,
  clampBackgroundDim,
  computeDownscaleSize,
  contrastRatio,
  CONTRAST_RATIO_MIN,
  createDefaultCustomTheme,
  hasInsufficientTextContrast,
  parseHexColor,
} from "../../src/skin/theme";
import { getSiteTheme } from "../../src/site/theme";
import { DARK_PALETTE, LIGHT_PALETTE, TOKEN_VAR } from "../../src/ui/tokens";

const OTHER_COOKIE = "session=abc123";
const LIGHT_HREF = `https://rule34.xxx/css/${SITE_THEME_STYLESHEET_LIGHT}?v=1`;
const DARK_HREF = `https://rule34.xxx/css/${SITE_THEME_STYLESHEET_DARK}?v=1`;

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

function appendStylesheet(href: string): HTMLLinkElement {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.append(link);
  return link;
}

describe("contrast helpers", () => {
  it("parses hex colors", () => {
    expect(parseHexColor("#abc")).toEqual({ r: 170, g: 187, b: 204 });
    expect(parseHexColor("#112233")).toEqual({ r: 17, g: 34, b: 51 });
    expect(parseHexColor("nope")).toBeNull();
  });

  it("flags text/bg below 4.5:1", () => {
    expect(hasInsufficientTextContrast("#777777", "#888888")).toBe(true);
    expect(hasInsufficientTextContrast("#1c2228", "#aae5a4")).toBe(false);
    const ratio = contrastRatio("#1c2228", "#aae5a4");
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeGreaterThanOrEqual(CONTRAST_RATIO_MIN);
  });

  it("clamps background dim to 0–0.8", () => {
    expect(clampBackgroundDim(-1)).toBe(0);
    expect(clampBackgroundDim(1)).toBe(0.8);
    expect(clampBackgroundDim(0.4)).toBe(0.4);
  });
});

describe("computeDownscaleSize", () => {
  it("never upscales and fits inside the max box", () => {
    expect(computeDownscaleSize(100, 50, 200, 200)).toEqual({
      width: 100,
      height: 50,
    });
    expect(computeDownscaleSize(4000, 2000, 1600, 1200)).toEqual({
      width: 1600,
      height: 800,
    });
    expect(computeDownscaleSize(2000, 4000, 1600, 1200)).toEqual({
      width: 600,
      height: 1200,
    });
  });
});

describe("applyAppearanceTheme", () => {
  beforeEach(() => {
    document.head.replaceChildren();
    document.body.replaceChildren();
    document.documentElement.removeAttribute(RDW_THEME_ATTR);
    document.documentElement.classList.remove(RDW_SKIN_CLASS);
    document.documentElement.style.cssText = "";
    document.body.style.cssText = "";
    setDocumentCookie(OTHER_COOKIE);
    vi.stubGlobal("GM_getValue", () => undefined);
    vi.stubGlobal("GM_setValue", () => undefined);
  });

  afterEach(() => {
    document.getElementById(TOKEN_STYLE_ID)?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("site removes rdw-skin and deletes theme cookie", () => {
    const link = appendStylesheet(DARK_HREF);
    setDocumentCookie(
      `${OTHER_COOKIE}; ${SITE_THEME_COOKIE_NAME}=${SITE_THEME_COOKIE_VALUE_DARK}`,
    );

    applyAppearanceTheme({ appearance: { theme: "site" } });

    expect(document.documentElement.classList.contains(RDW_SKIN_CLASS)).toBe(
      false,
    );
    expect(document.documentElement.getAttribute(RDW_THEME_ATTR)).toBe("site");
    expect(document.cookie).not.toContain(`${SITE_THEME_COOKIE_NAME}=`);
    expect(getSiteTheme()).toBe("light");
    expect(link.getAttribute("href")).toBe(LIGHT_HREF);
    expect(document.getElementById(TOKEN_STYLE_ID)?.textContent).toContain(
      LIGHT_PALETTE.bg,
    );
  });

  it("site-dark removes rdw-skin and sets theme=dark cookie", () => {
    const link = appendStylesheet(LIGHT_HREF);

    applyAppearanceTheme({ appearance: { theme: "site-dark" } });

    expect(document.documentElement.classList.contains(RDW_SKIN_CLASS)).toBe(
      false,
    );
    expect(document.documentElement.getAttribute(RDW_THEME_ATTR)).toBe(
      "site-dark",
    );
    expect(document.cookie).toContain(
      `${SITE_THEME_COOKIE_NAME}=${SITE_THEME_COOKIE_VALUE_DARK}`,
    );
    expect(getSiteTheme()).toBe("dark");
    expect(link.getAttribute("href")).toBe(DARK_HREF);
    expect(document.getElementById(TOKEN_STYLE_ID)?.textContent).toContain(
      DARK_PALETTE.bg,
    );
  });

  it("light enables rdw-skin, clears cookie, forces light stylesheet", () => {
    const link = appendStylesheet(DARK_HREF);
    setDocumentCookie(
      `${OTHER_COOKIE}; ${SITE_THEME_COOKIE_NAME}=${SITE_THEME_COOKIE_VALUE_DARK}`,
    );

    applyAppearanceTheme({ appearance: { theme: "light" } });

    expect(document.documentElement.classList.contains(RDW_SKIN_CLASS)).toBe(
      true,
    );
    expect(document.documentElement.getAttribute(RDW_THEME_ATTR)).toBe("light");
    expect(document.cookie).not.toContain(`${SITE_THEME_COOKIE_NAME}=`);
    expect(link.getAttribute("href")).toBe(LIGHT_HREF);
  });

  it("dark enables rdw-skin and still forces light site stylesheet", () => {
    const link = appendStylesheet(DARK_HREF);

    applyAppearanceTheme({ appearance: { theme: "dark" } });

    expect(document.documentElement.classList.contains(RDW_SKIN_CLASS)).toBe(
      true,
    );
    expect(document.documentElement.getAttribute(RDW_THEME_ATTR)).toBe("dark");
    expect(document.cookie).not.toContain(`${SITE_THEME_COOKIE_NAME}=`);
    expect(link.getAttribute("href")).toBe(LIGHT_HREF);
  });

  it("custom dark base injects dark tokens and body background with dim", () => {
    appendStylesheet(LIGHT_HREF);
    const custom = {
      ...createDefaultCustomTheme(),
      base: "dark" as const,
      backgroundImage: "https://example.com/bg.png",
      backgroundDim: 0.4,
    };

    const result = applyAppearanceTheme({
      appearance: { theme: "custom", custom },
    });

    expect(document.documentElement.classList.contains(RDW_SKIN_CLASS)).toBe(
      true,
    );
    expect(document.getElementById(TOKEN_STYLE_ID)?.textContent).toContain(
      DARK_PALETTE.bg,
    );
    expect(document.body.style.backgroundImage).toContain(
      "url(\"https://example.com/bg.png\")",
    );
    expect(document.body.style.backgroundImage).toContain("rgba(0, 0, 0, 0.4)");
    expect(
      document.documentElement.style.getPropertyValue(TOKEN_VAR.backgroundDim),
    ).toBe("0.4");
    expect(result.contrastWarning).toBe(false);
  });

  it("custom without image does not warn", () => {
    appendStylesheet(LIGHT_HREF);
    const result = applyAppearanceTheme({
      appearance: {
        theme: "custom",
        custom: createDefaultCustomTheme(),
      },
    });
    expect(result.contrastWarning).toBe(false);
  });

  it("applyBodyBackgroundImage clears when url empty", () => {
    applyBodyBackgroundImage("https://example.com/a.png", 0.2);
    expect(document.body.style.backgroundImage.length).toBeGreaterThan(0);
    applyBodyBackgroundImage(undefined, 0.2);
    expect(document.body.style.backgroundImage).toBe("");
  });

  it("leaving custom clears body background", () => {
    appendStylesheet(LIGHT_HREF);
    applyAppearanceTheme({
      appearance: {
        theme: "custom",
        custom: {
          ...createDefaultCustomTheme(),
          backgroundImage: "https://example.com/bg.png",
          backgroundDim: 0.3,
        },
      },
    });
    expect(document.body.style.backgroundImage.length).toBeGreaterThan(0);

    applyAppearanceTheme({ appearance: { theme: "light" } });
    expect(document.body.style.backgroundImage).toBe("");
  });
});
