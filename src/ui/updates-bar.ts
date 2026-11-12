import {
  CSS_CLASS,
  SEARCH_PARAM_PID,
  SEARCH_PARAM_TAGS,
  UI_TEXT,
  UPDATES_BAR_ID,
} from "../config/constants";
import { log } from "../log";
import {
  buildUpdatesQueries,
  buildUpdatesSearchUrl,
  isFullUpdatesQuery,
  isPartialUpdatesQuery,
} from "../search/query";
import { detectPageKind } from "../site/pages";
import {
  SITE_SELECTORS,
  extractPostIdFromThumb,
} from "../site/selectors";
import {
  getSeenPostId,
  getUpdatesGroupSize,
  listArtistTags,
  setSeenPostId,
} from "../storage/store";
import { ensureDocumentStyles } from "./cards";

function readPid(search: string): number {
  const params = new URLSearchParams(search);
  const raw = params.get(SEARCH_PARAM_PID);
  if (raw === null || raw.trim().length === 0) {
    return 0;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

function maxThumbPostId(root: ParentNode): number {
  let maxId = 0;
  const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
  for (const thumb of thumbs) {
    const postId = extractPostIdFromThumb(thumb);
    if (postId === null) {
      continue;
    }
    const numeric = Number(postId);
    if (Number.isFinite(numeric) && numeric > maxId) {
      maxId = numeric;
    }
  }
  return maxId;
}

function buildReloadHref(artistTags: string[], seenPostId: number): string {
  const groupSize = getUpdatesGroupSize();
  const queries = buildUpdatesQueries(artistTags, seenPostId, groupSize);
  const first = queries[0];
  if (first === undefined) {
    return window.location.href;
  }
  return buildUpdatesSearchUrl(first);
}

function insertBar(imageList: Element, bar: HTMLElement): void {
  imageList.parentElement?.insertBefore(bar, imageList);
}

function createBarShell(): HTMLDivElement {
  const bar = document.createElement("div");
  bar.id = UPDATES_BAR_ID;
  bar.className = CSS_CLASS.updatesBar;
  return bar;
}

function mountPartialBar(imageList: Element): void {
  const bar = createBarShell();
  const hint = document.createElement("p");
  hint.className = CSS_CLASS.hint;
  hint.textContent = UI_TEXT.updatesPartialHint;
  bar.append(hint);
  insertBar(imageList, bar);
}

function mountFullBar(imageList: Element, search: string, artistTags: string[]): void {
  const bar = createBarShell();
  const thumbCount = imageList.querySelectorAll(SITE_SELECTORS.thumb).length;
  if (thumbCount === 0) {
    const empty = document.createElement("p");
    empty.className = CSS_CLASS.hint;
    empty.textContent = UI_TEXT.noNewPosts;
    bar.append(empty);
    insertBar(imageList, bar);
    return;
  }

  const pid = readPid(search);
  if (pid > 0) {
    const hint = document.createElement("p");
    hint.className = CSS_CLASS.hint;
    hint.textContent = UI_TEXT.goToPageOneToMark;
    bar.append(hint);
    insertBar(imageList, bar);
    return;
  }

  const actions = document.createElement("div");
  actions.className = CSS_CLASS.updatesBarActions;

  const markButton = document.createElement("button");
  markButton.type = "button";
  markButton.className = CSS_CLASS.primaryButton;
  markButton.textContent = UI_TEXT.markAllSeen;
  markButton.addEventListener("click", () => {
    const pageMax = maxThumbPostId(imageList);
    const nextSeen = Math.max(getSeenPostId(), pageMax);
    setSeenPostId(nextSeen);

    bar.replaceChildren();
    const confirm = document.createElement("p");
    confirm.className = CSS_CLASS.hint;
    confirm.textContent = `${UI_TEXT.markedSeenConfirm}${String(nextSeen)}`;

    const reload = document.createElement("a");
    reload.className = CSS_CLASS.itemName;
    reload.href = buildReloadHref(artistTags, nextSeen);
    reload.textContent = UI_TEXT.reloadUpdates;

    const wrap = document.createElement("div");
    wrap.className = CSS_CLASS.updatesBarActions;
    wrap.append(confirm, reload);
    bar.append(wrap);
  });

  actions.append(markButton);
  bar.append(actions);
  insertBar(imageList, bar);
}

export function mountUpdatesBar(
  root: ParentNode = document,
  search: string = window.location.search,
): void {
  if (detectPageKind(search) !== "list") {
    return;
  }

  const params = new URLSearchParams(search);
  const tagsParam = params.get(SEARCH_PARAM_TAGS);
  if (tagsParam === null || tagsParam.trim().length === 0) {
    return;
  }

  const artistTags = listArtistTags();
  const isFull = isFullUpdatesQuery(tagsParam, artistTags);
  const isPartial = isPartialUpdatesQuery(tagsParam, artistTags);
  if (!isFull && !isPartial) {
    return;
  }

  const imageList = root.querySelector(SITE_SELECTORS.imageList);
  if (imageList === null) {
    log.warn(UI_TEXT.updatesBarMissingList);
    return;
  }

  const existing = root instanceof Document
    ? root.getElementById(UPDATES_BAR_ID)
    : root.querySelector(`#${UPDATES_BAR_ID}`);
  if (existing !== null) {
    existing.remove();
  }

  ensureDocumentStyles();

  if (isPartial) {
    mountPartialBar(imageList);
    return;
  }

  mountFullBar(imageList, search, artistTags);
}
