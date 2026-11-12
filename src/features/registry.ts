import { gridDensityFeature } from "./grid-density";
import {
  followedBadgeFeature,
  seenDimFeature,
} from "./grid-marks";
import { menuCleanupFeature } from "./menu-cleanup";
import { pagerFeature } from "./pager";
import { postActionsFeature } from "./post-actions";
import { searchTokensFeature } from "./search-tokens";
import { tagGroupsFeature } from "./tag-groups";
import type { Feature } from "./types";

export const FEATURES: Feature[] = [
  pagerFeature,
  menuCleanupFeature,
  tagGroupsFeature,
  searchTokensFeature,
  followedBadgeFeature,
  seenDimFeature,
  postActionsFeature,
  gridDensityFeature,
];
