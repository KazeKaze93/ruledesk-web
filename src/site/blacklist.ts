import { SITE_BLACKLIST_COOKIE_NAME } from "../config/constants";

const COOKIE_PAIR_SEPARATOR = ";";
const COOKIE_NAME_VALUE_SEPARATOR = "=";
const BLACKLIST_SPLIT_PATTERN = /[, ]|%20+/g;
const USER_ENTRY_PREFIX = "user:";
const RATING_ENTRY_PREFIX = "rating:";

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
