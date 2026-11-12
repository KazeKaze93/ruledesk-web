import { CSS_CLASS, UI_TEXT } from "../config/constants";
import { log } from "../log";
import { addFavorite, removeFavorite, voteUp } from "../site/favorites";
import { readPostIdFromSearch } from "../site/pages";
import { addFav, isFav, removeFav } from "../storage/favs";
import {
  applyFavButtonState,
  createFavButton,
} from "../ui/fav-button";
import { createPlaylistMenu } from "./playlist-menu";
import {
  POST_ACTIONS_ID,
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

const FEATURE_ID = "post-actions";
const FEATURE_LABEL = "Post side panel";
const FEATURE_PAGES = ["post"] as const;

const HOST_RIGHT_COL_ID = "right-col";
const LINK_LIST_SELECTOR = "div.link-list ul";
const ORIGINAL_LINK_TEXT = "Original image";
const ADD_FAVORITES_LINK_TEXT = "Add to favorites";
const SCORE_SPAN_ID_PREFIX = "psc";

const NARROW_BREAKPOINT_PX = 1100;
const NARROW_MEDIA_QUERY = `(max-width: ${String(NARROW_BREAKPOINT_PX - 1)}px)`;
const PANEL_WIDTH_PX = 160;
const PANEL_TOP = "2.5rem";
const PANEL_Z_INDEX = 100;

const CLASS_PANEL = "rdw-post-actions";
const CLASS_MODE_FIXED = "rdw-post-actions--fixed";
const CLASS_MODE_NARROW = "rdw-post-actions--narrow";
const CLASS_FAV_WRAP = "rdw-post-actions-fav-wrap";
const CLASS_FAV_BUTTON = "rdw-post-actions-fav";
const CLASS_FAV_LABEL = "rdw-post-actions-fav-label";
const CLASS_ORIGINAL = "rdw-post-actions-original";
const CLASS_SCORE_ROW = "rdw-post-actions-score-row";
const CLASS_SCORE = "rdw-post-actions-score";
const CLASS_VOTE = "rdw-post-actions-vote";
const CLASS_OPTION = "rdw-post-actions-option";

const TEXT_FAVORITE = "Favorite";
const TEXT_IN_FAVORITES = "In favorites";
const TEXT_ORIGINAL = "Original";
const TEXT_SCORE_PREFIX = "Score: ";
const TEXT_VOTE_UP = "Vote up";
const TEXT_SCORE_UNKNOWN = "—";

const LABEL_ORIGINAL = "Open original image";
const LABEL_VOTE_UP = "Vote up";

const EXCLUDED_OPTION_TEXTS: ReadonlySet<string> = new Set([
  ORIGINAL_LINK_TEXT,
  ADD_FAVORITES_LINK_TEXT,
]);

const WARN_NO_RIGHT_COL =
  "post-actions: #right-col missing in narrow mode; panel stays on body";

const FOCUS_OUTLINE = "2px solid #4c8bf5";
const FOCUS_OUTLINE_OFFSET = "2px";

const BODY_CLASS = featureBodyClass(FEATURE_ID);
const BODY_SELECTOR = `body.${BODY_CLASS}`;

const FEATURE_CSS = `
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_PANEL} {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
  box-sizing: border-box;
  padding: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.3;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_MODE_FIXED} {
  position: fixed;
  right: 0;
  top: ${PANEL_TOP};
  width: ${String(PANEL_WIDTH_PX)}px;
  z-index: ${String(PANEL_Z_INDEX)};
}
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_MODE_NARROW} {
  position: static;
  width: auto;
  margin: 0 0 0.75rem;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_WRAP},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_SCORE_ROW} {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_BUTTON},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_ORIGINAL},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_VOTE},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_OPTION} {
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 2px;
  padding: 0.15rem 0.45rem;
  cursor: pointer;
  text-decoration: none;
  font: inherit;
  text-align: left;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_BUTTON}.${CSS_CLASS.cardFavMarked} {
  font-weight: 600;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_BUTTON}:focus-visible,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_ORIGINAL}:focus-visible,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_VOTE}:focus-visible,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_OPTION}:focus-visible {
  outline: ${FOCUS_OUTLINE};
  outline-offset: ${FOCUS_OUTLINE_OFFSET};
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_VOTE}:disabled,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_OPTION}:disabled {
  opacity: 0.6;
  cursor: wait;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_SCORE} {
  font-variant-numeric: tabular-nums;
}
`.trim();

let layoutCleanup: (() => void) | null = null;

function removeExistingPanel(): void {
  if (layoutCleanup !== null) {
    layoutCleanup();
    layoutCleanup = null;
  }
  const existing = document.getElementById(POST_ACTIONS_ID);
  if (existing !== null) {
    existing.remove();
  }
}

function isNarrowViewport(): boolean {
  if (typeof window.matchMedia === "function") {
    return window.matchMedia(NARROW_MEDIA_QUERY).matches;
  }
  return window.innerWidth < NARROW_BREAKPOINT_PX;
}

function placePanel(panel: HTMLElement, narrow: boolean): void {
  panel.classList.toggle(CLASS_MODE_FIXED, !narrow);
  panel.classList.toggle(CLASS_MODE_NARROW, narrow);

  if (narrow) {
    const rightCol = document.getElementById(HOST_RIGHT_COL_ID);
    if (rightCol !== null) {
      rightCol.insertBefore(panel, rightCol.firstChild);
      return;
    }
    log.warn(WARN_NO_RIGHT_COL);
  }

  if (panel.parentElement !== document.body) {
    document.body.append(panel);
  }
}

function bindLayoutMode(panel: HTMLElement): void {
  const sync = (): void => {
    placePanel(panel, isNarrowViewport());
  };
  sync();

  if (typeof window.matchMedia === "function") {
    const media = window.matchMedia(NARROW_MEDIA_QUERY);
    const onChange = (): void => {
      sync();
    };
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      layoutCleanup = (): void => {
        media.removeEventListener("change", onChange);
      };
      return;
    }
    if (typeof media.addListener === "function") {
      media.addListener(onChange);
      layoutCleanup = (): void => {
        media.removeListener(onChange);
      };
      return;
    }
  }

  const onResize = (): void => {
    sync();
  };
  window.addEventListener("resize", onResize);
  layoutCleanup = (): void => {
    window.removeEventListener("resize", onResize);
  };
}

function findOriginalAnchor(): HTMLAnchorElement | null {
  const list = document.querySelector(LINK_LIST_SELECTOR);
  const roots: ParentNode[] =
    list !== null ? [list, document] : [document];
  for (const root of roots) {
    const links = root.querySelectorAll("a[href]");
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
      return node;
    }
  }
  return null;
}

function collectOptionAnchors(): HTMLAnchorElement[] {
  const list = document.querySelector(LINK_LIST_SELECTOR);
  if (list === null) {
    return [];
  }
  const result: HTMLAnchorElement[] = [];
  const links = list.querySelectorAll("a[href]");
  for (const node of links) {
    if (!(node instanceof HTMLAnchorElement)) {
      continue;
    }
    const text = node.textContent?.trim() ?? "";
    if (text.length === 0 || EXCLUDED_OPTION_TEXTS.has(text)) {
      continue;
    }
    result.push(node);
  }
  return result;
}

function readScoreText(postId: string): string {
  const span = document.getElementById(`${SCORE_SPAN_ID_PREFIX}${postId}`);
  if (span === null) {
    return TEXT_SCORE_UNKNOWN;
  }
  const text = span.textContent?.trim() ?? "";
  return text.length > 0 ? text : TEXT_SCORE_UNKNOWN;
}

function applyScoreValue(
  postId: string,
  scoreLabel: HTMLElement,
  score: number,
): void {
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

function createVoteButton(
  postId: string,
  scoreLabel: HTMLElement,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = CLASS_VOTE;
  button.textContent = TEXT_VOTE_UP;
  button.setAttribute("aria-label", LABEL_VOTE_UP);
  button.addEventListener("click", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    void handleVoteUpClick(button, scoreLabel, postId);
  });
  return button;
}

async function handleVoteUpClick(
  button: HTMLButtonElement,
  scoreLabel: HTMLElement,
  postId: string,
): Promise<void> {
  if (button.disabled) {
    return;
  }
  button.disabled = true;
  try {
    const score = await voteUp(postId);
    if (score !== null) {
      applyScoreValue(postId, scoreLabel, score);
    }
  } finally {
    button.disabled = false;
  }
}

function createScoreRow(postId: string): HTMLElement {
  const row = document.createElement("span");
  row.className = CLASS_SCORE_ROW;
  const scoreLabel = createScoreLabel(readScoreText(postId));
  row.append(scoreLabel, createVoteButton(postId, scoreLabel));
  return row;
}

function createOptionProxy(nativeLink: HTMLAnchorElement): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = CLASS_OPTION;
  const text = nativeLink.textContent?.trim() ?? "";
  button.textContent = text;
  button.setAttribute("aria-label", text);
  button.addEventListener("click", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    nativeLink.click();
  });
  return button;
}

function buildPanel(ctx: FeatureContext): HTMLElement {
  const panel = document.createElement("div");
  panel.id = POST_ACTIONS_ID;
  panel.className = CLASS_PANEL;
  panel.setAttribute("role", "complementary");
  panel.setAttribute("aria-label", FEATURE_LABEL);

  const postId = readPostIdFromSearch(ctx.search);
  if (postId !== null) {
    const scoreRow = createScoreRow(postId);
    const scoreLabel = scoreRow.querySelector(`.${CLASS_SCORE}`);
    const scoreEl =
      scoreLabel instanceof HTMLElement ? scoreLabel : null;
    panel.append(createPostFavControl(postId, scoreEl));
    panel.append(createPlaylistMenu(Number(postId)));

    const original = findOriginalAnchor();
    if (original !== null) {
      panel.append(createOriginalLink(original.href));
    }

    panel.append(scoreRow);
  } else {
    const original = findOriginalAnchor();
    if (original !== null) {
      panel.append(createOriginalLink(original.href));
    }
  }

  for (const nativeLink of collectOptionAnchors()) {
    panel.append(createOptionProxy(nativeLink));
  }

  return panel;
}

function mountPostActions(ctx: FeatureContext): void {
  removeExistingPanel();
  const panel = buildPanel(ctx);
  document.body.append(panel);
  bindLayoutMode(panel);
}

export const postActionsFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountPostActions,
};
