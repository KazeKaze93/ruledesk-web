export const PANEL_FEATURE_STATE_ID = "panel";

export const PANEL_TABS = [
  "collections",
  "artists",
  "favorites",
  "settings",
  "blacklist",
] as const;

export type PanelTab = (typeof PANEL_TABS)[number];

export const PANEL_TAB_LABELS: Record<PanelTab, string> = {
  collections: "Collections",
  artists: "Artists",
  favorites: "Favorites",
  settings: "Settings",
  blacklist: "Blacklist",
};

export const PANEL_UI_CLASS = {
  tabs: "rdw-tabs",
  tab: "rdw-tab",
  tabPanel: "rdw-tab-panel",
  footer: "rdw-footer",
  artistMeta: "rdw-artist-meta",
  artistFilter: "rdw-artist-filter",
  artistList: "rdw-artist-list",
  artistRow: "rdw-artist-row",
  artistLink: "rdw-artist-link",
  artistUndo: "rdw-artist-undo",
  scrollRegion: "rdw-scroll-region",
  themeDark: "rdw-theme-dark",
  settingsGroup: "rdw-settings-group",
  settingsRow: "rdw-settings-row",
  resizeHint: "rdw-resize-hint",
} as const;

export const ARTISTS_FILTER_THRESHOLD = 12;
export const UNFOLLOW_UNDO_MS = 5000;
export const ARTISTS_EMPTY_HINT =
  "Follow artists with the Follow button next to their name in the tag list.";
export const ARTIST_FILTER_LABEL = "Filter artists";
export const UNFOLLOW_UNDO_LABEL = "Undo";
export const UNFOLLOWED_PREFIX = "Unfollowed ";
export const RESIZE_HINT = "Drag the corner to resize";

export const FEATURE_CHECKBOX_ID_PREFIX = "rdw-feature-";
export const FEATURE_CHOICE_ID_PREFIX = "rdw-feature-choice-";
export const UPDATES_GROUP_SIZE_ID = "rdw-updates-group-size";
export const PLAYLIST_CHUNK_SIZE_ID = "rdw-playlist-chunk-size";
export const ARTIST_FILTER_ID = "rdw-artist-filter";
export const GRID_FAV_CHECKBOX_ID = "rdw-grid-fav-buttons";
export const TWEAKS_SWITCH_ID = "rdw-tweaks-enabled";

export const TAG_GROUPS_FEATURE_ID = "tag-groups";
export const TAG_GROUPS_PANEL_LABEL = "Collapse tags";

export function isPanelTab(value: unknown): value is PanelTab {
  return typeof value === "string" && PANEL_TABS.some((tab) => tab === value);
}

export function featurePanelLabel(featureId: string, fallback: string): string {
  if (featureId === TAG_GROUPS_FEATURE_ID) {
    return TAG_GROUPS_PANEL_LABEL;
  }
  return fallback;
}
