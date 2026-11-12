import { z } from "zod";

import {
  SCHEMA_VERSION,
  TAG_TYPE_EXCLUDE,
  TAG_TYPE_INCLUDE,
} from "../config/constants";

export const TagTypeSchema = z.enum([TAG_TYPE_INCLUDE, TAG_TYPE_EXCLUDE]);

export const TagEntrySchema = z.object({
  tag: z.string().min(1),
  type: TagTypeSchema,
});

export const CollectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tags: z.array(TagEntrySchema),
});

export const ArtistEntrySchema = z.object({
  tag: z.string().min(1),
  lastSeenPostId: z.string().min(1),
});

export const MarkFlagsSchema = z.record(z.string(), z.unknown());

export const StorageSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  collections: z.array(CollectionSchema),
  artists: z.array(ArtistEntrySchema),
  marks: MarkFlagsSchema,
});

export type TagType = z.infer<typeof TagTypeSchema>;
export type TagEntry = z.infer<typeof TagEntrySchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type ArtistEntry = z.infer<typeof ArtistEntrySchema>;
export type StorageData = z.infer<typeof StorageSchema>;

export function createDefaultStorage(): StorageData {
  return {
    version: SCHEMA_VERSION,
    collections: [],
    artists: [],
    marks: {},
  };
}
