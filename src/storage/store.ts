import * as z from "zod/mini";

import {
  DEFAULT_GRID_FAV_BUTTONS,
  DEFAULT_SEEN_POST_ID,
  DEFAULT_UPDATES_GROUP_SIZE,
  IMPORT_SCHEMA_ERROR_PREFIX,
  STORAGE_BACKUP_KEY,
  STORAGE_KEY,
} from "../config/constants";
import { log } from "../log";
import { normalizeArtistTag } from "../search/query";
import {
  ArtistEntrySchema,
  CollectionSchema,
  StorageSchema,
  createDefaultStorage,
  resolveGridFavButtons,
  resolveSeenPostId,
  resolveUpdatesGroupSize,
  type ArtistEntry,
  type Collection,
  type MarkFlags,
  type Settings,
  type StorageData,
  type TagEntry,
} from "./schema";

type GmGetValue = (key: string, defaultValue?: unknown) => unknown;
type GmSetValue = (key: string, value: unknown) => void;

function getGmGetValue(): GmGetValue {
  return GM_getValue;
}

function getGmSetValue(): GmSetValue {
  return GM_setValue;
}

function readRaw(): unknown {
  return getGmGetValue()(STORAGE_KEY, undefined);
}

function writeData(data: StorageData): void {
  getGmSetValue()(STORAGE_KEY, data);
}

function backupInvalid(raw: unknown): void {
  getGmSetValue()(STORAGE_BACKUP_KEY, raw);
  log.error("Invalid storage content backed up", {
    key: STORAGE_KEY,
    backupKey: STORAGE_BACKUP_KEY,
  });
}

function formatSchemaImportError(error: z.core.$ZodError): Error {
  const issue = error.issues[0];
  if (issue === undefined) {
    return new Error(`${IMPORT_SCHEMA_ERROR_PREFIX}: (root): Invalid data`);
  }
  const path =
    issue.path.length === 0
      ? "(root)"
      : issue.path.map((segment) => String(segment)).join(".");
  return new Error(
    `${IMPORT_SCHEMA_ERROR_PREFIX}: ${path}: ${issue.message}`,
  );
}

function currentSettings(data: StorageData): Settings {
  return {
    gridFavButtons: resolveGridFavButtons(data),
    updatesGroupSize: resolveUpdatesGroupSize(data),
  };
}

export function load(): StorageData {
  const raw = readRaw();
  if (raw === undefined || raw === null) {
    return createDefaultStorage();
  }
  const parsed = StorageSchema.safeParse(raw);
  if (!parsed.success) {
    backupInvalid(raw);
    return createDefaultStorage();
  }
  return parsed.data;
}

export function save(data: StorageData): void {
  const parsed = StorageSchema.parse(data);
  writeData(parsed);
}

export function addCollection(name: string, tags: TagEntry[]): Collection {
  const data = load();
  const collection = CollectionSchema.parse({
    id: crypto.randomUUID(),
    name: name.trim(),
    tags,
  });
  data.collections.push(collection);
  save(data);
  return collection;
}

export function renameCollection(id: string, name: string): Collection | null {
  const data = load();
  const target = data.collections.find((item) => item.id === id);
  if (target === undefined) {
    return null;
  }
  target.name = name.trim();
  CollectionSchema.parse(target);
  save(data);
  return target;
}

export function deleteCollection(id: string): boolean {
  const data = load();
  const next = data.collections.filter((item) => item.id !== id);
  if (next.length === data.collections.length) {
    return false;
  }
  data.collections = next;
  save(data);
  return true;
}

export function setPostFavMark(postId: string, fav: boolean): void {
  const data = load();
  const previous: MarkFlags = data.marks[postId] ?? {};
  data.marks[postId] = { ...previous, fav };
  save(data);
}

export function setPostFavMarks(postIds: string[], fav: boolean): void {
  if (postIds.length === 0) {
    return;
  }
  const data = load();
  for (const postId of postIds) {
    const previous: MarkFlags = data.marks[postId] ?? {};
    data.marks[postId] = { ...previous, fav };
  }
  save(data);
}

export function getGridFavButtonsEnabled(): boolean {
  return resolveGridFavButtons(load());
}

export function setGridFavButtonsEnabled(enabled: boolean): void {
  const data = load();
  data.settings = {
    ...currentSettings(data),
    gridFavButtons: enabled,
  };
  save(data);
}

export function getUpdatesGroupSize(): number {
  return resolveUpdatesGroupSize(load());
}

export function setUpdatesGroupSize(size: number): void {
  const data = load();
  const safeSize = Number.isFinite(size) && size >= 0 ? Math.floor(size) : 0;
  data.settings = {
    ...currentSettings(data),
    updatesGroupSize: safeSize,
  };
  save(data);
}

export function getSeenPostId(): number {
  return resolveSeenPostId(load());
}

export function setSeenPostId(seenPostId: number): void {
  const data = load();
  const safeId =
    Number.isFinite(seenPostId) && seenPostId >= 0
      ? Math.floor(seenPostId)
      : DEFAULT_SEEN_POST_ID;
  data.updates = { seenPostId: safeId };
  save(data);
}

export function listArtistTags(): string[] {
  return load().artists.map((entry) => entry.tag);
}

export function isFollowingArtist(tag: string): boolean {
  const normalized = normalizeArtistTag(tag);
  if (normalized === null) {
    return false;
  }
  return listArtistTags().includes(normalized);
}

export function addArtist(tag: string): ArtistEntry {
  const normalized = normalizeArtistTag(tag);
  if (normalized === null) {
    throw new Error("Invalid artist tag");
  }
  const data = load();
  if (data.artists.some((entry) => entry.tag === normalized)) {
    throw new Error("Duplicate artist tag");
  }
  const entry = ArtistEntrySchema.parse({ tag: normalized });
  data.artists.push(entry);
  save(data);
  return entry;
}

export function removeArtist(tag: string): boolean {
  const normalized = normalizeArtistTag(tag);
  if (normalized === null) {
    return false;
  }
  const data = load();
  const next = data.artists.filter((entry) => entry.tag !== normalized);
  if (next.length === data.artists.length) {
    return false;
  }
  data.artists = next;
  save(data);
  return true;
}

export function exportJson(): string {
  const data = load();
  return `${JSON.stringify(data, null, 2)}\n`;
}

function mergeCollections(
  current: Collection[],
  incoming: Collection[],
): Collection[] {
  const byId = new Map<string, Collection>();
  for (const item of current) {
    byId.set(item.id, item);
  }
  for (const item of incoming) {
    byId.set(item.id, item);
  }
  return Array.from(byId.values());
}

function mergeArtists(
  current: StorageData["artists"],
  incoming: StorageData["artists"],
): StorageData["artists"] {
  const byTag = new Map<string, ArtistEntry>();
  for (const item of current) {
    byTag.set(item.tag, item);
  }
  for (const item of incoming) {
    byTag.set(item.tag, item);
  }
  return Array.from(byTag.values());
}

function mergeSettings(
  current: StorageData["settings"],
  incoming: StorageData["settings"],
): StorageData["settings"] {
  if (incoming === undefined) {
    return current;
  }
  if (current === undefined) {
    return incoming;
  }
  return {
    gridFavButtons: incoming.gridFavButtons,
    updatesGroupSize:
      incoming.updatesGroupSize ?? current.updatesGroupSize,
  };
}

function mergeUpdates(
  current: StorageData["updates"],
  incoming: StorageData["updates"],
): StorageData["updates"] {
  const currentSeen = current?.seenPostId ?? DEFAULT_SEEN_POST_ID;
  const incomingSeen = incoming?.seenPostId ?? DEFAULT_SEEN_POST_ID;
  return { seenPostId: Math.max(currentSeen, incomingSeen) };
}

export function importJson(raw: string): StorageData {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    throw new Error(message);
  }
  const parsed = StorageSchema.safeParse(json);
  if (!parsed.success) {
    throw formatSchemaImportError(parsed.error);
  }
  const incoming = parsed.data;
  const current = load();
  const merged: StorageData = {
    version: current.version,
    collections: mergeCollections(current.collections, incoming.collections),
    artists: mergeArtists(current.artists, incoming.artists),
    marks: {
      ...current.marks,
      ...incoming.marks,
    },
    settings: mergeSettings(current.settings, incoming.settings),
    updates: mergeUpdates(current.updates, incoming.updates),
  };
  if (merged.settings === undefined) {
    merged.settings = {
      gridFavButtons: DEFAULT_GRID_FAV_BUTTONS,
      updatesGroupSize: DEFAULT_UPDATES_GROUP_SIZE,
    };
  }
  save(merged);
  return merged;
}
