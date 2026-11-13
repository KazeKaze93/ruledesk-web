import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { runFavoritesSync } = vi.hoisted(() => ({
  runFavoritesSync: vi.fn(),
}));

vi.mock("../src/site/favorites-sync", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/site/favorites-sync")>();
  return {
    ...actual,
    runFavoritesSync: (
      ...args: Parameters<typeof actual.runFavoritesSync>
    ) => runFavoritesSync(...args),
  };
});

import { FAVORITES_SYNC_MODE_INCREMENTAL } from "../src/site/favorites-sync";
import {
  FAVORITES_SYNC_LOCK_STALE_MS,
  FAVORITES_SYNC_RESUME_DELAY_MS,
  getFavoritesSyncRunnerTabId,
  resumeFavoritesSyncIfStale,
  shouldResumeStaleFavoritesSync,
  shouldSkipForFreshForeignLock,
} from "../src/site/favorites-sync-runner";
import {
  clearFavsCache,
  setSyncState,
} from "../src/storage/favs";
import { clearStorageCache } from "../src/storage/store";
import type { FavsSyncMode, FavsSyncState } from "../src/storage/schema";

const USER_ID = 479099;
const FOREIGN_TAB_ID = "foreign-tab";
const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearFavsCache();
  clearStorageCache();
  vi.stubGlobal(
    "GM_getValue",
    (key: string, defaultValue?: unknown): unknown => {
      if (!memory.has(key)) {
        return defaultValue;
      }
      return memory.get(key);
    },
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

function runningSync(
  lock: FavsSyncState["lock"],
  mode?: FavsSyncMode,
): FavsSyncState {
  const state: FavsSyncState = {
    nextPid: 100,
    lastPid: 500,
    startedAt: "2026-01-01T00:00:00.000Z",
    running: true,
    userId: USER_ID,
    lock,
  };
  if (mode !== undefined) {
    state.mode = mode;
  }
  return state;
}

describe("favorites-sync-runner decisions", () => {
  const now = 1_700_000_000_000;

  it("resumes when running and lock beatAt is older than stale threshold", () => {
    const sync = runningSync({
      tabId: FOREIGN_TAB_ID,
      beatAt: now - FAVORITES_SYNC_LOCK_STALE_MS - 1,
    });
    expect(shouldResumeStaleFavoritesSync(sync, now)).toBe(true);
    expect(
      shouldSkipForFreshForeignLock(sync, "this-tab", now),
    ).toBe(false);
  });

  it("skips when running and a foreign lock is still fresh", () => {
    const sync = runningSync({
      tabId: FOREIGN_TAB_ID,
      beatAt: now - FAVORITES_SYNC_LOCK_STALE_MS + 1,
    });
    expect(shouldResumeStaleFavoritesSync(sync, now)).toBe(false);
    expect(
      shouldSkipForFreshForeignLock(sync, "this-tab", now),
    ).toBe(true);
  });
});

describe("resumeFavoritesSyncIfStale", () => {
  beforeEach(() => {
    installGmMocks();
    runFavoritesSync.mockReset();
    runFavoritesSync.mockResolvedValue({
      status: "completed",
      total: 0,
      pages: 0,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("waits resume delay then calls runFavoritesSync for a stale lock", async () => {
    const now = Date.now();
    setSyncState(
      runningSync({
        tabId: FOREIGN_TAB_ID,
        beatAt: now - FAVORITES_SYNC_LOCK_STALE_MS - 1,
      }),
    );

    const pending = resumeFavoritesSyncIfStale();
    expect(runFavoritesSync).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_RESUME_DELAY_MS);
    const started = await pending;

    expect(started).toBe(true);
    expect(runFavoritesSync).toHaveBeenCalledTimes(1);
    expect(runFavoritesSync).toHaveBeenCalledWith(
      expect.objectContaining({
        tabId: getFavoritesSyncRunnerTabId(),
        signal: expect.any(AbortSignal),
        onProgress: expect.any(Function),
      }),
    );
  });

  it("does not start when a foreign lock is fresh", async () => {
    const now = Date.now();
    setSyncState(
      runningSync({
        tabId: FOREIGN_TAB_ID,
        beatAt: now,
      }),
    );

    const pending = resumeFavoritesSyncIfStale();
    await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_RESUME_DELAY_MS);
    const started = await pending;

    expect(started).toBe(false);
    expect(runFavoritesSync).not.toHaveBeenCalled();
  });

  it("passes stored sync mode through to runFavoritesSync", async () => {
    const now = Date.now();
    setSyncState(
      runningSync(
        {
          tabId: FOREIGN_TAB_ID,
          beatAt: now - FAVORITES_SYNC_LOCK_STALE_MS - 1,
        },
        FAVORITES_SYNC_MODE_INCREMENTAL,
      ),
    );

    const pending = resumeFavoritesSyncIfStale();
    await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_RESUME_DELAY_MS);
    const started = await pending;

    expect(started).toBe(true);
    expect(runFavoritesSync).toHaveBeenCalledWith(
      expect.objectContaining({
        tabId: getFavoritesSyncRunnerTabId(),
        mode: FAVORITES_SYNC_MODE_INCREMENTAL,
      }),
    );
  });
});
