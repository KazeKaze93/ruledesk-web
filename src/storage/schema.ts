import * as z from "zod/mini";

import {
  DEFAULT_GRID_FAV_BUTTONS,
  DEFAULT_SEEN_POST_ID,
  DEFAULT_TWEAKS_ENABLED,
  DEFAULT_UPDATES_GROUP_SIZE,
  FAVS_SCHEMA_VERSION,
  SCHEMA_VERSION,
  TAG_TYPE_EXCLUDE,
  TAG_TYPE_INCLUDE,
} from "../config/constants";

export const TagTypeSchema = z.enum([TAG_TYPE_INCLUDE, TAG_TYPE_EXCLUDE]);

export const TagEntrySchema = z.object({
  tag: z.string().check(z.minLength(1)),
  type: TagTypeSchema,
});

export const CollectionSchema = z.object({
  id: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
  tags: z.array(TagEntrySchema),
});

export const ArtistEntrySchema = z.object({
  tag: z.string().check(z.minLength(1)),
});

/** Legacy `fav` remains optional so old storage/export blobs still parse. */
export const MarkFlagsSchema = z.object({
  fav: z.optional(z.boolean()),
  seen: z.optional(z.boolean()),
});

export const SettingsSchema = z.object({
  gridFavButtons: z.boolean(),
  updatesGroupSize: z.optional(z.int().check(z.nonnegative())),
  tweaksEnabled: z.optional(z.boolean()),
  features: z.optional(z.record(z.string(), z.boolean())),
  featureChoice: z.optional(z.record(z.string(), z.string())),
  featureState: z.optional(z.record(z.string(), z.unknown())),
});

export const UpdatesSchema = z.object({
  seenPostId: z.int().check(z.nonnegative()),
});

export const StorageSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  collections: z.array(CollectionSchema),
  artists: z.array(ArtistEntrySchema),
  marks: z.record(z.string(), MarkFlagsSchema),
  settings: z.optional(SettingsSchema),
  updates: z.optional(UpdatesSchema),
});

export const FavsSyncSchema = z.object({
  nextPid: z.int(),
  lastPid: z.int(),
  startedAt: z.string(),
  finishedAt: z.optional(z.string()),
});

export const FavsSchema = z.object({
  version: z.literal(FAVS_SCHEMA_VERSION),
  ids: z.array(z.int()),
  sync: z.optional(FavsSyncSchema),
});

/** Export/import blob: main storage fields plus optional `favIds`. */
export const ExportBlobSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  collections: z.array(CollectionSchema),
  artists: z.array(ArtistEntrySchema),
  marks: z.record(z.string(), MarkFlagsSchema),
  settings: z.optional(SettingsSchema),
  updates: z.optional(UpdatesSchema),
  favIds: z.optional(z.array(z.int())),
});

export type TagType = z.infer<typeof TagTypeSchema>;
export type TagEntry = z.infer<typeof TagEntrySchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type ArtistEntry = z.infer<typeof ArtistEntrySchema>;
export type MarkFlags = z.infer<typeof MarkFlagsSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type UpdatesState = z.infer<typeof UpdatesSchema>;
export type StorageData = z.infer<typeof StorageSchema>;
export type FavsSyncState = z.infer<typeof FavsSyncSchema>;
export type FavsData = z.infer<typeof FavsSchema>;
export type ExportBlob = z.infer<typeof ExportBlobSchema>;

export function createDefaultFavs(): FavsData {
  return {
    version: FAVS_SCHEMA_VERSION,
    ids: [],
  };
}

export function createDefaultStorage(): StorageData {
  return {
    version: SCHEMA_VERSION,
    collections: [],
    artists: [],
    marks: {},
    settings: {
      gridFavButtons: DEFAULT_GRID_FAV_BUTTONS,
      updatesGroupSize: DEFAULT_UPDATES_GROUP_SIZE,
      tweaksEnabled: DEFAULT_TWEAKS_ENABLED,
    },
    updates: {
      seenPostId: DEFAULT_SEEN_POST_ID,
    },
  };
}

export function resolveGridFavButtons(data: StorageData): boolean {
  return data.settings?.gridFavButtons ?? DEFAULT_GRID_FAV_BUTTONS;
}

export function resolveTweaksEnabled(data: StorageData): boolean {
  return data.settings?.tweaksEnabled ?? DEFAULT_TWEAKS_ENABLED;
}

export function resolveUpdatesGroupSize(data: StorageData): number {
  return data.settings?.updatesGroupSize ?? DEFAULT_UPDATES_GROUP_SIZE;
}

export function resolveSeenPostId(data: StorageData): number {
  return data.updates?.seenPostId ?? DEFAULT_SEEN_POST_ID;
}
