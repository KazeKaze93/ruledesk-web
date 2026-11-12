import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEBUG_KEY,
  STORAGE_BACKUP_KEY,
  STORAGE_KEY,
} from "../src/config/constants";
import { createDefaultStorage } from "../src/storage/schema";
import {
  exportJson,
  importJson,
  load,
  save,
} from "../src/storage/store";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
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

describe("store", () => {
  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
  });

  it("returns the default object when storage is empty", () => {
    expect(load()).toEqual(createDefaultStorage());
    expect(memory.has(STORAGE_KEY)).toBe(false);
  });

  it("backs up invalid content and returns default without overwriting", () => {
    memory.set(STORAGE_KEY, { version: 1, broken: true });
    const result = load();
    expect(result).toEqual(createDefaultStorage());
    expect(memory.get(STORAGE_BACKUP_KEY)).toEqual({
      version: 1,
      broken: true,
    });
    expect(memory.get(STORAGE_KEY)).toEqual({ version: 1, broken: true });
  });

  it("round-trips a valid save through load", () => {
    const data = createDefaultStorage();
    data.collections.push({
      id: "c1",
      name: "Cats",
      tags: [{ tag: "cat", type: "include" }],
    });
    save(data);
    expect(load()).toEqual(data);
  });

  it("imports valid JSON by merging collections on id", () => {
    save({
      version: 1,
      collections: [
        {
          id: "keep",
          name: "Keep me",
          tags: [{ tag: "a", type: "include" }],
        },
        {
          id: "replace",
          name: "Old",
          tags: [{ tag: "old", type: "include" }],
        },
      ],
      artists: [],
      marks: {},
    });

    const merged = importJson(
      JSON.stringify({
        version: 1,
        collections: [
          {
            id: "replace",
            name: "New",
            tags: [{ tag: "new", type: "include" }],
          },
          {
            id: "added",
            name: "Added",
            tags: [{ tag: "x", type: "exclude" }],
          },
        ],
        artists: [],
        marks: {},
      }),
    );

    expect(merged.collections).toEqual([
      {
        id: "keep",
        name: "Keep me",
        tags: [{ tag: "a", type: "include" }],
      },
      {
        id: "replace",
        name: "New",
        tags: [{ tag: "new", type: "include" }],
      },
      {
        id: "added",
        name: "Added",
        tags: [{ tag: "x", type: "exclude" }],
      },
    ]);
  });

  it("allows duplicate names on import", () => {
    save({
      version: 1,
      collections: [
        {
          id: "a",
          name: "Same",
          tags: [{ tag: "a", type: "include" }],
        },
      ],
      artists: [],
      marks: {},
    });

    const merged = importJson(
      JSON.stringify({
        version: 1,
        collections: [
          {
            id: "b",
            name: "Same",
            tags: [{ tag: "b", type: "include" }],
          },
        ],
        artists: [],
        marks: {},
      }),
    );

    expect(merged.collections.map((item) => item.name)).toEqual([
      "Same",
      "Same",
    ]);
  });

  it("rejects invalid JSON on import without writing", () => {
    const before = createDefaultStorage();
    save(before);
    expect(() => importJson("{not-json")).toThrow();
    expect(load()).toEqual(before);
  });

  it("rejects schema-invalid JSON on import without writing", () => {
    const before = createDefaultStorage();
    save(before);
    expect(() =>
      importJson(JSON.stringify({ version: 1, collections: "nope" })),
    ).toThrow(
      /^File is not a RuleDesk Web export: collections: /,
    );
    expect(load()).toEqual(before);
  });

  it("exportJson returns pretty JSON of current storage", () => {
    const data = createDefaultStorage();
    data.collections.push({
      id: "c1",
      name: "Cats",
      tags: [{ tag: "cat", type: "include" }],
    });
    save(data);
    expect(JSON.parse(exportJson())).toEqual(data);
  });

  it("loads legacy storage without settings", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: { "7": { fav: true } },
    });
    const data = load();
    expect(data.settings).toBeUndefined();
    expect(data.marks["7"]?.fav).toBe(true);
  });
});
