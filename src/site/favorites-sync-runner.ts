import { log } from "../log";
import { getSyncState } from "../storage/favs";
import type { FavsSyncState } from "../storage/schema";
import {
  createFavoritesSyncTabId,
  runFavoritesSync,
} from "./favorites-sync";

/** Lock with no heartbeat for this long is considered abandoned. */
export const FAVORITES_SYNC_LOCK_STALE_MS = 10_000;

/** Grace pause after detecting a stale lock before this tab resumes. */
export const FAVORITES_SYNC_RESUME_DELAY_MS = 3_000;

let sessionTabId: string | undefined;
let resumeAttempted = false;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Stable tab id for this page session (created once). */
export function getFavoritesSyncRunnerTabId(): string {
  if (sessionTabId === undefined) {
    sessionTabId = createFavoritesSyncTabId();
  }
  return sessionTabId;
}

/**
 * True when sync claims to be running and the lock is missing or older than
 * {@link FAVORITES_SYNC_LOCK_STALE_MS}. Fresh locks (any tabId) are not resumed.
 */
export function shouldResumeStaleFavoritesSync(
  sync: FavsSyncState | undefined,
  now: number,
): boolean {
  if (sync?.running !== true) {
    return false;
  }
  const lock = sync.lock;
  if (lock === undefined) {
    return true;
  }
  return now - lock.beatAt > FAVORITES_SYNC_LOCK_STALE_MS;
}

/**
 * True when another tab holds a fresh lock — this tab must not start sync.
 */
export function shouldSkipForFreshForeignLock(
  sync: FavsSyncState | undefined,
  thisTabId: string,
  now: number,
): boolean {
  if (sync?.running !== true) {
    return false;
  }
  const lock = sync.lock;
  if (lock === undefined) {
    return false;
  }
  if (now - lock.beatAt > FAVORITES_SYNC_LOCK_STALE_MS) {
    return false;
  }
  return lock.tabId !== thisTabId;
}

/**
 * After a stale-lock check (and optional delay), resume via {@link runFavoritesSync}
 * with this session's tabId so nextPid continues in this tab.
 */
export async function resumeFavoritesSyncIfStale(): Promise<boolean> {
  const tabId = getFavoritesSyncRunnerTabId();
  const before = getSyncState();
  if (shouldSkipForFreshForeignLock(before, tabId, Date.now())) {
    return false;
  }
  if (!shouldResumeStaleFavoritesSync(before, Date.now())) {
    return false;
  }

  await delay(FAVORITES_SYNC_RESUME_DELAY_MS);

  const after = getSyncState();
  if (shouldSkipForFreshForeignLock(after, tabId, Date.now())) {
    return false;
  }
  if (!shouldResumeStaleFavoritesSync(after, Date.now())) {
    return false;
  }

  await runFavoritesSync({
    tabId,
    signal: new AbortController().signal,
    onProgress: () => {},
  });
  return true;
}

/**
 * Fire-and-forget entry for DOM-ready: at most one resume attempt per page load.
 */
export function maybeResumeFavoritesSync(): void {
  if (resumeAttempted) {
    return;
  }
  resumeAttempted = true;
  void resumeFavoritesSyncIfStale().catch((error: unknown) => {
    log.error("favorites sync resume failed", error);
  });
}
