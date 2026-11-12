import { darkThemeFeature } from "./dark-theme";
import { gridDensityFeature } from "./grid-density";
import {
  followedBadgeFeature,
  seenDimFeature,
} from "./grid-marks";
import { menuCleanupFeature } from "./menu-cleanup";
import { pagerFeature } from "./pager";
import { postActionsFeature } from "./post-actions";
import { tagGroupsFeature } from "./tag-groups";
import { topBarFeature } from "./top-bar";
import type { Feature } from "./types";

export const FEATURES: Feature[] = [
  topBarFeature,
  pagerFeature,
  menuCleanupFeature,
  tagGroupsFeature,
  followedBadgeFeature,
  seenDimFeature,
  postActionsFeature,
  gridDensityFeature,
  darkThemeFeature,
];
