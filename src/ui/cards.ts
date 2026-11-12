import {
  CSS_CLASS,
  DOCUMENT_STYLE_ID,
  SEARCH_PAGE,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_SECTION,
  UI_TEXT,
} from "../config/constants";
import { log } from "../log";
import { addFavorite } from "../site/favorites";
import {
  SITE_SELECTORS,
  extractPostIdFromThumb,
} from "../site/selectors";
import { load, setPostFavMark } from "../storage/store";
import { CARD_CSS } from "./styles";

function isPostListPage(search: string): boolean {
  const params = new URLSearchParams(search);
  return (
    params.get(SEARCH_PARAM_PAGE) === SEARCH_PAGE &&
    params.get(SEARCH_PARAM_SECTION) === SEARCH_SECTION
  );
}

function ensureDocumentStyles(): void {
  if (document.getElementById(DOCUMENT_STYLE_ID) !== null) {
    return;
  }
  const style = document.createElement("style");
  style.id = DOCUMENT_STYLE_ID;
  style.textContent = CARD_CSS;
  document.head.append(style);
}

function applyButtonState(
  button: HTMLButtonElement,
  state: "idle" | "pending" | "marked" | "error",
  errorTitle?: string,
): void {
  button.classList.remove(
    CSS_CLASS.cardFavMarked,
    CSS_CLASS.cardFavError,
    CSS_CLASS.cardFavPending,
  );
  button.disabled = state === "pending";
  button.setAttribute("aria-pressed", state === "marked" ? "true" : "false");
  button.removeAttribute("title");

  if (state === "pending") {
    button.classList.add(CSS_CLASS.cardFavPending);
    return;
  }
  if (state === "marked") {
    button.classList.add(CSS_CLASS.cardFavMarked);
    return;
  }
  if (state === "error") {
    button.classList.add(CSS_CLASS.cardFavError);
    button.title = errorTitle ?? UI_TEXT.cardFavErrorTitle;
  }
}

function attachFavButton(thumb: HTMLElement, postId: string, marked: boolean): void {
  if (thumb.querySelector(SITE_SELECTORS.cardFavButton) !== null) {
    return;
  }

  thumb.classList.add(CSS_CLASS.thumb);

  const button = document.createElement("button");
  button.type = "button";
  button.className = CSS_CLASS.cardFav;
  button.textContent = UI_TEXT.cardFavGlyph;
  button.setAttribute(
    "aria-label",
    `${UI_TEXT.cardFavLabel} ${postId}`,
  );
  applyButtonState(button, marked ? "marked" : "idle");

  button.addEventListener("click", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    void handleFavClick(button, postId);
  });

  thumb.append(button);
}

async function handleFavClick(
  button: HTMLButtonElement,
  postId: string,
): Promise<void> {
  if (button.disabled || button.getAttribute("aria-pressed") === "true") {
    return;
  }

  applyButtonState(button, "pending");
  const result = await addFavorite(postId);

  if (result.status === "added" || result.status === "already") {
    setPostFavMark(postId, true);
    applyButtonState(button, "marked");
    return;
  }

  if (result.status === "not_logged_in") {
    applyButtonState(button, "error", UI_TEXT.cardFavErrorTitle);
    log.warn("Favorite requires login", postId);
    return;
  }

  applyButtonState(button, "error", UI_TEXT.cardFavErrorTitle);
  log.warn("Favorite failed", postId, result);
}

export function mountCards(
  root: ParentNode = document,
  search: string = window.location.search,
): void {
  if (!isPostListPage(search)) {
    return;
  }

  ensureDocumentStyles();
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
