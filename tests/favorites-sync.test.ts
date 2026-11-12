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
import { createFavoritesSyncSection } from "../src/ui/favorites-sync-section";

const USER_ID = 479099;
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
}): string {
  const {
    ids,
    nextPid,
    lastPid,
    currentLabel = "1",
    includePaginator = true,
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
          currentLabel: "2",
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
