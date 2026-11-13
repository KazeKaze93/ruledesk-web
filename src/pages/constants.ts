/** Hash routes and DOM ids for RuleDesk own pages (replaces floating panel). */

export const RDW_HASH_PREFIX = "#rdw/" as const;

export const RDW_ROUTE_COLLECTIONS = "collections" as const;
export const RDW_ROUTE_FOLLOWING = "following" as const;
export const RDW_ROUTE_SETTINGS = "settings" as const;

export const RDW_ROUTES = [
  RDW_ROUTE_COLLECTIONS,
  RDW_ROUTE_FOLLOWING,
  RDW_ROUTE_SETTINGS,
] as const;

export type RdwRoute = (typeof RDW_ROUTES)[number];

export const RDW_HASH_COLLECTIONS = `${RDW_HASH_PREFIX}${RDW_ROUTE_COLLECTIONS}`;
export const RDW_HASH_FOLLOWING = `${RDW_HASH_PREFIX}${RDW_ROUTE_FOLLOWING}`;
export const RDW_HASH_SETTINGS = `${RDW_HASH_PREFIX}${RDW_ROUTE_SETTINGS}`;

export const RDW_OWN_PAGE_CLASS = "rdw-own-page";
export const RDW_PAGE_ROOT_ID = "rdw-page-root";
export const RDW_OWN_PAGE_STYLE_ID = "rdw-own-page-style";

export const HEADER_SELECTOR = "div#header";
export const NAVBAR_SELECTOR = "div#header ul#navbar";
export const CURRENT_PAGE_CLASS = "current-page";

export const MENU_ITEM_ID = {
  collections: "rdw-nav-collections",
  following: "rdw-nav-following",
  favorites: "rdw-nav-favorites",
  settings: "rdw-nav-settings",
} as const;

export const MENU_LABEL = {
  collections: "Collections",
  following: "Following",
  favorites: "Favorites",
  settings: "RuleDesk",
} as const;

/** Site native favorites entry (submenu); hidden when our Favorites item is shown. */
export const MY_FAVORITES_CONTAINER_ID = "my-favorites-container";
export const MY_FAVORITES_LINK_SELECTOR =
  'li#my-favorites-container a[href*="page=favorites"]';

export const POSTS_LINK_TEXT = "Posts";
export const FEED_MENU_ITEM_ID = "rdw-feed-menu";

export const PAGE_CONTENT_MAX_WIDTH_PX = 960;

/** Shared class names for own-page section layouts (relocated from ui/panel). */
export const PANEL_UI_CLASS = {
  artistMeta: "rdw-artist-meta",
  artistFilter: "rdw-artist-filter",
  artistList: "rdw-artist-list",
  artistRow: "rdw-artist-row",
  artistLink: "rdw-artist-link",
  artistUndo: "rdw-artist-undo",
  scrollRegion: "rdw-scroll-region",
  settingsGroup: "rdw-settings-group",
  settingsRow: "rdw-settings-row",
  pageCard: "rdw-page-card",
} as const;

export const ARTISTS_FILTER_THRESHOLD = 12;
export const UNFOLLOW_UNDO_MS = 5000;
export const ARTISTS_EMPTY_TITLE = "No followed artists yet";
export const ARTISTS_EMPTY_HINT =
  "Follow artists with the Follow button next to their name in the tag list.";
export const ARTIST_FILTER_LABEL = "Filter artists";
export const UNFOLLOW_UNDO_LABEL = "Undo";
export const UNFOLLOWED_PREFIX = "Unfollowed ";

export const FEATURE_CHECKBOX_ID_PREFIX = "rdw-feature-";
export const FEATURE_CHOICE_ID_PREFIX = "rdw-feature-choice-";
export const UPDATES_GROUP_SIZE_ID = "rdw-updates-group-size";
export const PLAYLIST_CHUNK_SIZE_ID = "rdw-playlist-chunk-size";
export const ARTIST_FILTER_ID = "rdw-artist-filter";
export const GRID_FAV_CHECKBOX_ID = "rdw-grid-fav-buttons";
export const TWEAKS_SWITCH_ID = "rdw-tweaks-enabled";

export const TAG_GROUPS_FEATURE_ID = "tag-groups";
export const TAG_GROUPS_PANEL_LABEL = "Collapse tags";

export function featurePanelLabel(featureId: string, fallback: string): string {
  if (featureId === TAG_GROUPS_FEATURE_ID) {
    return TAG_GROUPS_PANEL_LABEL;
  }
  return fallback;
}

export function isRdwRoute(value: string): value is RdwRoute {
  return RDW_ROUTES.some((route) => route === value);
}

/** Parse location.hash → route id, or null when hash is not ours. */
export function parseRdwHash(hash: string): RdwRoute | null {
  const trimmed = hash.trim();
  if (!trimmed.startsWith(RDW_HASH_PREFIX)) {
    return null;
  }
  const rest = trimmed.slice(RDW_HASH_PREFIX.length);
  const path = rest.split(/[/?#]/)[0] ?? "";
  if (isRdwRoute(path)) {
    return path;
  }
  return null;
}

/** CSS: hide site siblings after header while own page is open. */
export function buildOwnPageCss(): string {
  return `
html.${RDW_OWN_PAGE_CLASS} ${HEADER_SELECTOR} ~ *:not(#${RDW_PAGE_ROOT_ID}) {
  display: none !important;
}
#${RDW_PAGE_ROOT_ID} {
  display: block;
  box-sizing: border-box;
  width: 100%;
}
`;
}
