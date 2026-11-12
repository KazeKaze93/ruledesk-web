import { feedFeature } from "./feed";
import { gridDensityFeature } from "./grid-density";
import { seenDimFeature } from "./grid-marks";
import { infiniteScrollFeature } from "./infinite-scroll";
import { menuCleanupFeature } from "./menu-cleanup";
import { postActionsFeature } from "./post-actions";
import { searchToolsFeature } from "./search-tools";
import { tagGroupsFeature } from "./tag-groups";
import type { Feature } from "./types";

export const FEATURES: Feature[] = [
  feedFeature,
  menuCleanupFeature,
  tagGroupsFeature,
  searchToolsFeature,
  seenDimFeature,
  infiniteScrollFeature,
  postActionsFeature,
  gridDensityFeature,
];
