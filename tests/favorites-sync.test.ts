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
  FAVORITES_SYNC_RETRY_DELAYS_MS,
  extractUserIdFromDocument,
  extractUserIdFromFavoritesSearch,
  resolveFavoritesUserId,
  resolveLastPid,
  runFavoritesSync,
} from "../src/site/favorites-sync";
import {
  addFav,
  clearFavsCache,
  getSyncState,
  loadFavSet,
  setSyncState,
} from "../src/storage/favs";
import { clearStorageCache } from "../src/storage/store";

const USER_ID = 479099;
const TAB_ID = "test-tab-1";
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

function mountMyFavoritesLink(userId: number = USER_ID): void {
  const li = document.createElement("li");
  li.id = "my-favorites-container";
  const link = document.createElement("a");
  link.href = `index.php?page=favorites&s=view&id=${String(userId)}`;
  link.textContent = "My Favorites";
  li.append(link);
  document.body.append(li);
}

function favOnclick(pid: number): string {
  return `document.location='?page=favorites&amp;s=view&amp;id=${String(USER_ID)}&amp;pid=${String(pid)}'; return false;`;
}

/**
 * Live favorites paginator markup (onclick-based; href is "#").
 * First page sample includes next + lastpage; last page has neither.
 */
function favoritesPaginatorHtml(options: {
  currentLabel: string;
  nextPid?: number;
  lastPid?: number;
  pageTwoLabel?: string;
}): string {
  const { currentLabel, nextPid, lastPid, pageTwoLabel = "2" } = options;
  const parts: string[] = [`<b>${currentLabel}</b>`];
  if (nextPid !== undefined) {
    parts.push(
      `<a href="#" onclick="${favOnclick(nextPid)}">${pageTwoLabel}</a>`,
    );
    parts.push(
      `<a href="#" onclick="${favOnclick(nextPid)}" name="next">&gt;</a>`,
    );
  }
  if (lastPid !== undefined) {
    parts.push(
      `<a href="#" onclick="${favOnclick(lastPid)}" name="lastpage">&gt;&gt;</a>`,
    );
  }
  return `<div id="paginator">${parts.join("\n")}</div>`;
}

function favoritesPageHtml(options: {
  ids: number[];
  nextPid?: number;
  lastPid?: number;
  currentLabel?: string;
  includePaginator?: boolean;
  title?: string;
}): string {
  const {
    ids,
    nextPid,
    lastPid,
    currentLabel = "1",
    includePaginator = true,
    title = "Rule34 Favorites",
  } = options;
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
    const paginatorOptions: {
      currentLabel: string;
      nextPid?: number;
      lastPid?: number;
    } = { currentLabel };
    if (nextPid !== undefined) {
      paginatorOptions.nextPid = nextPid;
    }
    if (lastPid !== undefined) {
      paginatorOptions.lastPid = lastPid;
    }
    paginator = favoritesPaginatorHtml(paginatorOptions);
  }

  return `<!DOCTYPE html><html><head><title>${title}</title></head><body>${thumbs}${paginator}</body></html>`;
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

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
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

describe("resolveFavoritesUserId", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("prefers menu link over URL and saved value", () => {
    mountMyFavoritesLink(111);
    expect(
      resolveFavoritesUserId(
        document,
        "?page=favorites&s=view&id=222",
        333,
      ),
    ).toBe(111);
  });

  it("uses favorites URL id when menu link is missing", () => {
    expect(
      extractUserIdFromFavoritesSearch("?page=favorites&s=view&id=222"),
    ).toBe(222);
    expect(
      resolveFavoritesUserId(
        document,
        "?page=favorites&s=view&id=222",
        333,
      ),
    ).toBe(222);
  });

  it("falls back to saved sync userId", () => {
    expect(
      resolveFavoritesUserId(document, "?page=post&s=list&tags=cat", 333),
    ).toBe(333);
  });

  it("returns null when no source has an id", () => {
    expect(
      resolveFavoritesUserId(document, "?page=post&s=list&tags=cat", undefined),
    ).toBeNull();
  });
});

describe("resolveLastPid", () => {
  it("parses pid from lastpage onclick, not href", () => {
    const doc = new DOMParser().parseFromString(
      favoritesPageHtml({
        ids: [1],
        nextPid: FAVORITES_SYNC_PID_STEP,
        lastPid: 13050,
      }),
      "text/html",
    );
    const last = doc.querySelector('a[name="lastpage"]');
    expect(last).toBeInstanceOf(HTMLAnchorElement);
    if (last instanceof HTMLAnchorElement) {
      expect(last.getAttribute("href")).toBe("#");
      expect(last.href).toContain("#");
    }
    expect(resolveLastPid(doc, 0)).toBe(13050);
  });

  it("treats a page with no lastpage and no next as last", () => {
    const doc = new DOMParser().parseFromString(
      favoritesPageHtml({
        ids: [9],
        currentLabel: "261",
      }),
      "text/html",
    );
    expect(doc.querySelector('a[name="lastpage"]')).toBeNull();
    expect(doc.querySelector('a[name="next"]')).toBeNull();
    expect(resolveLastPid(doc, 13000)).toBe(13000);
  });

  it("returns null when next exists but lastpage is missing", () => {
    const doc = new DOMParser().parseFromString(
      favoritesPageHtml({
        ids: [1],
        nextPid: FAVORITES_SYNC_PID_STEP,
      }),
      "text/html",
    );
    expect(doc.querySelector('a[name="lastpage"]')).toBeNull();
    expect(doc.querySelector('a[name="next"]')).not.toBeNull();
    expect(resolveLastPid(doc, 0)).toBeNull();
  });

  it("returns null when lastpage onclick has no pid", () => {
    const html = `<!DOCTYPE html><html><body>
      <div id="paginator">
        <a href="#" onclick="return false;" name="lastpage">&gt;&gt;</a>
      </div>
    </body></html>`;
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(resolveLastPid(doc, 0)).toBeNull();
  });
});

describe("runFavoritesSync", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    mountMyFavoritesLink();
    vi.stubGlobal("location", {
      search: "",
    });
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
          nextPid: FAVORITES_SYNC_PID_STEP,
          lastPid: FAVORITES_SYNC_PID_STEP,
        }),
      },
      {
        body: favoritesPageHtml({
          ids: [12],
          currentLabel: "2",
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
      tabId: TAB_ID,
    });

    await vi.advanceTimersByTimeAsync(0);
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_PAGE_PAUSE_MS);
    const result = await run;

    expect(result).toEqual({ status: "completed", total: 3, pages: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(progress).toEqual([
      { page: 1, pages: 2, total: 2 },
      { page: 2, pages: 2, total: 3 },
    ]);
    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([10, 11, 12]);
    const sync = getSyncState();
    expect(sync?.finishedAt).toEqual(expect.any(String));
    expect(sync?.running).toBe(false);
    expect(sync?.userId).toBe(USER_ID);
    expect(sync?.lock).toEqual({
      tabId: TAB_ID,
      beatAt: expect.any(Number),
    });
  });

  it("completes on empty trailing page with paginator after non-empty", async () => {
    const fetchMock = mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [100, 101],
          nextPid: FAVORITES_SYNC_PID_STEP,
          lastPid: FAVORITES_SYNC_PID_STEP * 2,
        }),
      },
      {
        body: favoritesPageHtml({
          ids: [],
          currentLabel: "2",
          nextPid: FAVORITES_SYNC_PID_STEP * 2,
          lastPid: FAVORITES_SYNC_PID_STEP * 2,
        }),
      },
    ]);

    const run = runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
      tabId: TAB_ID,
    });

    await vi.advanceTimersByTimeAsync(0);
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_PAGE_PAUSE_MS);
    const result = await run;

    // lastPid advertises 3 pages; content ended on empty page 2.
    expect(result).toEqual({ status: "completed", total: 2, pages: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getSyncState()?.running).toBe(false);
    expect(getSyncState()?.finishedAt).toEqual(expect.any(String));
  });

  it("retries HTTP errors with 10s/30s/60s then pauses with status and title", async () => {
    const errorBody =
      "<!DOCTYPE html><html><head><title>Service Unavailable — please retry later now</title></head><body>down</body></html>";
    const fetchMock = mockFetchSequence([
      { ok: false, status: 503, body: errorBody },
      { ok: false, status: 503, body: errorBody },
      { ok: false, status: 503, body: errorBody },
      { ok: false, status: 503, body: errorBody },
    ]);

    const run = runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
      tabId: TAB_ID,
    });

    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_RETRY_DELAYS_MS[0]);
    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_RETRY_DELAYS_MS[1]);
    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_RETRY_DELAYS_MS[2]);
    await flushMicrotasks();
    const result = await run;

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.message).toContain("HTTP 503");
      expect(result.message).toContain("Service Unavailable");
      expect(result.message.length).toBeLessThanOrEqual(
        "HTTP 503: ".length + 80,
      );
    }
    expect(getSyncState()?.running).toBe(true);
    expect(getSyncState()?.lock?.tabId).toBe(TAB_ID);
  });

  it("retries when paginator is missing then succeeds", async () => {
    const fetchMock = mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [1],
          includePaginator: false,
          title: "Login required page title text here",
        }),
      },
      {
        body: favoritesPageHtml({
          ids: [55],
        }),
      },
    ]);

    const run = runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
      tabId: TAB_ID,
    });

    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_RETRY_DELAYS_MS[0]);
    await flushMicrotasks();
    const result = await run;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ status: "completed", total: 1, pages: 1 });
    expect(loadFavSet().has(55)).toBe(true);
  });

  it("writes running, userId, and lock heartbeat fields", async () => {
    mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [7],
        }),
      },
    ]);

    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
      tabId: TAB_ID,
    });

    expect(result.status).toBe("completed");
    const sync = getSyncState();
    expect(sync).toMatchObject({
      running: false,
      userId: USER_ID,
      lock: {
        tabId: TAB_ID,
        beatAt: expect.any(Number),
      },
    });
  });

  it("resolves userId from favorites URL when menu link is absent", async () => {
    document.body.replaceChildren();
    vi.stubGlobal("location", {
      search: `?page=favorites&s=view&id=${String(USER_ID)}`,
    });
    mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [9],
        }),
      },
    ]);

    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
      tabId: TAB_ID,
    });

    expect(result).toEqual({ status: "completed", total: 1, pages: 1 });
    expect(getSyncState()?.userId).toBe(USER_ID);
  });

  it("resolves userId from saved sync state when menu and URL lack it", async () => {
    document.body.replaceChildren();
    vi.stubGlobal("location", { search: "?page=post&s=list&tags=a" });
    setSyncState({
      nextPid: 0,
      lastPid: 0,
      startedAt: "2020-01-01T00:00:00.000Z",
      finishedAt: "2020-01-02T00:00:00.000Z",
      userId: USER_ID,
      running: false,
    });
    mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [3],
        }),
      },
    ]);

    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
      tabId: TAB_ID,
    });

    expect(result).toEqual({ status: "completed", total: 1, pages: 1 });
    expect(getSyncState()?.userId).toBe(USER_ID);
  });

  it("Stop sets running=false and keeps nextPid", async () => {
    mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [30],
          nextPid: FAVORITES_SYNC_PID_STEP,
          lastPid: FAVORITES_SYNC_PID_STEP,
        }),
      },
      {
        body: favoritesPageHtml({
          ids: [31],
          currentLabel: "2",
        }),
      },
    ]);
    const controller = new AbortController();
    const run = runFavoritesSync({
      onProgress: () => {},
      signal: controller.signal,
      tabId: TAB_ID,
    });

    await vi.advanceTimersByTimeAsync(0);
    await flushMicrotasks();
    controller.abort();
    await vi.advanceTimersByTimeAsync(FAVORITES_SYNC_PAGE_PAUSE_MS);
    const result = await run;

    expect(result.status).toBe("aborted");
    const sync = getSyncState();
    expect(sync?.running).toBe(false);
    expect(sync?.finishedAt).toBeUndefined();
    expect(sync?.nextPid).toBe(FAVORITES_SYNC_PID_STEP);
    expect(sync?.lock?.tabId).toBe(TAB_ID);
  });

  it("resumes from saved nextPid", async () => {
    setSyncState({
      nextPid: FAVORITES_SYNC_PID_STEP,
      lastPid: FAVORITES_SYNC_PID_STEP,
      startedAt: "2020-01-01T00:00:00.000Z",
      userId: USER_ID,
      running: false,
    });
    addFav(1);
    const fetchMock = mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [20, 21],
          currentLabel: "2",
        }),
      },
    ]);

    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
      tabId: TAB_ID,
    });

    expect(result).toEqual({ status: "completed", total: 3, pages: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(firstUrl).toContain(`pid=${String(FAVORITES_SYNC_PID_STEP)}`);
    expect(loadFavSet().has(20)).toBe(true);
    expect(loadFavSet().has(1)).toBe(true);
  });

  it("stops with unexpected page when the first page has no cards", async () => {
    mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [],
          includePaginator: true,
        }),
      },
    ]);
    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
      tabId: TAB_ID,
    });
    expect(result).toEqual({
      status: "error",
      message: FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE,
    });
  });

  it("stops with unexpected page when next exists without lastpage", async () => {
    mockFetchSequence([
      {
        body: favoritesPageHtml({
          ids: [1],
          nextPid: FAVORITES_SYNC_PID_STEP,
        }),
      },
    ]);
    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
      tabId: TAB_ID,
    });
    expect(result).toEqual({
      status: "error",
      message: FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE,
    });
  });

  it("errors when user id cannot be resolved", async () => {
    document.body.replaceChildren();
    vi.stubGlobal("location", { search: "" });
    const fetchMock = mockFetchSequence([]);
    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
      tabId: TAB_ID,
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
        }),
      },
    ]);
    const result = await runFavoritesSync({
      onProgress: () => {},
      signal: new AbortController().signal,
      tabId: TAB_ID,
    });
    expect(result).toEqual({ status: "completed", total: 3, pages: 1 });
    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([40, 41, 42]);
  });
});
