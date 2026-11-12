import {
  CSS_CLASS,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PARAM_TAGS,
  SEARCH_PAGE,
  SEARCH_SECTION,
  SITE_ORIGIN,
  UI_TEXT,
} from "../config/constants";
import { log } from "../log";
import { normalizeArtistTag } from "../search/query";
import { addFavorite, removeFavorite } from "../site/favorites";
import { readPostIdFromSearch } from "../site/pages";
import { SITE_SELECTORS } from "../site/selectors";
import { addFav, isFav, removeFav } from "../storage/favs";
import {
  addArtist,
  isFollowingArtist,
  removeArtist,
} from "../storage/store";
import {
  applyFavButtonState,
  createFavButton,
} from "../ui/fav-button";
import {
  POST_ACTIONS_ID,
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

const FEATURE_ID = "post-actions";
const FEATURE_LABEL = "Post actions";
const FEATURE_PAGES = ["post"] as const;

const HOST_RIGHT_COL_ID = "right-col";
const HOST_POST_VIEW_ID = "post-view";
const ORIGINAL_LINK_TEXT = "Original image";
const SCORE_SPAN_ID_PREFIX = "psc";

const CLASS_BAR = "rdw-post-actions";
const CLASS_FAV_WRAP = "rdw-post-actions-fav-wrap";
const CLASS_FAV_BUTTON = "rdw-post-actions-fav";
const CLASS_FAV_LABEL = "rdw-post-actions-fav-label";
const CLASS_FOLLOW = "rdw-post-actions-follow";
const CLASS_ORIGINAL = "rdw-post-actions-original";
const CLASS_SCORE = "rdw-post-actions-score";

const TEXT_FAVORITE = "Favorite";
const TEXT_IN_FAVORITES = "In favorites";
const TEXT_FOLLOW = "Follow";
const TEXT_FOLLOWING = "Following";
const TEXT_ORIGINAL = "Original";
const TEXT_SCORE_PREFIX = "Score: ";

const LABEL_ORIGINAL = "Open original image";

const WARN_NO_HOST =
  "post-actions: #right-col and #post-view missing; not mounted";

const FOCUS_OUTLINE = "2px solid #4c8bf5";
const FOCUS_OUTLINE_OFFSET = "2px";

const BODY_CLASS = featureBodyClass(FEATURE_ID);
const BODY_SELECTOR = `body.${BODY_CLASS}`;

const FEATURE_CSS = `
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_BAR} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  line-height: 1.3;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_WRAP} {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_BUTTON},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FOLLOW},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_ORIGINAL} {
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 2px;
  padding: 0.15rem 0.45rem;
  cursor: pointer;
  text-decoration: none;
  font: inherit;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_BUTTON}.${CSS_CLASS.cardFavMarked},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FOLLOW}[aria-pressed="true"] {
  font-weight: 600;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_BUTTON}:focus-visible,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FOLLOW}:focus-visible,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_ORIGINAL}:focus-visible {
  outline: ${FOCUS_OUTLINE};
  outline-offset: ${FOCUS_OUTLINE_OFFSET};
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_SCORE} {
  font-variant-numeric: tabular-nums;
}
`.trim();

function findHost(): Element | null {
  const rightCol = document.getElementById(HOST_RIGHT_COL_ID);
  if (rightCol !== null) {
    return rightCol;
  }
  return document.getElementById(HOST_POST_VIEW_ID);
}

function removeExistingBar(): void {
  const existing = document.getElementById(POST_ACTIONS_ID);
  if (existing !== null) {
    existing.remove();
  }
}

function extractArtistTagFromLi(li: Element): string | null {
  const links = li.querySelectorAll("a[href]");
  for (const node of links) {
    if (!(node instanceof HTMLAnchorElement)) {
      continue;
    }
    if (node.hasAttribute("onclick")) {
      continue;
    }
    const href = node.getAttribute("href");
    if (href === null || href.length === 0) {
      continue;
    }
    let url: URL;
    try {
      url = new URL(href, SITE_ORIGIN);
    } catch {
      continue;
    }
    if (url.searchParams.get(SEARCH_PARAM_PAGE) !== SEARCH_PAGE) {
      continue;
    }
    if (url.searchParams.get(SEARCH_PARAM_SECTION) !== SEARCH_SECTION) {
      continue;
    }
    const tags = url.searchParams.get(SEARCH_PARAM_TAGS);
    if (tags === null) {
      continue;
    }
    return normalizeArtistTag(tags);
  }
  return null;
}

function collectArtistTags(): string[] {
  const sidebar = document.querySelector(SITE_SELECTORS.tagSidebar);
  if (sidebar === null) {
    return [];
  }
  const tags: string[] = [];
  const seen = new Set<string>();
  const rows = sidebar.querySelectorAll(SITE_SELECTORS.tagTypeArtist);
  for (const row of rows) {
    const tag = extractArtistTagFromLi(row);
    if (tag === null || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}

function findOriginalHref(): string | null {
  const links = document.querySelectorAll("a[href]");
  for (const node of links) {
    if (!(node instanceof HTMLAnchorElement)) {
      continue;
    }
    if (node.textContent?.trim() !== ORIGINAL_LINK_TEXT) {
      continue;
    }
    const href = node.getAttribute("href");
    if (href === null || href.length === 0 || href === "#") {
      continue;
    }
    return href;
  }
  return null;
}

function readScoreText(postId: string): string | null {
  const span = document.getElementById(`${SCORE_SPAN_ID_PREFIX}${postId}`);
  if (span === null) {
    return null;
  }
  const text = span.textContent?.trim() ?? "";
  return text.length > 0 ? text : null;
}

function applyScoreValue(postId: string, scoreLabel: HTMLElement, score: number): void {
  const text = String(score);
  scoreLabel.textContent = `${TEXT_SCORE_PREFIX}${text}`;
  const span = document.getElementById(`${SCORE_SPAN_ID_PREFIX}${postId}`);
  if (span !== null) {
    span.textContent = text;
  }
}

function syncFavLabel(label: HTMLElement, marked: boolean): void {
  label.textContent = marked ? TEXT_IN_FAVORITES : TEXT_FAVORITE;
}

/**
 * createFavButton wires its own click handler and drops addFavorite's score.
 * Clone strips that listener so this module can update Score / #psc{ID}.
 */
function createPostFavControl(
  postId: string,
  scoreLabel: HTMLElement | null,
): HTMLElement {
  const marked = isFav(postId);
  const template = createFavButton(postId, marked, CLASS_FAV_BUTTON);
  const cloned = template.cloneNode(true);
  if (!(cloned instanceof HTMLButtonElement)) {
    return template;
  }

  applyFavButtonState(cloned, marked ? "marked" : "idle", postId);

  const wrap = document.createElement("span");
  wrap.className = CLASS_FAV_WRAP;

  const label = document.createElement("span");
  label.className = CLASS_FAV_LABEL;
  syncFavLabel(label, marked);

  cloned.addEventListener("click", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    void handlePostFavClick(cloned, label, postId, scoreLabel);
  });

  wrap.append(cloned, label);
  return wrap;
}

async function handlePostFavClick(
  button: HTMLButtonElement,
  label: HTMLElement,
  postId: string,
  scoreLabel: HTMLElement | null,
): Promise<void> {
  if (button.disabled) {
    return;
  }

  const currentlyMarked = button.getAttribute("aria-pressed") === "true";
  applyFavButtonState(button, "pending", postId);

  if (currentlyMarked) {
    const result = await removeFavorite(postId);
    if (result.status === "removed") {
      removeFav(postId);
      applyFavButtonState(button, "idle", postId);
      syncFavLabel(label, false);
      return;
    }
    applyFavButtonState(
      button,
      "marked_error",
      postId,
      UI_TEXT.cardFavErrorRequest,
    );
    syncFavLabel(label, true);
    log.warn("post-actions: remove favorite failed", postId, result);
    return;
  }

  const result = await addFavorite(postId);
  if (result.status === "added" || result.status === "already") {
    addFav(postId);
    applyFavButtonState(button, "marked", postId);
    syncFavLabel(label, true);
    if (
      result.status === "added" &&
      result.score !== undefined &&
      scoreLabel !== null
    ) {
      applyScoreValue(postId, scoreLabel, result.score);
    }
    return;
  }
  if (result.status === "not_logged_in") {
    applyFavButtonState(
      button,
      "error",
      postId,
      UI_TEXT.cardFavErrorNotLoggedIn,
    );
    syncFavLabel(label, false);
    log.warn("post-actions: favorite requires login", postId);
    return;
  }
  applyFavButtonState(button, "error", postId, UI_TEXT.cardFavErrorRequest);
  syncFavLabel(label, false);
  log.warn("post-actions: favorite failed", postId, result);
}

function createFollowButton(tag: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = CLASS_FOLLOW;
  button.dataset.rdwArtistTag = tag;
  applyFollowState(button, isFollowingArtist(tag));
  button.addEventListener("click", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    const following = button.getAttribute("aria-pressed") === "true";
    try {
      if (following) {
        removeArtist(tag);
        applyFollowState(button, false);
      } else {
        addArtist(tag);
        applyFollowState(button, true);
      }
    } catch {
      applyFollowState(button, isFollowingArtist(tag));
    }
  });
  return button;
}

function applyFollowState(button: HTMLButtonElement, following: boolean): void {
  const tag = button.dataset.rdwArtistTag ?? "";
  const verb = following ? TEXT_FOLLOWING : TEXT_FOLLOW;
  button.setAttribute("aria-pressed", following ? "true" : "false");
  button.setAttribute("aria-label", `${verb} ${tag}`);
  button.textContent = `${verb} ${tag}`;
}

function createOriginalLink(href: string): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = CLASS_ORIGINAL;
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", LABEL_ORIGINAL);
  link.textContent = TEXT_ORIGINAL;
  return link;
}

function createScoreLabel(scoreText: string): HTMLElement {
  const score = document.createElement("span");
  score.className = CLASS_SCORE;
  score.textContent = `${TEXT_SCORE_PREFIX}${scoreText}`;
  return score;
}

function buildBar(ctx: FeatureContext): HTMLElement {
  const bar = document.createElement("div");
  bar.id = POST_ACTIONS_ID;
  bar.className = CLASS_BAR;
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", FEATURE_LABEL);

  const postId = readPostIdFromSearch(ctx.search);
  let scoreLabel: HTMLElement | null = null;

  if (postId !== null) {
    const scoreText = readScoreText(postId);
    if (scoreText !== null) {
      scoreLabel = createScoreLabel(scoreText);
    }
    bar.append(createPostFavControl(postId, scoreLabel));
  }

  for (const tag of collectArtistTags()) {
    bar.append(createFollowButton(tag));
  }

  const originalHref = findOriginalHref();
  if (originalHref !== null) {
    bar.append(createOriginalLink(originalHref));
  }

  if (scoreLabel !== null) {
    bar.append(scoreLabel);
  }

  return bar;
}

function mountPostActions(ctx: FeatureContext): void {
  const host = findHost();
  if (host === null) {
    log.warn(WARN_NO_HOST);
    return;
  }

  removeExistingBar();
  const bar = buildBar(ctx);
  host.insertBefore(bar, host.firstChild);
}

export const postActionsFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountPostActions,
};
