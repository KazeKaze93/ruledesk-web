import {
  FAVORITES_PAGE,
  FAVORITES_SECTION_VIEW,
  FETCH_CREDENTIALS,
  FETCH_METHOD_GET,
  SEARCH_PARAM_ID,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_PID,
  SEARCH_PARAM_SECTION,
  SEARCH_PATH,
} from "../config/constants";
import { log } from "../log";
import {
  addFavs,
  getSyncState,
  loadFavSet,
  setSyncState,
} from "../storage/favs";
import type { FavsSyncState } from "../storage/schema";
import { extractPostIdFromFavoritesDeleteOnclick } from "./selectors";

/** Minimum pause between sequential favorites page fetches. */
export const FAVORITES_SYNC_PAGE_PAUSE_MS = 1500;

/** Favorites list pagination step (site serves 50 thumbs per page). */
export const FAVORITES_SYNC_PID_STEP = 50;

const MY_FAVORITES_LINK_SELECTOR =
  'li#my-favorites-container a[href*="page=favorites"]';
const THUMB_SELECTOR = "span.thumb";
const THUMB_POST_LINK_SELECTOR = 'span.thumb a[id^="p"]';
const PAGINATOR_SELECTOR = "#paginator";
const LASTPAGE_SELECTOR = 'a[name="lastpage"]';
const REMOVE_LINK_SELECTOR = "a[onclick]";
const POST_LINK_ID_PATTERN = /^p(\d+)$/;

const URL_PARSE_BASE = "https://rule34.xxx";

export const FAVORITES_SYNC_ERROR_NOT_LOGGED_IN =
  "not logged in or menu not found";
export const FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE = "unexpected page";

export type FavoritesSyncProgress = {
  page: number;
  pages: number;
  total: number;
};

export type FavoritesSyncResult =
  | { status: "completed"; total: number; pages: number }
  | { status: "aborted"; total: number; page: number; pages: number }
  | { status: "error"; message: string };

export type RunFavoritesSyncOptions = {
  onProgress: (progress: FavoritesSyncProgress) => void;
  signal: AbortSignal;
};

function createAbortResult(
  total: number,
  page: number,
  pages: number,
): FavoritesSyncResult {
  return { status: "aborted", total, page, pages };
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === "AbortError"
  ) || (
    error instanceof Error && error.name === "AbortError"
  );
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function parsePositiveInt(raw: string | null): number | null {
  if (raw === null) {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.trunc(value);
}

function parsePidFromHref(href: string): number | null {
  try {
    const url = new URL(href, URL_PARSE_BASE);
    return parsePositiveInt(url.searchParams.get(SEARCH_PARAM_PID));
  } catch {
    return null;
  }
}

export function extractUserIdFromDocument(root: ParentNode): number | null {
  const link = root.querySelector(MY_FAVORITES_LINK_SELECTOR);
  if (!(link instanceof HTMLAnchorElement)) {
    return null;
  }
  const href = link.getAttribute("href");
  if (href === null || href.length === 0) {
    return null;
  }
  try {
    const url = new URL(href, URL_PARSE_BASE);
    return parsePositiveInt(url.searchParams.get(SEARCH_PARAM_ID));
  } catch {
    return null;
  }
}

function buildFavoritesPageUrl(userId: number, pid: number): string {
  const params = new URLSearchParams();
  params.set(SEARCH_PARAM_PAGE, FAVORITES_PAGE);
  params.set(SEARCH_PARAM_SECTION, FAVORITES_SECTION_VIEW);
  params.set(SEARCH_PARAM_ID, String(userId));
  params.set(SEARCH_PARAM_PID, String(pid));
  return `${SEARCH_PATH}?${params.toString()}`;
}

function pageIndexFromPid(pid: number): number {
  return Math.floor(pid / FAVORITES_SYNC_PID_STEP) + 1;
}

function pagesFromLastPid(lastPid: number): number {
  return Math.floor(lastPid / FAVORITES_SYNC_PID_STEP) + 1;
}

function collectFavoriteIdsFromDocument(doc: Document): number[] {
  const ids = new Set<number>();

  const postLinks = doc.querySelectorAll(THUMB_POST_LINK_SELECTOR);
  for (const link of postLinks) {
    const match = POST_LINK_ID_PATTERN.exec(link.id);
    const raw = match?.[1];
    if (raw === undefined) {
      continue;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      ids.add(Math.trunc(parsed));
    }
  }

  const removeLinks = doc.querySelectorAll(REMOVE_LINK_SELECTOR);
  for (const link of removeLinks) {
    const onclick = link.getAttribute("onclick");
    if (onclick === null) {
      continue;
    }
    const postId = extractPostIdFromFavoritesDeleteOnclick(onclick);
    if (postId === null) {
      continue;
    }
    const parsed = Number(postId);
    if (Number.isFinite(parsed)) {
      ids.add(Math.trunc(parsed));
    }
  }

  return Array.from(ids);
}

function resolveLastPid(doc: Document, currentPid: number): number {
  const lastpage = doc.querySelector(LASTPAGE_SELECTOR);
  if (!(lastpage instanceof HTMLAnchorElement)) {
    return currentPid;
  }
  const fromHref = parsePidFromHref(lastpage.href);
  if (fromHref !== null) {
    return fromHref;
  }
  const fromAttr = parsePositiveInt(lastpage.getAttribute(SEARCH_PARAM_PID));
  if (fromAttr !== null) {
    return fromAttr;
  }
  return currentPid;
}

function isUnexpectedFavoritesPage(
  doc: Document,
  pid: number,
  lastPid: number,
  cardCount: number,
): boolean {
  if (cardCount === 0 && pid <= lastPid) {
    return true;
  }
  if (
    pid === 0 &&
    cardCount === 0 &&
    doc.querySelector(PAGINATOR_SELECTOR) === null
  ) {
    return true;
  }
  return false;
}

function persistSyncProgress(state: FavsSyncState): void {
  setSyncState(state);
}

/**
 * Walks the site favorites list page-by-page and merges ids into local favs.
 * Only adds; never removes. Network I/O lives here only (explicit user click).
 */
export async function runFavoritesSync(
  options: RunFavoritesSyncOptions,
): Promise<FavoritesSyncResult> {
  const { onProgress, signal } = options;

  const userId = extractUserIdFromDocument(document);
  if (userId === null) {
    log.warn("favorites sync: user id not found");
    return { status: "error", message: FAVORITES_SYNC_ERROR_NOT_LOGGED_IN };
  }

  const existing = getSyncState();
  const unfinished =
    existing !== undefined && existing.finishedAt === undefined;
  const startedAt = unfinished
    ? existing.startedAt
    : new Date().toISOString();
  let pid = unfinished ? existing.nextPid : 0;
  let lastPid = unfinished ? existing.lastPid : 0;
  let total = loadFavSet().size;
  let page = pageIndexFromPid(pid);
  let pages = pagesFromLastPid(lastPid);

  try {
    throwIfAborted(signal);

    while (true) {
      throwIfAborted(signal);

      const url = buildFavoritesPageUrl(userId, pid);
      let response: Response;
      try {
        response = await fetch(url, {
          method: FETCH_METHOD_GET,
          credentials: FETCH_CREDENTIALS,
        });
      } catch (error) {
        if (isAbortError(error)) {
          throw error;
        }
        log.warn("favorites sync: fetch failed", url, error);
        persistSyncProgress({ nextPid: pid, lastPid, startedAt });
        const message =
          error instanceof Error ? error.message : "request failed";
        return { status: "error", message };
      }

      if (!response.ok) {
        log.warn("favorites sync: HTTP error", response.status, url);
        persistSyncProgress({ nextPid: pid, lastPid, startedAt });
        return {
          status: "error",
          message: `HTTP ${String(response.status)}`,
        };
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const cardCount = doc.querySelectorAll(THUMB_SELECTOR).length;
      lastPid = resolveLastPid(doc, pid);
      page = pageIndexFromPid(pid);
      pages = pagesFromLastPid(lastPid);

      if (isUnexpectedFavoritesPage(doc, pid, lastPid, cardCount)) {
        log.warn("favorites sync: unexpected page", { pid, lastPid, cardCount });
        persistSyncProgress({ nextPid: pid, lastPid, startedAt });
        return {
          status: "error",
          message: FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE,
        };
      }

      const ids = collectFavoriteIdsFromDocument(doc);
      addFavs(ids);
      total = loadFavSet().size;

      const nextPid = pid + FAVORITES_SYNC_PID_STEP;
      persistSyncProgress({ nextPid, lastPid, startedAt });
      onProgress({ page, pages, total });

      if (pid >= lastPid) {
        const finishedAt = new Date().toISOString();
        persistSyncProgress({
          nextPid,
          lastPid,
          startedAt,
          finishedAt,
        });
        log.info("favorites sync: completed", { total, pages });
        return { status: "completed", total, pages };
      }

      throwIfAborted(signal);
      await delay(FAVORITES_SYNC_PAGE_PAUSE_MS, signal);
      throwIfAborted(signal);

      pid = nextPid;
      page = pageIndexFromPid(pid);
    }
  } catch (error) {
    if (isAbortError(error)) {
      log.info("favorites sync: aborted", { pid, total });
      return createAbortResult(total, page, pages);
    }
    log.error("favorites sync: unexpected failure", error);
    persistSyncProgress({ nextPid: pid, lastPid, startedAt });
    const message =
      error instanceof Error ? error.message : "unexpected error";
    return { status: "error", message };
  }
}
