import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SITE_ORIGIN } from "../../src/config/constants";
import { log } from "../../src/log";
import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  AUTOCOMPLETE_MIN_CHARS,
  AUTOCOMPLETE_PATH,
  AUTOCOMPLETE_QUERY_PARAM,
  AUTOCOMPLETE_TAG_TYPE_ARTIST,
  createAutocompleteQuerier,
  fetchAutocomplete,
  preferSuggestionType,
} from "../../src/site/autocomplete";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("preferSuggestionType", () => {
  it("moves preferred type first without reordering the rest", () => {
    expect(
      preferSuggestionType(
        [
          { label: "a (1)", value: "a", type: "general" },
          { label: "b (2)", value: "b", type: "artist" },
          { label: "c (3)", value: "c", type: "copyright" },
          { label: "d (4)", value: "d", type: "artist" },
        ],
        AUTOCOMPLETE_TAG_TYPE_ARTIST,
      ),
    ).toEqual([
      { label: "b (2)", value: "b", type: "artist" },
      { label: "d (4)", value: "d", type: "artist" },
      { label: "a (1)", value: "a", type: "general" },
      { label: "c (3)", value: "c", type: "copyright" },
    ]);
  });
});

describe("fetchAutocomplete", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns [] without fetching when shorter than min chars", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchAutocomplete("x")).toEqual([]);
    expect(AUTOCOMPLETE_MIN_CHARS).toBe(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GETs the site autocomplete URL with default credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        { label: "nyx_x (2691)", value: "nyx_x", type: "artist" },
        { label: "nyx (10)", value: "nyx", type: null },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const items = await fetchAutocomplete("ny");
    expect(items).toEqual([
      { label: "nyx_x (2691)", value: "nyx_x", type: "artist" },
      { label: "nyx (10)", value: "nyx" },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    if (call === undefined) {
      return;
    }
    const url = call[0];
    const init = call[1];
    expect(url).toBe(
      `${SITE_ORIGIN}${AUTOCOMPLETE_PATH}?${AUTOCOMPLETE_QUERY_PARAM}=ny`,
    );
    expect(init).toMatchObject({
      method: "GET",
      credentials: "same-origin",
    });
  });

  it("returns [] and warns on 429 without retrying", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 429));
    vi.stubGlobal("fetch", fetchMock);
    const warn = vi.spyOn(log, "warn").mockImplementation(() => undefined);

    expect(await fetchAutocomplete("tag")).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
  });

  it("returns [] and errors on schema mismatch", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse([{ label: 1, value: 2 }]));
    vi.stubGlobal("fetch", fetchMock);
    const error = vi.spyOn(log, "error").mockImplementation(() => undefined);

    expect(await fetchAutocomplete("tag")).toEqual([]);
    expect(error).toHaveBeenCalled();
  });

  it("returns [] quietly when aborted", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal =
          typeof init === "object" && init !== null && "signal" in init
            ? init.signal
            : undefined;
        if (!(signal instanceof AbortSignal)) {
          reject(new Error("missing signal"));
          return;
        }
        signal.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const error = vi.spyOn(log, "error").mockImplementation(() => undefined);

    const pending = fetchAutocomplete("tag", controller.signal);
    controller.abort();
    expect(await pending).toEqual([]);
    expect(error).not.toHaveBeenCalled();
  });
});

describe("createAutocompleteQuerier", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("debounces and aborts the previous in-flight request", async () => {
    const signals: AbortSignal[] = [];
    const fetchMock = vi.fn().mockImplementation((_url, init) => {
      return new Promise((resolve, reject) => {
        const signal =
          typeof init === "object" && init !== null && "signal" in init
            ? init.signal
            : undefined;
        if (!(signal instanceof AbortSignal)) {
          reject(new Error("missing signal"));
          return;
        }
        signals.push(signal);
        if (signal.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        signal.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
        setTimeout(() => {
          resolve(
            jsonResponse([
              { label: "ok (1)", value: "ok", type: "general" },
              { label: "art (2)", value: "art", type: "artist" },
            ]),
          );
        }, 50);
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const querier = createAutocompleteQuerier({
      preferType: AUTOCOMPLETE_TAG_TYPE_ARTIST,
    });
    const results: unknown[] = [];
    querier.query("ab", (items) => {
      results.push(items);
    });
    await vi.advanceTimersByTimeAsync(AUTOCOMPLETE_DEBOUNCE_MS - 1);
    expect(fetchMock).not.toHaveBeenCalled();

    querier.query("abc", (items) => {
      results.push(items);
    });
    await vi.advanceTimersByTimeAsync(AUTOCOMPLETE_DEBOUNCE_MS);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    querier.query("abcd", (items) => {
      results.push(items);
    });
    await vi.advanceTimersByTimeAsync(AUTOCOMPLETE_DEBOUNCE_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(signals[0]?.aborted).toBe(true);

    await vi.advanceTimersByTimeAsync(50);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual([
      { label: "art (2)", value: "art", type: "artist" },
      { label: "ok (1)", value: "ok", type: "general" },
    ]);

    querier.cancel();
  });

  it("emits [] immediately for short queries", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const querier = createAutocompleteQuerier();
    const onResult = vi.fn();
    querier.query("a", onResult);
    expect(onResult).toHaveBeenCalledWith([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
