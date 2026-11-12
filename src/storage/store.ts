import * as z from "zod/mini";

import {
  IMPORT_SCHEMA_ERROR_PREFIX,
  STORAGE_BACKUP_KEY,
  STORAGE_KEY,
} from "../config/constants";
import { log } from "../log";
import {
  CollectionSchema,
  StorageSchema,
  createDefaultStorage,
  type Collection,
  type MarkFlags,
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
  const byTag = new Map<string, StorageData["artists"][number]>();
  for (const item of current) {
    byTag.set(item.tag, item);
  }
  for (const item of incoming) {
    byTag.set(item.tag, item);
  }
  return Array.from(byTag.values());
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
  };
  save(merged);
  return merged;
}
