import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  APPEARANCE_BACKGROUND_KEY,
  FAVS_STORAGE_KEY,
  STORAGE_BACKUP_KEY,
  STORAGE_KEY,
} from "../src/config/constants";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  buildBackupFile,
  importBackupJson,
  IMPORT_MODE_MERGE,
  IMPORT_MODE_REPLACE,
  serializeBackupFile,
} from "../src/storage/backup";
import { clearFavsCache, loadFavSet } from "../src/storage/favs";
import { createDefaultFavs, createDefaultStorage } from "../src/storage/schema";
import {
  addArtist,
  addCollection,
  clearStorageCache,
  load,
  save,
} from "../src/storage/store";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
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

describe("backup export/import", () => {
  beforeEach(() => {
    installGmMocks();
    save(createDefaultStorage());
    memory.set(FAVS_STORAGE_KEY, createDefaultFavs());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("roundtrips export then replace import", () => {
    addArtist("nyx_x");
    addCollection("Cats", [{ tag: "cat", type: "include" }]);
    memory.set(FAVS_STORAGE_KEY, {
      version: 1,
      ids: [10, 20],
    });
    clearFavsCache();

    const file = buildBackupFile({
      includeBackground: false,
      includeFavorites: true,
    });
    expect(file.format).toBe(BACKUP_FORMAT);
    expect(file.version).toBe(BACKUP_VERSION);
    expect(file.storage.artists.map((entry) => entry.tag)).toEqual(["nyx_x"]);
    expect(file.favs?.ids).toEqual([10, 20]);
    expect(file.background).toBeUndefined();

    save(createDefaultStorage());
    memory.set(FAVS_STORAGE_KEY, createDefaultFavs());
    clearStorageCache();
    clearFavsCache();

    const result = importBackupJson(
      serializeBackupFile(file),
      IMPORT_MODE_REPLACE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.summary).toEqual({
      artistCount: 1,
      collectionCount: 1,
      favCount: 2,
    });
    expect(load().artists.map((entry) => entry.tag)).toEqual(["nyx_x"]);
    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([10, 20]);
    expect(memory.has(STORAGE_BACKUP_KEY)).toBe(true);
  });

  it("omit favorites from export when includeFavorites is false", () => {
    memory.set(FAVS_STORAGE_KEY, { version: 1, ids: [10, 20] });
    clearFavsCache();
    const file = buildBackupFile({
      includeBackground: false,
      includeFavorites: false,
    });
    expect(file.favs).toBeUndefined();
    const serialized = serializeBackupFile(file);
    expect(serialized).not.toContain('"favs"');
  });

  it("import without favs leaves local fav set untouched", () => {
    addArtist("keep_artist");
    memory.set(FAVS_STORAGE_KEY, { version: 1, ids: [99, 100] });
    clearFavsCache();

    const file = buildBackupFile({
      includeBackground: false,
      includeFavorites: false,
    });
    file.storage = {
      ...createDefaultStorage(),
      artists: [{ tag: "from_file" }],
      marks: {
        "7": { fav: true, seen: true },
      },
    };

    const result = importBackupJson(
      serializeBackupFile(file),
      IMPORT_MODE_REPLACE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([99, 100]);
    expect(result.summary.favCount).toBe(2);
    expect(load().artists.map((entry) => entry.tag)).toEqual(["from_file"]);
    expect(load().marks["7"]).toEqual({ seen: true });
    expect(memory.get(FAVS_STORAGE_KEY)).toEqual({
      version: 1,
      ids: [99, 100],
    });
  });

  it("merge keeps existing artists and unions favs; settings come from file", () => {
    addArtist("alpha");
    addCollection("Local", [{ tag: "dog", type: "include" }]);
    memory.set(FAVS_STORAGE_KEY, { version: 1, ids: [1] });
    clearFavsCache();

    const incoming = buildBackupFile({
      includeBackground: false,
      includeFavorites: true,
    });
    incoming.storage = {
      ...incoming.storage,
      artists: [{ tag: "beta" }],
      collections: [
        {
          id: "from-file",
          name: "File search",
          tags: [{ tag: "bird", type: "include" }],
        },
      ],
      settings: {
        gridFavButtons: false,
        updatesGroupSize: 3,
      },
    };
    incoming.favs = { version: 1, ids: [2, 3] };

    const beforeArtists = load().artists.map((entry) => entry.tag);
    expect(beforeArtists).toEqual(["alpha"]);

    const result = importBackupJson(
      serializeBackupFile(incoming),
      IMPORT_MODE_MERGE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const tags = load().artists.map((entry) => entry.tag).sort();
    expect(tags).toEqual(["alpha", "beta"]);
    expect(load().collections.map((entry) => entry.name).sort()).toEqual([
      "File search",
      "Local",
    ]);
    expect(Array.from(loadFavSet()).sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(load().settings?.gridFavButtons).toBe(false);
    expect(load().settings?.updatesGroupSize).toBe(3);
  });

  it("corrupt file changes nothing", () => {
    addArtist("keep_me");
    memory.set(FAVS_STORAGE_KEY, { version: 1, ids: [99] });
    clearFavsCache();
    const storageBefore = structuredClone(memory.get(STORAGE_KEY));
    const favsBefore = structuredClone(memory.get(FAVS_STORAGE_KEY));

    const result = importBackupJson("{not-json", IMPORT_MODE_REPLACE);
    expect(result.ok).toBe(false);
    expect(memory.get(STORAGE_KEY)).toEqual(storageBefore);
    expect(memory.get(FAVS_STORAGE_KEY)).toEqual(favsBefore);
    expect(load().artists.map((entry) => entry.tag)).toEqual(["keep_me"]);
    expect(Array.from(loadFavSet())).toEqual([99]);

    const badShape = importBackupJson(
      JSON.stringify({ format: "nope", version: 1 }),
      IMPORT_MODE_MERGE,
    );
    expect(badShape.ok).toBe(false);
    expect(load().artists.map((entry) => entry.tag)).toEqual(["keep_me"]);
  });

  it("includeBackground exports APPEARANCE_BACKGROUND_KEY when set", () => {
    memory.set(APPEARANCE_BACKGROUND_KEY, "data:image/png;base64,abc");
    const withBg = buildBackupFile({
      includeBackground: true,
      includeFavorites: false,
    });
    expect(withBg.background).toBe("data:image/png;base64,abc");
    const withoutBg = buildBackupFile({
      includeBackground: false,
      includeFavorites: false,
    });
    expect(withoutBg.background).toBeUndefined();
  });
});
