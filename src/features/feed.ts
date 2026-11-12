import { SEARCH_PARAM_TAGS } from "../config/constants";
import { log } from "../log";
import {
  buildFeedUrl,
  isFullUpdatesQuery,
  isPartialUpdatesQuery,
} from "../search/query";
import {
  SITE_SELECTORS,
  extractPostIdFromThumb,
} from "../site/selectors";
import {
  getSeenPostId,
  getUpdatesGroupSize,
  listArtistTags,
} from "../storage/store";
import { mountUpdatesBar } from "../ui/updates-bar";
import { onThumbsAdded } from "./runtime";
import {
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

const FEATURE_ID = "feed";
const FEATURE_LABEL = "Feed in site menu";
const FEATURE_PAGES = ["list", "post", "favorites", "other"] as const;

const CONTENT_ID = "content";
const POSTS_LINK_TEXT = "Posts";
const FEED_LINK_TEXT = "Feed";
const FEED_MENU_ITEM_ID = "rdw-feed-menu";
const CURRENT_PAGE_CLASS = "current-page";
/** Class on thumbs newer than seenPostId (outline via feature CSS). */
export const FEED_NEW_CLASS = "new";

const NO_ARTISTS_TITLE = "Follow artists to build your feed";
const MISSING_POSTS_WARN = "feed: Posts menu item not found";

const NEW_OUTLINE = "2px solid #4c8bf5";
const NEW_OUTLINE_OFFSET = "2px";

const BODY_CLASS = featureBodyClass(FEATURE_ID);

const FEATURE_CSS = `
body.${BODY_CLASS} span.thumb.${FEED_NEW_CLASS} img.preview {
  outline: ${NEW_OUTLINE};
  outline-offset: ${NEW_OUTLINE_OFFSET};
}
`;

let unsubscribeThumbsAdded: (() => void) | undefined;

/** Clears the thumbs-added subscription (tests). */
export function resetFeedRuntimeState(): void {
  if (unsubscribeThumbsAdded !== undefined) {
    unsubscribeThumbsAdded();
    unsubscribeThumbsAdded = undefined;
  }
}

function findPostsMenuItem(): HTMLLIElement | null {
  const content = document.getElementById(CONTENT_ID);
  const anchors = document.querySelectorAll("a");
  for (const node of anchors) {
    if (!(node instanceof HTMLAnchorElement)) {
      continue;
    }
    if ((node.textContent?.trim() ?? "") !== POSTS_LINK_TEXT) {
      continue;
    }
    const listItem = node.closest("li");
    if (listItem === null) {
      continue;
    }
    if (content !== null && content.contains(listItem)) {
      continue;
    }
    return listItem;
  }
  return null;
}

function resolveFeedHref(postsAnchor: HTMLAnchorElement | null): string {
  const artistTags = listArtistTags();
  if (artistTags.length === 0) {
    if (postsAnchor !== null) {
      return postsAnchor.href;
    }
    return buildFeedUrl([], getUpdatesGroupSize());
  }
  return buildFeedUrl(artistTags, getUpdatesGroupSize());
}

function ensureFeedMenuItem(): HTMLLIElement | null {
  const existing = document.getElementById(FEED_MENU_ITEM_ID);
  if (existing instanceof HTMLLIElement) {
    return existing;
  }

  const postsItem = findPostsMenuItem();
  if (postsItem === null) {
    log.warn(MISSING_POSTS_WARN);
    return null;
  }

  const postsAnchor = postsItem.querySelector("a");
  const postsLink =
    postsAnchor instanceof HTMLAnchorElement ? postsAnchor : null;

  const feedItem = document.createElement("li");
  feedItem.id = FEED_MENU_ITEM_ID;
  const feedLink = document.createElement("a");
  feedLink.textContent = FEED_LINK_TEXT;
  feedLink.href = resolveFeedHref(postsLink);
  if (listArtistTags().length === 0) {
    feedLink.title = NO_ARTISTS_TITLE;
  }
  feedItem.append(feedLink);
  postsItem.after(feedItem);
  return feedItem;
}

function isFeedPage(search: string, artistTags: string[]): boolean {
  const tagsParam = new URLSearchParams(search).get(SEARCH_PARAM_TAGS);
  if (tagsParam === null || tagsParam.trim().length === 0) {
    return false;
  }
  return (
    isFullUpdatesQuery(tagsParam, artistTags) ||
    isPartialUpdatesQuery(tagsParam, artistTags)
  );
}

function applyCurrentPageHighlight(
  feedItem: HTMLLIElement,
  onFeed: boolean,
): void {
  const postsItem = findPostsMenuItem();
  if (onFeed) {
    postsItem?.classList.remove(CURRENT_PAGE_CLASS);
    feedItem.classList.add(CURRENT_PAGE_CLASS);
    return;
  }
  feedItem.classList.remove(CURRENT_PAGE_CLASS);
}

function markNewThumbs(root: ParentNode, seenPostId: number): void {
  if (seenPostId === 0) {
    return;
  }
  const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
  for (const thumb of thumbs) {
    const postId = extractPostIdFromThumb(thumb);
    if (postId === null) {
      continue;
    }
    const numeric = Number(postId);
    if (!Number.isFinite(numeric) || numeric <= seenPostId) {
      continue;
    }
    thumb.classList.add(FEED_NEW_CLASS);
  }
}

function ensureNewThumbsSubscription(): void {
  if (unsubscribeThumbsAdded !== undefined) {
    return;
  }
  unsubscribeThumbsAdded = onThumbsAdded((root) => {
    markNewThumbs(root, getSeenPostId());
  });
}

function mountFeed(ctx: FeatureContext): void {
  const feedItem = ensureFeedMenuItem();
  if (feedItem === null) {
    return;
  }

  const artistTags = listArtistTags();
  const onFeed = isFeedPage(ctx.search, artistTags);
  applyCurrentPageHighlight(feedItem, onFeed);

  if (!onFeed || ctx.pageKind !== "list") {
    return;
  }

  markNewThumbs(document, getSeenPostId());
  ensureNewThumbsSubscription();
  mountUpdatesBar(document, ctx.search);
}

export const feedFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountFeed,
};
