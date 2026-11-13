import {
  SITE_THEME_COOKIE_MAX_AGE_DAYS,
  SITE_THEME_COOKIE_NAME,
  SITE_THEME_COOKIE_PATH,
  SITE_THEME_COOKIE_VALUE_DARK,
  SITE_THEME_STYLESHEET_DARK,
  SITE_THEME_STYLESHEET_DIR,
  SITE_THEME_STYLESHEET_LIGHT,
} from "../config/constants";
import { log } from "../log";

export type SiteTheme = "dark" | "light";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const COOKIE_PAIR_SEPARATOR = ";";
const COOKIE_NAME_VALUE_SEPARATOR = "=";
const STYLESHEET_REL = "stylesheet";
const LIGHT_STYLESHEET_PATH = `${SITE_THEME_STYLESHEET_DIR}${SITE_THEME_STYLESHEET_LIGHT}`;
const DARK_STYLESHEET_PATH = `${SITE_THEME_STYLESHEET_DIR}${SITE_THEME_STYLESHEET_DARK}`;

function readCookieValue(name: string): string | null {
  const pairs = document.cookie.split(COOKIE_PAIR_SEPARATOR);
  const prefix = `${name}${COOKIE_NAME_VALUE_SEPARATOR}`;
  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed.startsWith(prefix)) {
      continue;
    }
    return trimmed.slice(prefix.length);
  }
  return null;
}

function writeThemeCookie(value: string, expires: Date): void {
  document.cookie = [
    `${SITE_THEME_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR}${value}`,
    `expires=${expires.toUTCString()}`,
    `path=${SITE_THEME_COOKIE_PATH}`,
  ].join("; ");
}

/** Deletes the site `theme` cookie (light / default). */
export function clearSiteThemeCookie(): void {
  document.cookie = [
    `${SITE_THEME_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR}`,
    `expires=${new Date(0).toUTCString()}`,
    `path=${SITE_THEME_COOKIE_PATH}`,
  ].join("; ");
}

/** Collapse `//` (and longer) runs in a pathname so `/css/...` comparisons work. */
const REPEATED_PATH_SLASHES = /\/{2,}/g;

function collapsePathSlashes(pathname: string): string {
  return pathname.replace(REPEATED_PATH_SLASHES, "/");
}

/**
 * Match site desktop CSS hrefs via URL pathname (query ignored).
 * Production uses absolute hrefs with a doubled slash (`…xxx//css/desktop.css?46`);
 * collapsing repeated path slashes makes that equal `/css/desktop.css`.
 */
function isSiteDesktopStylesheetHref(href: string): boolean {
  try {
    const url = new URL(href, location.href);
    const path = collapsePathSlashes(url.pathname);
    return path === LIGHT_STYLESHEET_PATH || path === DARK_STYLESHEET_PATH;
  } catch {
    return false;
  }
}

function stylesheetFilenameForTheme(theme: SiteTheme): string {
  return theme === "dark"
    ? SITE_THEME_STYLESHEET_DARK
    : SITE_THEME_STYLESHEET_LIGHT;
}

/** Swap filename in the raw href so `//css/` and `/css/` forms stay intact. */
function replaceStylesheetFilename(href: string, filename: string): string {
  if (href.includes(SITE_THEME_STYLESHEET_DARK)) {
    return href.replace(SITE_THEME_STYLESHEET_DARK, filename);
  }
  if (href.includes(SITE_THEME_STYLESHEET_LIGHT)) {
    return href.replace(SITE_THEME_STYLESHEET_LIGHT, filename);
  }
  return href;
}

function findSiteDesktopStylesheetLink(): HTMLLinkElement | null {
  const links = document.querySelectorAll<HTMLLinkElement>(
    `link[rel="${STYLESHEET_REL}"]`,
  );
  for (const link of links) {
    const href = link.getAttribute("href");
    if (href === null || href.length === 0) {
      continue;
    }
    if (isSiteDesktopStylesheetHref(href)) {
      return link;
    }
  }
  return null;
}

const WARN_STYLESHEET_MISSING =
  "Site desktop stylesheet link not found; theme cookie updated only";
const READY_STATE_LOADING = "loading";
const EVENT_DOM_CONTENT_LOADED = "DOMContentLoaded";
const STYLESHEET_OBSERVER_OPTIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
};

let pendingStylesheetTheme: SiteTheme | null = null;
let stylesheetObserver: MutationObserver | null = null;
let domContentLoadedBound = false;

function swapStylesheetLink(link: HTMLLinkElement, theme: SiteTheme): boolean {
  const href = link.getAttribute("href");
  if (href === null || href.length === 0) {
    return false;
  }
  link.setAttribute(
    "href",
    replaceStylesheetFilename(href, stylesheetFilenameForTheme(theme)),
  );
  return true;
}

function disconnectStylesheetWatch(): void {
  if (stylesheetObserver !== null) {
    stylesheetObserver.disconnect();
    stylesheetObserver = null;
  }
  if (domContentLoadedBound) {
    document.removeEventListener(EVENT_DOM_CONTENT_LOADED, onStylesheetDomReady);
    domContentLoadedBound = false;
  }
}

function tryApplyPendingStylesheet(): boolean {
  if (pendingStylesheetTheme === null) {
    return false;
  }
  const link = findSiteDesktopStylesheetLink();
  if (link === null) {
    return false;
  }
  if (!swapStylesheetLink(link, pendingStylesheetTheme)) {
    return false;
  }
  pendingStylesheetTheme = null;
  disconnectStylesheetWatch();
  return true;
}

function onStylesheetDomReady(): void {
  domContentLoadedBound = false;
  if (tryApplyPendingStylesheet()) {
    return;
  }
  if (pendingStylesheetTheme !== null) {
    log.warn(WARN_STYLESHEET_MISSING);
    pendingStylesheetTheme = null;
    disconnectStylesheetWatch();
  }
}

function warnStylesheetMissing(): void {
  log.warn(WARN_STYLESHEET_MISSING);
  pendingStylesheetTheme = null;
  disconnectStylesheetWatch();
}

/**
 * Swap desktop.css ↔ desktop-dark.css once the link exists.
 * At document-start the link is not parsed yet: watch documentElement and
 * fall back to DOMContentLoaded. Warn only if it is still missing after that.
 */
export function scheduleSiteDesktopStylesheet(theme: SiteTheme): void {
  const link = findSiteDesktopStylesheetLink();
  if (link !== null && swapStylesheetLink(link, theme)) {
    pendingStylesheetTheme = null;
    disconnectStylesheetWatch();
    return;
  }
  pendingStylesheetTheme = theme;
  if (document.readyState !== READY_STATE_LOADING) {
    warnStylesheetMissing();
    return;
  }
  const root = document.documentElement;
  if (stylesheetObserver === null && root !== null) {
    stylesheetObserver = new MutationObserver(() => {
      tryApplyPendingStylesheet();
    });
    stylesheetObserver.observe(root, STYLESHEET_OBSERVER_OPTIONS);
  }
  if (!domContentLoadedBound) {
    document.addEventListener(EVENT_DOM_CONTENT_LOADED, onStylesheetDomReady);
    domContentLoadedBound = true;
  }
}

/** Drops a document-start stylesheet watch (tests). */
export function resetSiteDesktopStylesheetWatch(): void {
  pendingStylesheetTheme = null;
  disconnectStylesheetWatch();
}

/** Cookie only. Stylesheet swap is {@link scheduleSiteDesktopStylesheet}. */
export function writeSiteThemeCookie(theme: SiteTheme): void {
  if (theme === "dark") {
    const expires = new Date(
      Date.now() + SITE_THEME_COOKIE_MAX_AGE_DAYS * MS_PER_DAY,
    );
    writeThemeCookie(SITE_THEME_COOKIE_VALUE_DARK, expires);
    return;
  }
  clearSiteThemeCookie();
}

/**
 * RuleDesk skin modes need a predictable site base: no theme cookie + light CSS.
 * Does not touch html.rdw-skin (that is owned by src/skin/theme.ts).
 */
export function forceLightSiteBase(): void {
  writeSiteThemeCookie("light");
  scheduleSiteDesktopStylesheet("light");
}

export function getSiteTheme(): SiteTheme {
  const value = readCookieValue(SITE_THEME_COOKIE_NAME);
  if (value === SITE_THEME_COOKIE_VALUE_DARK) {
    return "dark";
  }
  return "light";
}

export function setSiteTheme(theme: SiteTheme): void {
  writeSiteThemeCookie(theme);
  scheduleSiteDesktopStylesheet(theme);
}
