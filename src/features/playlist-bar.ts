import { SEARCH_PARAM_TAGS } from "../config/constants";
import { log } from "../log";
import {
  buildPlaylistQueries,
  buildSearchUrl,
  parsePlaylistQuery,
  parseTags,
} from "../search/query";
import { SITE_SELECTORS } from "../site/selectors";
import type { Collection } from "../storage/schema";
import {
  getPlaylistChunkSize,
  listPlaylists,
} from "../storage/store";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

const FEATURE_ID = "playlist-bar";
const FEATURE_LABEL = "Playlist header";
const FEATURE_PAGES = ["list"] as const;

const ROOT_ID = "rdw-playlist-bar";
const ROOT_CLASS = "rdw-playlist-bar";
const TITLE_CLASS = "rdw-playlist-bar-title";
const NAME_CLASS = "rdw-playlist-bar-name";
const COUNT_CLASS = "rdw-playlist-bar-count";
const PARTS_CLASS = "rdw-playlist-bar-parts";
const PART_LABEL_CLASS = "rdw-playlist-bar-part-label";
const PART_LINK_CLASS = "rdw-playlist-bar-part-link";
const CAPTION_CLASS = "rdw-playlist-bar-caption";

const TEXT_POSTS_SUFFIX = " posts";
const TEXT_PART_PREFIX = "Part ";
const TEXT_PART_OF = " of ";
const TEXT_CAPTION = "Posts are ordered by the site (newest first).";
const TEXT_PREV = "Previous";
const TEXT_NEXT = "Next";

const WARN_MISSING_HOST =
  "playlist-bar: image-list not found; playlist bar not mounted";

const BODY_CLASS = featureBodyClass(FEATURE_ID);

const FEATURE_CSS = `
body.${BODY_CLASS} .${ROOT_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 100%;
  margin: 0.5rem 0;
  padding: 0.5rem 0.65rem;
  border: 1px solid #666;
  border-radius: 2px;
  background: #f7f7f7;
  box-sizing: border-box;
}
body.${BODY_CLASS} .${TITLE_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.75rem;
  max-width: 100%;
  font: inherit;
  line-height: 1.3;
}
body.${BODY_CLASS} .${NAME_CLASS} {
  font-weight: 600;
}
body.${BODY_CLASS} .${COUNT_CLASS} {
  opacity: 0.85;
}
body.${BODY_CLASS} .${PARTS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  max-width: 100%;
  font: inherit;
  line-height: 1.3;
}
body.${BODY_CLASS} .${PART_LABEL_CLASS} {
  flex: 0 0 auto;
}
body.${BODY_CLASS} a.${PART_LINK_CLASS} {
  color: inherit;
  text-decoration: underline;
}
body.${BODY_CLASS} a.${PART_LINK_CLASS}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}
body.${BODY_CLASS} .${CAPTION_CLASS} {
  margin: 0;
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.35;
  opacity: 0.8;
}
`.trim();

function readTagsParam(search: string): string {
  return new URLSearchParams(search).get(SEARCH_PARAM_TAGS) ?? "";
}

function idsEqualAsSet(left: readonly number[], right: readonly number[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const set = new Set(left);
  if (set.size !== left.length) {
    return false;
  }
  for (const id of right) {
    if (!set.has(id)) {
      return false;
    }
  }
  return true;
}

function containsAllIds(
  postIds: readonly number[],
  queryIds: readonly number[],
): boolean {
  const set = new Set(postIds);
  for (const id of queryIds) {
    if (!set.has(id)) {
      return false;
    }
  }
  return true;
}

type PlaylistMatch = {
  playlist: Collection;
  partIndex: number;
  partQueries: string[];
};

function findPlaylistMatch(queryIds: number[]): PlaylistMatch | null {
  const chunkSize = getPlaylistChunkSize();
  const candidates: PlaylistMatch[] = [];

  for (const playlist of listPlaylists()) {
    const postIds = playlist.postIds ?? [];
    if (!containsAllIds(postIds, queryIds)) {
      continue;
    }
    const partQueries = buildPlaylistQueries(postIds, chunkSize);
    let partIndex = -1;
    for (let index = 0; index < partQueries.length; index += 1) {
      const chunkQuery = partQueries[index];
      if (chunkQuery === undefined) {
        continue;
      }
      const chunkIds = parsePlaylistQuery(chunkQuery);
      if (chunkIds !== null && idsEqualAsSet(queryIds, chunkIds)) {
        partIndex = index;
        break;
      }
    }
    candidates.push({ playlist, partIndex, partQueries });
  }

  if (candidates.length === 0) {
    return null;
  }

  const exact = candidates.find((entry) => entry.partIndex >= 0);
  return exact ?? candidates[0] ?? null;
}

function buildPlaylistSearchUrl(query: string): string {
  return buildSearchUrl(parseTags(query));
}

function removeExistingBar(root: ParentNode): void {
  const existing =
    root instanceof Document
      ? root.getElementById(ROOT_ID)
      : root.querySelector(`#${ROOT_ID}`);
  if (existing !== null) {
    existing.remove();
  }
}

function findImageList(root: ParentNode): Element | null {
  return root.querySelector(SITE_SELECTORS.imageList);
}

function findFallbackHost(root: ParentNode): Element | null {
  return (
    root.querySelector(SITE_SELECTORS.postListContent) ??
    root.querySelector(SITE_SELECTORS.contentRoot)
  );
}

function insertBar(host: Element, bar: HTMLElement, before: Element | null): void {
  if (before !== null && before.parentElement === host) {
    host.insertBefore(bar, before);
    return;
  }
  if (before !== null) {
    before.parentElement?.insertBefore(bar, before);
    return;
  }
  host.insertBefore(bar, host.firstChild);
}

function formatPostCount(count: number): string {
  return `${String(count)}${TEXT_POSTS_SUFFIX}`;
}

function formatPartLabel(partIndex: number, total: number): string {
  return `${TEXT_PART_PREFIX}${String(partIndex + 1)}${TEXT_PART_OF}${String(total)}`;
}

function appendNeighborLink(
  parent: Element,
  label: string,
  query: string | undefined,
): void {
  if (query === undefined) {
    return;
  }
  const link = document.createElement("a");
  link.className = PART_LINK_CLASS;
  link.href = buildPlaylistSearchUrl(query);
  link.textContent = label;
  parent.append(link);
}

function buildPartsRow(match: PlaylistMatch): HTMLDivElement | null {
  const { partIndex, partQueries } = match;
  if (partQueries.length === 0 || partIndex < 0) {
    return null;
  }

  const row = document.createElement("div");
  row.className = PARTS_CLASS;

  const label = document.createElement("span");
  label.className = PART_LABEL_CLASS;
  label.textContent = formatPartLabel(partIndex, partQueries.length);
  row.append(label);

  if (partQueries.length > 1) {
    appendNeighborLink(row, TEXT_PREV, partQueries[partIndex - 1]);
    appendNeighborLink(row, TEXT_NEXT, partQueries[partIndex + 1]);
  }

  return row;
}

function createBar(match: PlaylistMatch): HTMLDivElement {
  const bar = document.createElement("div");
  bar.id = ROOT_ID;
  bar.className = ROOT_CLASS;

  const title = document.createElement("div");
  title.className = TITLE_CLASS;

  const name = document.createElement("span");
  name.className = NAME_CLASS;
  name.textContent = match.playlist.name;

  const count = document.createElement("span");
  count.className = COUNT_CLASS;
  count.textContent = formatPostCount(match.playlist.postIds?.length ?? 0);

  title.append(name, count);
  bar.append(title);

  const parts = buildPartsRow(match);
  if (parts !== null) {
    bar.append(parts);
  }

  const caption = document.createElement("p");
  caption.className = CAPTION_CLASS;
  caption.textContent = TEXT_CAPTION;
  bar.append(caption);

  return bar;
}

function mountPlaylistBar(ctx: FeatureContext): void {
  removeExistingBar(document);

  const tagsParam = readTagsParam(ctx.search);
  const queryIds = parsePlaylistQuery(tagsParam);
  if (queryIds === null) {
    return;
  }

  const match = findPlaylistMatch(queryIds);
  if (match === null) {
    return;
  }

  const imageList = findImageList(document);
  const bar = createBar(match);

  if (imageList !== null) {
    const host = imageList.parentElement;
    if (host === null) {
      log.warn(WARN_MISSING_HOST);
      return;
    }
    insertBar(host, bar, imageList);
    return;
  }

  const fallback = findFallbackHost(document);
  if (fallback === null) {
    log.warn(WARN_MISSING_HOST);
    return;
  }
  log.warn(WARN_MISSING_HOST);
  insertBar(fallback, bar, null);
}

export const playlistBarFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountPlaylistBar,
};
