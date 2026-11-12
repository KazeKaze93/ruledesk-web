import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  FAVORITES_SYNC_ERROR_NOT_LOGGED_IN,
  FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE,
  FAVORITES_SYNC_PAGE_PAUSE_MS,
  FAVORITES_SYNC_PID_STEP,
  extractUserIdFromDocument,
  runFavoritesSync,
} from "../src/site/favorites-sync";
import {
  addFav,
  clearFavsCache,
  getSyncState,
  loadFavSet,
  setSyncState,
} from "../src/storage/favs";
import { createFavoritesSyncSection } from "../src/ui/favorites-sync-section";

const USER_ID = 77;
const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearFavsCache();
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

function mountMyFavoritesLink(userId: number = USER_ID): void {
  const li = document.createElement("li");
  li.id = "my-favorites-container";
  const link = document.createElement("a");
  link.href = `index.php?page=favorites&s=view&id=${String(userId)}`;
  link.textContent = "My Favorites";
  li.append(link);
  document.body.append(li);
}

function favoritesPageHtml(options: {
  ids: number[];
  lastPid?: number;
  includePaginator?: boolean;
}): string {
  const { ids, lastPid, includePaginator = true } = options;
  const thumbs = ids
    .map(
      (id) => `
      <span class="thumb">
        <a id="p${String(id)}" href="index.php?page=post&s=view&id=${String(id)}">
          <img class="preview" alt="t" />
        </a>
        <a href="#" onclick="document.location='index.php?page=favorites&s=delete&id=${String(id)}&return_pid=0'; return false;">Remove</a>
      </span>`,
    )
    .join("");

  let paginator = "";
  if (includePaginator) {
    const last =
      lastPid === undefined
        ? ""
        : `<a name="lastpage" href="index.php?page=favorites&s=view&id=${String(USER_ID)}&pid=${String(lastPid)}">Last</a>`;
    paginator = `<div id="paginator">${last}</div>`;
  }

  return `<!DOCTYPE html><html><body>${thumbs}${paginator}</body></html>`;
}

function mockFetchSequence(
  responses: Array<{ ok?: boolean; status?: number; body: string } | Error>,
): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn();
  for (const item of responses) {
    if (item instanceof Error) {
      fetchMock.mockRejectedValueOnce(item);
    } else {
      const ok = item.ok ?? true;
      fetchMock.mockResolvedValueOnce({
        ok,
        status: item.status ?? (ok ? 200 : 500),
        text: async () => item.body,
      });
    }
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("extractUserIdFromDocument", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("reads user id from My Favorites menu link", () => {
    mountMyFavoritesLink(1234);
    expect(extractUserIdFromDocument(document)).toBe(1234);
  });

  it("returns null when the menu link is missing", () => {
    expect(extractUserIdFromDocument(document)).toBeNull();
  });
});

describe("runFavoritesSync", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    mountMyFavoritesLink();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("fetches two pages then completes on the last", async () => {
    const fetchMock = mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [10, 11],
          lastPid: FAVORITES_SYNC_PID_STEP,
        }),
      },
      {
        body: favoritesPageHtml({
          ids: [12],
          lastPid: FAVORITES_SYNC_PID_STEP,
        }),
      },
    ]);
    const progress: Array<{ page: number; pages: number; total: number }> = [];
    const controller = new AbortController();

    const run = runFavoritesSync({
      onProgress: (p) => {
        progress.push(p);
      },
      signal: controller.signal,
    });

    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_PAGE_PAUSE_MS);
    const result = await run;

    expect(result).toEqual({ status: "completed", total: 3, pages: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(progress).toEqual([
      { page: 1, pages: 2, total: 2 },
      { page: 2, pages: 2, total: 3 },
    ]);
    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([10, 11, 12]);
    expect(getSyncState()?.finishedAt).toEqual(expect.any(String));
  });

  it("resumes from saved nextPid", async () => {
    setSyncState({
      nextPid: FAVORITES_SYNC_PID_STEP,
      lastPid: FAVORITES_SYNC_PID_STEP,
      startedAt: "2020-01-01T00:00:00.000Z",
    });
    addFav(1);
    const fetchMock = mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [20, 21],
          lastPid: FAVORITES_SYNC_PID_STEP,
        }),
      },
    ]);

    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
    });

    expect(result).toEqual({ status: "completed", total: 3, pages: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(firstUrl).toContain(`pid=${String(FAVORITES_SYNC_PID_STEP)}`);
    expect(loadFavSet().has(20)).toBe(true);
    expect(loadFavSet().has(1)).toBe(true);
  });

  it("aborts via signal during the page pause", async () => {
    mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [30],
          lastPid: FAVORITES_SYNC_PID_STEP,
        }),
      },
      {
        body: favoritesPageHtml({
          ids: [31],
          lastPid: FAVORITES_SYNC_PID_STEP,
        }),
      },
    ]);
    const controller = new AbortController();
    const run = runFavoritesSync({
      onProgress: () => {},
      signal: controller.signal,
    });

    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();
    controller.abort();
    await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_PAGE_PAUSE_MS);
    const result = await run;

    expect(result.status).toBe("aborted");
    if (result.status === "aborted") {
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    }
    expect(getSyncState()?.finishedAt).toBeUndefined();
  });

  it("stops with error when response is not ok", async () => {
    mockFetchSequence([{ ok: false, status: 503, body: "down" }]);
    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
    });
    expect(result).toEqual({ status: "error", message: "HTTP 503" });
    expect(getSyncState()?.nextPid).toBe(0);
  });

  it("stops with unexpected page when a page has no cards", async () => {
    mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [],
          lastPid: 0,
          includePaginator: true,
        }),
      },
    ]);
    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
    });
    expect(result).toEqual({
      status: "error",
      message: FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE,
    });
  });

  it("errors when My Favorites link is missing", async () => {
    document.body.replaceChildren();
    const fetchMock = mockFetchSequence([]);
    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
    });
    expect(result).toEqual({
      status: "error",
      message: FAVORITES_SYNC_ERROR_NOT_LOGGED_IN,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not duplicate ids already in the local set", async () => {
    addFav(40);
    addFav(41);
    mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [40, 41, 42],
          lastPid: 0,
        }),
      },
    ]);
    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
    });
    expect(result).toEqual({ status: "completed", total: 3, pages: 1 });
    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([40, 41, 42]);
  });
});

describe("createFavoritesSyncSection", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("renders status, sync controls, warning, and add-only note", () => {
    addFav(5);
    const section = createFavoritesSyncSection();
    expect(section.querySelector("h3")?.textContent).toBe("Favorites sync");
    expect(section.textContent).toContain("1 in local favorites set");
    expect(section.textContent).toContain("Sync favorites");
    expect(section.textContent).toContain("Resume");
    expect(section.textContent).toContain("Stop");
    expect(section.textContent).toContain(
      "Loads every favorites page, one request per 1.5 s",
    );
    expect(section.textContent).toContain(
      "Sync only adds favorites. Posts removed on the site stay in the local set.",
    );
    expect(section.querySelector("progress")).toBeInstanceOf(HTMLProgressElement);
  });
});
