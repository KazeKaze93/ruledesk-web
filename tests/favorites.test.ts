import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addFavorite,
  removeFavorite,
  voteUp,
} from "../src/site/favorites";

function mockFetchSequence(
  responses: Array<{ ok?: boolean; body: string } | Error>,
): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn();
  for (const item of responses) {
    if (item instanceof Error) {
      fetchMock.mockRejectedValueOnce(item);
    } else {
      fetchMock.mockResolvedValueOnce({
        ok: item.ok ?? true,
        status: item.ok === false ? 500 : 200,
        text: async () => item.body,
      });
    }
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("addFavorite", () => {
  beforeEach(() => {
    vi.stubGlobal("GM_getValue", () => undefined);
    vi.stubGlobal("GM_setValue", () => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns added with score when addfav is 3 and vote is numeric", async () => {
    mockFetchSequence([{ body: "3" }, { body: "42" }]);
    await expect(addFavorite("99")).resolves.toEqual({
      status: "added",
      score: 42,
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("returns already when addfav is 1 and does not vote", async () => {
    mockFetchSequence([{ body: "1" }]);
    await expect(addFavorite("99")).resolves.toEqual({ status: "already" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns not_logged_in when addfav is 2 and does not vote", async () => {
    mockFetchSequence([{ body: "2" }]);
    await expect(addFavorite("99")).resolves.toEqual({
      status: "not_logged_in",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns error on unexpected addfav body", async () => {
    mockFetchSequence([{ body: "nope" }]);
    await expect(addFavorite("99")).resolves.toEqual({ status: "error" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns error on network failure for addfav", async () => {
    mockFetchSequence([new Error("offline")]);
    await expect(addFavorite("99")).resolves.toEqual({ status: "error" });
  });

  it("still returns added when vote body is non-numeric", async () => {
    mockFetchSequence([{ body: "3" }, { body: "ok" }]);
    await expect(addFavorite("99")).resolves.toEqual({ status: "added" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe("voteUp", () => {
  beforeEach(() => {
    vi.stubGlobal("GM_getValue", () => undefined);
    vi.stubGlobal("GM_setValue", () => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the new score number", async () => {
    const fetchMock = mockFetchSequence([{ body: "17" }]);
    await expect(voteUp("99")).resolves.toBe(17);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("page=post&s=vote");
  });

  it("returns null when the body is non-numeric", async () => {
    mockFetchSequence([{ body: "ok" }]);
    await expect(voteUp("99")).resolves.toBeNull();
  });

  it("returns null on network failure", async () => {
    mockFetchSequence([new Error("offline")]);
    await expect(voteUp("99")).resolves.toBeNull();
  });
});

describe("removeFavorite", () => {
  beforeEach(() => {
    vi.stubGlobal("GM_getValue", () => undefined);
    vi.stubGlobal("GM_setValue", () => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns removed when response.ok", async () => {
    mockFetchSequence([{ body: "<html>ok</html>" }]);
    await expect(removeFavorite("55")).resolves.toEqual({ status: "removed" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns error when response is not ok", async () => {
    mockFetchSequence([{ ok: false, body: "no" }]);
    await expect(removeFavorite("55")).resolves.toEqual({ status: "error" });
  });

  it("returns error on network failure", async () => {
    mockFetchSequence([new Error("offline")]);
    await expect(removeFavorite("55")).resolves.toEqual({ status: "error" });
  });
});
