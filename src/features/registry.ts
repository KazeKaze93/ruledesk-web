import { gridDensityFeature } from "./grid-density";
import { seenDimFeature } from "./grid-marks";
import { menuCleanupFeature } from "./menu-cleanup";
import { postActionsFeature } from "./post-actions";
import { searchTokensFeature } from "./search-tokens";
import { tagGroupsFeature } from "./tag-groups";
import type { Feature } from "./types";

export const FEATURES: Feature[] = [
  menuCleanupFeature,
  tagGroupsFeature,
  searchTokensFeature,
  seenDimFeature,
  postActionsFeature,
  gridDensityFeature,
];
