import {
  SITE_BLACKLIST_COOKIE_MAX_AGE_YEARS,
  SITE_BLACKLIST_COOKIE_NAME,
  SITE_BLACKLIST_COOKIE_PATH,
} from "../config/constants";

const COOKIE_PAIR_SEPARATOR = ";";
const COOKIE_NAME_VALUE_SEPARATOR = "=";
const BLACKLIST_SPLIT_PATTERN = /[, ]|%20+/g;
const USER_ENTRY_PREFIX = "user:";
const RATING_ENTRY_PREFIX = "rating:";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365;
const BLACKLIST_TAG_SEPARATOR = " ";

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

function normalizeBlacklistTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const normalized = raw.trim().toLowerCase().replaceAll(" ", "_");
    if (normalized.length === 0 || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function encodeBlacklistCookieValue(tags: readonly string[]): string {
  if (tags.length === 0) {
    return "";
  }
  return encodeURIComponent(
    encodeURIComponent(tags.join(BLACKLIST_TAG_SEPARATOR)),
  );
}

function writeBlacklistCookie(value: string, expires: Date): void {
  document.cookie = [
    `${SITE_BLACKLIST_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR}${value}`,
    `expires=${expires.toUTCString()}`,
    `path=${SITE_BLACKLIST_COOKIE_PATH}`,
  ].join("; ");
}

/**
 * Reads the site `tag_blacklist` cookie using the site's decode + split rule.
 * Empty tokens are dropped; entries are lowercased.
 */
export function readSiteBlacklist(): string[] {
  const raw = readCookieValue(SITE_BLACKLIST_COOKIE_NAME);
  if (raw === null || raw.length === 0) {
    return [];
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(decodeURI(raw));
  } catch {
    return [];
  }
  const result: string[] = [];
  for (const part of decoded.split(BLACKLIST_SPLIT_PATTERN)) {
    const trimmed = part.trim().toLowerCase();
    if (trimmed.length === 0) {
      continue;
    }
    result.push(trimmed);
  }
  return result;
}

/**
 * Writes the site `tag_blacklist` cookie (browser cookie only; account list untouched).
 * Value encoding matches the live site: encodeURIComponent twice over space-joined tags.
 */
export function writeSiteBlacklist(tags: string[]): void {
  const normalized = normalizeBlacklistTags(tags);
  const expires = new Date(
    Date.now() +
      SITE_BLACKLIST_COOKIE_MAX_AGE_YEARS * DAYS_PER_YEAR * MS_PER_DAY,
  );
  writeBlacklistCookie(encodeBlacklistCookieValue(normalized), expires);
}

/**
 * True when any blacklist entry matches a post tag or `rating:x`.
 * Entries starting with `user:` are ignored. `score` is reserved for callers.
 */
export function isBlacklisted(
  tags: readonly string[],
  score: number,
  rating: string,
  list: readonly string[],
): boolean {
  void score;
  if (list.length === 0) {
    return false;
  }
  const tagSet = new Set<string>();
  for (const tag of tags) {
    const normalized = tag.trim().toLowerCase();
    if (normalized.length > 0) {
      tagSet.add(normalized);
    }
  }
  const ratingNorm = rating.trim().toLowerCase();

  for (const entry of list) {
    if (entry.startsWith(USER_ENTRY_PREFIX)) {
      continue;
    }
    if (entry.startsWith(RATING_ENTRY_PREFIX)) {
      const value = entry.slice(RATING_ENTRY_PREFIX.length);
      if (value.length > 0 && value === ratingNorm) {
        return true;
      }
      continue;
    }
    if (tagSet.has(entry)) {
      return true;
    }
  }
  return false;
}
