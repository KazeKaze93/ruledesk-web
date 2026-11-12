import {
  EXCLUDE_PREFIX,
  SEARCH_PAGE,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PARAM_TAGS,
  SEARCH_PATH,
  SEARCH_SECTION,
  SITE_ORIGIN,
  TAG_SEPARATOR,
  TAG_TYPE_EXCLUDE,
  TAG_TYPE_INCLUDE,
  URL_TAG_SEPARATOR,
} from "../config/constants";
import type { TagEntry } from "../storage/schema";

export function parseTags(raw: string): TagEntry[] {
  const tokens = raw.trim().split(/\s+/).filter((token) => token.length > 0);
  return tokens.map((token) => {
    if (token.startsWith(EXCLUDE_PREFIX) && token.length > EXCLUDE_PREFIX.length) {
      return {
        tag: token.slice(EXCLUDE_PREFIX.length),
        type: TAG_TYPE_EXCLUDE,
      };
    }
    return {
      tag: token,
      type: TAG_TYPE_INCLUDE,
    };
  });
}

export function serialize(tags: TagEntry[]): string {
  return tags
    .map((entry) =>
      entry.type === TAG_TYPE_EXCLUDE
        ? `${EXCLUDE_PREFIX}${entry.tag}`
        : entry.tag,
    )
    .join(TAG_SEPARATOR);
}

export function buildSearchUrl(tags: TagEntry[]): string {
  const encoded = tags
    .map((entry) => {
      const raw =
        entry.type === TAG_TYPE_EXCLUDE
          ? `${EXCLUDE_PREFIX}${entry.tag}`
          : entry.tag;
      return encodeURIComponent(raw);
    })
    .join(URL_TAG_SEPARATOR);

  const params = new URLSearchParams();
  params.set(SEARCH_PARAM_PAGE, SEARCH_PAGE);
  params.set(SEARCH_PARAM_SECTION, SEARCH_SECTION);
  const query = params.toString();
  return `${SITE_ORIGIN}${SEARCH_PATH}?${query}&${SEARCH_PARAM_TAGS}=${encoded}`;
}

export function readTagsFromLocation(search: string): TagEntry[] | null {
  const params = new URLSearchParams(search);
  const page = params.get(SEARCH_PARAM_PAGE);
  const section = params.get(SEARCH_PARAM_SECTION);
  const tagsRaw = params.get(SEARCH_PARAM_TAGS);
  if (page !== SEARCH_PAGE || section !== SEARCH_SECTION) {
    return null;
  }
  if (tagsRaw === null || tagsRaw.trim().length === 0) {
    return null;
  }
  return parseTags(tagsRaw);
}
