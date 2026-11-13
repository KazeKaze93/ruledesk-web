import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SITE_THEME_COOKIE_NAME,
  SITE_THEME_COOKIE_VALUE_DARK,
  SITE_THEME_STYLESHEET_DARK,
  SITE_THEME_STYLESHEET_LIGHT,
} from "../src/config/constants";
import {
  getSiteTheme,
  resetSiteDesktopStylesheetWatch,
  scheduleSiteDesktopStylesheet,
  setSiteTheme,
} from "../src/site/theme";

const OTHER_COOKIE = "session=abc123";
const OTHER_STYLESHEET_HREF = "https://rule34.xxx/css/other.css?v=9";
/** Absolute single-slash (canonical host + path). */
const LIGHT_HREF_ABSOLUTE = `https://rule34.xxx/css/${SITE_THEME_STYLESHEET_LIGHT}?v=42`;
const DARK_HREF_ABSOLUTE = `https://rule34.xxx/css/${SITE_THEME_STYLESHEET_DARK}?v=42`;
/** Root-relative `/css/...`. */
const LIGHT_HREF_ROOT_RELATIVE = `/css/${SITE_THEME_STYLESHEET_LIGHT}?46`;
const DARK_HREF_ROOT_RELATIVE = `/css/${SITE_THEME_STYLESHEET_DARK}?46`;
/**
 * Absolute with doubled path slash — real site markup
 * (`https://rule34.xxx//css/desktop.css?46`). Pathname collapse required.
 */
const LIGHT_HREF_DOUBLE_SLASH = `https://rule34.xxx//css/${SITE_THEME_STYLESHEET_LIGHT}?46`;
const DARK_HREF_DOUBLE_SLASH = `https://rule34.xxx//css/${SITE_THEME_STYLESHEET_DARK}?46`;

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
  // Preserve raw href (incl. //css/); property setter would absolutize.
  link.setAttribute("href", href);
  document.head.append(link);
  return link;
}

describe("getSiteTheme", () => {
  beforeEach(() => {
    setDocumentCookie("");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns light when theme cookie is missing", () => {
    setDocumentCookie(OTHER_COOKIE);
    expect(getSiteTheme()).toBe("light");
  });

  it("returns dark when theme cookie is exactly dark", () => {
    setDocumentCookie(
      `${OTHER_COOKIE}; ${SITE_THEME_COOKIE_NAME}=${SITE_THEME_COOKIE_VALUE_DARK}`,
    );
    expect(getSiteTheme()).toBe("dark");
  });

  it("returns light for any other theme cookie value", () => {
    setDocumentCookie(`${SITE_THEME_COOKIE_NAME}=light`);
    expect(getSiteTheme()).toBe("light");
    setDocumentCookie(`${SITE_THEME_COOKIE_NAME}=Dark`);
    expect(getSiteTheme()).toBe("light");
    setDocumentCookie(`${SITE_THEME_COOKIE_NAME}=1`);
    expect(getSiteTheme()).toBe("light");
  });
});

describe("setSiteTheme", () => {
  beforeEach(() => {
    document.head.replaceChildren();
    document.body.replaceChildren();
    setDocumentCookie(OTHER_COOKIE);
    vi.stubGlobal("GM_getValue", () => undefined);
    vi.stubGlobal("GM_setValue", () => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("writes dark theme cookie without touching other cookies", () => {
    setSiteTheme("dark");
    expect(document.cookie).toContain(
      `${SITE_THEME_COOKIE_NAME}=${SITE_THEME_COOKIE_VALUE_DARK}`,
    );
    expect(document.cookie).toContain(OTHER_COOKIE);
    expect(getSiteTheme()).toBe("dark");
  });

  it("deletes theme cookie for light instead of writing a light value", () => {
    setDocumentCookie(
      `${OTHER_COOKIE}; ${SITE_THEME_COOKIE_NAME}=${SITE_THEME_COOKIE_VALUE_DARK}`,
    );
    setSiteTheme("light");
    expect(document.cookie).toContain(OTHER_COOKIE);
    expect(document.cookie).not.toContain(`${SITE_THEME_COOKIE_NAME}=`);
    expect(document.cookie).not.toContain(
      `${SITE_THEME_COOKIE_NAME}=${SITE_THEME_COOKIE_VALUE_DARK}`,
    );
    expect(document.cookie).not.toContain(`${SITE_THEME_COOKIE_NAME}=light`);
    expect(getSiteTheme()).toBe("light");
  });

  it("finds absolute /css/desktop.css and preserves query when swapping", () => {
    const siteLink = appendStylesheet(LIGHT_HREF_ABSOLUTE);
    const otherLink = appendStylesheet(OTHER_STYLESHEET_HREF);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    setSiteTheme("dark");
    expect(siteLink.getAttribute("href")).toBe(DARK_HREF_ABSOLUTE);
    expect(otherLink.getAttribute("href")).toBe(OTHER_STYLESHEET_HREF);
    expect(warnSpy).not.toHaveBeenCalled();

    setSiteTheme("light");
    expect(siteLink.getAttribute("href")).toBe(LIGHT_HREF_ABSOLUTE);
    expect(otherLink.getAttribute("href")).toBe(OTHER_STYLESHEET_HREF);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("finds and swaps root-relative /css/desktop.css?46 without warning", () => {
    const siteLink = appendStylesheet(LIGHT_HREF_ROOT_RELATIVE);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    setSiteTheme("dark");
    expect(siteLink.getAttribute("href")).toBe(DARK_HREF_ROOT_RELATIVE);
    expect(warnSpy).not.toHaveBeenCalled();

    setSiteTheme("light");
    expect(siteLink.getAttribute("href")).toBe(LIGHT_HREF_ROOT_RELATIVE);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("finds absolute double-slash …xxx//css/desktop.css?46 without warning", () => {
    const siteLink = appendStylesheet(LIGHT_HREF_DOUBLE_SLASH);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    setSiteTheme("dark");
    expect(siteLink.getAttribute("href")).toBe(DARK_HREF_DOUBLE_SLASH);
    expect(warnSpy).not.toHaveBeenCalled();

    setSiteTheme("light");
    expect(siteLink.getAttribute("href")).toBe(LIGHT_HREF_DOUBLE_SLASH);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not throw when the site stylesheet link is missing", () => {
    appendStylesheet(OTHER_STYLESHEET_HREF);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => setSiteTheme("dark")).not.toThrow();
    expect(document.cookie).toContain(
      `${SITE_THEME_COOKIE_NAME}=${SITE_THEME_COOKIE_VALUE_DARK}`,
    );
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("scheduleSiteDesktopStylesheet before the link exists", () => {
  function setReadyState(value: DocumentReadyState): void {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get: () => value,
    });
  }

  function restoreReadyState(): void {
    Reflect.deleteProperty(document, "readyState");
  }

  beforeEach(() => {
    document.head.replaceChildren();
    document.body.replaceChildren();
    resetSiteDesktopStylesheetWatch();
    setReadyState("loading");
  });

  afterEach(() => {
    resetSiteDesktopStylesheetWatch();
    restoreReadyState();
    vi.restoreAllMocks();
  });

  it("does not warn before the link exists and swaps when the link is inserted", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    scheduleSiteDesktopStylesheet("dark");
    expect(warnSpy).not.toHaveBeenCalled();

    const siteLink = appendStylesheet(LIGHT_HREF_DOUBLE_SLASH);
    await vi.waitFor(() => {
      expect(siteLink.getAttribute("href")).toBe(DARK_HREF_DOUBLE_SLASH);
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns only after DOMContentLoaded when the link never appears", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    scheduleSiteDesktopStylesheet("dark");
    expect(warnSpy).not.toHaveBeenCalled();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(warnSpy).toHaveBeenCalled();
  });
});
