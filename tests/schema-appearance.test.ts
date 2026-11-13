import { describe, expect, it } from "vitest";

import {
  FavsSyncSchema,
  normalizeAppearanceCustom,
  StorageSchema,
} from "../src/storage/schema";

describe("appearance custom migration", () => {
  it("keeps explicit base and drops legacy color fields", () => {
    expect(
      normalizeAppearanceCustom({
        base: "light",
        accent: "#ff0000",
        bg: "#000000",
        surface: "#111111",
        text: "#eeeeee",
        backgroundDim: 0.1,
      }),
    ).toEqual({
      base: "light",
      backgroundDim: 0.1,
    });
  });

  it("picks dark base from a dark legacy bg", () => {
    expect(
      normalizeAppearanceCustom({
        accent: "#2f6fed",
        bg: "#16181c",
        surface: "#1e2228",
        text: "#e8edf2",
      }),
    ).toEqual({ base: "dark" });
  });

  it("picks light base from a light legacy bg", () => {
    expect(
      normalizeAppearanceCustom({
        accent: "#2f6fed",
        bg: "#aae5a4",
        surface: "#ffffff",
        text: "#1c2228",
      }),
    ).toEqual({ base: "light" });
  });

  it("parses legacy custom storage without resetting the blob", () => {
    const parsed = StorageSchema.safeParse({
      version: 1,
      collections: [],
      artists: [],
      marks: {},
      settings: {
        gridFavButtons: true,
        appearance: {
          theme: "custom",
          custom: {
            accent: "#2f6fed",
            bg: "#16181c",
            surface: "#1e2228",
            text: "#e8edf2",
          },
        },
      },
    });
    expect(parsed.success).toBe(true);
  });
});

describe("FavsSyncSchema mode HANDOFF from F", () => {
  it("accepts optional incremental/full mode", () => {
    expect(
      FavsSyncSchema.safeParse({
        nextPid: 0,
        lastPid: 0,
        startedAt: "2026-01-01T00:00:00.000Z",
        mode: "incremental",
      }).success,
    ).toBe(true);
    expect(
      FavsSyncSchema.safeParse({
        nextPid: 0,
        lastPid: 0,
        startedAt: "2026-01-01T00:00:00.000Z",
        mode: "full",
      }).success,
    ).toBe(true);
  });
});
