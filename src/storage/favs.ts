import {
  FAVS_STORAGE_KEY,
  STORAGE_KEY,
} from "../config/constants";
import { log } from "../log";
import {
  FavsSchema,
  StorageSchema,
  createDefaultFavs,
  stripLegacyPanelWindowSize,
  type FavsData,
  type FavsSyncState,
  type MarkFlags,
  type StorageData,
} from "./schema";

type GmGetValue = (key: string, defaultValue?: unknown) => unknown;
type GmSetValue = (key: string, value: unknown) => void;

let cachedIds: Set<number> | null = null;
let cachedSync: FavsSyncState | undefined;
let cacheHydrated = false;

function getGmGetValue(): GmGetValue {
  return GM_getValue;
}

function getGmSetValue(): GmSetValue {
  return GM_setValue;
}

function normalizePostId(id: number | string): number | null {
  if (typeof id === "number") {
    if (!Number.isFinite(id)) {
      return null;
    }
    return Math.trunc(id);
  }
  const trimmed = id.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.trunc(parsed);
}

function readFavsRaw(): FavsData {
  const raw = getGmGetValue()(FAVS_STORAGE_KEY, undefined);
  if (raw === undefined || raw === null) {
    return createDefaultFavs();
  }
  const parsed = FavsSchema.safeParse(raw);
  if (!parsed.success) {
    log.error("Invalid favs storage content; using empty favs", {
      key: FAVS_STORAGE_KEY,
    });
    return createDefaultFavs();
  }
  return parsed.data;
}

function writeFavsData(data: FavsData): void {
  const parsed = FavsSchema.parse(data);
  getGmSetValue()(FAVS_STORAGE_KEY, parsed);
}

function setCacheFromData(data: FavsData): void {
  cachedIds = new Set(data.ids);
  cachedSync = data.sync;
  cacheHydrated = true;
}

function readMainStorageRaw(): StorageData | null {
  const raw = getGmGetValue()(STORAGE_KEY, undefined);
  if (raw === undefined || raw === null) {
    return null;
  }
  const parsed = StorageSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

function writeMainStorage(data: StorageData): void {
  getGmSetValue()(STORAGE_KEY, StorageSchema.parse(data));
}

/**
 * Extract legacy `marks.*.fav === true` into favs.ids, strip `fav` from marks,
 * strip legacy panel window size from featureState, save both keys.
 * Idempotent. Preserves `marks.seen` and other featureState keys.
 */
export function migrateMarksFavToFavs(): void {
  const main = readMainStorageRaw();
  const favs = readFavsRaw();
  const ids = new Set(favs.ids);
  let marksChanged = false;
  let mainToWrite: StorageData | null = null;

  if (main !== null) {
    const nextMarks: StorageData["marks"] = {};
    for (const [postId, flags] of Object.entries(main.marks)) {
      const nextFlags: MarkFlags = {};
      if (flags.seen === true) {
        nextFlags.seen = true;
      }
      if (flags.fav === true) {
        const normalized = normalizePostId(postId);
        if (normalized !== null) {
          ids.add(normalized);
        }
        marksChanged = true;
      } else if (flags.fav !== undefined) {
        marksChanged = true;
      }
      if (Object.keys(nextFlags).length > 0) {
        nextMarks[postId] = nextFlags;
      } else if (flags.fav === undefined && flags.seen === undefined) {
        nextMarks[postId] = {};
      }
      // fav-only entries become empty and are dropped
    }

    let nextMain: StorageData = main;
    if (marksChanged) {
      nextMain = { ...main, marks: nextMarks };
    }
    const stripped = stripLegacyPanelWindowSize(nextMain);
    if (marksChanged || stripped.changed) {
      mainToWrite = stripped.data;
    }
  }

  if (mainToWrite !== null) {
    writeMainStorage(mainToWrite);
  }

  const nextFavs: FavsData = {
    version: favs.version,
    ids: Array.from(ids),
  };
  if (favs.sync !== undefined) {
    nextFavs.sync = favs.sync;
  }

  const idsChanged =
    nextFavs.ids.length !== favs.ids.length ||
    nextFavs.ids.some((id) => !favs.ids.includes(id));

  if (idsChanged) {
    writeFavsData(nextFavs);
  }

  setCacheFromData(nextFavs);
}

function ensureCache(): Set<number> {
  if (cacheHydrated && cachedIds !== null) {
    return cachedIds;
  }
  migrateMarksFavToFavs();
  if (cachedIds === null) {
    const data = readFavsRaw();
    setCacheFromData(data);
  }
  return cachedIds ?? new Set();
}

function persistIds(ids: Set<number>): void {
  const next: FavsData = {
    version: createDefaultFavs().version,
    ids: Array.from(ids),
  };
  if (cachedSync !== undefined) {
    next.sync = cachedSync;
  }
  writeFavsData(next);
  cachedIds = ids;
  cacheHydrated = true;
}

/** Clears the in-memory fav cache (tests / full remount). */
export function clearFavsCache(): void {
  cachedIds = null;
  cachedSync = undefined;
  cacheHydrated = false;
}

export function loadFavSet(): Set<number> {
  return ensureCache();
}

export function isFav(id: number | string): boolean {
  const normalized = normalizePostId(id);
  if (normalized === null) {
    return false;
  }
  return ensureCache().has(normalized);
}

export function addFav(id: number | string): void {
  const normalized = normalizePostId(id);
  if (normalized === null) {
    return;
  }
  const ids = new Set(ensureCache());
  if (ids.has(normalized)) {
    cachedIds = ids;
    return;
  }
  ids.add(normalized);
  persistIds(ids);
}

export function removeFav(id: number | string): void {
  const normalized = normalizePostId(id);
  if (normalized === null) {
    return;
  }
  const ids = new Set(ensureCache());
  if (!ids.has(normalized)) {
    cachedIds = ids;
    return;
  }
  ids.delete(normalized);
  persistIds(ids);
}

export function addFavs(ids: number[]): void {
  if (ids.length === 0) {
    ensureCache();
    return;
  }
  const next = new Set(ensureCache());
  let changed = false;
  for (const id of ids) {
    const normalized = normalizePostId(id);
    if (normalized === null) {
      continue;
    }
    if (!next.has(normalized)) {
      next.add(normalized);
      changed = true;
    }
  }
  if (changed) {
    persistIds(next);
  } else {
    cachedIds = next;
  }
}

export function getSyncState(): FavsSyncState | undefined {
  ensureCache();
  return cachedSync;
}

export function setSyncState(sync: FavsSyncState | undefined): void {
  const ids = ensureCache();
  cachedSync = sync;
  const next: FavsData = {
    version: createDefaultFavs().version,
    ids: Array.from(ids),
  };
  if (sync !== undefined) {
    next.sync = sync;
  }
  writeFavsData(next);
  cacheHydrated = true;
}

/**
 * Strip legacy `fav` flags from a marks record and return the fav post ids found.
 * Used by import to treat old `marks.fav` as fav ids.
 */
export function extractFavIdsFromMarks(
  marks: StorageData["marks"],
): { marks: StorageData["marks"]; favIds: number[] } {
  const favIds: number[] = [];
  const nextMarks: StorageData["marks"] = {};
  for (const [postId, flags] of Object.entries(marks)) {
    if (flags.fav === true) {
      const normalized = normalizePostId(postId);
      if (normalized !== null) {
        favIds.push(normalized);
      }
    }
    const nextFlags: MarkFlags = {};
    if (flags.seen === true) {
      nextFlags.seen = true;
    }
    if (Object.keys(nextFlags).length > 0) {
      nextMarks[postId] = nextFlags;
    }
  }
  return { marks: nextMarks, favIds };
}
