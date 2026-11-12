import * as z from "zod/mini";

import {
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
  lastSeenPostId: z.int().check(z.nonnegative()),
});

export const MarkFlagsSchema = z.object({
  fav: z.optional(z.boolean()),
});

export const StorageSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  collections: z.array(CollectionSchema),
  artists: z.array(ArtistEntrySchema),
  marks: z.record(z.string(), MarkFlagsSchema),
});

export type TagType = z.infer<typeof TagTypeSchema>;
export type TagEntry = z.infer<typeof TagEntrySchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type ArtistEntry = z.infer<typeof ArtistEntrySchema>;
export type MarkFlags = z.infer<typeof MarkFlagsSchema>;
export type StorageData = z.infer<typeof StorageSchema>;

export function createDefaultStorage(): StorageData {
  return {
    version: SCHEMA_VERSION,
    collections: [],
    artists: [],
    marks: {},
  };
}
