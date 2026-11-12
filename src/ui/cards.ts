import {
  CSS_CLASS,
  DOCUMENT_STYLE_ID,
} from "../config/constants";
import { detectPageKind } from "../site/pages";
import {
  SITE_SELECTORS,
  extractPostIdFromThumb,
} from "../site/selectors";
import { BASE_GRID_CSS, ensureThumbAnchor } from "../site/thumb";
import { getGridFavButtonsEnabled, load } from "../storage/store";
import { createFavButton } from "./fav-button";
import { CARD_CSS } from "./styles";

export function ensureDocumentStyles(): void {
  if (document.getElementById(DOCUMENT_STYLE_ID) !== null) {
    return;
  }
  const style = document.createElement("style");
  style.id = DOCUMENT_STYLE_ID;
  style.textContent = `${BASE_GRID_CSS}\n${CARD_CSS}`;
  document.head.append(style);
}

function findThumbLink(thumb: HTMLElement, postId: string): HTMLAnchorElement | null {
  const byId = thumb.querySelector(`#p${postId}`);
  if (byId instanceof HTMLAnchorElement) {
    return byId;
  }
  const byHref = thumb.querySelector(SITE_SELECTORS.thumbLink);
  return byHref instanceof HTMLAnchorElement ? byHref : null;
}

function attachFavButton(thumb: HTMLElement, postId: string, marked: boolean): void {
  if (thumb.querySelector(SITE_SELECTORS.cardFavButton) !== null) {
    return;
  }

  const link = findThumbLink(thumb, postId);
  if (link === null) {
    return;
  }

  ensureThumbAnchor(thumb);
  const button = createFavButton(postId, marked);
  link.after(button);
}

function applyGridFavVisibilityClass(visible: boolean): void {
  document.body.classList.toggle(CSS_CLASS.gridFavsHidden, !visible);
}

export function setGridFavButtonsVisible(visible: boolean): void {
  applyGridFavVisibilityClass(visible);
  if (visible && detectPageKind(window.location.search) === "list") {
    mountCards();
  }
}

export function mountCards(
  root: ParentNode = document,
  search: string = window.location.search,
): void {
  if (detectPageKind(search) !== "list") {
    return;
  }

  ensureDocumentStyles();
  const enabled = getGridFavButtonsEnabled();
  applyGridFavVisibilityClass(enabled);
  if (!enabled) {
    return;
  }

  const marks = load().marks;
  const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);

  for (const thumb of thumbs) {
    if (!(thumb instanceof HTMLElement)) {
      continue;
    }
    const postId = extractPostIdFromThumb(thumb);
    if (postId === null) {
      continue;
    }
    const marked = marks[postId]?.fav === true;
    attachFavButton(thumb, postId, marked);
  }
}
