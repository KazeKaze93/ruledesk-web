import { TAG_TYPE_INCLUDE } from "../config/constants";
import { log } from "../log";
import { normalizeArtistTag, readTagsFromLocation } from "../search/query";
import {
  isFollowingArtist,
  load,
  setPostSeenMark,
} from "../storage/store";
import { readPostIdFromSearch } from "../site/pages";
import {
  SITE_SELECTORS,
  extractPostIdFromThumb,
} from "../site/selectors";
import { ensureThumbAnchor } from "../site/thumb";
import {
  THUMB_ANCHOR_NAME,
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

const FOLLOWED_BADGE_FEATURE_ID = "followed-badge";
const SEEN_DIM_FEATURE_ID = "seen-dim";

const FOLLOWED_BADGE_CLASS = "rdw-followed-badge";
const SEEN_CLASS = "rdw-seen";

const FOLLOWED_BADGE_LABEL = "Following badge";
const FOLLOWED_BADGE_TITLE_PREFIX = "Following: ";
const SEEN_DIM_LABEL = "Dim seen posts";

const BADGE_OFFSET_PX = "4px";
const BADGE_SIZE_PX = "10px";
const BADGE_MAX_WIDTH_PX = "20px";
const SEEN_DIM_OPACITY = "0.4";
const SEEN_DIM_HOVER_OPACITY = "1";

const ALT_TAG_SEPARATOR = " ";
const BADGE_TAG_JOIN = ", ";

function findThumbLink(thumb: HTMLElement, postId: string | null): HTMLAnchorElement | null {
  if (postId !== null) {
    const byId = thumb.querySelector(`#p${postId}`);
    if (byId instanceof HTMLAnchorElement) {
      return byId;
    }
  }
  const byHref = thumb.querySelector(SITE_SELECTORS.thumbLink);
  return byHref instanceof HTMLAnchorElement ? byHref : null;
}

function collectIncludeTags(search: string): Set<string> {
  const entries = readTagsFromLocation(search);
  const includes = new Set<string>();
  if (entries === null) {
    return includes;
  }
  for (const entry of entries) {
    if (entry.type !== TAG_TYPE_INCLUDE) {
      continue;
    }
    const normalized = normalizeArtistTag(entry.tag);
    if (normalized !== null) {
      includes.add(normalized);
    }
  }
  return includes;
}

function followedBadgeCaption(tags: readonly string[]): string {
  return `${FOLLOWED_BADGE_TITLE_PREFIX}${tags.join(BADGE_TAG_JOIN)}`;
}

function findBadgeArtistTags(
  thumb: HTMLElement,
  includeTags: Set<string>,
): string[] {
  const preview = thumb.querySelector(SITE_SELECTORS.previewImage);
  if (!(preview instanceof HTMLImageElement)) {
    log.warn("followed-badge: missing img.preview on thumb", thumb.id);
    return [];
  }
  const alt = preview.alt.trim();
  if (alt.length === 0) {
    return [];
  }
  const matched: string[] = [];
  const seen = new Set<string>();
  for (const raw of alt.split(ALT_TAG_SEPARATOR)) {
    if (raw.length === 0) {
      continue;
    }
    if (!isFollowingArtist(raw)) {
      continue;
    }
    const normalized = normalizeArtistTag(raw);
    if (normalized === null) {
      continue;
    }
    if (includeTags.has(normalized)) {
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    matched.push(normalized);
  }
  return matched;
}

function ensureFollowedBadge(
  thumb: HTMLElement,
  includeTags: Set<string>,
): void {
  if (thumb.querySelector(`.${FOLLOWED_BADGE_CLASS}`) !== null) {
    return;
  }

  const artistTags = findBadgeArtistTags(thumb, includeTags);
  if (artistTags.length === 0) {
    return;
  }

  const postId = extractPostIdFromThumb(thumb);
  const link = findThumbLink(thumb, postId);
  if (link === null) {
    log.warn("followed-badge: missing post link on thumb", thumb.id);
    return;
  }

  ensureThumbAnchor(thumb);

  const caption = followedBadgeCaption(artistTags);
  const badge = document.createElement("span");
  badge.className = FOLLOWED_BADGE_CLASS;
  badge.title = caption;
  badge.setAttribute("aria-label", caption);
  link.after(badge);
}

function mountFollowedBadge(ctx: FeatureContext): void {
  const includeTags = collectIncludeTags(ctx.search);
  const thumbs = document.querySelectorAll(SITE_SELECTORS.thumb);
  for (const thumb of thumbs) {
    if (!(thumb instanceof HTMLElement)) {
      continue;
    }
    ensureFollowedBadge(thumb, includeTags);
  }
}

function mountSeenDim(ctx: FeatureContext): void {
  if (ctx.pageKind === "post") {
    const postId = readPostIdFromSearch(ctx.search);
    if (postId === null) {
      log.warn("seen-dim: missing post id in search", ctx.search);
      return;
    }
    setPostSeenMark(postId);
    return;
  }

  if (ctx.pageKind !== "list") {
    return;
  }

  const marks = load().marks;
  const thumbs = document.querySelectorAll(SITE_SELECTORS.thumb);
  for (const thumb of thumbs) {
    if (!(thumb instanceof HTMLElement)) {
      continue;
    }
    const postId = extractPostIdFromThumb(thumb);
    if (postId === null) {
      continue;
    }
    if (marks[postId]?.seen === true) {
      thumb.classList.add(SEEN_CLASS);
    }
  }
}

export const followedBadgeFeature: Feature = {
  id: FOLLOWED_BADGE_FEATURE_ID,
  label: FOLLOWED_BADGE_LABEL,
  pages: ["list"],
  defaultEnabled: true,
  css: `
body.${featureBodyClass(FOLLOWED_BADGE_FEATURE_ID)} .${FOLLOWED_BADGE_CLASS} {
  position: absolute;
  top: ${BADGE_OFFSET_PX};
  left: ${BADGE_OFFSET_PX};
  z-index: 5;
  box-sizing: border-box;
  display: block;
  width: ${BADGE_SIZE_PX};
  height: ${BADGE_SIZE_PX};
  max-width: ${BADGE_MAX_WIDTH_PX};
  padding: 0;
  border: 1px solid #333;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  pointer-events: none;
  overflow: hidden;
}

@supports (anchor-name: --a) {
  body.${featureBodyClass(FOLLOWED_BADGE_FEATURE_ID)} .${FOLLOWED_BADGE_CLASS} {
    position-anchor: ${THUMB_ANCHOR_NAME};
    top: calc(anchor(top) + ${BADGE_OFFSET_PX});
    left: calc(anchor(left) + ${BADGE_OFFSET_PX});
  }
}
`,
  mount: mountFollowedBadge,
};

export const seenDimFeature: Feature = {
  id: SEEN_DIM_FEATURE_ID,
  label: SEEN_DIM_LABEL,
  pages: ["list", "post"],
  defaultEnabled: true,
  css: `
body.${featureBodyClass(SEEN_DIM_FEATURE_ID)} .${SEEN_CLASS} img.preview {
  opacity: ${SEEN_DIM_OPACITY};
}

body.${featureBodyClass(SEEN_DIM_FEATURE_ID)} .${SEEN_CLASS}:hover img.preview {
  opacity: ${SEEN_DIM_HOVER_OPACITY};
}
`,
  mount: mountSeenDim,
};
