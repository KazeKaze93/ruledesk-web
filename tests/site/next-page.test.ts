import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FETCH_CREDENTIALS, FETCH_METHOD_GET } from "../../src/config/constants";
import { fetchNextPage } from "../../src/site/next-page";

function mockFetch(
  responses: Array<{ ok?: boolean; status?: number; body: string } | Error>,
): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn();
  for (const item of responses) {
    if (item instanceof Error) {
      fetchMock.mockRejectedValueOnce(item);
    } else {
      fetchMock.mockResolvedValueOnce({
        ok: item.ok ?? true,
        status: item.status ?? (item.ok === false ? 500 : 200),
        text: async () => item.body,
      });
    }
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function pageHtml(options: {
  thumbs?: Array<{ id: string; title?: string; alt?: string }>;
  nextHref?: string | null;
  includeImageList?: boolean;
  includePagination?: boolean;
}): string {
  const includeImageList = options.includeImageList ?? true;
  const includePagination = options.includePagination ?? true;
  const thumbs = options.thumbs ?? [];

  const thumbHtml = thumbs
    .map((thumb) => {
      const alt = thumb.alt ?? "tag_a";
      const title = thumb.title ?? `${alt} score:1 rating:s`;
      return `<span class="thumb" id="${thumb.id}"><a href="#"><img class="preview" alt="${alt}" title="${title}"></a></span>`;
    })
    .join("");

  const imageList = includeImageList
    ? `<div class="image-list">${thumbHtml}</div>`
    : "";

  let pagination = "";
  if (includePagination) {
    if (options.nextHref === null) {
      pagination = `<div class="pagination"><b>1</b></div>`;
    } else {
      const href = options.nextHref ?? "?page=post&s=list&tags=test&pid=42";
      pagination = `<div class="pagination"><a href="${href}" alt="next">&gt;</a></div>`;
    }
  }

  return `<!doctype html><html><body>${imageList}${pagination}</body></html>`;
}

describe("fetchNextPage", () => {
  beforeEach(() => {
    vi.stubGlobal("GM_getValue", () => undefined);
    vi.stubGlobal("GM_setValue", () => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches with GET and same-origin credentials", async () => {
    const fetchMock = mockFetch([
      {
        body: pageHtml({
          thumbs: [{ id: "s1" }],
          nextHref: "?page=post&s=list&tags=a&pid=42",
        }),
      },
    ]);

    await fetchNextPage("/index.php?page=post&s=list&tags=a");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/index.php?page=post&s=list&tags=a");
    expect(init).toEqual({
      method: FETCH_METHOD_GET,
      credentials: FETCH_CREDENTIALS,
    });
  });

  it("parses thumbs from div.image-list", async () => {
    mockFetch([
      {
        body: pageHtml({
          thumbs: [
            { id: "s10", alt: "cat dog", title: "cat dog score:3 rating:e" },
            { id: "s11" },
          ],
        }),
      },
    ]);

    const result = await fetchNextPage("/next");
    expect(result.thumbs).toHaveLength(2);
    expect(result.thumbs[0]?.id).toBe("s10");
    expect(result.thumbs[1]?.id).toBe("s11");
  });

  it("resolves absolute and site-relative next URLs from pagination", async () => {
    mockFetch([
      {
        body: pageHtml({
          thumbs: [{ id: "s1" }],
          nextHref: "?page=post&s=list&tags=x&pid=42",
        }),
      },
    ]);
    const relative = await fetchNextPage("/page1");
    expect(relative.nextUrl).toBe(
      new URL("?page=post&s=list&tags=x&pid=42", window.location.href).href,
    );

    mockFetch([
      {
        body: pageHtml({
          thumbs: [{ id: "s2" }],
          nextHref: `${window.location.origin}/index.php?page=post&s=list&pid=84`,
        }),
      },
    ]);
    const absolute = await fetchNextPage("/page2");
    expect(absolute.nextUrl).toBe(
      `${window.location.origin}/index.php?page=post&s=list&pid=84`,
    );
  });

  it("returns null nextUrl when pagination has no next link", async () => {
    mockFetch([
      {
        body: pageHtml({
          thumbs: [{ id: "s1" }],
          nextHref: null,
        }),
      },
    ]);
    const result = await fetchNextPage("/last");
    expect(result.thumbs).toHaveLength(1);
    expect(result.nextUrl).toBeNull();
  });

  it("returns empty thumbs when image-list is missing", async () => {
    mockFetch([
      {
        body: pageHtml({
          includeImageList: false,
          nextHref: "?pid=42",
        }),
      },
    ]);
    const result = await fetchNextPage("/empty");
    expect(result.thumbs).toEqual([]);
    expect(result.nextUrl).not.toBeNull();
  });

  it("throws on non-OK HTTP status", async () => {
    mockFetch([{ ok: false, status: 503, body: "busy" }]);
    await expect(fetchNextPage("/fail")).rejects.toThrow(/503/);
  });

  it("throws on network failure", async () => {
    mockFetch([new Error("offline")]);
    await expect(fetchNextPage("/fail")).rejects.toThrow("offline");
  });

  it("rejects cross-origin URLs before fetch", async () => {
    const fetchMock = mockFetch([{ body: pageHtml({}) }]);
    await expect(
      fetchNextPage("https://evil.example/steal"),
    ).rejects.toThrow(/Cross-origin/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
