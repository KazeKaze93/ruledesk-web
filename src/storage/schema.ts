import * as z from "zod/mini";

import {
  APPEARANCE_THEME_CUSTOM,
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_LIGHT,
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  COLLECTION_KIND_POSTS,
  COLLECTION_KIND_SEARCH,
  DEFAULT_APPEARANCE_THEME,
  DEFAULT_GRID_FAV_BUTTONS,
  DEFAULT_PLAYLIST_CHUNK_SIZE,
  DEFAULT_SEEN_POST_ID,
  DEFAULT_TWEAKS_ENABLED,
  DEFAULT_UPDATES_GROUP_SIZE,
  FAVS_SCHEMA_VERSION,
  SCHEMA_VERSION,
  TAG_TYPE_EXCLUDE,
  TAG_TYPE_INCLUDE,
} from "../config/constants";

export const TagTypeSchema = z.enum([TAG_TYPE_INCLUDE, TAG_TYPE_EXCLUDE]);

export const CollectionKindSchema = z.enum([
  COLLECTION_KIND_SEARCH,
  COLLECTION_KIND_POSTS,
]);

export const TagEntrySchema = z.object({
  tag: z.string().check(z.minLength(1)),
  type: TagTypeSchema,
});

/** Optional `kind` / `postIds`: missing `kind` means a saved search. */
export const CollectionSchema = z.object({
  id: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
  tags: z.array(TagEntrySchema),
  kind: z.optional(CollectionKindSchema),
  postIds: z.optional(z.array(z.int())),
});

export const ArtistEntrySchema = z.object({
  tag: z.string().check(z.minLength(1)),
});

/** Legacy `fav` remains optional so old storage/export blobs still parse. */
export const MarkFlagsSchema = z.object({
  fav: z.optional(z.boolean()),
  seen: z.optional(z.boolean()),
});

export const AppearanceThemeSchema = z.enum([
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  APPEARANCE_THEME_LIGHT,
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_CUSTOM,
]);

export const AppearanceCustomSchema = z.object({
  accent: z.string(),
  bg: z.string(),
  surface: z.string(),
  text: z.string(),
  backgroundImage: z.optional(z.string()),
  backgroundDim: z.optional(z.number()),
});

export const AppearanceSchema = z.object({
  theme: AppearanceThemeSchema,
  custom: z.optional(AppearanceCustomSchema),
});

export const SettingsSchema = z.object({
  gridFavButtons: z.boolean(),
  updatesGroupSize: z.optional(z.int().check(z.nonnegative())),
  playlistChunkSize: z.optional(z.int().check(z.positive())),
  tweaksEnabled: z.optional(z.boolean()),
  features: z.optional(z.record(z.string(), z.boolean())),
  featureChoice: z.optional(z.record(z.string(), z.string())),
  featureState: z.optional(z.record(z.string(), z.unknown())),
  appearance: z.optional(AppearanceSchema),
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

/** Legacy floating-panel size keys under settings.featureState.panel. */
export const LEGACY_PANEL_FEATURE_STATE_ID = "panel";
export const LEGACY_PANEL_WIDTH_KEY = "width";
export const LEGACY_PANEL_HEIGHT_KEY = "height";

export const FavsSyncLockSchema = z.object({
  tabId: z.string().check(z.minLength(1)),
  beatAt: z.number(),
});

export const FavsSyncSchema = z.object({
  nextPid: z.int(),
  lastPid: z.int(),
  startedAt: z.string(),
  finishedAt: z.optional(z.string()),
  running: z.optional(z.boolean()),
  userId: z.optional(z.int()),
  lock: z.optional(FavsSyncLockSchema),
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
export type CollectionKind = z.infer<typeof CollectionKindSchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type ArtistEntry = z.infer<typeof ArtistEntrySchema>;
export type MarkFlags = z.infer<typeof MarkFlagsSchema>;
export type AppearanceTheme = z.infer<typeof AppearanceThemeSchema>;
export type AppearanceCustom = z.infer<typeof AppearanceCustomSchema>;
export type Appearance = z.infer<typeof AppearanceSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type UpdatesState = z.infer<typeof UpdatesSchema>;
export type StorageData = z.infer<typeof StorageSchema>;
export type FavsSyncLock = z.infer<typeof FavsSyncLockSchema>;
export type FavsSyncState = z.infer<typeof FavsSyncSchema>;
export type FavsData = z.infer<typeof FavsSchema>;
export type ExportBlob = z.infer<typeof ExportBlobSchema>;

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Drop legacy floating-panel width/height from featureState.panel.
 * Keeps tab and any other keys. No SCHEMA_VERSION bump.
 */
export function stripLegacyPanelWindowSize(
  data: StorageData,
): { data: StorageData; changed: boolean } {
  const featureState = data.settings?.featureState;
  if (featureState === undefined) {
    return { data, changed: false };
  }
  const panelRaw = featureState[LEGACY_PANEL_FEATURE_STATE_ID];
  if (!isUnknownRecord(panelRaw)) {
    return { data, changed: false };
  }
  const hasWidth = Object.prototype.hasOwnProperty.call(
    panelRaw,
    LEGACY_PANEL_WIDTH_KEY,
  );
  const hasHeight = Object.prototype.hasOwnProperty.call(
    panelRaw,
    LEGACY_PANEL_HEIGHT_KEY,
  );
  if (!hasWidth && !hasHeight) {
    return { data, changed: false };
  }

  const nextPanel: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(panelRaw)) {
    if (key === LEGACY_PANEL_WIDTH_KEY || key === LEGACY_PANEL_HEIGHT_KEY) {
      continue;
    }
    nextPanel[key] = value;
  }

  const nextFeatureState: Record<string, unknown> = { ...featureState };
  if (Object.keys(nextPanel).length === 0) {
    delete nextFeatureState[LEGACY_PANEL_FEATURE_STATE_ID];
  } else {
    nextFeatureState[LEGACY_PANEL_FEATURE_STATE_ID] = nextPanel;
  }

  const nextSettings = data.settings === undefined
    ? { gridFavButtons: DEFAULT_GRID_FAV_BUTTONS }
    : { ...data.settings };
  if (Object.keys(nextFeatureState).length === 0) {
    delete nextSettings.featureState;
  } else {
    nextSettings.featureState = nextFeatureState;
  }

  return {
    data: {
      ...data,
      settings: nextSettings,
    },
    changed: true,
  };
}

export function isPlaylist(collection: Collection): boolean {
  return collection.kind === COLLECTION_KIND_POSTS;
}

export function resolveCollectionKind(collection: Collection): CollectionKind {
  return collection.kind ?? COLLECTION_KIND_SEARCH;
}

export function createDefaultFavs(): FavsData {
  return {
    version: FAVS_SCHEMA_VERSION,
    ids: [],
  };
}

export function createDefaultAppearance(): Appearance {
  return {
    theme: DEFAULT_APPEARANCE_THEME,
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
      appearance: createDefaultAppearance(),
    },
    updates: {
      seenPostId: DEFAULT_SEEN_POST_ID,
    },
  };
}

export function resolveAppearance(data: StorageData): Appearance {
  return data.settings?.appearance ?? createDefaultAppearance();
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

export function resolvePlaylistChunkSize(data: StorageData): number {
  return data.settings?.playlistChunkSize ?? DEFAULT_PLAYLIST_CHUNK_SIZE;
}

export function resolveSeenPostId(data: StorageData): number {
  return data.updates?.seenPostId ?? DEFAULT_SEEN_POST_ID;
}
