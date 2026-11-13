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

function isSiteDesktopStylesheetPath(pathname: string): boolean {
  return (
    pathname.endsWith(LIGHT_STYLESHEET_PATH) ||
    pathname.endsWith(DARK_STYLESHEET_PATH)
  );
}

function stylesheetFilenameForTheme(theme: SiteTheme): string {
  return theme === "dark"
    ? SITE_THEME_STYLESHEET_DARK
    : SITE_THEME_STYLESHEET_LIGHT;
}

function replaceStylesheetFilename(href: string, filename: string): string {
  const url = new URL(href, window.location.href);
  const segments = url.pathname.split("/");
  segments[segments.length - 1] = filename;
  url.pathname = segments.join("/");
  return url.href;
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
    let pathname: string;
    try {
      pathname = new URL(href, window.location.href).pathname;
    } catch {
      continue;
    }
    if (isSiteDesktopStylesheetPath(pathname)) {
      return link;
    }
  }
  return null;
}

/**
 * Swap the site desktop stylesheet link (desktop.css ↔ desktop-dark.css).
 * Preserves query string. No-op (warn) if the link is missing.
 */
export function applySiteDesktopStylesheet(theme: SiteTheme): void {
  const link = findSiteDesktopStylesheetLink();
  if (link === null) {
    log.warn("Site desktop stylesheet link not found; theme cookie updated only");
    return;
  }
  const href = link.getAttribute("href");
  if (href === null || href.length === 0) {
    log.warn("Site desktop stylesheet link not found; theme cookie updated only");
    return;
  }
  link.setAttribute(
    "href",
    replaceStylesheetFilename(href, stylesheetFilenameForTheme(theme)),
  );
}

/**
 * RuleDesk skin modes need a predictable site base: no theme cookie + light CSS.
 * Does not touch html.rdw-skin (that is owned by src/skin/theme.ts).
 */
export function forceLightSiteBase(): void {
  clearSiteThemeCookie();
  applySiteDesktopStylesheet("light");
}

export function getSiteTheme(): SiteTheme {
  const value = readCookieValue(SITE_THEME_COOKIE_NAME);
  if (value === SITE_THEME_COOKIE_VALUE_DARK) {
    return "dark";
  }
  return "light";
}

export function setSiteTheme(theme: SiteTheme): void {
  if (theme === "dark") {
    const expires = new Date(
      Date.now() + SITE_THEME_COOKIE_MAX_AGE_DAYS * MS_PER_DAY,
    );
    writeThemeCookie(SITE_THEME_COOKIE_VALUE_DARK, expires);
  } else {
    clearSiteThemeCookie();
  }
  applySiteDesktopStylesheet(theme);
}
