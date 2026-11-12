import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEBUG_KEY, STORAGE_KEY } from "../../src/config/constants";
import { playlistBarFeature } from "../../src/features/playlist-bar";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import {
  buildPlaylistQueries,
  buildSearchUrl,
  parseTags,
} from "../../src/search/query";
import { createDefaultStorage } from "../../src/storage/schema";
import { clearStorageCache, save } from "../../src/storage/store";

const ROOT_ID = "rdw-playlist-bar";
const NAME_CLASS = "rdw-playlist-bar-name";
const COUNT_CLASS = "rdw-playlist-bar-count";
const PART_LABEL_CLASS = "rdw-playlist-bar-part-label";
const PART_LINK_CLASS = "rdw-playlist-bar-part-link";
const CAPTION_CLASS = "rdw-playlist-bar-caption";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
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
  memory.set(DEBUG_KEY, false);
}

function makeCtx(search: string): FeatureContext {
  return {
    pageKind: "list",
    search,
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function seedPlaylist(
  name: string,
  postIds: number[],
  playlistChunkSize = 2,
): void {
  const data = createDefaultStorage();
  data.collections = [
    {
      id: "playlist-1",
      name,
      tags: [],
      kind: "posts",
      postIds,
    },
  ];
  data.settings = {
    ...data.settings,
    gridFavButtons: data.settings?.gridFavButtons ?? true,
    playlistChunkSize,
  };
  save(data);
}

function buildListPage(): HTMLDivElement {
  const content = document.createElement("div");
  content.id = "content";
  const list = document.createElement("div");
  list.className = "image-list";
  content.append(list);
  document.body.append(content);
  return list;
}

function tagsSearch(query: string): string {
  return `?page=post&s=list&tags=${encodeURIComponent(query)}`;
}

describe("playlistBarFeature", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    installGmMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports Feature metadata for list", () => {
    expect(playlistBarFeature.id).toBe("playlist-bar");
    expect(playlistBarFeature.label).toBe("Playlist header");
    expect(playlistBarFeature.pages).toEqual(["list"]);
    expect(playlistBarFeature.defaultEnabled).toBe(true);
  });

  it("scopes every css rule under body.rdw-f-playlist-bar", () => {
    const bodyClass = featureBodyClass("playlist-bar");
    expect(bodyClass).toBe("rdw-f-playlist-bar");
    const rules = playlistBarFeature.css
      .split("}")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const selector = rule.split("{")[0]?.trim() ?? "";
      expect(selector.startsWith(`body.${bodyClass}`)).toBe(true);
    }
  });

  it("shows the bar when the query matches a playlist chunk", () => {
    seedPlaylist("Fox pack", [5, 4, 3, 2, 1], 2);
    const list = buildListPage();
    const queries = buildPlaylistQueries([5, 4, 3, 2, 1], 2);
    expect(queries[0]).toBeDefined();
    const query = queries[0] ?? "";

    playlistBarFeature.mount(makeCtx(tagsSearch(query)));

    const bar = document.getElementById(ROOT_ID);
    expect(bar).not.toBeNull();
    expect(bar?.nextElementSibling).toBe(list);
    expect(bar?.querySelector(`.${NAME_CLASS}`)?.textContent).toBe("Fox pack");
    expect(bar?.querySelector(`.${COUNT_CLASS}`)?.textContent).toBe("5 posts");
    expect(bar?.querySelector(`.${PART_LABEL_CLASS}`)?.textContent).toBe(
      "Part 1 of 3",
    );
    expect(bar?.querySelector(`.${CAPTION_CLASS}`)?.textContent).toBe(
      "Posts are ordered by the site (newest first).",
    );
  });

  it("links neighbor parts from buildPlaylistQueries", () => {
    seedPlaylist("Parts", [5, 4, 3, 2, 1], 2);
    buildListPage();
    const queries = buildPlaylistQueries([5, 4, 3, 2, 1], 2);
    expect(queries).toHaveLength(3);
    const middle = queries[1];
    expect(middle).toBeDefined();

    playlistBarFeature.mount(makeCtx(tagsSearch(middle ?? "")));

    const bar = document.getElementById(ROOT_ID);
    expect(bar?.querySelector(`.${PART_LABEL_CLASS}`)?.textContent).toBe(
      "Part 2 of 3",
    );
    const links = Array.from(
      bar?.querySelectorAll(`a.${PART_LINK_CLASS}`) ?? [],
    );
    expect(links).toHaveLength(2);
    expect(links[0]?.textContent).toBe("Previous");
    expect(links[1]?.textContent).toBe("Next");
    expect(links[0]?.getAttribute("href")).toBe(
      buildSearchUrl(parseTags(queries[0] ?? "")),
    );
    expect(links[1]?.getAttribute("href")).toBe(
      buildSearchUrl(parseTags(queries[2] ?? "")),
    );
  });

  it("draws nothing for a non-playlist id query", () => {
    seedPlaylist("Mine", [10, 20], 40);
    buildListPage();

    playlistBarFeature.mount(makeCtx(tagsSearch("id:999")));

    expect(document.getElementById(ROOT_ID)).toBeNull();
  });

  it("draws nothing for a non-playlist tags query", () => {
    seedPlaylist("Mine", [10, 20], 40);
    buildListPage();

    playlistBarFeature.mount(makeCtx(tagsSearch("cat dog")));

    expect(document.getElementById(ROOT_ID)).toBeNull();
  });

  it("draws nothing on partial overlap with a playlist", () => {
    seedPlaylist("Mine", [10, 20, 30], 40);
    buildListPage();

    playlistBarFeature.mount(makeCtx(tagsSearch("( id:30 ~ id:20 ~ id:99 )")));

    expect(document.getElementById(ROOT_ID)).toBeNull();
    expect(memory.get(STORAGE_KEY)).toBeDefined();
  });

  it("warns and exits cleanly when image-list is missing", () => {
    seedPlaylist("Lone", [7], 40);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => {
      playlistBarFeature.mount(makeCtx(tagsSearch("id:7")));
    }).not.toThrow();

    expect(document.getElementById(ROOT_ID)).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("mounts into a fallback host when image-list is missing but content exists", () => {
    seedPlaylist("Lone", [7], 40);
    const content = document.createElement("div");
    content.id = "content";
    document.body.append(content);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    playlistBarFeature.mount(makeCtx(tagsSearch("id:7")));

    const bar = document.getElementById(ROOT_ID);
    expect(bar).not.toBeNull();
    expect(bar?.parentElement).toBe(content);
    expect(warnSpy).toHaveBeenCalled();
  });
});
