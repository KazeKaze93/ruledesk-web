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
  UPDATES_ID_PREFIX,
  UPDATES_OR_CLOSE,
  UPDATES_OR_JOIN,
  UPDATES_OR_OPEN,
  URL_TAG_SEPARATOR,
} from "../config/constants";
import type { TagEntry } from "../storage/schema";

const UPDATES_ID_TOKEN_PATTERN = /^id:>(\d+)$/;

export function normalizeArtistTag(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) {
    return null;
  }
  const withUnderscores = trimmed.replaceAll(" ", "_");
  if (/\s/.test(withUnderscores)) {
    return null;
  }
  if (
    withUnderscores === UPDATES_OR_OPEN ||
    withUnderscores === UPDATES_OR_CLOSE ||
    withUnderscores === UPDATES_OR_JOIN
  ) {
    return null;
  }
  if (withUnderscores.startsWith(EXCLUDE_PREFIX)) {
    return null;
  }
  if (withUnderscores.length === 0) {
    return null;
  }
  return withUnderscores;
}

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

function encodeSearchToken(raw: string): string {
  // encodeURIComponent leaves () unescaped; rule34 encodes them as %28/%29.
  return encodeURIComponent(raw).replaceAll("(", "%28").replaceAll(")", "%29");
}

export function buildSearchUrl(tags: TagEntry[]): string {
  const encoded = tags
    .map((entry) => {
      const raw =
        entry.type === TAG_TYPE_EXCLUDE
          ? `${EXCLUDE_PREFIX}${entry.tag}`
          : entry.tag;
      return encodeSearchToken(raw);
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

function formatGroupQuery(tags: string[]): string {
  if (tags.length === 1) {
    const only = tags[0];
    return only === undefined ? "" : only;
  }
  return `${UPDATES_OR_OPEN} ${tags.join(` ${UPDATES_OR_JOIN} `)} ${UPDATES_OR_CLOSE}`;
}

export function buildUpdatesQueries(
  artistTags: string[],
  seenPostId: number,
  groupSize: number,
): string[] {
  const normalized: string[] = [];
  for (const raw of artistTags) {
    const tag = normalizeArtistTag(raw);
    if (tag !== null) {
      normalized.push(tag);
    }
  }
  if (normalized.length === 0) {
    return [];
  }

  const groups: string[][] = [];
  if (groupSize <= 0) {
    groups.push(normalized);
  } else {
    for (let index = 0; index < normalized.length; index += groupSize) {
      groups.push(normalized.slice(index, index + groupSize));
    }
  }

  return groups.map((group) => {
    const base = formatGroupQuery(group);
    if (seenPostId > 0) {
      return `${base} ${UPDATES_ID_PREFIX}${String(seenPostId)}`;
    }
    return base;
  });
}

export function buildUpdatesSearchUrl(query: string): string {
  return buildSearchUrl(parseTags(query));
}

export function isUpdatesQuery(
  tagsParam: string,
  artistTags: string[],
): boolean {
  const tracked = new Set<string>();
  for (const raw of artistTags) {
    const tag = normalizeArtistTag(raw);
    if (tag !== null) {
      tracked.add(tag);
    }
  }
  if (tracked.size === 0) {
    return false;
  }

  const tokens = tagsParam.trim().split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return false;
  }

  let body = tokens;
  const last = tokens[tokens.length - 1];
  if (last !== undefined && UPDATES_ID_TOKEN_PATTERN.test(last)) {
    body = tokens.slice(0, -1);
  }
  if (body.some((token) => UPDATES_ID_TOKEN_PATTERN.test(token))) {
    return false;
  }
  if (body.length === 0) {
    return false;
  }

  if (body.length === 1) {
    const only = body[0];
    if (only === undefined) {
      return false;
    }
    const tag = normalizeArtistTag(only);
    return tag !== null && tracked.has(tag);
  }

  const first = body[0];
  const lastBody = body[body.length - 1];
  if (first !== UPDATES_OR_OPEN || lastBody !== UPDATES_OR_CLOSE) {
    return false;
  }
  const inner = body.slice(1, -1);
  if (inner.length === 0 || inner.length % 2 === 0) {
    return false;
  }

  for (let index = 0; index < inner.length; index += 1) {
    const token = inner[index];
    if (token === undefined) {
      return false;
    }
    if (index % 2 === 1) {
      if (token !== UPDATES_OR_JOIN) {
        return false;
      }
      continue;
    }
    const tag = normalizeArtistTag(token);
    if (tag === null || !tracked.has(tag)) {
      return false;
    }
  }
  return true;
}
